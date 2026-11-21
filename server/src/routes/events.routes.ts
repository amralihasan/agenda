import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import {
  ScheduleEventCreateSchema,
  ScheduleEventUpdateSchema,
} from '../validators/schemas.js';

export const eventsRouter = Router();

// GET /api/schedule-events?date=YYYY-MM-DD
eventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const where: any = {};
    if (date) where.date = String(date);

    const events = await prisma.scheduleEvent.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/schedule-events
eventsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = ScheduleEventCreateSchema.parse(req.body);
    const event = await prisma.scheduleEvent.create({ data });
    res.status(201).json(event);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/schedule-events/:id
eventsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = ScheduleEventUpdateSchema.parse(req.body);
    const event = await prisma.scheduleEvent.update({
      where: { id },
      data,
    });
    res.json(event);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/schedule-events/:id
eventsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.scheduleEvent.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
