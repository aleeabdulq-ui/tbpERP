import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CORE = ["dashboard:read", "tasks:read", "tasks:create", "tasks:update", "leave:read", "leave:create", "training:read", "profile:update", "notifications:read", "messages:read", "messages:send"];
const PEOPLE = ["employees:read", "employees:manage", "staff_records:manage", "payment_structure:read", "payment_structure:manage", "hourly_rate:read", "attendance:read", "attendance:manage", "performance:read", "performance:manage", "leave:approve", "hr_reports:read", "benefits:read", "training:manage", "messages:broadcast", "tasks:assign:hr", "recruitment:manage", "staff_profiles:read_all", "approvals:hr"];
const PROJECTS = ["projects:read", "projects:create", "projects:manage", "milestones:read", "milestones:create", "milestones:manage", "project_reports:read", "drawing_status:manage", "site_progress:manage", "project_dashboard:read", "deadlines:manage", "tasks:assign:project", "approvals:project"];
const FINANCE = ["invoices:read", "invoices:manage", "payments:read", "payments:manage", "expenses:read", "expenses:manage", "expenses:approve", "payroll:read", "payroll:manage", "budgets:read", "budgets:manage", "financial_reports:read", "finance_dashboard:read", "payments:approve", "tasks:assign:finance", "approvals:finance"];
const IT = ["support_tickets:manage", "incidents:manage", "licenses:manage", "maintenance:manage", "system_reports:read", "system_settings:manage", "roles:manage"];
const PROCUREMENT = ["purchase_requisitions:read", "purchase_requisitions:manage", "purchase_orders:read", "purchase_orders:manage", "vendors:read", "vendors:manage", "inventory:read", "inventory:manage", "deliveries:read", "deliveries:manage", "procurement_reports:read"];
const ADMINISTRATION = ["assets:read", "assets:manage", "facilities:read", "facilities:manage", "vehicles:read", "vehicles:manage", "administration_reports:read", "administration:manage"];

async function main() {
  // ── Departments ──────────────────────────────────────────────────
  const departments = [
    { name: "Human Resources", code: "HR" },
    { name: "Accounts & Finance", code: "ACC" },
    { name: "Projects", code: "PRJ" },
    { name: "Information Technology", code: "IT" },
    { name: "Procurement", code: "PROC" },
    { name: "Administration", code: "ADM" },
  ];
  for (const dept of departments) {
    await prisma.department.upsert({ where: { code: dept.code }, update: { name: dept.name }, create: dept });
  }
  const dept = Object.fromEntries((await prisma.department.findMany()).map((d) => [d.code, d]));

  // ── Roles ────────────────────────────────────────────────────────
  const roles = [
    { name: "Platform Administrator", description: "Full unrestricted access", permissions: ["*"] },
    { name: "Head of HR", description: "Owns people operations, leave approvals and HR reporting", permissions: [...CORE, ...PEOPLE, "own_net_pay:read", "payroll:read", "hr_workflows:manage"] },
    { name: "Head of Accounts", description: "Owns finance dashboards, payroll and financial reporting", permissions: [...CORE, ...FINANCE, "own_net_pay:read"] },
    { name: "Project Coordinator", description: "Runs architecture and construction projects", permissions: [...CORE, ...PROJECTS, "own_net_pay:read"] },
    { name: "IT Administrator", description: "Maintains systems, roles and security", permissions: [...CORE, ...IT, "system_reports:read"] },
    { name: "Procurement", description: "Handles vendors, purchase orders and inventory", permissions: [...CORE, ...PROCUREMENT] },
    { name: "Administration", description: "Manages assets, facilities and vehicles", permissions: [...CORE, ...ADMINISTRATION] },
    { name: "Employee", description: "Default staff workspace", permissions: [...CORE, "own_net_pay:read"] },
  ];
  for (const role of roles) {
    await prisma.role.upsert({ where: { name: role.name }, update: { permissions: role.permissions, description: role.description }, create: role });
  }
  const role = Object.fromEntries((await prisma.role.findMany()).map((r) => [r.name, r]));

  // ── People ───────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const people = [
    { email: "admin@tbp.ng", role: "Platform Administrator", dept: "IT", employeeNumber: "TBP-0001", firstName: "Adaobi", lastName: "Eze", designation: "Platform Administrator", officeLocation: "Lagos HQ" },
    { email: "hr@tbp.ng", role: "Head of HR", dept: "HR", employeeNumber: "TBP-0002", firstName: "Chiamaka", lastName: "Okafor", designation: "Head of HR", officeLocation: "Lagos HQ" },
    { email: "finance@tbp.ng", role: "Head of Accounts", dept: "ACC", employeeNumber: "TBP-0003", firstName: "Ibrahim", lastName: "Musa", designation: "Head of Accounts", officeLocation: "Lagos HQ" },
    { email: "projects@tbp.ng", role: "Project Coordinator", dept: "PRJ", employeeNumber: "TBP-0004", firstName: "Tunde", lastName: "Adebayo", designation: "Project Coordinator", officeLocation: "Site Office — Lekki" },
    { email: "architect@tbp.ng", role: "Employee", dept: "PRJ", employeeNumber: "TBP-0005", firstName: "Ngozi", lastName: "Nwosu", designation: "Architect", officeLocation: "Lagos HQ" },
    { email: "staff@tbp.ng", role: "Employee", dept: "ADM", employeeNumber: "TBP-0006", firstName: "Emeka", lastName: "Obi", designation: "Administrative Officer", officeLocation: "Lagos HQ" },
  ];
  const employees: Record<string, { id: number; userId: number }> = {};
  for (const person of people) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: { passwordHash, roleId: role[person.role].id },
      create: { email: person.email, passwordHash, roleId: role[person.role].id },
    });
    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: { firstName: person.firstName, lastName: person.lastName, designation: person.designation, officeLocation: person.officeLocation, departmentId: dept[person.dept].id },
      create: {
        userId: user.id,
        employeeNumber: person.employeeNumber,
        firstName: person.firstName,
        lastName: person.lastName,
        designation: person.designation,
        departmentId: dept[person.dept].id,
        officeLocation: person.officeLocation,
        joinedAt: new Date("2024-01-15"),
        hrProfile: { nationality: "Nigerian", employmentType: "FULL_TIME", workLocation: "OFFICE" },
      },
    });
    employees[person.email] = { id: employee.id, userId: user.id };
  }
  const admin = employees["admin@tbp.ng"];
  const architect = employees["architect@tbp.ng"];
  const coordinator = employees["projects@tbp.ng"];
  const staff = employees["staff@tbp.ng"];

  // Make the HR head the manager of the two junior staff
  await prisma.employee.updateMany({ where: { userId: { in: [architect.userId, staff.userId] } }, data: { managerId: employees["hr@tbp.ng"].id } });

  // ── Nigerian public holidays ─────────────────────────────────────
  const holidays = [
    { name: "New Year's Day", date: new Date(Date.UTC(2026, 0, 1)), recurring: true },
    { name: "Workers' Day", date: new Date(Date.UTC(2026, 4, 1)), recurring: true },
    { name: "Democracy Day", date: new Date(Date.UTC(2026, 5, 12)), recurring: true },
    { name: "Independence Day", date: new Date(Date.UTC(2026, 9, 1)), recurring: true },
    { name: "Christmas Day", date: new Date(Date.UTC(2026, 11, 25)), recurring: true },
    { name: "Boxing Day", date: new Date(Date.UTC(2026, 11, 26)), recurring: true },
  ];
  for (const holiday of holidays) await prisma.publicHoliday.upsert({ where: { id: (await prisma.publicHoliday.findFirst({ where: { name: holiday.name, date: holiday.date } }))?.id ?? -1 }, update: holiday, create: holiday });

  // ── Project + milestones ─────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { code: "PRJ-2601" },
    update: {},
    create: {
      code: "PRJ-2601", name: "Lekki Waterside Duplex", status: "ACTIVE",
      description: "Design and build supervision for a 5-bedroom waterfront duplex.",
      startsAt: new Date("2026-01-12"), dueAt: new Date("2026-11-30"),
      drawingStatus: "Working drawings approved", siteProgress: 38, progress: 42,
      createdById: coordinator.id, coordinatorId: coordinator.id,
      milestones: { create: [
        { title: "Concept design sign-off", dueAt: new Date("2026-02-13"), completedAt: new Date("2026-02-11") },
        { title: "Foundation completion", dueAt: new Date("2026-05-29"), completedAt: new Date("2026-06-02") },
        { title: "First floor slab", dueAt: new Date("2026-09-18") },
        { title: "Roofing & fenestration", dueAt: new Date("2026-11-13") },
      ] },
    },
  });

  // ── Tasks ────────────────────────────────────────────────────────
  if (!(await prisma.task.findFirst({ where: { title: "Review revised window schedule" } }))) {
    await prisma.task.create({
      data: {
        title: "Review revised window schedule", category: "PROJECT", priority: "HIGH", status: "IN_PROGRESS",
        description: "Confirm aluminium profile substitutions with the supplier and approve the revised schedule.",
        dueAt: new Date(Date.now() + 5 * 86400000), acceptedAt: new Date(),
        assigneeId: architect.id, createdById: coordinator.id, projectId: project.id,
        activities: { create: [
          { actorId: coordinator.id, action: "CREATED", message: "Tunde Adebayo created this task." },
          { actorId: architect.id, action: "ACCEPTED", message: "Ngozi Nwosu accepted the task." },
        ] },
      },
    });
    await prisma.task.create({
      data: {
        title: "Update Q3 staff records audit", category: "HR_ADMIN", priority: "MEDIUM", status: "ASSIGNED",
        description: "Verify emergency contacts and ID documents for all staff confirmed in 2026.",
        dueAt: new Date(Date.now() + 9 * 86400000),
        assigneeId: staff.id, createdById: admin.id,
        activities: { create: { actorId: admin.id, action: "CREATED", message: "Adaobi Eze created this task." } },
      },
    });
  }

  // ── Payroll & payment structures ────────────────────────────────
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  for (const [key, gross] of [["architect@tbp.ng", 950000], ["staff@tbp.ng", 480000]] as const) {
    const emp = employees[key];
    if (await prisma.staffPayment.findFirst({ where: { employeeId: emp.id } })) continue; // already seeded
    const tax = Math.round(gross * 0.16);
    const deductions = Math.round(gross * 0.02);
    await prisma.staffPayment.create({ data: { employeeId: emp.id, grossPay: gross, tax, deductions, netPay: gross - tax - deductions, ratePerHour: 4871, effectiveAt: new Date("2026-01-01"), updatedById: employees["hr@tbp.ng"].userId } });
    for (let back = 0; back < 3; back++) {
      const period = new Date(month.getFullYear(), month.getMonth() - back, 1);
      await prisma.payroll.create({ data: { employeeId: emp.id, period, gross, deductions: tax + deductions, net: gross - tax - deductions } }).catch(() => {});
    }
  }

  // ── Benefits ─────────────────────────────────────────────────────
  for (const name of ["Health Insurance (HMO)", "Pension Contribution", "Housing Allowance"]) {
    const benefit = await prisma.benefit.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.employeeBenefit.upsert({ where: { employeeId_benefitId: { employeeId: architect.id, benefitId: benefit.id } }, update: {}, create: { employeeId: architect.id, benefitId: benefit.id } });
  }

  // ── Training ─────────────────────────────────────────────────────
  let training = await prisma.training.findFirst({ where: { title: "Site Safety & QA Induction" } });
  training ??= await prisma.training.create({
    data: {
      title: "Site Safety & QA Induction", category: "Compliance", deliveryMode: "IN_PERSON", status: "ACTIVE",
      description: "Mandatory HSE onboarding for all site staff, covering PPE, permits and QA hold points.",
      startsAt: new Date("2026-08-10"), endsAt: new Date("2026-08-11"), certificationName: "TBP HSE Level 1",
      employees: { create: [
        { employeeId: architect.id, status: "COMPLETED", progress: 100, completedAt: new Date("2026-07-31") },
        { employeeId: staff.id, status: "IN_PROGRESS", progress: 45 },
      ] },
    },
  });

  // ── Attendance (this month) ──────────────────────────────────────
  const today = new Date();
  for (let day = 1; day <= Math.min(today.getDate(), 5); day++) {
    const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), day));
    if (date.getUTCDay() === 0 || date.getUTCDay() === 6) continue;
    for (const emp of [architect, staff]) {
      await prisma.attendance.upsert({ where: { employeeId_date: { employeeId: emp.id, date } }, update: {}, create: { employeeId: emp.id, date, status: "PRESENT", checkInAt: new Date(date.getTime() + 8 * 3600000) } }).catch(() => {});
    }
  }

  // ── Notifications for admin ──────────────────────────────────────
  await prisma.notification.upsert({
    where: { dedupeKey: "seed:welcome" },
    update: {},
    create: { userId: admin.userId, type: "GENERAL", title: "Welcome to TBP ERP", message: "Your workspace is ready. Invite staff from the People page.", dedupeKey: "seed:welcome" },
  });

  console.log("Seed complete. Sign in with:");
  console.log("  admin@tbp.ng / Password123!   (Platform Administrator)");
  console.log("  hr@tbp.ng / Password123!      (Head of HR)");
  console.log("  projects@tbp.ng / Password123! (Project Coordinator)");
}

main().finally(() => prisma.$disconnect());
