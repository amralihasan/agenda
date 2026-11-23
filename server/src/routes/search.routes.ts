import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const searchRouter = Router();

interface SearchAttachmentImage {
  id: string;
  caption: string | null;
  imageData: string;
  createdAt: Date;
}

interface SearchAttachmentVoice {
  id: string;
  title: string | null;
  audioData: string;
  duration: number;
  createdAt: Date;
}

interface SearchResultItem {
  id: string;
  scope: 'daily' | 'monthly' | 'notes';
  kind:
    | 'event'
    | 'task'
    | 'priority'
    | 'daily-note'
    | 'monthly-intention'
    | 'monthly-memo'
    | 'note';
  title: string;
  description: string | null;
  date: string | null;
  year?: number;
  month?: number;
  dayOfWeek?: number | null;
  timeRange?: string | null;
  category?: string | null;
  color?: string | null;
  images: SearchAttachmentImage[];
  voiceNotes: SearchAttachmentVoice[];
}

const stripHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
};

const getDateParts = (dateStr: string | null | undefined) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { month: undefined, dayOfWeek: null as number | null };
  }
  const d = new Date(`${dateStr}T12:00:00Z`);
  return {
    month: d.getUTCMonth() + 1,
    dayOfWeek: d.getUTCDay(), // 0 = Sunday .. 6 = Saturday
  };
};

// GET /api/search?q=...&scope=all|daily|monthly|notes&dayName=0..6&month=1..12
searchRouter.get('/', async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const scopeParam = typeof req.query.scope === 'string' ? req.query.scope : 'all';
    const scope =
      scopeParam === 'daily' || scopeParam === 'monthly' || scopeParam === 'notes'
        ? scopeParam
        : 'all';

    const dayParam = typeof req.query.dayName === 'string' ? req.query.dayName.trim() : '';
    const dayFilter =
      dayParam !== '' && dayParam !== 'all' && /^[0-6]$/.test(dayParam)
        ? parseInt(dayParam, 10)
        : null;

    const monthParam = typeof req.query.month === 'string' ? req.query.month.trim() : '';
    const monthFilter =
      monthParam !== '' && monthParam !== 'all' && /^([1-9]|1[0-2])$/.test(monthParam)
        ? parseInt(monthParam, 10)
        : null;

    const includeDaily = scope === 'all' || scope === 'daily';
    const includeMonthly = scope === 'all' || scope === 'monthly';
    const includeNotes = scope === 'all' || scope === 'notes';

    const [
      tasks,
      priorities,
      events,
      dailyNotes,
      monthlyPlans,
      notes,
      allImages,
      allVoiceNotes,
    ] = await Promise.all([
      includeDaily ? prisma.task.findMany({ orderBy: { date: 'desc' } }) : Promise.resolve([]),
      includeDaily
        ? prisma.dailyPriority.findMany({ orderBy: { date: 'desc' } })
        : Promise.resolve([]),
      includeDaily
        ? prisma.scheduleEvent.findMany({ orderBy: [{ date: 'desc' }, { startTime: 'asc' }] })
        : Promise.resolve([]),
      includeDaily ? prisma.dailyNote.findMany({ orderBy: { date: 'desc' } }) : Promise.resolve([]),
      includeMonthly
        ? prisma.monthlyPlan.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] })
        : Promise.resolve([]),
      includeNotes
        ? prisma.note.findMany({ orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }] })
        : Promise.resolve([]),
      prisma.imageAttachment.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.voiceNote.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    const imagesMap = new Map<string, SearchAttachmentImage[]>();
    for (const img of allImages) {
      const key = `${img.targetType}:${img.targetId}`;
      const list = imagesMap.get(key) || [];
      list.push({
        id: img.id,
        caption: img.caption,
        imageData: img.imageData,
        createdAt: img.createdAt,
      });
      imagesMap.set(key, list);
    }

    const voiceMap = new Map<string, SearchAttachmentVoice[]>();
    for (const vn of allVoiceNotes) {
      const key = `${vn.targetType}:${vn.targetId}`;
      const list = voiceMap.get(key) || [];
      list.push({
        id: vn.id,
        title: vn.title,
        audioData: vn.audioData,
        duration: vn.duration,
        createdAt: vn.createdAt,
      });
      voiceMap.set(key, list);
    }

    const results: SearchResultItem[] = [];

    // 1. Daily Schedule Events
    for (const ev of events) {
      const { month, dayOfWeek } = getDateParts(ev.date);
      const dailyKey = `daily:${ev.date}`;
      results.push({
        id: `event-${ev.id}`,
        scope: 'daily',
        kind: 'event',
        title: ev.title,
        description: ev.description || null,
        date: ev.date,
        month,
        dayOfWeek,
        timeRange: `${ev.startTime}–${ev.endTime}`,
        category: ev.category || null,
        color: ev.color || 'carmine',
        images: imagesMap.get(dailyKey) || [],
        voiceNotes: voiceMap.get(dailyKey) || [],
      });
    }

    // 2. Daily Tasks
    for (const task of tasks) {
      const { month, dayOfWeek } = getDateParts(task.date);
      const dailyKey = `daily:${task.date}`;
      results.push({
        id: `task-${task.id}`,
        scope: 'daily',
        kind: 'task',
        title: task.title,
        description: task.description || null,
        date: task.date,
        month,
        dayOfWeek,
        timeRange:
          task.startTime && task.endTime ? `${task.startTime}–${task.endTime}` : null,
        images: imagesMap.get(dailyKey) || [],
        voiceNotes: voiceMap.get(dailyKey) || [],
      });
    }

    // 3. Daily Priorities
    for (const p of priorities) {
      const { month, dayOfWeek } = getDateParts(p.date);
      const dailyKey = `daily:${p.date}`;
      results.push({
        id: `priority-${p.id}`,
        scope: 'daily',
        kind: 'priority',
        title: p.title,
        description: null,
        date: p.date,
        month,
        dayOfWeek,
        category: p.category || null,
        images: imagesMap.get(dailyKey) || [],
        voiceNotes: voiceMap.get(dailyKey) || [],
      });
    }

    // 4. Daily Notes (only include if content or attachments exist)
    const dailyNoteDatesSeen = new Set<string>();
    for (const dn of dailyNotes) {
      dailyNoteDatesSeen.add(dn.date);
      const plain = stripHtml(dn.content);
      const dailyKey = `daily:${dn.date}`;
      const imgs = imagesMap.get(dailyKey) || [];
      const vns = voiceMap.get(dailyKey) || [];
      if (!plain && imgs.length === 0 && vns.length === 0) continue;

      const { month, dayOfWeek } = getDateParts(dn.date);
      results.push({
        id: `daily-note-${dn.id}`,
        scope: 'daily',
        kind: 'daily-note',
        title: `Daily Notes · ${dn.date}`,
        description: plain || null,
        date: dn.date,
        month,
        dayOfWeek,
        images: imgs,
        voiceNotes: vns,
      });
    }

    // Also include daily dates that have attachments even if DailyNote row doesn't exist
    if (includeDaily) {
      const attachmentDates = new Set<string>();
      for (const key of [...imagesMap.keys(), ...voiceMap.keys()]) {
        if (key.startsWith('daily:')) {
          const dateStr = key.slice('daily:'.length);
          if (!dailyNoteDatesSeen.has(dateStr)) {
            attachmentDates.add(dateStr);
          }
        }
      }
      for (const dateStr of attachmentDates) {
        const { month, dayOfWeek } = getDateParts(dateStr);
        const dailyKey = `daily:${dateStr}`;
        results.push({
          id: `daily-media-${dateStr}`,
          scope: 'daily',
          kind: 'daily-note',
          title: `Daily Notes · ${dateStr}`,
          description: null,
          date: dateStr,
          month,
          dayOfWeek,
          images: imagesMap.get(dailyKey) || [],
          voiceNotes: voiceMap.get(dailyKey) || [],
        });
      }
    }

    // 5. Monthly Plans (intentions & memoranda)
    for (const mp of monthlyPlans) {
      const monthStr = `${mp.year}-${mp.month.toString().padStart(2, '0')}`;
      try {
        const intentions = JSON.parse(mp.intentions || '[]');
        if (Array.isArray(intentions)) {
          for (const item of intentions) {
            if (item?.text) {
              results.push({
                id: `monthly-int-${mp.id}-${item.id || results.length}`,
                scope: 'monthly',
                kind: 'monthly-intention',
                title: String(item.text),
                description: null,
                date: null,
                year: mp.year,
                month: mp.month,
                dayOfWeek: null,
                category: monthStr,
                images: [],
                voiceNotes: [],
              });
            }
          }
        }
      } catch {
        // ignore malformed JSON
      }

      try {
        const memos = JSON.parse(mp.notes || '[]');
        if (Array.isArray(memos)) {
          for (const item of memos) {
            if (item?.text) {
              results.push({
                id: `monthly-memo-${mp.id}-${item.id || results.length}`,
                scope: 'monthly',
                kind: 'monthly-memo',
                title: String(item.text),
                description: null,
                date: null,
                year: mp.year,
                month: mp.month,
                dayOfWeek: null,
                category: monthStr,
                images: [],
                voiceNotes: [],
              });
            }
          }
        }
      } catch {
        // ignore malformed JSON
      }
    }

    // 6. Personal Notes
    for (const note of notes) {
      const { month, dayOfWeek } = getDateParts(note.date);
      const noteKey = `note:${note.id}`;
      const plain = stripHtml(note.content);
      results.push({
        id: `note-${note.id}`,
        scope: 'notes',
        kind: 'note',
        title: note.title || 'Untitled Note',
        description: plain || null,
        date: note.date || null,
        month,
        dayOfWeek,
        category: note.category,
        images: imagesMap.get(noteKey) || [],
        voiceNotes: voiceMap.get(noteKey) || [],
      });
    }

    // Apply filters
    const filtered = results.filter((item) => {
      if (monthFilter !== null && item.month !== monthFilter) {
        return false;
      }
      if (dayFilter !== null && item.dayOfWeek !== dayFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          item.title,
          item.description || '',
          item.category || '',
          item.date || '',
          ...item.images.map((i) => i.caption || ''),
          ...item.voiceNotes.map((v) => v.title || ''),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });

    res.json({ results: filtered, total: filtered.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
