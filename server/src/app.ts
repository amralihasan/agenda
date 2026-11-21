import express from 'express';
import cors from 'cors';
import { tasksRouter } from './routes/tasks.routes.js';
import { prioritiesRouter } from './routes/priorities.routes.js';
import { eventsRouter } from './routes/events.routes.js';
import { dailyNotesRouter } from './routes/daily-notes.routes.js';
import { agendaRouter } from './routes/agenda.routes.js';
import { notesRouter } from './routes/notes.routes.js';
import { weeklyRouter } from './routes/weekly.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { backupRouter } from './routes/backup.routes.js';
import { voiceNotesRouter } from './routes/voice-notes.routes.js';
import { imagesRouter } from './routes/images.routes.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', agendaRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/priorities', prioritiesRouter);
app.use('/api/schedule-events', eventsRouter);
app.use('/api/daily-notes', dailyNotesRouter);
app.use('/api/weekly-plan', weeklyRouter);
app.use('/api/notes', notesRouter);
app.use('/api/voice-notes', voiceNotesRouter);
app.use('/api/images', imagesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/backup', backupRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});
