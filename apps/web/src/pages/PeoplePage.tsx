import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { Department, EmployeeRow, Paged } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TableWrap, Table, THead, TH, TR, TD } from "@/components/ui/table";
import { StatusBadge, EmptyState, Spinner, PageHeader } from "@/components/ui/misc";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

type EmployeesResponse = Paged<EmployeeRow> & {
  summary: { total: number; active: number; onLeave: number; departments: number };
  departments: Department[];
  capabilities: { manage: boolean; editRecords: boolean; viewPayment: boolean; managePayment: boolean };
};

const blank = { email: "", employeeNumber: "", firstName: "", lastName: "", phone: "", designation: "", departmentId: "", joinedAt: "", officeLocation: "Lagos HQ" };

export default function PeoplePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);

  const { data, isLoading } = useQuery({
    queryKey: ["employees", { page, search, status }],
    queryFn: async () => (await api.get<EmployeesResponse>("/hr/employees", { params: { page, pageSize: 9, search: search || undefined, status: status || undefined } })).data,
    placeholderData: keepPreviousData,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post("/hr/employees", { ...form, departmentId: Number(form.departmentId), joinedAt: form.joinedAt, phone: form.phone || undefined })).data,
    onSuccess: (data: { message: string }) => {
      toast.success(data.message);
      setOpen(false);
      setForm(blank);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="People"
        description="Directory, staff records and onboarding"
        actions={data?.capabilities.manage ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus size={15} /> Add employee</Button></DialogTrigger>
            <DialogContent title="New employee" description="They'll activate their account via Forgot Password.">
              <form onSubmit={submit} className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2"><label className="mb-1 block text-[12px] font-medium text-ink-600">Work email</label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@tbp.ng" /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">First name</label><Input required minLength={2} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Last name</label><Input required minLength={2} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Employee no.</label><Input required minLength={3} value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} placeholder="TBP-0010" /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Designation</label><Input required minLength={2} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Architect" /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Department</label>
                  <Select required value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="" disabled>Select…</option>
                    {data?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Start date</label><Input required type="date" value={form.joinedAt} onChange={(e) => setForm({ ...form, joinedAt: e.target.value })} /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Office</label><Input required minLength={2} value={form.officeLocation} onChange={(e) => setForm({ ...form, officeLocation: e.target.value })} /></div>
                <div className="col-span-2 mt-1 flex justify-end gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create employee"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : undefined}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total staff", value: data?.summary.total },
          { label: "Active", value: data?.summary.active },
          { label: "On leave", value: data?.summary.onLeave },
          { label: "Departments", value: data?.summary.departments },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-[11.5px] font-medium text-ink-400">{item.label}</p>
            <p className="mt-1 text-[22px] font-semibold tracking-tight tnum">{item.value ?? "—"}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <Input className="pl-8.5" placeholder="Search name, number, designation or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select className="w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On leave</option>
          <option value="INACTIVE">Inactive</option>
          <option value="TERMINATED">Terminated</option>
        </Select>
      </div>

      <TableWrap>
        <Table>
          <THead>
            <TR className="hover:bg-transparent"><TH>Employee</TH><TH>Role & designation</TH><TH>Department</TH><TH>Status</TH><TH>Joined</TH><TH>Office</TH></TR>
          </THead>
          <tbody>
            {isLoading ? (
              <TR><TD colSpan={6}><Spinner label="Loading people…" /></TD></TR>
            ) : (data?.data.length ?? 0) === 0 ? (
              <TR><TD colSpan={6}><EmptyState icon={<UsersRound size={26} />} title="No employees found" hint="Try a different search or add a new employee." /></TD></TR>
            ) : (
              data?.data.map((employee) => (
                <TR key={employee.id}>
                  <TD>
                    <Link to={`/people/${employee.id}`} className="flex items-center gap-3 group">
                      <UserAvatar src={employee.avatarUrl} name={employee.name} size="sm" />
                      <span>
                        <span className="block text-[13px] font-semibold text-ink-900 group-hover:text-accent-600">{employee.name}</span>
                        <span className="block text-[11px] text-ink-400">{employee.employeeNumber} · {employee.email}</span>
                      </span>
                    </Link>
                  </TD>
                  <TD><span className="block text-[13px]">{employee.designation}</span><span className="block text-[11px] text-ink-400">{employee.role}</span></TD>
                  <TD>{employee.department.name}</TD>
                  <TD><StatusBadge status={employee.status} /></TD>
                  <TD className="tnum text-[12.5px]">{formatDate(employee.joinedAt, { day: "2-digit", month: "short", year: "numeric" })}</TD>
                  <TD className="text-[12.5px]">{employee.officeLocation}</TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-2.5 text-[12px] text-ink-500">
            <span className="tnum">Page {data.pagination.page} of {data.pagination.pages} · {data.pagination.total} staff</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={15} /></Button>
              <Button variant="outline" size="icon" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={15} /></Button>
            </div>
          </div>
        )}
      </TableWrap>
    </div>
  );
}
