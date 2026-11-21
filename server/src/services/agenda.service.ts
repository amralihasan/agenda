import { prisma } from '../db.js';
import {
  startOfWeek,
  endOfWeek,
  format,
  addDays,
  parseISO,
  getDayOfYear,
  getWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';

export class AgendaService {
  /**
   * Fetch full daily agenda for a given date (YYYY-MM-DD)
   */
  async getDailyAgenda(dateStr: string) {
    const date = parseISO(dateStr);
    const dayOfYear = getDayOfYear(date);
    const weekNumber = getWeek(date, { weekStartsOn: 1 });

    const [priorities, events, tasks, dailyNote, settings] = await Promise.all([
      prisma.dailyPriority.findMany({
        where: { date: dateStr },
        orderBy: { position: 'asc' },
      }),
      prisma.scheduleEvent.findMany({
        where: { date: dateStr },
        orderBy: { startTime: 'asc' },
      }),
      prisma.task.findMany({
        where: { date: dateStr },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: { category: true },
      }),
      prisma.dailyNote.findUnique({
        where: { date: dateStr },
      }),
      this.getSettings(),
    ]);

    return {
      date: dateStr,
      dayOfYear,
      totalDays: 365,
      weekNumber,
      priorities,
      events,
      tasks,
      dailyNote: dailyNote || {
        id: `note-${dateStr}`,
        date: dateStr,
        content: '',
        quote: null,
        quoteAuthor: null,
      },
      settings,
    };
  }

  /**
   * Fetch full weekly agenda for a date (YYYY-MM-DD)
   */
  async getWeeklyAgenda(dateStr: string) {
    const settings = await this.getSettings();
    const date = parseISO(dateStr);
    const firstDay = (settings.firstDayOfWeek ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

    const weekStart = startOfWeek(date, { weekStartsOn: firstDay });
    const weekEnd = endOfWeek(date, { weekStartsOn: firstDay });
    const weekStartDateStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndDateStr = format(weekEnd, 'yyyy-MM-dd');
    const weekNumber = getWeek(date, { weekStartsOn: firstDay });

    const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((d) =>
      format(d, 'yyyy-MM-dd')
    );

    const [weeklyPlan, tasks, events] = await Promise.all([
      prisma.weeklyPlan.findUnique({
        where: { weekStartDate: weekStartDateStr },
      }),
      prisma.task.findMany({
        where: {
          date: { in: days },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.scheduleEvent.findMany({
        where: {
          date: { in: days },
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    // Group tasks and events by date
    const daysData = days.map((dStr) => {
      const dDate = parseISO(dStr);
      return {
        date: dStr,
        dayName: format(dDate, 'EEEE'),
        dayNumber: format(dDate, 'd'),
        tasks: tasks.filter((t) => t.date === dStr),
        events: events.filter((e) => e.date === dStr),
      };
    });

    return {
      weekStartDate: weekStartDateStr,
      weekEndDate: weekEndDateStr,
      weekNumber,
      weeklyPlan: weeklyPlan || {
        id: `plan-${weekStartDateStr}`,
        weekStartDate: weekStartDateStr,
        title: '',
        goals: JSON.stringify([]),
        notes: '',
      },
      days: daysData,
    };
  }

  /**
   * Fetch monthly agenda and indicator summaries
   */
  async getMonthlyAgenda(year: number, month: number) {
    // month is 1-12
    const targetDate = new Date(year, month - 1, 1);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).map((d) =>
      format(d, 'yyyy-MM-dd')
    );

    const [tasks, events, notes] = await Promise.all([
      prisma.task.findMany({
        where: {
          date: { in: daysInMonth },
        },
        select: { id: true, date: true, isCompleted: true },
      }),
      prisma.scheduleEvent.findMany({
        where: {
          date: { in: daysInMonth },
        },
        select: { id: true, date: true, title: true },
      }),
      prisma.dailyNote.findMany({
        where: {
          date: { in: daysInMonth },
          content: { not: '' },
        },
        select: { id: true, date: true },
      }),
    ]);

    const daySummaries = daysInMonth.map((dStr) => {
      const dayTasks = tasks.filter((t) => t.date === dStr);
      const dayEvents = events.filter((e) => e.date === dStr);
      const hasNote = notes.some((n) => n.date === dStr);

      return {
        date: dStr,
        totalTasks: dayTasks.length,
        completedTasks: dayTasks.filter((t) => t.isCompleted).length,
        totalEvents: dayEvents.length,
        events: dayEvents,
        hasNote,
      };
    });

    return {
      year,
      month,
      monthName: format(monthStart, 'MMMM'),
      days: daySummaries,
    };
  }

  /**
   * Get app settings or initialize defaults
   */
  async getSettings() {
    let settings = await prisma.appSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: 'default',
          language: 'ar',
          firstDayOfWeek: 1,
          startHour: 6,
          endHour: 22,
          paperTone: 'ivory',
        },
      });
    }

    return settings;
  }
}

export const agendaService = new AgendaService();
