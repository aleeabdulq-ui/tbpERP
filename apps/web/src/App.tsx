import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useAuth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import { Spinner } from "@/components/ui/misc";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PeoplePage from "@/pages/PeoplePage";
import EmployeeRecordPage from "@/pages/EmployeeRecordPage";
import LeavePage from "@/pages/LeavePage";
import PayrollPage from "@/pages/PayrollPage";
import TasksPage from "@/pages/TasksPage";
import ProjectsPage from "@/pages/ProjectsPage";
import MessagesPage from "@/pages/MessagesPage";
import ReportsPage from "@/pages/ReportsPage";
import TrainingPage from "@/pages/TrainingPage";
import SettingsPage from "@/pages/SettingsPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="flex min-h-screen items-center justify-center"><Spinner label="Restoring session…" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function NotFound() {
  return (
    <div className="flex flex-col items-center gap-2 py-24 text-center">
      <p className="text-[32px] font-bold tracking-tight text-ink-200">404</p>
      <p className="text-[14px] text-ink-500">This page doesn't exist in your workspace.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="people/:id" element={<EmployeeRecordPage />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
