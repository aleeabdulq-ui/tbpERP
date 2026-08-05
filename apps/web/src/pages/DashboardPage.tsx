import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bell, CalendarDays, MapPin, UserRound } from "lucide-react";
import { useEmployee } from "@/components/AppShell";
import { Badge } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, Skeleton } from "@/components/ui/misc";
import { UserAvatar } from "@/components/ui/avatar";
import { cn, formatDate, relativeTime, toneBadge, type Tone } from "@/lib/utils";

const toneDot: Record<Tone, string> = {
  primary: "bg-accent-500", success: "bg-success-500", warning: "bg-warning-500", violet: "bg-violet-500", danger: "bg-danger-500",
};

export default function DashboardPage() {
  const data = useEmployee();

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }
  const { profile } = data;

  return (
    <div className="space-y-5">
      {/* Hero strip */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-4 rounded-2xl bg-ink-700 p-5 text-white shadow-card">
        <UserAvatar src={profile.avatarUrl} name={profile.name} size="lg" className="ring-2 ring-white/30" />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold tracking-tight">{profile.name}</p>
          <p className="text-[12px] text-white/60">{profile.designation} · {profile.department}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/55">
            <span className="inline-flex items-center gap-1"><UserRound size={11} /> {profile.employeeNumber}</span>
            <span className="inline-flex items-center gap-1"><MapPin size={11} /> {profile.location}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> Joined {formatDate(profile.dateJoined)}</span>
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <Badge tone="success" className="bg-white/10 text-white">{profile.status}</Badge>
          <p className="mt-1 text-[10.5px] text-white/50">{data.dashboardTitle}</p>
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {data.metrics.map((metric, index) => (
          <motion.div key={metric.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
            <Card className="h-full p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] font-medium text-ink-400">{metric.label}</p>
                <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[metric.tone ?? "primary"])} />
              </div>
              <p className="mt-1.5 truncate text-[22px] font-semibold tracking-tight text-ink-900 tnum">{metric.value}</p>
              {metric.detail ? <p className="mt-0.5 truncate text-[11px] text-ink-400">{metric.detail}</p> : <p className="mt-0.5 text-[11px] text-transparent">·</p>}
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Trend chart */}
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>{data.trend.title}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend.points} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f26a1b" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#f26a1b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ededf1" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8b8da1" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#8b8da1" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ border: "1px solid #ededf1", fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#f26a1b" strokeWidth={2} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.trend.summary.map((item) => (
                <span key={item.label} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium", toneBadge[item.tone ?? "primary"])}>
                  {item.label}: <span className="tnum">{item.value}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Panels */}
        <div className="space-y-4">
          {data.panels.map((panel) => (
            <Card key={panel.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px]">{panel.title}</CardTitle>
                {panel.actionLabel ? <span className="text-[11px] font-medium text-accent-600">{panel.actionLabel}</span> : null}
              </CardHeader>
              <CardContent className="space-y-1">
                {panel.items.length === 0 && <p className="py-2 text-[12px] text-ink-400">Nothing here yet.</p>}
                {panel.items.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-ink-50">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[item.tone ?? "primary"])} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-ink-800">{item.label}</p>
                      {item.meta ? <p className="truncate text-[11px] text-ink-400">{item.meta}</p> : null}
                    </div>
                    {item.progress !== undefined ? (
                      <div className="w-16"><Progress value={item.progress} /></div>
                    ) : item.value !== undefined ? (
                      <span className="text-[12px] font-semibold text-ink-600 tnum">{item.value}</span>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-[13px]"><Bell size={13} /> Latest notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.notifications.length === 0 && <p className="py-2 text-[12px] text-ink-400">All caught up.</p>}
              {data.notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-xl bg-ink-50/70 px-3 py-2">
                  <p className="text-[12.5px] font-medium text-ink-800">{notification.title}</p>
                  <p className="line-clamp-2 text-[11.5px] text-ink-500">{notification.message}</p>
                  <p className="mt-0.5 text-[10.5px] text-ink-300">{relativeTime(notification.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
