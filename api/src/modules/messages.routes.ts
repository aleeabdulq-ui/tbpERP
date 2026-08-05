import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";

const router = Router();
router.use(authenticate, authorize("messages:read"));

const sendSchema = z.object({
  audienceType: z.enum(["INDIVIDUAL", "DEPARTMENT", "ALL"]),
  recipientId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  subject: z.string().trim().min(2).max(160),
  body: z.string().trim().min(2).max(10_000),
  announcement: z.boolean().default(false),
});

const personSelect = { id: true, email: true, employee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, department: { select: { name: true } } } } } as const;
const serialize = (message: any) => ({
  ...message,
  sender: { id: message.sender.id, email: message.sender.email, name: `${message.sender.employee?.firstName ?? ""} ${message.sender.employee?.lastName ?? ""}`.trim() || message.sender.email, avatarUrl: message.sender.employee?.avatarUrl },
  recipient: { id: message.recipient.id, email: message.recipient.email, name: `${message.recipient.employee?.firstName ?? ""} ${message.recipient.employee?.lastName ?? ""}`.trim() || message.recipient.email, avatarUrl: message.recipient.employee?.avatarUrl },
});

router.get("/", async (request, response, next) => {
  try {
    const box = z.enum(["inbox", "sent", "announcements"]).default("inbox").parse(request.query.box);
    const where = box === "sent" ? { senderId: request.auth!.userId } : { recipientId: request.auth!.userId, ...(box === "announcements" ? { announcement: true } : {}) };
    const messages = await prisma.message.findMany({ where: { ...where, deletedAt: null }, include: { sender: { select: personSelect }, recipient: { select: personSelect }, department: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
    response.json({ data: messages.map(serialize), unread: await prisma.message.count({ where: { recipientId: request.auth!.userId, readAt: null, deletedAt: null } }) });
  } catch (error) { next(error); }
});

router.get("/audiences", authorize("messages:send"), async (_request, response, next) => {
  try {
    const [departments, users] = await Promise.all([
      prisma.department.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.user.findMany({ where: { deletedAt: null, employee: { deletedAt: null } }, select: personSelect, orderBy: { employee: { firstName: "asc" } } }),
    ]);
    response.json({ departments, people: users.map((user) => ({ id: user.id, employeeId: user.employee?.id, email: user.email, name: `${user.employee?.firstName ?? ""} ${user.employee?.lastName ?? ""}`.trim(), department: user.employee?.department.name, avatarUrl: user.employee?.avatarUrl })) });
  } catch (error) { next(error); }
});

router.post("/", authorize("messages:send"), async (request, response, next) => {
  try {
    const input = sendSchema.parse(request.body);
    const canBroadcast = request.auth!.permissions.includes("*") || request.auth!.permissions.includes("messages:broadcast");
    if ((input.audienceType !== "INDIVIDUAL" || input.announcement) && !canBroadcast) throw new AppError(403, "Only HR and administrators can message teams or all staff", "MESSAGE_BROADCAST_FORBIDDEN");
    if (input.announcement && input.audienceType !== "ALL") throw new AppError(422, "Public announcements must be sent to all staff", "INVALID_ANNOUNCEMENT_AUDIENCE");
    const recipients = await prisma.user.findMany({
      where: { deletedAt: null, employee: { deletedAt: null }, ...(input.audienceType === "INDIVIDUAL" ? { id: input.recipientId } : input.audienceType === "DEPARTMENT" ? { employee: { deletedAt: null, departmentId: input.departmentId } } : {}) },
      select: { id: true },
    });
    if (!recipients.length) throw new AppError(404, "No active recipients matched this audience", "MESSAGE_AUDIENCE_EMPTY");
    const groupKey = crypto.randomUUID();
    await prisma.$transaction(async (transaction) => {
      await transaction.message.createMany({ data: recipients.map(({ id }) => ({ senderId: request.auth!.userId, recipientId: id, audienceType: input.audienceType, departmentId: input.audienceType === "DEPARTMENT" ? input.departmentId : null, groupKey, announcement: input.announcement, subject: input.subject, body: input.body })) });
      await transaction.notification.createMany({ data: recipients.filter(({ id }) => id !== request.auth!.userId).map(({ id }) => ({ userId: id, type: "MESSAGE" as const, title: input.announcement ? "Public announcement" : "New message", message: input.subject, dedupeKey: `message:${groupKey}:${id}` })) });
      await transaction.auditLog.create({ data: { userId: request.auth!.userId, action: input.announcement ? "ANNOUNCEMENT_SENT" : "MESSAGE_SENT", entityType: "MESSAGE", entityId: groupKey, metadata: { audienceType: input.audienceType, recipients: recipients.length } } });
    });
    response.status(201).json({ groupKey, delivered: recipients.length });
  } catch (error) { next(error); }
});

router.patch("/:id/read", async (request, response, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const result = await prisma.message.updateMany({ where: { id, recipientId: request.auth!.userId, readAt: null }, data: { readAt: new Date() } });
    response.json({ updated: result.count });
  } catch (error) { next(error); }
});

router.get("/events/live", async (request, response, next) => {
  try {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders();
    let lastId = Number(request.headers["last-event-id"] ?? 0);
    const send = async () => {
      const latest = await prisma.message.findFirst({ where: { recipientId: request.auth!.userId, deletedAt: null, id: { gt: lastId } }, orderBy: { id: "desc" }, select: { id: true } });
      if (latest) { lastId = latest.id; response.write(`id: ${latest.id}\nevent: message\ndata: ${JSON.stringify({ id: latest.id })}\n\n`); }
      else response.write(`event: heartbeat\ndata: {}\n\n`);
    };
    await send();
    const timer = setInterval(() => send().catch(() => response.end()), 5_000);
    request.on("close", () => clearInterval(timer));
  } catch (error) { next(error); }
});

export default router;
