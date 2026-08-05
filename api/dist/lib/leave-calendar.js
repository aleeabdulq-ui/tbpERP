const dayKey = (date) => date.toISOString().slice(0, 10);
const recurringKey = (date) => date.toISOString().slice(5, 10);
const isWeekday = (date) => date.getUTCDay() >= 1 && date.getUTCDay() <= 5;
const addDay = (date) => new Date(date.getTime() + 86_400_000);
export function calculateLeaveSchedule(startDate, requestedEndDate, holidays) {
    const start = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const requestedEnd = new Date(Date.UTC(requestedEndDate.getUTCFullYear(), requestedEndDate.getUTCMonth(), requestedEndDate.getUTCDate()));
    const holidayByDate = new Map(holidays.map((holiday) => [dayKey(holiday.date), holiday]));
    const recurringByDate = new Map(holidays.filter((holiday) => holiday.recurring).map((holiday) => [recurringKey(holiday.date), holiday]));
    const holidayFor = (date) => holidayByDate.get(dayKey(date)) ?? recurringByDate.get(recurringKey(date));
    let requestedWorkingDays = 0;
    for (let cursor = start; cursor <= requestedEnd; cursor = addDay(cursor))
        if (isWeekday(cursor))
            requestedWorkingDays += 1;
    let creditedDays = 0;
    let excludedHolidayCount = 0;
    const excludedHolidays = [];
    let effectiveEndDate = new Date(start);
    for (let cursor = start; creditedDays < requestedWorkingDays; cursor = addDay(cursor)) {
        effectiveEndDate = cursor;
        if (!isWeekday(cursor))
            continue;
        const holiday = holidayFor(cursor);
        if (holiday) {
            excludedHolidayCount += 1;
            excludedHolidays.push({ name: holiday.name, date: dayKey(cursor) });
            continue;
        }
        creditedDays += 1;
    }
    return { days: creditedDays, requestedEndDate: requestedEnd, effectiveEndDate, excludedHolidayCount, excludedHolidays };
}
