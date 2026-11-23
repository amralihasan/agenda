import { z } from 'zod';

export const AuthLoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const TaskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  priority: z.enum(['urgent', 'normal', 'low']).default('normal'),
  status: z.enum(['pending', 'completed', 'migrated']).default('pending'),
  isCompleted: z.boolean().default(false),
  order: z.number().int().default(0),
  categoryId: z.string().optional().nullable(),
});

export const TaskUpdateSchema = TaskCreateSchema.partial();

export const TaskMoveSchema = z.object({
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be YYYY-MM-DD'),
});

export const DailyPriorityCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  position: z.number().int().min(1).max(3),
  title: z.string().min(1, 'Title is required'),
  isCompleted: z.boolean().default(false),
  category: z.string().optional().nullable(),
});

export const DailyPriorityUpdateSchema = DailyPriorityCreateSchema.partial();

export const ScheduleEventCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:mm'),
  location: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export const ScheduleEventUpdateSchema = ScheduleEventCreateSchema.partial();

export const DailyNoteUpsertSchema = z.object({
  content: z.string().default(''),
  noteType: z.enum(['text', 'code']).default('text').optional(),
  quote: z.string().optional().nullable(),
  quoteAuthor: z.string().optional().nullable(),
});

export const WeeklyPlanUpsertSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().optional().nullable(),
  goals: z.string().optional().nullable(), // JSON string
  notes: z.string().optional().nullable(),
  noteType: z.enum(['text', 'code']).default('text').optional(),
});

export const MonthlyPlanUpdateSchema = z.object({
  intentions: z.string().optional(),
  notes: z.string().optional(),
});

export const NoteCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().default(''),
  noteType: z.enum(['text', 'code']).default('text').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  category: z.string().default('General'),
  paperStyle: z.enum(['ruled', 'grid', 'blank']).default('ruled'),
  isPinned: z.boolean().default(false),
});

export const NoteUpdateSchema = NoteCreateSchema.partial();

export const AppSettingsUpdateSchema = z.object({
  language: z.enum(['en', 'ar']).optional(),
  firstDayOfWeek: z.number().int().min(0).max(6).optional(),
  startHour: z.number().int().min(0).max(23).optional(),
  endHour: z.number().int().min(0).max(23).optional(),
  paperTone: z.string().optional(),
});

export const VoiceNoteCreateSchema = z.object({
  title: z.string().optional().nullable(),
  audioData: z.string().min(1, 'Audio data is required'),
  duration: z.number().int().min(0).default(0),
  targetType: z.enum(['daily', 'weekly', 'note']),
  targetId: z.string().min(1, 'Target ID is required'),
});

export const ImageAttachmentCreateSchema = z.object({
  caption: z.string().optional().nullable(),
  imageData: z.string().min(1, 'Image data is required'),
  targetType: z.enum(['daily', 'weekly', 'note']),
  targetId: z.string().min(1, 'Target ID is required'),
});

export const CategoryCreateSchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
  color: z.string().optional().default('#832613'),
});

export const CategoryUpdateSchema = z.object({
  name: z.string().min(1).trim().optional(),
  color: z.string().optional(),
});
