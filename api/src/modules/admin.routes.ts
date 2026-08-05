import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { knownPermissions, permissionGroups } from "../lib/permissions.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, authorize("roles:manage"));

router.get("/roles", async (_request, response, next) => {
  try {
    const roles = await prisma.role.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, description: true, permissions: true, _count: { select: { users: true } } } });
    response.json({ groups: permissionGroups, roles: roles.map((role) => ({ ...role, permissions: Array.isArray(role.permissions) ? role.permissions : [], users: role._count.users })) });
  } catch (error) { next(error); }
});

router.patch("/roles/:id", async (request, response, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const input = z.object({ permissions: z.array(z.string()).max(100) }).parse(request.body);
    const invalid = input.permissions.filter((permission) => permission !== "*" && !knownPermissions.has(permission));
    if (invalid.length) throw new AppError(422, `Unknown permissions: ${invalid.join(", ")}`, "UNKNOWN_PERMISSION");
    const role = await prisma.role.findFirst({ where: { id, deletedAt: null } });
    if (!role) throw new AppError(404, "Role not found", "ROLE_NOT_FOUND");
    if (role.name === "Platform Administrator") throw new AppError(409, "Platform Administrator access cannot be reduced", "PROTECTED_ROLE");
    const permissions = [...new Set(input.permissions)].sort();
    const updated = await prisma.role.update({ where: { id }, data: { permissions }, select: { id: true, name: true, permissions: true } });
    await prisma.auditLog.create({ data: { userId: request.auth!.userId, action: "ROLE_PERMISSIONS_UPDATED", entityType: "Role", entityId: String(id), metadata: { role: role.name, permissions } } });
    response.json({ ...updated, message: "Role permissions updated. Affected users will receive them at their next sign-in." });
  } catch (error) { next(error); }
});

export default router;
