import { useQuery } from "@tanstack/react-query";
import { HeartPulse, Landmark, PiggyBank, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import type { BenefitRow, PayrollRow } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableWrap, Table, THead, TH, TR, TD } from "@/components/ui/table";
import { StatusBadge, Spinner, EmptyState, PageHeader } from "@/components/ui/misc";

export default function PayrollPage() {
  const payroll = useQuery({ queryKey: ["payroll"], queryFn: async () => (await api.get<PayrollRow[]>("/hr/payroll")).data, retry: false });
  const benefits = useQuery({ queryKey: ["benefits"], queryFn: async () => (await api.get<BenefitRow[]>("/hr/benefits")).data, retry: false });

  const rows = payroll.data ?? [];
  const latest = rows[0];
  const yearToDate = rows.reduce((sum, row) => sum + Number(row.net ?? 0), 0);
  const currency = latest?.currency ?? "NGN";

  return (
    <div className="space-y-5">
      <PageHeader title="Payroll & Benefits" description="Your payslips and enrolled benefits" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3.5 p-4">
          <span className="rounded-2xl bg-accent-50 p-2.5 text-accent-600"><Wallet size={18} /></span>
          <div><p className="text-[11.5px] font-medium text-ink-400">Latest net pay</p><p className="text-[19px] font-semibold tracking-tight tnum">{latest ? formatMoney(latest.net, latest.currency) : "—"}</p></div>
        </Card>
        <Card className="flex items-center gap-3.5 p-4">
          <span className="rounded-2xl bg-success-50 p-2.5 text-success-500"><Landmark size={18} /></span>
          <div><p className="text-[11.5px] font-medium text-ink-400">Net year-to-date</p><p className="text-[19px] font-semibold tracking-tight tnum">{rows.length ? formatMoney(yearToDate, currency) : "—"}</p></div>
        </Card>
        <Card className="flex items-center gap-3.5 p-4">
          <span className="rounded-2xl bg-violet-50 p-2.5 text-violet-500"><HeartPulse size={18} /></span>
          <div><p className="text-[11.5px] font-medium text-ink-400">Active benefits</p><p className="text-[19px] font-semibold tracking-tight tnum">{benefits.data?.length ?? "—"}</p></div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TableWrap>
            <Table>
              <THead><TR className="hover:bg-transparent"><TH>Period</TH><TH>Gross</TH><TH>Deductions</TH><TH>Net</TH><TH>Status</TH></TR></THead>
              <tbody>
                {payroll.isLoading ? (
                  <TR><TD colSpan={5}><Spinner label="Loading payslips…" /></TD></TR>
                ) : rows.length === 0 ? (
                  <TR><TD colSpan={5}><EmptyState icon={<Landmark size={26} />} title="No payslips yet" hint="Payslips appear here after each payroll run." /></TD></TR>
                ) : (
                  rows.map((row) => (
                    <TR key={row.id}>
                      <TD className="font-medium text-ink-900">{formatDate(row.period, { month: "long", year: "numeric" })}</TD>
                      <TD className="tnum">{formatMoney(row.gross, row.currency)}</TD>
                      <TD className="tnum text-danger-500">-{formatMoney(row.deductions, row.currency)}</TD>
                      <TD className="tnum font-semibold text-ink-900">{formatMoney(row.net, row.currency)}</TD>
                      <TD><StatusBadge status={row.status ?? "PAID"} /></TD>
                    </TR>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrap>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-1.5"><PiggyBank size={14} /> Benefits</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {benefits.isLoading ? <Spinner /> : (benefits.data ?? []).length === 0 ? (
              <p className="text-[12.5px] text-ink-400">No benefits enrolled yet.</p>
            ) : (
              (benefits.data ?? []).map((row) => (
                <div key={row.id} className="flex items-start gap-2.5 rounded-xl border border-ink-100 px-3.5 py-3">
                  <span className="mt-0.5 rounded-lg bg-success-50 p-1.5 text-success-500"><HeartPulse size={13} /></span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink-900">{row.benefit.name}</p>
                    {row.benefit.description ? <p className="text-[11.5px] text-ink-400">{row.benefit.description}</p> : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
