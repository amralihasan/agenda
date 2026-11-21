import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const backupRouter = Router();

// GET /api/backup/export
backupRouter.get('/export', async (_req: Request, res: Response) => {
  try {
    const [tasks, priorities, events, dailyNotes, notes, weeklyPlans, settings, categories] =
      await Promise.all([
        prisma.task.findMany(),
        prisma.dailyPriority.findMany(),
        prisma.scheduleEvent.findMany(),
        prisma.dailyNote.findMany(),
        prisma.note.findMany(),
        prisma.weeklyPlan.findMany(),
        prisma.appSettings.findMany(),
        prisma.category.findMany(),
      ]);

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      priorities,
      events,
      dailyNotes,
      notes,
      weeklyPlans,
      settings,
      categories,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="agenda-backup-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.json(backupData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/backup/import
backupRouter.post('/import', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.tasks)) {
      return res.status(400).json({ error: 'Invalid backup data format' });
    }

    await prisma.$transaction(async (tx) => {
      // Clear existing records
      await tx.task.deleteMany({});
      await tx.dailyPriority.deleteMany({});
      await tx.scheduleEvent.deleteMany({});
      await tx.dailyNote.deleteMany({});
      await tx.note.deleteMany({});
      await tx.weeklyPlan.deleteMany({});

      // Restore data
      if (data.categories?.length) {
        for (const cat of data.categories) {
          await tx.category.upsert({
            where: { id: cat.id },
            update: cat,
            create: cat,
          });
        }
      }

      if (data.tasks?.length) {
        for (const task of data.tasks) {
          const { category, ...cleanTask } = task;
          await tx.task.create({ data: cleanTask });
        }
      }

      if (data.priorities?.length) {
        for (const p of data.priorities) {
          await tx.dailyPriority.create({ data: p });
        }
      }

      if (data.events?.length) {
        for (const ev of data.events) {
          await tx.scheduleEvent.create({ data: ev });
        }
      }

      if (data.dailyNotes?.length) {
        for (const dn of data.dailyNotes) {
          await tx.dailyNote.create({ data: dn });
        }
      }

      if (data.notes?.length) {
        for (const n of data.notes) {
          await tx.note.create({ data: n });
        }
      }

      if (data.weeklyPlans?.length) {
        for (const wp of data.weeklyPlans) {
          await tx.weeklyPlan.create({ data: wp });
        }
      }
    });

    res.json({ success: true, message: 'Data successfully restored from backup.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
