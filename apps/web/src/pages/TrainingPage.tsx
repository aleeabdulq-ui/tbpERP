import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { api } from "@/lib/api";
import type { TrainingProgram } from "@/lib/types";
import { formatDate, labelize } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge, Spinner, EmptyState, PageHeader, Progress, Badge } from "@/components/ui/misc";
import { UserAvatar } from "@/components/ui/avatar";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api";

type TrainingResponse = { data: TrainingProgram[]; capabilities: { manage: boolean } };

export default function TrainingPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["training"], queryFn: async () => (await api.get<TrainingResponse>("/hr/training")).data });
  const updateProgress = useMutation({
    mutationFn: async ({ trainingId, employeeId, progress, status }: { trainingId: number; employeeId: number; progress: number; status: string }) =>
      (await api.patch(`/hr/training/${trainingId}/employees/${employeeId}`, { progress, status })).data,
    onSuccess: () => { toast.success("Progress updated."); queryClient.invalidateQueries({ queryKey: ["training"] }); },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Training" description="Programs, enrolments and certifications" />
      {isLoading ? <Spinner label="Loading programs…" /> : (data?.data.length ?? 0) === 0 ? (
        <Card><EmptyState icon={<GraduationCap size={28} />} title="No programs yet" hint="HR can create training programs and enrol staff." /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data!.data.map((program) => (
            <Card key={program.id}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight text-ink-900">{program.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-400">{program.category} · {labelize(program.deliveryMode)} · {formatDate(program.startsAt, { day: "2-digit", month: "short" })}{program.endsAt ? ` – ${formatDate(program.endsAt, { day: "2-digit", month: "short" })}` : ""}</p>
                  </div>
                  <StatusBadge status={program.status} />
                </div>
                {program.description && <p className="text-[12.5px] text-ink-500">{program.description}</p>}
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-ink-500"><span>Average progress</span><span className="tnum">{program.averageProgress}%</span></div>
                  <Progress value={program.averageProgress} />
                </div>
                {program.certificationName && <Badge tone="success">Certificate: {program.certificationName}</Badge>}
                <div className="space-y-2 border-t border-ink-50 pt-3">
                  {program.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center gap-2.5">
                      <UserAvatar name={enrollment.employee.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-ink-800">{enrollment.employee.name}</p>
                        <p className="text-[10.5px] text-ink-400">{enrollment.employee.department.name}</p>
                      </div>
                      {data?.capabilities.manage ? (
                        <div className="flex items-center gap-1.5">
                          <Select className="h-8 w-32 text-[11.5px]" value={enrollment.status}
                            onChange={(e) => updateProgress.mutate({ trainingId: program.id, employeeId: enrollment.employee.id, status: e.target.value, progress: e.target.value === "COMPLETED" ? 100 : enrollment.progress })}>
                            {["ASSIGNED", "IN_PROGRESS", "COMPLETED"].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
                          </Select>
                        </div>
                      ) : (
                        <span className="flex items-center gap-2"><Progress value={enrollment.progress} className="w-20" /><span className="text-[11px] text-ink-500 tnum">{enrollment.progress}%</span></span>
                      )}
                    </div>
                  ))}
                  {program.enrollments.length === 0 && <p className="text-[11.5px] text-ink-300">No enrolments yet.</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {data?.capabilities.manage && <p className="text-[11.5px] text-ink-400">Program creation and enrolment are available to HR via the API; progress can be updated inline above.</p>}
    </div>
  );
}
