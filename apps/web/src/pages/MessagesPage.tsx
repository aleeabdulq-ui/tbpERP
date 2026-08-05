import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, MessagesSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api, errorMessage } from "@/lib/api";
import { hasPermission, type Department, type Message } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge, Spinner, EmptyState, PageHeader } from "@/components/ui/misc";
import { UserAvatar } from "@/components/ui/avatar";

type Box = "inbox" | "sent" | "announcements";
type Audiences = { departments: Department[]; people: Array<{ id: number; name: string; email: string; department?: string; avatarUrl?: string | null }> };

export default function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [box, setBox] = useState<Box>("inbox");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ audienceType: "INDIVIDUAL", recipientId: "", departmentId: "", subject: "", body: "", announcement: false });
  const canBroadcast = hasPermission(user?.permissions, "messages:broadcast");

  const { data, isLoading } = useQuery({
    queryKey: ["messages", box],
    queryFn: async () => (await api.get<{ data: Message[]; unread: number }>("/messages", { params: { box } })).data,
    refetchInterval: 20_000,
  });
  const { data: audiences } = useQuery({ queryKey: ["audiences"], queryFn: async () => (await api.get<Audiences>("/messages/audiences")).data, enabled: open });

  const send = useMutation({
    mutationFn: async () => (await api.post("/messages", {
      audienceType: form.audienceType, recipientId: form.recipientId ? Number(form.recipientId) : undefined,
      departmentId: form.departmentId ? Number(form.departmentId) : undefined,
      subject: form.subject, body: form.body, announcement: form.announcement,
    })).data,
    onSuccess: (result: { delivered: number }) => {
      toast.success(`Delivered to ${result.delivered} recipient${result.delivered === 1 ? "" : "s"}.`);
      setOpen(false);
      setForm({ ...form, subject: "", body: "", announcement: false });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const markRead = async (message: Message) => {
    if (message.readAt || box === "sent") return;
    try { await api.patch(`/messages/${message.id}/read`); queryClient.invalidateQueries({ queryKey: ["messages"] }); } catch { /* non-blocking */ }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Messages" description="Direct messages, team broadcasts and announcements"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Send size={14} /> Compose</Button></DialogTrigger>
            <DialogContent title="New message">
              <form onSubmit={(e: FormEvent) => { e.preventDefault(); send.mutate(); }} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Audience</label>
                    <Select value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value })}>
                      <option value="INDIVIDUAL">One person</option>
                      {canBroadcast && <option value="DEPARTMENT">Department</option>}
                      {canBroadcast && <option value="ALL">All staff</option>}
                    </Select>
                  </div>
                  {form.audienceType === "INDIVIDUAL" && (
                    <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Recipient</label>
                      <Select required value={form.recipientId} onChange={(e) => setForm({ ...form, recipientId: e.target.value })}>
                        <option value="" disabled>Select…</option>
                        {audiences?.people.filter((p) => p.id !== user?.id).map((person) => <option key={person.id} value={person.id}>{person.name || person.email}{person.department ? ` · ${person.department}` : ""}</option>)}
                      </Select>
                    </div>
                  )}
                  {form.audienceType === "DEPARTMENT" && (
                    <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Department</label>
                      <Select required value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                        <option value="" disabled>Select…</option>
                        {audiences?.departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                      </Select>
                    </div>
                  )}
                </div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Subject</label><Input required minLength={2} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                <div><label className="mb-1 block text-[12px] font-medium text-ink-600">Message</label><Textarea required minLength={2} rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
                {canBroadcast && form.audienceType === "ALL" && (
                  <label className="flex items-center gap-2 text-[12.5px] text-ink-600">
                    <input type="checkbox" checked={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.checked })} className="h-3.5 w-3.5 accent-accent-500" />
                    Pin as a public announcement
                  </label>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={send.isPending}>{send.isPending ? "Sending…" : "Send"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex items-center gap-2">
        <div className="flex rounded-full bg-ink-100 p-0.75 text-[12.5px] font-medium">
          {(["inbox", "sent", "announcements"] as Box[]).map((value) => (
            <button key={value} onClick={() => setBox(value)}
              className={cn("rounded-full px-4 py-1.5 capitalize transition-all cursor-pointer", box === value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800")}>
              {value}{value === "inbox" && (data?.unread ?? 0) > 0 ? ` (${data!.unread})` : ""}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Spinner label="Loading messages…" /> : (data?.data.length ?? 0) === 0 ? (
        <Card><EmptyState icon={<MessagesSquare size={28} />} title="Nothing here" hint="Messages sent to you will land in your inbox." /></Card>
      ) : (
        <div className="space-y-2">
          {data?.data.map((message) => {
            const other = box === "sent" ? message.recipient : message.sender;
            const isOpen = expanded === message.id;
            return (
              <Card key={message.id} className={cn("cursor-pointer transition-shadow hover:shadow-pop", !message.readAt && box === "inbox" && "border-accent-200")}
                onClick={() => { setExpanded(isOpen ? null : message.id); markRead(message); }}>
                <div className="flex items-start gap-3 px-4.5 py-3.5">
                  <UserAvatar name={other.name} src={other.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("truncate text-[13.5px]", !message.readAt && box === "inbox" ? "font-semibold text-ink-900" : "font-medium text-ink-700")}>{message.subject}</p>
                      {message.announcement && <Badge tone="warning"><Megaphone size={10} /> Announcement</Badge>}
                      {message.audienceType === "DEPARTMENT" && message.department && <Badge tone="violet">{message.department.name}</Badge>}
                    </div>
                    <p className="text-[11.5px] text-ink-400">{box === "sent" ? "To" : "From"} {other.name} · {relativeTime(message.createdAt)}</p>
                    {isOpen ? <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-700">{message.body}</p>
                      : <p className="mt-0.5 line-clamp-1 text-[12.5px] text-ink-500">{message.body}</p>}
                  </div>
                  {!message.readAt && box === "inbox" && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
