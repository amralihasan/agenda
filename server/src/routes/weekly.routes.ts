import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { WeeklyPlanUpsertSchema } from '../validators/schemas.js';

export const weeklyRouter = Router();

// PUT /api/weekly-plan/:weekStartDate (Upsert weekly plan)
weeklyRouter.put('/:weekStartDate', async (req: Request, res: Response) => {
  try {
    const { weekStartDate } = req.params;
    const data = WeeklyPlanUpsertSchema.parse({
      weekStartDate,
      ...req.body,
    });

    const plan = await prisma.weeklyPlan.upsert({
      where: { weekStartDate },
      update: {
        title: data.title,
        goals: data.goals,
        notes: data.notes,
      },
      create: data,
    });
    res.json(plan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
