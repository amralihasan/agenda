import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import {
  DailyPriorityCreateSchema,
  DailyPriorityUpdateSchema,
} from '../validators/schemas.js';

export const prioritiesRouter = Router();

// GET /api/priorities?date=YYYY-MM-DD
prioritiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required' });
    }
    const priorities = await prisma.dailyPriority.findMany({
      where: { date: String(date) },
      orderBy: { position: 'asc' },
    });
    res.json(priorities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/priorities (Upsert priority by date & position)
prioritiesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = DailyPriorityCreateSchema.parse(req.body);
    const priority = await prisma.dailyPriority.upsert({
      where: {
        date_position: {
          date: data.date,
          position: data.position,
        },
      },
      update: {
        title: data.title,
        isCompleted: data.isCompleted,
        category: data.category,
      },
      create: data,
    });
    res.status(201).json(priority);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/priorities/:id
prioritiesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = DailyPriorityUpdateSchema.parse(req.body);
    const priority = await prisma.dailyPriority.update({
      where: { id },
      data,
    });
    res.json(priority);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/priorities/:id
prioritiesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.dailyPriority.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
