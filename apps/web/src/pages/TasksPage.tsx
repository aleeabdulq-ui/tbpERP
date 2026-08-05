import { useState, type FormEvent } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, CornerUpLeft, MessageSquare, Paperclip, Plus, RotateCcw, Search, Send, Target } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { Paged, Person, TaskDetail, TaskSummary } from "@/lib/types";
import { cn, formatDate, relativeTime, labelize, toneBadge } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TableWrap, Table, THead, TH, TR, TD } from "@/components/ui/table";
import { StatusBadge, Spinner, EmptyState, PageHeader, Badge } from "@/components/ui/misc";
import { UserAvatar } from "@/components/ui/avatar";

type TasksResponse = Paged<TaskSummary> & {
  summary: { active: number; dueThisWeek: number; overdue: number; completionRate: number };
  assignees: Person[];
  capabilities: { assign: boolean; manage: boolean; archive: boolean; categories: string[] };
};

const fmtCountdown = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${Math.floor((seconds % 3600) / 60)}m`;
};

function TaskDetailDialog({ id, onClose }: { id: number | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: async () => (await api.get<TaskDetail>(`/tasks/${id}`)).data,
    enabled: id !== null,
  });
  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["task", id] }); queryClient.invalidateQueries({ queryKey: ["tasks"] }); };
  const act = (action: string, body?: object) => async () => {
    try { await api.post(`/tasks/${id}/${action}`, body ?? {}); toast.success("Task updated."); invalidate(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const postComment = useMutation({
    mutationFn: async () => (await api.post(`/tasks/${id}/comments`, { body: comment })).data,
    onSuccess: () => { setComment(""); invalidate(); },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const task = data?.task;
  return (
    <Dialog open={id !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent title={task?.title ?? "Task"} className="max-w-2xl" description={task ? `${labelize(task.category)} · assigned to ${task.assignee.name}` : undefined}>
        {isLoading || !data || !task ? <Spinner /> : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <Badge tone={task.priority === "CRITICAL" ? "danger" : task.priority === "HIGH" ? "warning" : "primary"}>{labelize(task.priority)}</Badge>
              {task.dueAt && <span className="text-[12px] text-ink-400 tnum">Due {formatDate(task.dueAt)}</span>}
              {task.countdown && (
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-medium tnum", task.countdown.overdue ? "bg-danger-50 text-danger-500" : "bg-violet-50 text-violet-500")}>
                  {task.countdown.overdue ? "Overdue" : `${fmtCountdown(task.countdown.remainingSeconds)} left`}
                </span>
              )}
            </div>
            {task.description && <p className="rounded-xl bg-ink-50 p-3.5 text-[13px] leading-relaxed text-ink-700">{task.description}</p>}
            <div className="flex flex-wrap gap-2">
              {data.workflow.accept && <Button size="sm" variant="secondary" onClick={act("accept")}><CheckCheck size={14} /> Accept task</Button>}
              {data.workflow.submit && <Button size="sm" onClick={act("submit")}><Send size={14} /> Submit for review</Button>}
              {data.workflow.review && (
                <>
                  <Button size="sm" onClick={async () => { try { await api.post(`/tasks/${id}/review`, { decision: "APPROVE" }); toast.success("Task approved."); invalidate(); } catch (e) { toast.error(errorMessage(e)); } }}>
                    <CheckCheck size={14} /> Approve & close
                  </Button>
                  <Button size="sm" variant="outline" onClick={async () => {
                    const reason = window.prompt("Reason for returning this task:");
                    if (!reason) return;
                    try { await api.post(`/tasks/${id}/review`, { decision: "RETURN", reason }); toast.success("Task returned."); invalidate(); } catch (e) { toast.error(errorMessage(e)); }
                  }}><RotateCcw size={14} /> Return for revision</Button>
                </>
              )}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-600"><MessageSquare size={13} /> Comments ({data.comments.length})</p>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {data.comments.map((item) => (
                  <div key={item.id} className="flex gap-2.5">
                    <UserAvatar name={item.author.name} size="sm" />
                    <div className="flex-1 rounded-xl bg-ink-50 px-3 py-2">
                      <p className="text-[11.5px] font-semibold text-ink-700">{item.author.name} <span className="font-normal text-ink-300">· {relativeTime(item.createdAt)}</span></p>
                      <p className="text-[12.5px] text-ink-700">{item.body}</p>
                    </div>
                  </div>
                ))}
                {data.comments.length === 0 && <p className="text-[12px] text-ink-400">No comments yet.</p>}
              </div>
              <form className="mt-2.5 flex gap-2" onSubmit={(e) => { e.preventDefault(); comment.trim() && postComment.mutate(); }}>
                <Input placeholder="Write a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
                <Button type="submit" size="sm" disabled={postComment.isPending || !comment.trim()}>Post</Button>
              </form>
            </div>

            {data.activities.length > 0 && (
              <div>
                <p className="mb-1.5 text-[12.5px] font-semibold text-ink-600">Activity</p>
                <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                  {data.activities.map((activity) => (
                    <p key={activity.id} className="flex items-center justify-between text-[11.5px] text-ink-500">
                      <span className="truncate">{activity.message}</span>
                      <span className="ml-2 shrink-0 text-ink-300">{relativeTime(activity.createdAt)}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assigneeId: "", priority: "MEDIUM", category: "GENERAL", dueAt: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", { search, statusFilter }],
    queryFn: async () => (await api.get<TasksResponse>("/tasks", { params: { search: search || undefined, status: statusFilter || undefined, pageSize: 30 } })).data,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post("/tasks", { ...form, assigneeId: Number(form.assigneeId), dueAt: form.dueAt || null, description: form.description || null })).data,
    onSuccess: () => {
      toast.success("Task assigned.");
      setCreateOpen(false);
      setForm({ title: "", description: "", assigneeId: "", priority: "MEDIUM", category: "GENERAL", dueAt: "" });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate(); };

  return (
    <div className="space-y-5">
      <PageHeader title="Tasks" description="Assignments, deadlines and reviews"
        actions={data?.capabilities.assign ? <Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={15} /> Assign task</Button> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active", value: data?.summary.active },
          { label: "Due this week", value: data?.summary.dueThisWeek },
          { label: "Overdue", value: data?.summary.overdue, danger: true },
          { label: "Completion", value: data ? `${data.summary.completionRate}%` : "—" },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-[11.5px] font-medium text-ink-400">{item.label}</p>
            <p className={cn("mt-1 text-[20px] font-semibold tracking-tight tnum", item.danger && Number(item.value) > 0 && "text-danger-500")}>{item.value ?? "—"}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <Input className="pl-8.5" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {["TODO", "ASSIGNED", "IN_PROGRESS", "REVIEW", "RETURNED", "COMPLETED", "OVERDUE"].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
        </Select>
      </div>

      <TableWrap>
        <Table>
          <THead><TR className="hover:bg-transparent"><TH>Task</TH><TH>Assignee</TH><TH>Priority</TH><TH>Status</TH><TH>Due</TH><TH className="text-center">Activity</TH></TR></THead>
          <tbody>
            {isLoading ? (
              <TR><TD colSpan={6}><Spinner label="Loading tasks…" /></TD></TR>
            ) : (data?.data.length ?? 0) === 0 ? (
              <TR><TD colSpan={6}><EmptyState icon={<Target size={26} />} title="No tasks found" hint="Assigned tasks and their workflow will appear here." /></TD></TR>
            ) : (
              data?.data.map((task) => (
                <TR key={task.id} className="cursor-pointer" onClick={() => setSelected(task.id)}>
                  <TD><p className="max-w-72 truncate font-medium text-ink-900">{task.title}</p><p className="text-[11px] text-ink-400">{labelize(task.category)}</p></TD>
                  <TD><div className="flex items-center gap-2"><UserAvatar name={task.assignee.name} size="sm" /><span className="text-[12.5px]">{task.assignee.name}</span></div></TD>
                  <TD><Badge tone={task.priority === "CRITICAL" ? "danger" : task.priority === "HIGH" ? "warning" : "primary"}>{labelize(task.priority)}</Badge></TD>
                  <TD><StatusBadge status={task.status} /></TD>
                  <TD className="tnum text-[12.5px]">{formatDate(task.dueAt, { day: "2-digit", month: "short" })}</TD>
                  <TD className="text-center"><span className="inline-flex items-center gap-2 text-[11.5px] text-ink-400"><span className="inline-flex items-center gap-0.5"><MessageSquare size={11} />{task.commentCount}</span><span className="inline-flex items-center gap-0.5"><Paperclip size={11} />{task.attachmentCount}</span></span></TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </TableWrap>

      <TaskDetailDialog id={selected} onClose={() => setSelected(null)} />

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent title="Assign a task" description="The assignee gets a notification and a countdown once they accept.">
          <form onSubmit={submit} className="space-y-3.5">
            <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Title</label><Input required minLength={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Review tender documents" /></div>
            <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Context, deliverables, links…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="mb-1 block text-[12px] font-medium text-ink-600">Assignee</label>
                <Select required value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                  <option value="" disabled>Select employee…</option>
                  {data?.assignees.map((person) => <option key={person.id} value={person.id}>{person.name}{person.designation ? ` — ${person.designation}` : ""}</option>)}
                </Select>
              </div>
              <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Category</label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {(data?.capabilities.categories.length ? data.capabilities.categories : ["GENERAL"]).map((category) => <option key={category} value={category}>{labelize(category)}</option>)}
                </Select>
              </div>
              <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Priority</label>
                <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p}>{labelize(p)}</option>)}
                </Select>
              </div>
              <div className="col-span-2"><label className="mb-1 block text-[12px] font-medium text-ink-600">Due date</label><Input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={create.isPending}>{create.isPending ? "Assigning…" : "Assign task"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {data?.capabilities.archive && (
        <p className="flex items-center gap-1.5 text-[11.5px] text-ink-400"><CornerUpLeft size={11} /> Managers can archive completed tasks from the task detail view.</p>
      )}
    </div>
  );
}
