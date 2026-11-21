import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { DailyNoteUpsertSchema } from '../validators/schemas.js';

export const dailyNotesRouter = Router();

// GET /api/daily-notes/:date
dailyNotesRouter.get('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const note = await prisma.dailyNote.findUnique({
      where: { date },
    });
    if (!note) {
      return res.json({
        id: `note-${date}`,
        date,
        content: '',
        quote: null,
        quoteAuthor: null,
      });
    }
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/daily-notes/:date (Upsert)
dailyNotesRouter.put('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const data = DailyNoteUpsertSchema.parse(req.body);
    const note = await prisma.dailyNote.upsert({
      where: { date },
      update: data,
      create: {
        date,
        ...data,
      },
    });
    res.json(note);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
