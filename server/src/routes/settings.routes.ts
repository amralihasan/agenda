import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { agendaService } from '../services/agenda.service.js';
import { AppSettingsUpdateSchema } from '../validators/schemas.js';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await agendaService.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
settingsRouter.put('/', async (req: Request, res: Response) => {
  try {
    const data = AppSettingsUpdateSchema.parse(req.body);
    const settings = await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: {
        id: 'default',
        language: data.language || 'en',
        firstDayOfWeek: data.firstDayOfWeek ?? 1,
        startHour: data.startHour ?? 6,
        endHour: data.endHour ?? 22,
        paperTone: data.paperTone || 'ivory',
      },
    });
    res.json(settings);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
