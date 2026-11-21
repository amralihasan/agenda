export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  date: string; // YYYY-MM-DD
  startTime?: string | null; // HH:mm
  endTime?: string | null; // HH:mm
  priority: 'urgent' | 'normal' | 'low';
  status: 'pending' | 'completed' | 'migrated';
  isCompleted: boolean;
  order: number;
  categoryId?: string | null;
  category?: Category | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyPriority {
  id: string;
  date: string;
  position: number; // 1, 2, 3
  title: string;
  isCompleted: boolean;
  category?: string | null;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string | null;
  category?: string | null;
}

export interface DailyNote {
  id: string;
  date: string;
  content: string;
  noteType?: 'text' | 'code';
  quote?: string | null;
  quoteAuthor?: string | null;
}

export interface WeeklyGoal {
  id: string;
  text: string;
  isCompleted: boolean;
  position: number;
}

export interface WeeklyPlan {
  id: string;
  weekStartDate: string;
  title?: string | null;
  goals: string | null; // JSON string of WeeklyGoal[]
  notes?: string | null;
  noteType?: 'text' | 'code';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  noteType?: 'text' | 'code';
  date?: string | null;
  category: string;
  paperStyle: 'ruled' | 'grid' | 'blank';
  isPinned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoiceNote {
  id: string;
  title?: string | null;
  audioData: string; // base64 data URL
  duration: number; // in seconds
  targetType: 'daily' | 'weekly' | 'note';
  targetId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ImageAttachment {
  id: string;
  caption?: string | null;
  imageData: string; // base64 data URL
  targetType: 'daily' | 'weekly' | 'note';
  targetId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppSettings {
  id: string;
  language: 'en' | 'ar';
  firstDayOfWeek: number; // 0: Sunday, 1: Monday, 6: Saturday
  startHour: number;
  endHour: number;
  paperTone: string;
}

export interface DailyAgendaResponse {
  date: string;
  dayOfYear: number;
  totalDays: number;
  weekNumber: number;
  priorities: DailyPriority[];
  events: ScheduleEvent[];
  tasks: Task[];
  dailyNote: DailyNote;
  settings: AppSettings;
}

export interface WeeklyDayData {
  date: string;
  dayName: string;
  dayNumber: string;
  tasks: Task[];
  events: ScheduleEvent[];
}

export interface WeeklyAgendaResponse {
  weekStartDate: string;
  weekEndDate: string;
  weekNumber: number;
  weeklyPlan: WeeklyPlan;
  days: WeeklyDayData[];
}

export interface MonthlyDaySummary {
  date: string;
  totalTasks: number;
  completedTasks: number;
  totalEvents: number;
  events: { id: string; date: string; title: string }[];
  hasNote: boolean;
}

export interface MonthlyAgendaResponse {
  year: number;
  month: number;
  monthName: string;
  days: MonthlyDaySummary[];
}
