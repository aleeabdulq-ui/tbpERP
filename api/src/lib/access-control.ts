import type { Prisma, TaskCategory } from "@prisma/client";

type AuthContext = { userId: number; role: string; permissions: string[] };
type AssignmentTarget = {
  id: number;
  designation: string;
  department: { code: string };
  user: { role: { name: string } };
};

export const hasPermission = (auth: AuthContext | undefined, permission: string) =>
  Boolean(auth?.permissions.includes("*") || auth?.permissions.includes(permission));

export const allowedTaskCategories = (auth: AuthContext | undefined): TaskCategory[] => {
  if (hasPermission(auth, "tasks:assign:any")) return ["GENERAL", "HR_ADMIN", "FINANCE", "PROJECT"];
  const categories: TaskCategory[] = [];
  if (hasPermission(auth, "tasks:assign:hr")) categories.push("HR_ADMIN");
  if (hasPermission(auth, "tasks:assign:finance")) categories.push("FINANCE");
  if (hasPermission(auth, "tasks:assign:project")) categories.push("PROJECT");
  return categories;
};

const projectAssignableRoles = new Set([
  "Architect",
  "Builder",
  "Engineer",
  "Quantity Surveyor",
  "Intern Architect",
  "NYSC Corps Member",
]);

export function canAssignTask(auth: AuthContext | undefined, category: TaskCategory, target: AssignmentTarget) {
  if (hasPermission(auth, "tasks:assign:any")) return true;
  if (category === "HR_ADMIN" && hasPermission(auth, "tasks:assign:hr")) return true;
  if (category === "FINANCE" && hasPermission(auth, "tasks:assign:finance")) return target.department.code === "ACC";
  if (category === "PROJECT" && hasPermission(auth, "tasks:assign:project")) return projectAssignableRoles.has(target.user.role.name);
  return false;
}

export function assignmentTargetWhere(auth: AuthContext | undefined): Prisma.EmployeeWhereInput {
  if (hasPermission(auth, "tasks:assign:any") || hasPermission(auth, "tasks:assign:hr")) return {};
  const scopes: Prisma.EmployeeWhereInput[] = [];
  if (hasPermission(auth, "tasks:assign:finance")) scopes.push({ department: { code: "ACC" } });
  if (hasPermission(auth, "tasks:assign:project")) scopes.push({ user: { role: { name: { in: [...projectAssignableRoles] } } } });
  return scopes.length ? { OR: scopes } : { id: -1 };
}
