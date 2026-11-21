import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { MonthlyPlanUpdateSchema } from '../validators/schemas.js';

export const monthlyRouter = Router();

function parseYearMonth(req: Request): { year: number; month: number } | null {
  const year = Number(req.params.year);
  const month = Number(req.params.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

// GET /api/monthly-plan/:year/:month
monthlyRouter.get('/:year/:month', async (req: Request, res: Response) => {
  try {
    const parsed = parseYearMonth(req);
    if (!parsed) return res.status(400).json({ error: 'Invalid year or month' });
    const { year, month } = parsed;

    const plan = await prisma.monthlyPlan.findUnique({
      where: { year_month: { year, month } },
    });

    res.json(
      plan || {
        year,
        month,
        intentions: '[]',
        notes: '[]',
      }
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/monthly-plan/:year/:month
monthlyRouter.put('/:year/:month', async (req: Request, res: Response) => {
  try {
    const parsed = parseYearMonth(req);
    if (!parsed) return res.status(400).json({ error: 'Invalid year or month' });
    const { year, month } = parsed;

    const data = MonthlyPlanUpdateSchema.parse(req.body);

    const plan = await prisma.monthlyPlan.upsert({
      where: { year_month: { year, month } },
      update: {
        intentions: data.intentions,
        notes: data.notes,
      },
      create: {
        year,
        month,
        intentions: data.intentions ?? '[]',
        notes: data.notes ?? '[]',
      },
    });

    res.json(plan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
