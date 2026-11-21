import { Router, Request, Response } from 'express';
import { agendaService } from '../services/agenda.service.js';

export const agendaRouter = Router();

// GET /api/daily-agenda/:date (date = YYYY-MM-DD)
agendaRouter.get('/daily-agenda/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const agenda = await agendaService.getDailyAgenda(date);
    res.json(agenda);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/weekly-agenda/:date (date = any YYYY-MM-DD in the week)
agendaRouter.get('/weekly-agenda/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const agenda = await agendaService.getWeeklyAgenda(date);
    res.json(agenda);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/monthly-agenda/:year/:month (month = 1-12)
agendaRouter.get('/monthly-agenda/:year/:month', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Valid year and month (1-12) are required' });
    }
    const agenda = await agendaService.getMonthlyAgenda(year, month);
    res.json(agenda);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
