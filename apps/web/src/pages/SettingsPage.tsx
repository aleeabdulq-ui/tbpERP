import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api, errorMessage } from "@/lib/api";
import { hasPermission, type PermissionGroup, type RoleInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, PageHeader, Spinner } from "@/components/ui/misc";

type Profile = {
  id: number; email: string; role: { name: string };
  employee?: { id: number; firstName: string; lastName: string; phone?: string | null; officeLocation?: string | null; employeeNumber: string; designation: string; department?: { name: string } } | null;
};

function ProfileSection() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: async () => (await api.get<Profile>("/profile")).data });
  const [form, setForm] = useState<{ firstName: string; lastName: string; phone: string; officeLocation: string } | null>(null);

  const save = useMutation({
    mutationFn: async () => (await api.patch("/profile", form)).data,
    onSuccess: () => { toast.success("Profile updated."); setForm(null); queryClient.invalidateQueries({ queryKey: ["profile"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const employee = profile?.employee;
  const current = form ?? {
    firstName: employee?.firstName ?? "", lastName: employee?.lastName ?? "",
    phone: employee?.phone ?? "", officeLocation: employee?.officeLocation ?? "",
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-1.5"><UserRoundCog size={14} /> My profile</CardTitle></CardHeader>
      <CardContent>
        {!profile ? <Spinner /> : !employee ? <p className="text-[12.5px] text-ink-400">No employee profile attached to this account.</p> : (
          <form className="grid grid-cols-2 gap-3.5" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}>
            <div><label className="mb-1 block text-[12px] font-medium text-ink-600">First name</label><Input required minLength={2} value={current.firstName} onChange={(e) => setForm({ ...current, firstName: e.target.value })} /></div>
            <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Last name</label><Input required minLength={2} value={current.lastName} onChange={(e) => setForm({ ...current, lastName: e.target.value })} /></div>
            <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Phone</label><Input value={current.phone} onChange={(e) => setForm({ ...current, phone: e.target.value })} /></div>
            <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Office</label><Input value={current.officeLocation} onChange={(e) => setForm({ ...current, officeLocation: e.target.value })} /></div>
            <div className="col-span-2 flex items-center justify-between">
              <p className="text-[11.5px] text-ink-400">{profile.email} · {employee.employeeNumber} · {employee.department?.name}</p>
              <Button type="submit" size="sm" disabled={!form || save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function RolesSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["roles"], queryFn: async () => (await api.get<{ groups: PermissionGroup[]; roles: RoleInfo[] }>("/admin/roles")).data });
  const toggle = useMutation({
    mutationFn: async ({ id, permissions }: { id: number; permissions: string[] }) => (await api.patch(`/admin/roles/${id}`, { permissions })).data,
    onSuccess: (result: { message: string }) => { toast.success(result.message); queryClient.invalidateQueries({ queryKey: ["roles"] }); },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (isLoading || !data) return <Spinner label="Loading roles…" />;

  return (
    <div className="space-y-4">
      {data.roles.map((role) => (
        <Card key={role.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[14px]">
              {role.name}
              {role.permissions.includes("*") && <Badge tone="danger">Full access</Badge>}
            </CardTitle>
            <span className="text-[11.5px] text-ink-400">{role.users} user{role.users === 1 ? "" : "s"}</span>
          </CardHeader>
          <CardContent>
            {role.permissions.includes("*") ? (
              <p className="text-[12.5px] text-ink-400">Platform Administrator holds every permission and cannot be edited here.</p>
            ) : (
              <div className="space-y-3">
                {data.groups.map((group) => {
                  const enabled = group.permissions.filter((p) => role.permissions.includes(p));
                  return (
                    <div key={group.key}>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{group.label} <span className="tnum">({enabled.length}/{group.permissions.length})</span></p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.permissions.map((permission) => {
                          const active = role.permissions.includes(permission);
                          return (
                            <button key={permission} type="button"
                              className={`rounded-full border px-2.5 py-1 text-[11px] transition-all cursor-pointer ${active ? "border-accent-500 bg-accent-50 text-accent-700 font-medium" : "border-ink-200 text-ink-500 hover:border-ink-300"}`}
                              onClick={() => toggle.mutate({ id: role.id, permissions: active ? role.permissions.filter((p) => p !== permission) : [...role.permissions, permission] })}>
                              {permission}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const canManageRoles = hasPermission(user?.permissions, "roles:manage");
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Your account and workspace administration" />
      <ProfileSection />
      {canManageRoles && (
        <div>
          <h2 className="mb-3 mt-2 flex items-center gap-1.5 text-[15px] font-semibold tracking-tight"><ShieldCheck size={15} /> Roles & permissions</h2>
          <RolesSection />
        </div>
      )}
    </div>
  );
}
