export const activeReminderStatuses = ["IN_PROGRESS", "OVERDUE"];
export function taskCountdown(dueAt, acceptedAt, status, now = new Date()) {
    if (!dueAt || !acceptedAt || !activeReminderStatuses.includes(status))
        return null;
    const remainingSeconds = Math.max(0, Math.ceil((dueAt.getTime() - now.getTime()) / 1000));
    return { startedAt: acceptedAt, dueAt, remainingSeconds, overdue: dueAt.getTime() <= now.getTime() };
}
export function nextReminderTime(now, dueAt, intervalHours) {
    if (!dueAt || dueAt.getTime() <= now.getTime())
        return null;
    return new Date(Math.min(now.getTime() + intervalHours * 3600000, dueAt.getTime()));
}
export function canAccept(status) {
    return status === "ASSIGNED" || status === "RETURNED";
}
export function canSubmit(status) {
    return status === "IN_PROGRESS" || status === "OVERDUE";
}
