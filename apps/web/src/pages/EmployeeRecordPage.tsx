import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, CalendarDays, Camera, Clock3, Landmark, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { EmployeeRecord, PaymentRecord } from "@/lib/types";
import { cn, formatDate, formatMoney, labelize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TableWrap, Table, THead, TH, TR, TD } from "@/components/ui/table";
import { StatusBadge, Spinner, Progress } from "@/components/ui/misc";
import { UserAvatar } from "@/components/ui/avatar";

type PaymentResponse = {
  data: PaymentRecord[];
  workingSchedule: { daysPerWeek: number; hoursPerDay: number; startTime: string; endTime: string; weeklyHours: number; averageMonthlyHours: number };
  capabilities: { viewAll: boolean; viewRate: boolean; viewNet: boolean; manage: boolean };
};

function MaskedValue({ value }: { value: unknown }) {
  if (value && typeof value === "object" && "masked" in (value as Record<string, unknown>)) {
    return <span className="tnum">{String((value as Record<string, unknown>).masked)}</span>;
  }
  if (value === null || value === undefined || value === "") return <span className="text-ink-300">—</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "object") return null; // nested objects are rendered by dedicated sections
  const text = String(value);
  const asDate = /^\d{4}-\d{2}-\d{2}T/.test(text) ? formatDate(text) : text;
  return <span className="break-words">{asDate}</span>;
}

function PaymentStructureSection({ employeeId }: { employeeId: number }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ grossPay: "", tax: "", deductions: "", ratePerHour: "", effectiveAt: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["payment-structure", employeeId],
    queryFn: async () => (await api.get<PaymentResponse>(`/hr/employees/${employeeId}/payment-structure`)).data,
    retry: false,
  });

  const save = useMutation({
    mutationFn: async () => (await api.post(`/hr/employees/${employeeId}/payment-structure`, {
      grossPay: Number(form.grossPay), tax: form.tax === "" ? 0 : Number(form.tax), deductions: form.deductions === "" ? 0 : Number(form.deductions),
      ratePerHour: Number(form.ratePerHour), currency: "NGN", effectiveAt: form.effectiveAt,
    })).data,
    onSuccess: (result: { message: string }) => {
      toast.success(result.message);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payment-structure", employeeId] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (isLoading) return <Spinner label="Loading payment structure…" />;
  if (!data) return null;

  const latest = data.data[0];
  const schedule = data.workingSchedule;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5"><Landmark size={14} /> Payment structure</CardTitle>
        {data.capabilities.manage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" variant="secondary">Set new structure</Button></DialogTrigger>
            <DialogContent title="New payment structure" description="Previous records are retained for history.">
              <form className="grid grid-cols-2 gap-3.5" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Gross pay (₦/mo)</label><Input required type="number" min="0" value={form.grossPay} onChange={(e) => setForm({ ...form, grossPay: e.target.value })} /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Rate per hour (₦)</label><Input required type="number" min="0" value={form.ratePerHour} onChange={(e) => setForm({ ...form, ratePerHour: e.target.value })} /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Tax (₦)</label><Input type="number" min="0" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Deductions (₦)</label><Input type="number" min="0" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} /></div>
                <div className="col-span-2"><label className="mb-1 block text-[12px] font-medium text-ink-600">Effective date</label><Input required type="date" value={form.effectiveAt} onChange={(e) => setForm({ ...form, effectiveAt: e.target.value })} /></div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save structure"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {latest ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {latest.grossPay !== undefined && <Stat label="Gross pay" value={formatMoney(latest.grossPay, latest.currency)} />}
            {latest.netPay !== undefined && <Stat label="Net pay" value={formatMoney(latest.netPay, latest.currency)} accent />}
            {latest.ratePerHour !== undefined && <Stat label="Hourly rate" value={formatMoney(latest.ratePerHour, latest.currency)} />}
            <Stat label="Effective" value={formatDate(latest.effectiveAt)} />
          </div>
        ) : (
          <p className="rounded-xl bg-ink-50 px-3 py-2.5 text-[12.5px] text-ink-500">No payment structure recorded yet.</p>
        )}

        <div className="rounded-2xl border border-ink-100 p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-ink-500"><Clock3 size={12} /> Working schedule</p>
          <div className="grid grid-cols-3 gap-2 text-center text-[11.5px]">
            <div className="rounded-xl bg-ink-50 py-2"><p className="text-[15px] font-semibold tnum">{schedule.daysPerWeek}</p><p className="text-ink-400">days/week</p></div>
            <div className="rounded-xl bg-ink-50 py-2"><p className="text-[15px] font-semibold tnum">{schedule.startTime}–{schedule.endTime}</p><p className="text-ink-400">daily</p></div>
            <div className="rounded-xl bg-ink-50 py-2"><p className="text-[15px] font-semibold tnum">{schedule.weeklyHours}h</p><p className="text-ink-400">weekly</p></div>
          </div>
        </div>

        {data.data.length > 1 && (
          <TableWrap className="shadow-none">
            <Table>
              <THead><TR className="hover:bg-transparent"><TH>Effective</TH>{data.capabilities.viewAll && <TH>Gross</TH>}<TH>Net</TH>{data.capabilities.viewRate && <TH>Hourly</TH>}</TR></THead>
              <tbody>
                {data.data.slice(1, 5).map((record) => (
                  <TR key={record.id}>
                    <TD className="tnum">{formatDate(record.effectiveAt)}</TD>
                    {data.capabilities.viewAll && <TD className="tnum">{formatMoney(record.grossPay, record.currency)}</TD>}
                    <TD className="tnum">{formatMoney(record.netPay, record.currency)}</TD>
                    {data.capabilities.viewRate && <TD className="tnum">{formatMoney(record.ratePerHour, record.currency)}</TD>}
                  </TR>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-3.5", accent ? "border-accent-200 bg-accent-50" : "border-ink-100")}>
      <p className="text-[11px] font-medium text-ink-400">{label}</p>
      <p className={cn("mt-0.5 text-[16px] font-semibold tracking-tight tnum", accent && "text-accent-700")}>{value}</p>
    </div>
  );
}

export default function EmployeeRecordPage() {
  const { id } = useParams();
  const employeeId = Number(id);
  const queryClient = useQueryClient();
  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => (await api.get<EmployeeRecord>(`/hr/employees/${employeeId}`)).data,
    enabled: Number.isFinite(employeeId),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("image", file);
      return (await api.post(`/hr/employees/${employeeId}/avatar`, form)).data;
    },
    onSuccess: () => {
      toast.success("Employee image updated.");
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (isLoading || !employee) return <Spinner label="Loading record…" />;

  const name = `${employee.firstName} ${employee.lastName}`;
  const skipProfileKeys = new Set(["employmentHistory"]);
  const profileEntries = employee.hrProfile ? Object.entries(employee.hrProfile).filter(([key]) => !skipProfileKeys.has(key)) : [];
  const canSeePay = true; // endpoint itself enforces permission visibility per-field
  const years = Math.max(0, (Date.now() - new Date(employee.joinedAt).getTime()) / (365.25 * 86400000));

  return (
    <div className="space-y-5">
      <Link to="/people" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-ink-900"><ArrowLeft size={14} /> Back to People</Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-ink-700 p-5 text-white shadow-card">
        <div className="relative">
          <UserAvatar src={employee.avatarUrl} name={name} size="xl" className="ring-2 ring-white/30" />
          {employee.capabilities.edit && (
            <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-accent-500 p-1.5 text-white shadow-pop transition-transform hover:scale-105" title="Upload photo">
              <Camera size={12} />
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])} />
            </label>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[19px] font-semibold tracking-tight">{name}</h1>
            <StatusBadge status={employee.status} />
          </div>
          <p className="mt-0.5 text-[12.5px] text-white/60">{employee.designation} · {employee.department.name}</p>
          <div className="mt-2 flex flex-wrap gap-x-.5 gap-x-5 gap-y-1 text-[11.5px] text-white/55">
            <span className="inline-flex items-center gap-1.5"><Briefcase size={11} /> {employee.user?.role.name}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={11} /> {years.toFixed(1)} yrs at TBP</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={11} /> {employee.officeLocation}</span>
          </div>
        </div>
        <div className="w-40 text-right">
          <p className="text-[11px] text-white/50">Tenure progress</p>
          <Progress value={Math.min(years / 5 * 100, 100)} className="mt-2 bg-white/15" barClassName="bg-accent-400" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Core record */}
        <Card>
          <CardHeader>
            <CardTitle>Core record</CardTitle>
            {employee.capabilities.viewConfidential && <span className="inline-flex items-center gap-1 text-[11px] text-success-500"><ShieldCheck size={11} /> Confidential access</span>}
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12.5px]">
              <Field label="Employee number" value={employee.employeeNumber} mono />
              <Field label="Email" value={employee.user?.email} />
              <Field label="Phone" value={employee.phone} />
              <Field label="Manager" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : null} />
              <Field label="Department" value={`${employee.department.name} (${employee.department.code})`} />
              <Field label="Joined" value={formatDate(employee.joinedAt)} />
            </dl>
            {profileEntries.length > 0 && (
              <>
                <div className="my-4 h-px bg-ink-100" />
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12.5px]">
                  {profileEntries.map(([key, value]) => (
                    <Field key={key} label={labelize(key)}>
                      <MaskedValue value={value} />
                    </Field>
                  ))}
                </dl>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          {canSeePay && <PaymentStructureSection employeeId={employeeId} />}

          {/* Employment history */}
          <Card>
            <CardHeader><CardTitle>Employment history</CardTitle></CardHeader>
            <CardContent>
              {employee.employmentHistory.length === 0 ? (
                <p className="text-[12.5px] text-ink-400">No previous employment recorded.</p>
              ) : (
                <div className="space-y-3">
                  {employee.employmentHistory.map((item) => (
                    <div key={item.id} className="relative border-l-2 border-ink-100 pl-4">
                      <span className="absolute -left-[4.5px] top-1 h-2 w-2 rounded-full bg-accent-500" />
                      <p className="text-[13px] font-semibold text-ink-800">{item.positionHeld}</p>
                      <p className="text-[12px] text-ink-500">{item.companyName}</p>
                      <p className="text-[11px] text-ink-400 tnum">{formatDate(item.startedAt, { month: "short", year: "numeric" })} – {item.endedAt ? formatDate(item.endedAt, { month: "short", year: "numeric" }) : "Present"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, children, mono }: { label: string; value?: string | null; children?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-medium uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className={cn("mt-0.5 text-ink-800", mono && "tnum")}>{children ?? (value ? value : <span className="text-ink-300">—</span>)}</dd>
    </div>
  );
}
