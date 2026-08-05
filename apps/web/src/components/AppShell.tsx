import { useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell, BriefcaseBusiness, CalendarCheck2, FolderKanban, Landmark,
  LayoutDashboard, LogOut, MessagesSquare, Settings, Target, UsersRound,
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { hasPermission, type DashboardResponse, type Notification } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui/misc";
import { UserAvatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type NavItem = { to: string; label: string; icon: React.ReactNode };

function useDashboardMe() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardResponse>("/dashboard")).data,
    staleTime: 60_000,
  });
}

export function useEmployee() {
  const { data } = useDashboardMe();
  return data;
}

const navItems: (NavItem & { permission?: string })[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { to: "/tasks", label: "Tasks", icon: <Target size={17} /> },
  { to: "/people", label: "People", icon: <UsersRound size={17} />, permission: "employees:read" },
  { to: "/leave", label: "Leave", icon: <CalendarCheck2 size={17} /> },
  { to: "/payroll", label: "Payroll & Benefits", icon: <Landmark size={17} />, permission: "payroll:read" },
  { to: "/projects", label: "Projects", icon: <FolderKanban size={17} />, permission: "projects:read" },
  { to: "/training", label: "Training", icon: <BriefcaseBusiness size={17} />, permission: "training:read" },
  { to: "/messages", label: "Messages", icon: <MessagesSquare size={17} /> },
  { to: "/reports", label: "Reports", icon: <LayoutDashboard size={17} />, permission: "hr_reports:read" },
  { to: "/settings", label: "Settings", icon: <Settings size={17} /> },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: dash } = useDashboardMe();
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<Notification[]>("/notifications")).data,
    refetchInterval: 30_000,
  });

  const visibleNav = useMemo(
    () => navItems.filter((item) => !item.permission || hasPermission(user?.permissions, item.permission) || (item.permission === "hr_reports:read" && user?.permissions.some((p) => p.endsWith("reports:read")))),
    [user],
  );

  const unread = (notifications ?? []).filter((n) => !n.readAt);
  const markAll = useMutation({
    mutationFn: async () => (await api.post("/notifications/read-all")).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-ink-700 px-3.5 py-5 text-white lg:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <img src="/tbp-logo.png" alt="TBP logo" className="h-9 w-9 rounded-xl object-contain bg-white/95 p-0.5" />
          <div>
            <p className="text-[13.5px] font-semibold leading-tight">TBP ERP</p>
            <p className="text-[10.5px] text-white/55">The Building Practice</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.25 text-[13px] font-medium transition-all",
                  isActive ? "bg-white text-ink-900 shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white",
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => logout().then(() => navigate("/login"))}
          className="mt-3 flex items-center gap-2.5 rounded-xl px-3 py-2.25 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-ink-100 bg-white/80 px-4 backdrop-blur-md lg:px-7">
          <div className="flex items-center gap-3 lg:hidden">
            <img src="/tbp-logo.png" alt="TBP logo" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-[14px] font-semibold">TBP ERP</span>
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-[14px] font-semibold text-ink-900">
              {dash?.profile?.name ? `Welcome back, ${dash.profile.name.split(" ")[0]}` : "Welcome back"}
            </p>
            <p className="truncate text-[11.5px] text-ink-400">{dash?.dashboardTitle ?? user?.role}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative rounded-full p-2 text-ink-500 transition-colors hover:bg-ink-100 cursor-pointer" aria-label="Notifications">
                <Bell size={18} />
                {unread.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9.5px] font-bold text-white tnum">
                    {unread.length > 9 ? "9+" : unread.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-86 p-0">
                <DropdownMenuLabel className="flex items-center justify-between px-4 pt-3 normal-case">
                  <span className="text-[13px] font-semibold text-ink-900">Notifications</span>
                  {unread.length > 0 && <button className="text-[11.5px] text-accent-600 cursor-pointer" onClick={() => markAll.mutate()}>Mark all read</button>}
                </DropdownMenuLabel>
                <div className="max-h-96 overflow-y-auto pb-2">
                  {(notifications ?? []).slice(0, 12).map((notification) => (
                    <DropdownMenuItem key={notification.id} className="mx-2 items-start gap-2.5 rounded-xl px-2.5 py-2.5">
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", notification.readAt ? "bg-ink-100" : "bg-accent-500")} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className={cn("truncate text-[12.5px]", notification.readAt ? "text-ink-500" : "font-semibold text-ink-900")}>{notification.title}</span>
                        </span>
                        <span className="line-clamp-2 text-[12px] text-ink-500">{notification.message}</span>
                        <span className="text-[10.5px] text-ink-300">{relativeTime(notification.createdAt)}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                  {(notifications ?? []).length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-ink-400">You're all caught up.</p>}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-ink-100 cursor-pointer">
                <UserAvatar src={dash?.profile?.avatarUrl ?? null} name={user?.name} size="sm" />
                <span className="hidden text-left md:block">
                  <span className="block max-w-36 truncate text-[12.5px] font-semibold leading-tight text-ink-900">{user?.name || user?.email}</span>
                  <span className="block max-w-36 truncate text-[10.5px] text-ink-400">{user?.role}</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  <span className="block text-[13px] font-semibold normal-case text-ink-900">{user?.email}</span>
                  <Badge className="mt-1.5" tone="violet"><StatusBadge status={user?.role} /></Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/settings")}><Settings size={14} /> Profile & settings</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => logout().then(() => navigate("/login"))}><LogOut size={14} /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-10 pt-6 lg:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
