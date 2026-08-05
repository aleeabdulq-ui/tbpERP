export const hasPermission = (auth, permission) => Boolean(auth?.permissions.includes("*") || auth?.permissions.includes(permission));
export const allowedTaskCategories = (auth) => {
    if (hasPermission(auth, "tasks:assign:any"))
        return ["GENERAL", "HR_ADMIN", "FINANCE", "PROJECT"];
    const categories = [];
    if (hasPermission(auth, "tasks:assign:hr"))
        categories.push("HR_ADMIN");
    if (hasPermission(auth, "tasks:assign:finance"))
        categories.push("FINANCE");
    if (hasPermission(auth, "tasks:assign:project"))
        categories.push("PROJECT");
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
export function canAssignTask(auth, category, target) {
    if (hasPermission(auth, "tasks:assign:any"))
        return true;
    if (category === "HR_ADMIN" && hasPermission(auth, "tasks:assign:hr"))
        return true;
    if (category === "FINANCE" && hasPermission(auth, "tasks:assign:finance"))
        return target.department.code === "ACC";
    if (category === "PROJECT" && hasPermission(auth, "tasks:assign:project"))
        return projectAssignableRoles.has(target.user.role.name);
    return false;
}
export function assignmentTargetWhere(auth) {
    if (hasPermission(auth, "tasks:assign:any") || hasPermission(auth, "tasks:assign:hr"))
        return {};
    const scopes = [];
    if (hasPermission(auth, "tasks:assign:finance"))
        scopes.push({ department: { code: "ACC" } });
    if (hasPermission(auth, "tasks:assign:project"))
        scopes.push({ user: { role: { name: { in: [...projectAssignableRoles] } } } });
    return scopes.length ? { OR: scopes } : { id: -1 };
}
