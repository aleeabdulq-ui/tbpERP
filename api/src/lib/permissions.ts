export const permissionGroups = [
  { key: "core", label: "Core workspace", permissions: ["dashboard:read", "tasks:read", "tasks:create", "tasks:update", "leave:read", "leave:create", "training:read", "profile:update", "notifications:read", "messages:read", "messages:send"] },
  { key: "people", label: "Human resources", permissions: ["employees:read", "employees:manage", "staff_records:manage", "payment_structure:read", "payment_structure:manage", "hourly_rate:read", "own_net_pay:read", "attendance:read", "attendance:manage", "performance:read", "performance:manage", "leave:approve", "hr_reports:read"] },
  { key: "projects", label: "Architecture & projects", permissions: ["projects:read", "projects:create", "projects:manage", "milestones:read", "milestones:create", "milestones:manage", "project_reports:read", "drawing_status:manage", "site_progress:manage"] },
  { key: "finance", label: "Accounts & finance", permissions: ["invoices:read", "invoices:manage", "payments:read", "payments:manage", "expenses:read", "expenses:manage", "expenses:approve", "payroll:read", "payroll:manage", "budgets:read", "budgets:manage", "financial_reports:read"] },
  { key: "procurement", label: "Procurement", permissions: ["purchase_requisitions:read", "purchase_requisitions:manage", "purchase_orders:read", "purchase_orders:manage", "vendors:read", "vendors:manage", "inventory:read", "inventory:manage", "deliveries:read", "deliveries:manage", "procurement_reports:read"] },
  { key: "administration", label: "Administration", permissions: ["assets:read", "assets:manage", "facilities:read", "facilities:manage", "vehicles:read", "vehicles:manage", "administration_reports:read"] },
  { key: "it", label: "Information technology", permissions: ["support_tickets:manage", "incidents:manage", "licenses:manage", "maintenance:manage", "system_reports:read", "system_settings:manage", "roles:manage"] },
] as const;

const workflowPermissions = [
  "benefits:read", "training:manage", "messages:broadcast", "tasks:manage", "tasks:delete", "tasks:assign:any", "tasks:assign:hr", "tasks:assign:finance", "tasks:assign:project",
  "recruitment:manage", "disciplinary_actions:manage", "administration:manage", "hr_workflows:manage", "staff_profiles:read_all", "approvals:hr",
  "finance_dashboard:read", "purchase_requests:approve", "payments:approve", "finance_workflows:approve",
  "project_dashboard:read", "deadlines:manage", "project_reports:read", "approvals:project",
  "financial_reports:read", "approvals:finance",
];

export const knownPermissions = new Set<string>([...permissionGroups.flatMap((group) => [...group.permissions]), ...workflowPermissions]);
