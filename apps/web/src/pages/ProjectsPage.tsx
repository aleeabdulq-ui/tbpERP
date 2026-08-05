import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Milestone as MilestoneIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api, errorMessage } from "@/lib/api";
import { hasPermission, type Project } from "@/lib/types";
import { cn, formatDate, labelize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge, Spinner, EmptyState, PageHeader, Progress, Badge } from "@/components/ui/misc";

const blank = { code: "", name: "", description: "", status: "PLANNING", startsAt: "", dueAt: "" };

export default function ProjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const canCreate = hasPermission(user?.permissions, "projects:create") || hasPermission(user?.permissions, "projects:manage");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get<Project[]>("/projects")).data,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post("/projects", { ...form, description: form.description || null, startsAt: form.startsAt || null, dueAt: form.dueAt || null })).data,
    onSuccess: () => {
      toast.success("Project created.");
      setOpen(false);
      setForm(blank);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const addMilestone = useMutation({
    mutationFn: async ({ projectId, title, dueAt }: { projectId: number; title: string; dueAt: string }) =>
      (await api.post(`/projects/${projectId}/milestones`, { title, dueAt: dueAt || null })).data,
    onSuccess: () => { toast.success("Milestone added."); queryClient.invalidateQueries({ queryKey: ["projects"] }); },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Projects" description="Architecture and construction delivery"
        actions={canCreate ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus size={15} /> New project</Button></DialogTrigger>
            <DialogContent title="New project">
              <form onSubmit={(e: FormEvent) => { e.preventDefault(); create.mutate(); }} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Code</label><Input required minLength={3} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PRJ-2602" /></div>
                  <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Status</label>
                    <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"].map((s) => <option key={s}>{labelize(s)}</option>)}
                    </Select>
                  </div>
                </div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Name</label><Input required minLength={3} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ikoyi Office Renovation" /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Start date</label><Input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
                  <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Target date</label><Input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create project"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : undefined}
      />

      {isLoading ? <Spinner label="Loading projects…" /> : (projects?.length ?? 0) === 0 ? (
        <Card><EmptyState icon={<FolderKanban size={28} />} title="No projects yet" hint="Create your first project to track milestones, drawings and site progress." /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects?.map((project) => (
            <Card key={project.id}>
              <CardContent className="space-y-3.5 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-semibold tracking-tight text-ink-900">{project.name}</p>
                      <StatusBadge status={project.status} />
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-ink-400 tnum">{project.code} · Coordinator: {project.coordinator.firstName} {project.coordinator.lastName}</p>
                  </div>
                  <Badge tone="violet">{project.taskCount ?? 0} tasks</Badge>
                </div>

                {project.description && <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-500">{project.description}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 flex justify-between text-[11px] text-ink-500"><span>Overall progress</span><span className="tnum">{project.progress}%</span></div>
                    <Progress value={project.progress} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-[11px] text-ink-500"><span>Site progress</span><span className="tnum">{project.siteProgress}%</span></div>
                    <Progress value={project.siteProgress} barClassName="bg-violet-500" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-400 tnum">
                  <span>Start: {formatDate(project.startsAt, { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span className={cn(project.dueAt && new Date(project.dueAt) < new Date() && project.status === "ACTIVE" && "text-danger-500 font-medium")}>Due: {formatDate(project.dueAt, { day: "2-digit", month: "short", year: "numeric" })}</span>
                  {project.drawingStatus && <span className="truncate">Drawings: {project.drawingStatus}</span>}
                </div>

                <div className="border-t border-ink-50 pt-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500"><MilestoneIcon size={12} /> Milestones</p>
                  <div className="space-y-1.5">
                    {project.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center gap-2.5 text-[12px]">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", milestone.completedAt ? "bg-success-500" : "bg-ink-200")} />
                        <span className={cn("flex-1 truncate", milestone.completedAt && "text-ink-400 line-through")}>{milestone.title}</span>
                        <span className="tnum text-ink-400">{formatDate(milestone.dueAt, { day: "2-digit", month: "short" })}</span>
                      </div>
                    ))}
                    {project.milestones.length === 0 && <p className="text-[11.5px] text-ink-300">No milestones yet.</p>}
                  </div>
                  {hasPermission(user?.permissions, "milestones:create") && (
                    <form className="mt-2.5 flex gap-2" onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      addMilestone.mutate({ projectId: project.id, title: String(formData.get("title") ?? ""), dueAt: String(formData.get("dueAt") ?? "") });
                      e.currentTarget.reset();
                    }}>
                      <Input name="title" required minLength={2} placeholder="Add milestone…" className="h-8.5 text-[12.5px]" />
                      <Input name="dueAt" type="date" className="h-8.5 w-36 text-[12px]" />
                      <Button type="submit" size="sm" variant="secondary" disabled={addMilestone.isPending}>Add</Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
