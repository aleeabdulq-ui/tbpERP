import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, Check, Palmtree, X } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { LeaveRequest, Paged } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TableWrap, Table, THead, TH, TR, TD } from "@/components/ui/table";
import { StatusBadge, Spinner, EmptyState, PageHeader } from "@/components/ui/misc";
import { UserAvatar } from "@/components/ui/avatar";

type LeaveResponse = Paged<LeaveRequest> & {
  summary: { balance: number; used: number; pending: number; teamPending: number };
  capabilities: { approve: boolean };
};

type Preview = { days: number; effectiveEndDate: string; excludedHolidayCount: number; excludedHolidays: Array<{ name: string; date: string }> };

const leaveTypes = ["Annual Leave", "Sick Leave", "Casual Leave", "Compassionate Leave"];

export default function LeavePage() {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<"mine" | "team">("mine");
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ type: "Annual Leave", startDate: "", endDate: "", reason: "" });
  const [preview, setPreview] = useState<Preview | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["leave", { scope, statusFilter }],
    queryFn: async () => (await api.get<LeaveResponse>("/hr/leave", { params: { scope, pageSize: 20, status: statusFilter || undefined } })).data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["leave"] });

  const fetchPreview = useMutation({
    mutationFn: async () => (await api.post<Preview>("/hr/leave/preview", { startDate: form.startDate, endDate: form.endDate })).data,
    onSuccess: setPreview,
    onError: (error) => { setPreview(null); toast.error(errorMessage(error)); },
  });

  const submit = useMutation({
    mutationFn: async () => (await api.post("/hr/leave", form)).data,
    onSuccess: () => {
      toast.success("Leave request submitted.");
      setOpen(false);
      setForm({ type: "Annual Leave", startDate: "", endDate: "", reason: "" });
      setPreview(null);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const review = useMutation({
    mutationFn: async ({ id, decision }: { id: number; decision: "APPROVED" | "REJECTED" }) =>
      (await api.patch(`/hr/leave/${id}/review`, { status: decision })).data,
    onSuccess: (_d, vars) => { toast.success(`Leave ${vars.decision.toLowerCase()}.`); invalidate(); },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit.mutate();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leave"
        description="Requests, balances and approvals"
        actions={
          <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setPreview(null); }}>
            <DialogTrigger asChild><Button size="sm"><Palmtree size={15} /> Request leave</Button></DialogTrigger>
            <DialogContent title="Request leave" description="Working days are credited around weekends and public holidays.">
              <form onSubmit={onSubmit} className="space-y-3.5">
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Leave type</label>
                  <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{leaveTypes.map((type) => <option key={type}>{type}</option>)}</Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Start date</label><Input required type="date" value={form.startDate} onChange={(e) => { setForm({ ...form, startDate: e.target.value }); setPreview(null); }} /></div>
                  <div><label className="mb-1 block text-[12px] font-medium text-ink-600">End date</label><Input required type="date" value={form.endDate} onChange={(e) => { setForm({ ...form, endDate: e.target.value }); setPreview(null); }} /></div>
                </div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Reason</label><Textarea required minLength={5} maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why are you taking this leave?" /></div>
                {form.startDate && form.endDate && form.endDate >= form.startDate && !preview && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => fetchPreview.mutate()} disabled={fetchPreview.isPending}>
                    {fetchPreview.isPending ? "Checking…" : "Preview schedule"}
                  </Button>
                )}
                {preview && (
                  <div className="rounded-xl bg-accent-50 p-3 text-[12.5px] text-accent-700">
                    <p className="font-semibold">{preview.days} working day{preview.days === 1 ? "" : "s"} · returns {formatDate(preview.effectiveEndDate)}</p>
                    {preview.excludedHolidayCount > 0 && <p className="mt-0.5 text-[11.5px]">Excludes {preview.excludedHolidays.map((h) => h.name).join(", ")}</p>}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={submit.isPending}>{submit.isPending ? "Submitting…" : "Submit request"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Annual balance", value: data ? `${data.summary.balance} days` : "—" },
          { label: "Used this year", value: data ? `${data.summary.used} days` : "—" },
          { label: "Pending days", value: data ? `${data.summary.pending} days` : "—" },
          { label: "Team awaiting review", value: data?.summary.teamPending ?? "—" },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-[11.5px] font-medium text-ink-400">{item.label}</p>
            <p className="mt-1 text-[20px] font-semibold tracking-tight tnum">{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Scope switch */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-ink-100 p-0.75 text-[12.5px] font-medium">
          {(["mine", "team"] as const).map((value) => (
            <button key={value} onClick={() => setScope(value)}
              className={cn("rounded-full px-4 py-1.5 transition-all cursor-pointer", scope === value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800")}>
              {value === "mine" ? "My requests" : "Team approvals"}
            </button>
          ))}
        </div>
        <Select className="w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>

      <TableWrap>
        <Table>
          <THead><TR className="hover:bg-transparent"><TH>Employee</TH><TH>Type</TH><TH>Dates</TH><TH className="text-center">Days</TH><TH>Status</TH>{data?.capabilities.approve && scope === "team" && <TH className="text-right">Review</TH>}</TR></THead>
          <tbody>
            {isLoading ? (
              <TR><TD colSpan={6}><Spinner label="Loading requests…" /></TD></TR>
            ) : (data?.data.length ?? 0) === 0 ? (
              <TR><TD colSpan={6}><EmptyState icon={<CalendarCheck2 size={26} />} title="No leave requests" hint="Requests you submit or need to review will appear here." /></TD></TR>
            ) : (
              data?.data.map((request) => (
                <TR key={request.id}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar src={request.employee.avatarUrl} name={request.employee.name} size="sm" />
                      <div><p className="text-[13px] font-semibold text-ink-900">{request.employee.name}</p><p className="text-[11px] text-ink-400">{request.employee.department}</p></div>
                    </div>
                  </TD>
                  <TD>{request.type}</TD>
                  <TD className="tnum text-[12.5px]">{formatDate(request.startDate, { day: "2-digit", month: "short" })} → {formatDate(request.endDate, { day: "2-digit", month: "short", year: "numeric" })}</TD>
                  <TD className="text-center tnum">{request.days}</TD>
                  <TD><StatusBadge status={request.status} /></TD>
                  {data?.capabilities.approve && scope === "team" && (
                    <TD className="text-right">
                      {request.status === "PENDING" ? (
                        <div className="inline-flex gap-1.5">
                          <Button size="icon" variant="outline" className="text-success-500" title="Approve" onClick={() => review.mutate({ id: request.id, decision: "APPROVED" })}><Check size={14} /></Button>
                          <Button size="icon" variant="outline" className="text-danger-500" title="Reject" onClick={() => review.mutate({ id: request.id, decision: "REJECTED" })}><X size={14} /></Button>
                        </div>
                      ) : <span className="text-[11.5px] text-ink-300">Reviewed</span>}
                    </TD>
                  )}
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
