import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

const projectInput = z.object({
  code: z.string().trim().min(3).max(30), name: z.string().trim().min(3).max(191),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).default("PLANNING"),
  startsAt: z.coerce.date().optional().nullable(), dueAt: z.coerce.date().optional().nullable(),
  drawingStatus: z.string().trim().max(80).optional().nullable(), siteProgress: z.number().int().min(0).max(100).default(0),
  progress: z.number().int().min(0).max(100).default(0),
});
const projectInclude = { coordinator: { select: { id: true, firstName: true, lastName: true } }, milestones: { orderBy: { dueAt: "asc" as const } }, _count: { select: { tasks: true } } };

router.get("/", authorize("projects:read", "project_dashboard:read"), async (_request, response, next) => {
  try { const projects = await prisma.project.findMany({ where: { deletedAt: null }, include: projectInclude, orderBy: [{ status: "asc" }, { dueAt: "asc" }] }); response.json(projects.map((project) => ({ ...project, taskCount: project._count.tasks, _count: undefined }))); } catch (error) { next(error); }
});
router.post("/", authorize("projects:create"), async (request, response, next) => {
  try { const input = projectInput.parse(request.body); const actor = await prisma.employee.findUnique({ where: { userId: request.auth!.userId } }); if (!actor) throw new AppError(403, "An employee profile is required", "EMPLOYEE_REQUIRED"); const project = await prisma.project.create({ data: { ...input, description: input.description || null, startsAt: input.startsAt || null, dueAt: input.dueAt || null, drawingStatus: input.drawingStatus || null, createdById: actor.id, coordinatorId: actor.id }, include: projectInclude }); await prisma.auditLog.create({ data: { userId: request.auth!.userId, action: "PROJECT_CREATED", entityType: "PROJECT", entityId: String(project.id), metadata: { code: project.code, name: project.name } } }); response.status(201).json(project); } catch (error) { next(error); }
});
router.patch("/:id", authorize("projects:manage"), async (request, response, next) => {
  try { const id = z.coerce.number().int().positive().parse(request.params.id); const input = projectInput.partial().parse(request.body); if (!await prisma.project.findFirst({ where: { id, deletedAt: null } })) throw new AppError(404, "Project not found", "PROJECT_NOT_FOUND"); const project = await prisma.project.update({ where: { id }, data: input, include: projectInclude }); await prisma.auditLog.create({ data: { userId: request.auth!.userId, action: "PROJECT_UPDATED", entityType: "PROJECT", entityId: String(id) } }); response.json(project); } catch (error) { next(error); }
});
router.post("/:id/milestones", authorize("milestones:create"), async (request, response, next) => {
  try { const projectId = z.coerce.number().int().positive().parse(request.params.id); const input = z.object({ title: z.string().trim().min(2).max(191), description: z.string().trim().max(5000).optional().nullable(), dueAt: z.coerce.date().optional().nullable() }).parse(request.body); if (!await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } })) throw new AppError(404, "Project not found", "PROJECT_NOT_FOUND"); const milestone = await prisma.milestone.create({ data: { projectId, ...input, description: input.description || null, dueAt: input.dueAt || null } }); await prisma.auditLog.create({ data: { userId: request.auth!.userId, action: "MILESTONE_CREATED", entityType: "MILESTONE", entityId: String(milestone.id), metadata: { projectId } } }); response.status(201).json(milestone); } catch (error) { next(error); }
});
export default router;
