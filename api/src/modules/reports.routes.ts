import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, authorize("hr_reports:read", "financial_reports:read", "project_reports:read", "system_reports:read", "procurement_reports:read", "administration_reports:read"));

router.get("/overview", async (request, response, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const permissions = request.auth!.permissions;
    const has = (permission: string) => permissions.includes("*") || permissions.includes(permission);
    const globalWorkforce = has("hr_reports:read") || has("system_reports:read") || has("administration_reports:read");
    const projectWorkforce = has("project_reports:read") && !globalWorkforce;
    const workforceWhere: Prisma.EmployeeWhereInput = globalWorkforce ? { deletedAt: null } : projectWorkforce ? { deletedAt: null, department: { code: "PRJ" } } : { id: -1 };
    const relatedEmployeeWhere: Prisma.EmployeeWhereInput = { ...workforceWhere };
    const payrollWhere: Prisma.PayrollWhereInput = has("financial_reports:read") ? { deletedAt: null, period: { gte: sixMonthsAgo } } : { id: -1 };
    const departmentWhere: Prisma.DepartmentWhereInput = globalWorkforce ? { deletedAt: null } : projectWorkforce ? { deletedAt: null, code: "PRJ" } : { id: -1 };
    const [
      employees,
      activeEmployees,
      departments,
      leaveGroups,
      payroll,
      training,
      attendanceGroups,
      performance,
      recentHires,
      taskRows,
      approvedLeaveRows,
      trainingRows,
      attendanceRows,
    ] = await Promise.all([
      prisma.employee.count({ where: workforceWhere }),
      prisma.employee.count({ where: { ...workforceWhere, status: "ACTIVE" } }),
      prisma.department.findMany({
        where: departmentWhere,
        select: { name: true, _count: { select: { employees: { where: workforceWhere } } } },
        orderBy: { name: "asc" },
      }),
      prisma.leaveRequest.groupBy({
        by: ["status"],
        where: { deletedAt: null, createdAt: { gte: sixMonthsAgo }, employee: relatedEmployeeWhere },
        _count: { _all: true },
        _sum: { days: true },
      }),
      prisma.payroll.aggregate({
        where: payrollWhere,
        _sum: { gross: true, deductions: true, net: true },
        _count: { _all: true },
      }),
      prisma.employeeTraining.aggregate({ where: { employee: relatedEmployeeWhere }, _avg: { progress: true }, _count: { _all: true } }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { date: { gte: monthStart }, employee: relatedEmployeeWhere },
        _count: { _all: true },
      }),
      prisma.performanceReview.aggregate({
        where: { deletedAt: null, employee: relatedEmployeeWhere },
        _avg: { rating: true, kpiAchievement: true },
        _count: { _all: true },
      }),
      prisma.employee.findMany({
        where: { ...workforceWhere, joinedAt: { gte: sixMonthsAgo } },
        select: { joinedAt: true },
      }),
      prisma.task.findMany({ where: { deletedAt: null, assignee: relatedEmployeeWhere }, select: { status: true, dueAt: true, completedAt: true, assignee: { select: { department: { select: { name: true } } } } } }),
      prisma.leaveRequest.findMany({ where: { deletedAt: null, status: "APPROVED", createdAt: { gte: sixMonthsAgo }, employee: relatedEmployeeWhere }, select: { days: true, employee: { select: { department: { select: { name: true } } } } } }),
      prisma.employeeTraining.findMany({ where: { employee: relatedEmployeeWhere }, select: { progress: true, status: true, employee: { select: { department: { select: { name: true } } } } } }),
      prisma.attendance.findMany({ where: { date: { gte: monthStart }, employee: relatedEmployeeWhere }, select: { status: true, employee: { select: { department: { select: { name: true } } } } } }),
    ]);

    const headcount = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      return {
        month: date.toLocaleDateString("en", { month: "short" }),
        hires: recentHires.filter((item) => item.joinedAt >= date && item.joinedAt < end).length,
      };
    });
    const completedTasks = taskRows.filter((item) => item.status === "COMPLETED").length;
    const overdueTasks = taskRows.filter((item) => item.status === "OVERDUE" || (item.dueAt && item.dueAt < now && item.status !== "COMPLETED")).length;
    const approvedLeaveDays = approvedLeaveRows.reduce((sum, item) => sum + Number(item.days), 0);
    const attended = attendanceRows.filter((item) => ["PRESENT", "LATE"].includes(item.status.toUpperCase())).length;
    const departmentPerformance = departments.map((department) => {
      const name = department.name;
      const departmentTasks = taskRows.filter((item) => item.assignee.department.name === name);
      const departmentTraining = trainingRows.filter((item) => item.employee.department.name === name);
      const departmentAttendance = attendanceRows.filter((item) => item.employee.department.name === name);
      const departmentCompleted = departmentTasks.filter((item) => item.status === "COMPLETED").length;
      return {
        name,
        employees: department._count.employees,
        tasksCompleted: departmentCompleted,
        taskCompletionRate: departmentTasks.length ? Math.round(departmentCompleted / departmentTasks.length * 100) : 0,
        leaveDays: approvedLeaveRows.filter((item) => item.employee.department.name === name).reduce((sum, item) => sum + Number(item.days), 0),
        attendanceRate: departmentAttendance.length ? Math.round(departmentAttendance.filter((item) => ["PRESENT", "LATE"].includes(item.status.toUpperCase())).length / departmentAttendance.length * 100) : 0,
        trainingProgress: departmentTraining.length ? Math.round(departmentTraining.reduce((sum, item) => sum + item.progress, 0) / departmentTraining.length) : 0,
      };
    });

    response.json({
      generatedAt: now,
      reportScope: globalWorkforce ? "workforce" : projectWorkforce ? "projects" : has("financial_reports:read") ? "finance" : "department",
      summary: {
        employees,
        activeEmployees,
        departments: departments.length,
        payrollNet: Number(payroll._sum.net ?? 0),
        trainingProgress: Math.round(Number(training._avg.progress ?? 0)),
        performanceRating: Number(performance._avg.rating ?? 0).toFixed(1),
        tasksCompleted: completedTasks,
        taskCompletionRate: taskRows.length ? Math.round(completedTasks / taskRows.length * 100) : 0,
        leaveDays: approvedLeaveDays,
        attendanceRate: attendanceRows.length ? Math.round(attended / attendanceRows.length * 100) : 0,
      },
      departments: departments.map((item) => ({ name: item.name, employees: item._count.employees })),
      leave: leaveGroups.map((item) => ({ status: item.status, requests: item._count._all, days: Number(item._sum.days ?? 0) })),
      payroll: {
        records: payroll._count._all,
        gross: Number(payroll._sum.gross ?? 0),
        deductions: Number(payroll._sum.deductions ?? 0),
        net: Number(payroll._sum.net ?? 0),
      },
      training: { enrollments: training._count._all, averageProgress: Math.round(Number(training._avg.progress ?? 0)) },
      tasks: { total: taskRows.length, completed: completedTasks, overdue: overdueTasks, completionRate: taskRows.length ? Math.round(completedTasks / taskRows.length * 100) : 0 },
      attendance: attendanceGroups.map((item) => ({ status: item.status, count: item._count._all })),
      performance: {
        reviews: performance._count._all,
        averageRating: Number(performance._avg.rating ?? 0),
        kpiAchievement: Number(performance._avg.kpiAchievement ?? 0),
      },
      headcount,
      departmentPerformance,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
