// Shared API response shapes (mirrors the Express serializers).

export type SessionUser = {
  id: number;
  email: string;
  role: string;
  permissions: string[];
  name: string;
};

export type LoginResponse = {
  accessToken: string;
  csrfToken: string;
  user: SessionUser;
};

export type Person = { id: number; name: string; employeeNumber?: string; designation?: string; avatarUrl?: string; email?: string };

export type Metric = { key: string; label: string; value: number | string; detail?: string; tone?: "primary" | "success" | "warning" | "violet" | "danger" };
export type PanelItem = { id: string | number; label: string; meta?: string; value?: string | number; tone?: Metric["tone"]; progress?: number };
export type Panel = { key: string; title: string; actionLabel?: string; items: PanelItem[] };

export type DashboardResponse = {
  dashboardKind: string;
  dashboardTitle: string;
  generatedAt: string;
  profile: {
    name: string; employeeNumber: string; department: string; departmentCode: string;
    designation: string; email: string; phone?: string | null; status: string;
    dateJoined: string; manager: string; location: string; avatarUrl?: string | null;
    role: string; permissions: string[];
  };
  metrics: Metric[];
  trend: { title: string; points: Array<{ label: string; value: number }>; summary: Array<{ label: string; value: string | number; tone?: Metric["tone"] }> };
  panels: Panel[];
  notifications: Notification[];
};

export type Notification = {
  id: number; type: string; title: string; message: string;
  readAt: string | null; createdAt: string;
};

export type Department = { id: number; name: string; code: string };

export type EmployeeRow = {
  id: number; employeeNumber: string; name: string; firstName: string; lastName: string;
  email: string; role: string; phone?: string | null; avatarUrl?: string | null;
  designation: string; status: string; joinedAt: string; officeLocation: string;
  department: Department; manager: { id: number; name: string; designation: string } | null;
};

export type EmploymentHistoryItem = { id: number; companyName: string; positionHeld: string; startedAt?: string | null; endedAt?: string | null; reasonForLeaving?: string | null };

export type EmployeeRecord = Omit<EmployeeRow, "name" | "email" | "role" | "department" | "manager"> & {
  signatureFileName?: string | null;
  createdAt: string; updatedAt: string;
  hrProfile?: Record<string, unknown>;
  department: Department;
  user?: { email: string; role: { name: string } };
  manager: ({ id: number; employeeNumber: string; firstName: string; lastName: string; avatarUrl?: string | null; designation: string; status: string; department: Department }) | null;
  employmentHistory: EmploymentHistoryItem[];
  signatureUrl?: string;
  capabilities: { viewConfidential: boolean; edit: boolean };
};

export type PaymentRecord = {
  id: number; grossPay?: number; tax?: number; deductions?: number; netPay?: number;
  ratePerHour?: number; currency: string; effectiveAt: string; createdAt?: string; updatedBy?: string;
};

export type Paged<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
};

export type LeaveRequest = {
  id: number; type: string; startDate: string; requestedEndDate: string; endDate: string;
  days: number; excludedHolidayCount: number; reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED"; reviewerNote?: string | null;
  createdAt: string;
  employee: { id: number; name: string; employeeNumber: string; designation: string; email: string; department: string; avatarUrl?: string | null };
};

export type TaskSummary = {
  id: number; title: string; description?: string | null;
  status: string; priority: string; category: string;
  dueAt?: string | null; acceptedAt?: string | null; submittedAt?: string | null;
  assignee: Person; createdBy: Person;
  commentCount: number; attachmentCount: number;
  countdown?: { remainingSeconds: number; overdue: boolean } | null;
};

export type TaskDetail = {
  task: TaskSummary;
  workflow: { accept: boolean; submit: boolean; review: boolean; editDetails: boolean };
  comments: Array<{ id: number; body: string; createdAt: string; author: Person }>;
  activities: Array<{ id: number; action: string; message: string; createdAt: string; actor: Person }>;
  attachments: Array<{ id: number; originalName: string; mimeType: string; size: number; createdAt: string; uploadedBy: Person }>;
};

export type Project = {
  id: number; code: string; name: string; description?: string | null; status: string;
  startsAt?: string | null; dueAt?: string | null; drawingStatus?: string | null;
  siteProgress: number; progress: number; taskCount?: number;
  coordinator: { id: number; firstName: string; lastName: string };
  milestones: Array<{ id: number; title: string; description?: string | null; dueAt?: string | null; completedAt?: string | null }>;
};

export type Message = {
  id: number; subject: string; body: string; announcement: boolean; audienceType: string;
  readAt: string | null; createdAt: string; department?: { id: number; name: string } | null;
  sender: { id: number; email: string; name: string; avatarUrl?: string | null };
  recipient: { id: number; email: string; name: string; avatarUrl?: string | null };
};

export type TrainingProgram = {
  id: number; title: string; description?: string | null; category: string;
  deliveryMode: string; status: string; startsAt?: string | null; endsAt?: string | null;
  certificationName?: string | null; performanceGoal?: string | null;
  averageProgress: number;
  enrollments: Array<{ id: number; status: string; progress: number; completedAt?: string | null; employee: { id: number; name: string; firstName: string; lastName: string; employeeNumber: string; avatarUrl?: string | null; department: { name: string } } }>;
};

export type PayrollRow = { id: number; period: string; gross: number; deductions: number; net: number; currency: string; status: string };
export type BenefitRow = { id: number; benefit: { id: number; name: string; description?: string | null } };

export type RoleInfo = { id: number; name: string; description?: string | null; permissions: string[]; users: number };
export type PermissionGroup = { key: string; label: string; permissions: string[] };

export const hasPermission = (permissions: string[] | undefined, permission: string) =>
  Boolean(permissions?.includes("*") || permissions?.includes(permission));
