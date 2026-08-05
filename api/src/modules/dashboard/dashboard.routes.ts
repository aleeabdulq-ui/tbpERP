import { Router } from "express";
import type { Prisma, TaskCategory } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { AppError } from "../../lib/errors.js";

const router = Router();
router.use(authenticate, authorize("dashboard:read"));

type DashboardKind = "hr" | "projects" | "it" | "finance" | "procurement" | "administration" | "employee";
type Tone = "primary" | "success" | "warning" | "violet" | "danger";
type Metric = { key: string; label: string; value: number | string; detail?: string; tone?: Tone };
type PanelItem = { id: string | number; label: string; meta?: string; value?: string | number; tone?: Tone; progress?: number };
type Panel = { key: string; title: string; actionLabel?: string; items: PanelItem[] };

const titles: Record<DashboardKind, string> = {
  hr: "Human Resources",
  projects: "Architecture & Projects",
  it: "Information Technology",
  finance: "Accounts & Finance",
  procurement: "Procurement",
  administration: "Administration",
  employee: "My Workspace",
};

export function dashboardKind(role: string, departmentCode: string): DashboardKind {
  if (role === "Head of HR" || departmentCode === "HR") return "hr";
  if (role === "Head of Accounts" || role === "Finance Staff" || departmentCode === "ACC") return "finance";
  if (role === "Procurement" || departmentCode === "PROC") return "procurement";
  if (role === "Administration" || departmentCode === "ADM") return "administration";
  if (role === "Platform Administrator" || role === "IT Administrator" || departmentCode === "IT") return "it";
  if (departmentCode === "PRJ" || ["Project Coordinator", "Principal Architect", "Architect", "Builder", "Engineer", "Quantity Surveyor", "Intern Architect", "NYSC Corps Member"].includes(role)) return "projects";
  return "employee";
}

const openStatuses = ["TODO", "IN_PROGRESS", "REVIEW"] as const;
const money = (value: Prisma.Decimal | number | null | undefined) => `₦${Math.round(Number(value ?? 0) / 1000).toLocaleString("en-NG")}k`;
const formatDate = (value?: Date | null) => value ? value.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "No date";
const taskCategory: Partial<Record<DashboardKind, TaskCategory>> = { hr: "HR_ADMIN", projects: "PROJECT", finance: "FINANCE" };

router.get("/", async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      select: {
        id: true, email: true,
        role: { select: { name: true, permissions: true } },
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, designation: true, status: true, joinedAt: true, phone: true, officeLocation: true, avatarUrl: true, department: { select: { name: true, code: true } }, manager: { select: { firstName: true, lastName: true } } } },
        notifications: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 8 },
      },
    });
    if (!user?.employee) throw new AppError(404, "Employee profile not found", "EMPLOYEE_NOT_FOUND");

    const employee = user.employee;
    const kind = dashboardKind(user.role.name, employee.department.code);
    const now = new Date();
    const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(dayStart); weekStart.setDate(weekStart.getDate() - 6);
    const category = taskCategory[kind];
    const departmentTaskWhere: Prisma.TaskWhereInput = {
      deletedAt: null,
      ...(category ? { category } : kind === "employee" ? { assigneeId: employee.id } : { assignee: { department: { code: employee.department.code } } }),
    };

    const [ownTasks, openTasks, pendingApprovals, attendanceRows, recentActivity] = await Promise.all([
      prisma.task.findMany({ where: { assigneeId: employee.id, deletedAt: null, status: { in: [...openStatuses] } }, orderBy: [{ priority: "desc" }, { dueAt: "asc" }], take: 6, select: { id: true, title: true, priority: true, status: true, dueAt: true } }),
      prisma.task.count({ where: { ...departmentTaskWhere, status: { in: [...openStatuses] } } }),
      prisma.task.count({ where: { ...departmentTaskWhere, status: "REVIEW" } }),
      prisma.attendance.findMany({ where: { date: { gte: weekStart } }, select: { date: true, status: true } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, action: true, entityType: true, createdAt: true, user: { select: { email: true } } } }),
    ]);

    let metrics: Metric[] = [];
    let panels: Panel[] = [];
    let trend = { title: "Task completion", points: [] as Array<{ label: string; value: number }>, summary: [] as Array<{ label: string; value: string | number; tone?: Tone }> };

    if (kind === "hr") {
      const [totalEmployees, newEmployees, employeesOnLeave, pendingLeave, training, hrTasks, birthdayCandidates] = await Promise.all([
        prisma.employee.count({ where: { deletedAt: null } }),
        prisma.employee.count({ where: { deletedAt: null, joinedAt: { gte: monthStart } } }),
        prisma.employee.count({ where: { deletedAt: null, status: "ON_LEAVE" } }),
        prisma.leaveRequest.count({ where: { deletedAt: null, status: "PENDING" } }),
        prisma.employeeTraining.aggregate({ _avg: { progress: true }, _count: { _all: true } }),
        prisma.task.findMany({ where: { category: "HR_ADMIN", deletedAt: null, status: { in: [...openStatuses] } }, orderBy: [{ priority: "desc" }, { dueAt: "asc" }], take: 5, select: { id: true, title: true, priority: true, dueAt: true } }),
        prisma.employee.findMany({ where: { deletedAt: null, status: { not: "TERMINATED" } }, select: { id: true, firstName: true, lastName: true, avatarUrl: true, department: { select: { name: true } }, hrProfile: true } }),
      ]);
      const birthdays = birthdayCandidates.flatMap((candidate) => {
        const profile = candidate.hrProfile && typeof candidate.hrProfile === "object" && !Array.isArray(candidate.hrProfile) ? candidate.hrProfile as Prisma.JsonObject : null;
        const raw = profile?.dateOfBirth;
        if (typeof raw !== "string") return [];
        const birthDate = new Date(raw); if (Number.isNaN(birthDate.getTime())) return [];
        const next = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate()); if (next < dayStart) next.setFullYear(next.getFullYear() + 1);
        const daysAway = Math.ceil((next.getTime() - dayStart.getTime()) / 86400000);
        return daysAway <= 45 ? [{ id: candidate.id, label: `${candidate.firstName} ${candidate.lastName}`, meta: candidate.department.name, value: formatDate(next), daysAway }] : [];
      }).sort((a, b) => a.daysAway - b.daysAway).slice(0, 5).map(({ daysAway: _daysAway, ...item }) => item);
      metrics = [
        { key: "employees", label: "Total Employees", value: totalEmployees, detail: "workforce", tone: "primary" },
        { key: "new-employees", label: "New Employees", value: newEmployees, detail: "this month", tone: "success" },
        { key: "leave", label: "Employees on Leave", value: employeesOnLeave, detail: "currently", tone: "warning" },
        { key: "pending-leave", label: "Pending Leave Requests", value: pendingLeave, detail: "awaiting review", tone: pendingLeave ? "danger" : "success" },
      ];
      trend = attendanceTrend(attendanceRows);
      panels = [
        { key: "birthdays", title: "Upcoming Birthdays", items: birthdays },
        { key: "training", title: "Training Progress", items: [{ id: "training", label: "Workforce learning", meta: `${training._count._all} enrollments`, value: `${Math.round(Number(training._avg.progress ?? 0))}%`, progress: Math.round(Number(training._avg.progress ?? 0)), tone: "success" }] },
        { key: "tasks", title: "Open HR Tasks", items: hrTasks.map((task) => ({ id: task.id, label: task.title, meta: task.dueAt ? `Due ${formatDate(task.dueAt)}` : "No deadline", value: task.priority, tone: task.priority === "CRITICAL" || task.priority === "HIGH" ? "danger" : "primary" })) },
      ];
    } else if (kind === "projects") {
      const [projects, assignedTasks, deadlines, drawings, uploads, performance] = await Promise.all([
        prisma.project.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { dueAt: "asc" }, take: 6, select: { id: true, code: true, name: true, progress: true, siteProgress: true, drawingStatus: true, dueAt: true } }),
        prisma.task.count({ where: { assigneeId: employee.id, deletedAt: null, status: { in: [...openStatuses] } } }),
        prisma.milestone.findMany({ where: { completedAt: null, dueAt: { gte: dayStart }, project: { deletedAt: null } }, orderBy: { dueAt: "asc" }, take: 5, select: { id: true, title: true, dueAt: true, project: { select: { code: true } } } }),
        prisma.project.count({ where: { deletedAt: null, drawingStatus: { contains: "review" } } }),
        prisma.taskAttachment.findMany({ where: { deletedAt: null, task: { category: "PROJECT", deletedAt: null } }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, originalName: true, createdAt: true, uploadedBy: { select: { firstName: true, lastName: true } }, task: { select: { project: { select: { code: true } } } } } }),
        prisma.performanceReview.aggregate({ where: { deletedAt: null, employee: { department: { code: "PRJ" } } }, _avg: { kpiAchievement: true } }),
      ]);
      const averageProgress = projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0;
      metrics = [
        { key: "active", label: "Active Projects", value: projects.length, detail: "in delivery", tone: "primary" },
        { key: "assigned", label: "Assigned Tasks", value: assignedTasks, detail: "open", tone: "violet" },
        { key: "deadlines", label: "Project Deadlines", value: deadlines.length, detail: "upcoming", tone: "warning" },
        { key: "drawings", label: "Drawings Awaiting Review", value: drawings, detail: "pending", tone: drawings ? "danger" : "success" },
        { key: "approvals", label: "Pending Approvals", value: pendingApprovals, tone: "warning" },
        { key: "rfi", label: "RFIs / Comments", value: 0, detail: "not connected", tone: "violet" },
      ];
      trend = { title: "Project Progress", points: projects.map((project) => ({ label: project.code, value: project.progress })), summary: [{ label: "Average progress", value: `${averageProgress}%`, tone: "primary" }, { label: "Team performance", value: `${Math.round(Number(performance._avg.kpiAchievement ?? 0))}%`, tone: "success" }, { label: "Coordination meetings", value: 0, tone: "violet" }] };
      panels = [
        { key: "projects", title: "Project Delivery", items: projects.map((project) => ({ id: project.id, label: project.name, meta: `${project.code} · ${project.drawingStatus ?? "Drawing status pending"}`, value: `${project.progress}%`, progress: project.progress, tone: "primary" })) },
        { key: "deadlines", title: "Upcoming Deadlines", items: deadlines.map((item) => ({ id: item.id, label: item.title, meta: item.project.code, value: formatDate(item.dueAt), tone: "warning" })) },
        { key: "uploads", title: "Recently Uploaded Drawings", items: uploads.map((item) => ({ id: item.id, label: item.originalName, meta: `${item.uploadedBy.firstName} ${item.uploadedBy.lastName} · ${item.task.project?.code ?? "Project"}`, value: formatDate(item.createdAt), tone: "violet" })) },
      ];
    } else if (kind === "finance") {
      const [payroll, payrollPeriods] = await Promise.all([
        prisma.payroll.aggregate({ where: { deletedAt: null }, _sum: { gross: true, deductions: true, net: true }, _count: { _all: true } }),
        prisma.payroll.groupBy({ by: ["period"], where: { deletedAt: null }, orderBy: { period: "desc" }, take: 6, _sum: { net: true } }),
      ]);
      metrics = [
        { key: "revenue", label: "Revenue Summary", value: "₦0", detail: "not connected", tone: "success" },
        { key: "invoices", label: "Outstanding Invoices", value: 0, detail: "not connected", tone: "warning" },
        { key: "payments", label: "Pending Payments", value: 0, detail: "not connected", tone: "danger" },
        { key: "expenses", label: "Monthly Expenses", value: money(payroll._sum.deductions), detail: "payroll deductions", tone: "warning" },
        { key: "cashflow", label: "Cash Flow", value: money(payroll._sum.net), detail: "net payroll", tone: "success" },
        { key: "budget", label: "Budget Utilization", value: "0%", detail: "not connected", tone: "violet" },
        { key: "payroll", label: "Payroll Status", value: payroll._count._all, detail: "records", tone: "primary" },
        { key: "approvals", label: "Financial Approvals", value: pendingApprovals, detail: "in review", tone: "warning" },
      ];
      trend = { title: "Cash Flow", points: payrollPeriods.reverse().map((item) => ({ label: item.period.toLocaleDateString("en", { month: "short" }), value: Math.round(Number(item._sum.net ?? 0) / 1000) })), summary: [{ label: "Gross payroll", value: money(payroll._sum.gross), tone: "primary" }, { label: "Net payroll", value: money(payroll._sum.net), tone: "success" }, { label: "Upcoming due payments", value: 0, tone: "warning" }] };
      panels = [{ key: "approvals", title: "Finance Approvals", items: ownTasks.map(taskItem) }, { key: "notifications", title: "Finance Notifications", items: notificationItems(user.notifications) }];
    } else if (kind === "it") {
      const [users, recentRequests, critical] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.task.findMany({ where: { deletedAt: null, category: "GENERAL", status: { in: [...openStatuses] } }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, title: true, priority: true, dueAt: true } }),
        prisma.task.count({ where: { deletedAt: null, priority: "CRITICAL", status: { in: [...openStatuses] } } }),
      ]);
      metrics = [
        { key: "support", label: "Open Support Tickets", value: recentRequests.length, detail: "tracked as tasks", tone: "primary" },
        { key: "incidents", label: "Critical Incidents", value: critical, tone: critical ? "danger" : "success" },
        { key: "server", label: "Server Status", value: "Online", tone: "success" },
        { key: "network", label: "Network Status", value: "Operational", tone: "success" },
        { key: "assets", label: "Asset Inventory", value: 0, detail: "not connected", tone: "violet" },
        { key: "licenses", label: "Software Licenses", value: 0, detail: "not connected", tone: "warning" },
        { key: "maintenance", label: "Scheduled Maintenance", value: 0, detail: "upcoming", tone: "primary" },
        { key: "health", label: "System Health", value: "Healthy", detail: `${users} users`, tone: "success" },
      ];
      trend = activityTrend(recentActivity);
      panels = [{ key: "requests", title: "Recent User Requests", items: recentRequests.map((item) => ({ id: item.id, label: item.title, meta: item.dueAt ? `Due ${formatDate(item.dueAt)}` : "No deadline", value: item.priority, tone: item.priority === "CRITICAL" ? "danger" : "primary" })) }, { key: "notifications", title: "IT Notifications", items: notificationItems(user.notifications) }];
    } else if (kind === "procurement") {
      metrics = [
        { key: "requisitions", label: "Pending Purchase Requests", value: 0, detail: "not connected", tone: "warning" },
        { key: "orders", label: "Purchase Orders Awaiting Approval", value: 0, detail: "not connected", tone: "danger" },
        { key: "vendors", label: "Vendor Performance", value: "—", detail: "not connected", tone: "violet" },
        { key: "stock", label: "Low Stock Alerts", value: 0, detail: "not connected", tone: "warning" },
        { key: "received", label: "Goods Received", value: 0, detail: "this month", tone: "success" },
        { key: "deliveries", label: "Delivery Schedule", value: 0, detail: "upcoming", tone: "primary" },
        { key: "budget", label: "Procurement Budget", value: "0%", detail: "utilized", tone: "violet" },
        { key: "kpis", label: "Procurement KPIs", value: "—", detail: "not connected", tone: "primary" },
      ];
      trend = taskTrend("Procurement Workflow", openTasks, pendingApprovals);
      panels = [{ key: "tasks", title: "Procurement Tasks", items: ownTasks.map(taskItem) }, { key: "notifications", title: "Notifications", items: notificationItems(user.notifications) }];
    } else if (kind === "administration") {
      const [staffAttendance, assets] = await Promise.all([prisma.attendance.count({ where: { date: dayStart, status: "PRESENT" } }), prisma.employee.count({ where: { deletedAt: null, status: "ACTIVE" } })]);
      metrics = [
        { key: "announcements", label: "Office Announcements", value: user.notifications.filter((item) => item.type === "SYSTEM").length, tone: "primary" },
        { key: "attendance", label: "Staff Attendance", value: staffAttendance, detail: "present today", tone: "success" },
        { key: "assets", label: "Asset Status", value: 0, detail: "not connected", tone: "violet" },
        { key: "vehicles", label: "Vehicle Requests", value: 0, detail: "not connected", tone: "warning" },
        { key: "facilities", label: "Facility Maintenance Requests", value: 0, detail: "not connected", tone: "danger" },
        { key: "visitors", label: "Visitor Management", value: 0, detail: "today", tone: "primary" },
        { key: "tasks", label: "Administrative Tasks", value: openTasks, detail: "open", tone: "warning" },
        { key: "approvals", label: "Pending Approvals", value: pendingApprovals, tone: "violet" },
      ];
      trend = attendanceTrend(attendanceRows);
      panels = [{ key: "tasks", title: "Administrative Tasks", items: ownTasks.map(taskItem) }, { key: "notifications", title: "Office Notifications", items: notificationItems(user.notifications) }, { key: "staff", title: "Office Overview", items: [{ id: "staff", label: "Active staff", value: assets, tone: "primary" }] }];
    } else {
      const completed = await prisma.task.count({ where: { assigneeId: employee.id, deletedAt: null, status: "COMPLETED" } });
      metrics = [{ key: "assigned", label: "Assigned Tasks", value: ownTasks.length, tone: "primary" }, { key: "completed", label: "Completed Tasks", value: completed, tone: "success" }, { key: "pending", label: "Pending Tasks", value: openTasks, tone: "warning" }, { key: "notifications", label: "Notifications", value: user.notifications.filter((item) => !item.readAt).length, tone: "violet" }];
      trend = taskTrend("Task Progress", openTasks, pendingApprovals);
      panels = [{ key: "tasks", title: "My Tasks", items: ownTasks.map(taskItem) }, { key: "notifications", title: "Notifications", items: notificationItems(user.notifications) }];
    }

    panels.push({ key: "activity", title: "Recent Activities", items: recentActivity.slice(0, 5).map((item) => ({ id: item.id, label: titleCase(item.action), meta: `${item.user?.email ?? "System"} · ${item.entityType}`, value: formatDate(item.createdAt), tone: "primary" })) });
    if (kind === "hr") panels.push({ key: "notifications", title: "HR Notifications", items: notificationItems(user.notifications) });

    response.json({
      dashboardKind: kind,
      dashboardTitle: titles[kind],
      generatedAt: now,
      profile: { name: `${employee.firstName} ${employee.lastName}`, employeeNumber: employee.employeeNumber, department: employee.department.name, departmentCode: employee.department.code, designation: employee.designation, email: user.email, phone: employee.phone, status: employee.status, dateJoined: employee.joinedAt, manager: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—", location: employee.officeLocation, avatarUrl: employee.avatarUrl, role: user.role.name, permissions: Array.isArray(user.role.permissions) ? user.role.permissions : [] },
      metrics,
      trend,
      panels,
      notifications: user.notifications,
    });
  } catch (error) { next(error); }
});

function attendanceTrend(rows: Array<{ date: Date; status: string }>) {
  const points = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - 6 + index);
    const daily = rows.filter((row) => row.date.getTime() === date.getTime());
    const present = daily.filter((row) => ["PRESENT", "LATE"].includes(row.status)).length;
    return { label: date.toLocaleDateString("en", { weekday: "short" }), value: daily.length ? Math.round(present / daily.length * 100) : 0 };
  });
  const latest = points.at(-1)?.value ?? 0;
  return { title: "Attendance Summary", points, summary: [{ label: "Attendance today", value: `${latest}%`, tone: "success" as Tone }, { label: "Present records", value: rows.filter((row) => row.status === "PRESENT").length, tone: "primary" as Tone }, { label: "Late records", value: rows.filter((row) => row.status === "LATE").length, tone: "warning" as Tone }] };
}

function activityTrend(activity: Array<{ createdAt: Date }>) {
  const points = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - 6 + index); return { label: date.toLocaleDateString("en", { weekday: "short" }), value: activity.filter((item) => { const itemDate = new Date(item.createdAt); itemDate.setHours(0, 0, 0, 0); return itemDate.getTime() === date.getTime(); }).length }; });
  return { title: "System Health & Activity", points, summary: [{ label: "API status", value: "Online", tone: "success" as Tone }, { label: "Database", value: "Connected", tone: "success" as Tone }, { label: "Recent events", value: activity.length, tone: "primary" as Tone }] };
}

function taskTrend(title: string, open: number, review: number) { return { title, points: [{ label: "Open", value: open }, { label: "Review", value: review }, { label: "Complete", value: 0 }], summary: [{ label: "Open work", value: open, tone: "warning" as Tone }, { label: "Pending approvals", value: review, tone: "violet" as Tone }] }; }
function taskItem(task: { id: number; title: string; priority: string; status: string; dueAt: Date | null }): PanelItem { return { id: task.id, label: task.title, meta: task.dueAt ? `Due ${formatDate(task.dueAt)}` : titleCase(task.status), value: task.priority, tone: task.priority === "CRITICAL" || task.priority === "HIGH" ? "danger" : "primary" }; }
function notificationItems(items: Array<{ id: number; title: string; message: string; readAt: Date | null }>): PanelItem[] { return items.slice(0, 5).map((item) => ({ id: item.id, label: item.title, meta: item.message, tone: item.readAt ? "primary" : "violet" })); }
function titleCase(value: string) { return value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }

export default router;
