import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { formatMoney, labelize } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner, PageHeader } from "@/components/ui/misc";

type Overview = {
  generatedAt: string; reportScope: string;
  summary: { employees: number; activeEmployees: number; departments: number; payrollNet: number; trainingProgress: number; performanceRating: string; tasksCompleted: number; taskCompletionRate: number; leaveDays: number; attendanceRate: number };
  headcount?: Array<{ month: string; hires: number }>;
  departments: Array<{ name: string; employees: number }>;
  leave: Array<{ status: string; requests: number; days: number }>;
  payroll: { records: number; gross: number; deductions: number; net: number };
  tasks: { total: number; completed: number; overdue: number; completionRate: number };
  attendance: Array<{ status: string; count: number }>;
};

const COLORS = ["#f26a1b", "#16a34a", "#7c3aed", "#d97706", "#dc2626", "#63657d"];

export default function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["reports-overview"], queryFn: async () => (await api.get<Overview>("/reports/overview")).data, retry: false });

  if (isLoading) return <Spinner label="Building report…" />;
  if (!data) return (
    <div className="space-y-5">
      <PageHeader title="Reports" description="Cross-module analytics" />
      <Card className="p-6 text-[13px] text-ink-500">You don't have access to any report datasets. Ask an administrator to grant a report permission.</Card>
    </div>
  );

  const s = data.summary;
  const leaveChart = data.leave.map((row) => ({ name: labelize(row.status), value: row.requests }));
  const attendanceChart = data.attendance.map((row) => ({ name: labelize(row.status), value: row.count }));

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description={`Generated ${new Date(data.generatedAt).toLocaleString("en-GB")} · scope: ${labelize(data.reportScope)}`} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { label: "Employees", value: s.employees },
          { label: "Active staff", value: s.activeEmployees },
          { label: "Task completion", value: `${s.taskCompletionRate}%` },
          { label: "Attendance rate", value: `${s.attendanceRate}%` },
          { label: "Payroll (net, 6mo)", value: formatMoney(s.payrollNet) },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-[11.5px] font-medium text-ink-400">{item.label}</p>
            <p className="mt-1 truncate text-[18px] font-semibold tracking-tight tnum">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Headcount by department</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departments} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ededf1" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8b8da1" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 11, fill: "#8b8da1" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ border: "1px solid #ededf1", fontSize: 12 }} />
                <Bar dataKey="employees" radius={[6, 6, 0, 0]} fill="#403a58" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leave requests</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leaveChart} dataKey="value" nameKey="name" innerRadius={44} outerRadius={72} paddingAngle={3}>
                  {leaveChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ border: "1px solid #ededf1", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Attendance this month</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendanceChart} dataKey="value" nameKey="name" innerRadius={44} outerRadius={72} paddingAngle={3}>
                  {attendanceChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ border: "1px solid #ededf1", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payroll summary (last 6 months)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-[13px]">
          <div className="rounded-xl bg-ink-50 p-3.5"><p className="text-[11px] text-ink-400">Runs</p><p className="text-[17px] font-semibold tnum">{data.payroll.records}</p></div>
          <div className="rounded-xl bg-ink-50 p-3.5"><p className="text-[11px] text-ink-400">Gross</p><p className="text-[17px] font-semibold tnum">{formatMoney(data.payroll.gross)}</p></div>
          <div className="rounded-xl bg-ink-50 p-3.5"><p className="text-[11px] text-ink-400">Deductions</p><p className="text-[17px] font-semibold tnum text-danger-500">{formatMoney(data.payroll.deductions)}</p></div>
          <div className="rounded-xl bg-accent-50 p-3.5"><p className="text-[11px] text-accent-600">Net</p><p className="text-[17px] font-semibold tnum text-accent-700">{formatMoney(data.payroll.net)}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
