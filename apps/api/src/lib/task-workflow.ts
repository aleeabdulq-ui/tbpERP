import type { TaskStatus } from "@prisma/client";

export const activeReminderStatuses: TaskStatus[] = ["IN_PROGRESS", "OVERDUE"];

export function taskCountdown(dueAt: Date | null, acceptedAt: Date | null, status: TaskStatus, now = new Date()) {
  if (!dueAt || !acceptedAt || !activeReminderStatuses.includes(status)) return null;
  const remainingSeconds = Math.max(0, Math.ceil((dueAt.getTime() - now.getTime()) / 1000));
  return { startedAt: acceptedAt, dueAt, remainingSeconds, overdue: dueAt.getTime() <= now.getTime() };
}

export function nextReminderTime(now: Date, dueAt: Date | null, intervalHours: number) {
  if (!dueAt || dueAt.getTime() <= now.getTime()) return null;
  return new Date(Math.min(now.getTime() + intervalHours * 3600000, dueAt.getTime()));
}

export function canAccept(status: TaskStatus) {
  return status === "ASSIGNED" || status === "RETURNED";
}

export function canSubmit(status: TaskStatus) {
  return status === "IN_PROGRESS" || status === "OVERDUE";
}
