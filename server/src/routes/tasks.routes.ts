import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import {
  TaskCreateSchema,
  TaskUpdateSchema,
  TaskMoveSchema,
} from '../validators/schemas.js';

export const tasksRouter = Router();

// GET /api/tasks?date=YYYY-MM-DD
tasksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { date, status } = req.query;
    const where: any = {};
    if (date) where.date = String(date);
    if (status) where.status = String(status);

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { category: true },
    });
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
tasksRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = TaskCreateSchema.parse(req.body);
    const task = await prisma.task.create({
      data,
      include: { category: true },
    });
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Validation error' });
  }
});

// PUT /api/tasks/:id
tasksRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = TaskUpdateSchema.parse(req.body);
    const task = await prisma.task.update({
      where: { id },
      data,
      include: { category: true },
    });
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tasks/:id/move - Move unfinished task to another date
tasksRouter.post('/:id/move', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetDate } = TaskMoveSchema.parse(req.body);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        date: targetDate,
        status: 'migrated',
      },
      include: { category: true },
    });
    res.json(updatedTask);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
