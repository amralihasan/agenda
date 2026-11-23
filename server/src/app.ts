import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { tasksRouter } from './routes/tasks.routes.js';
import { prioritiesRouter } from './routes/priorities.routes.js';
import { eventsRouter } from './routes/events.routes.js';
import { dailyNotesRouter } from './routes/daily-notes.routes.js';
import { agendaRouter } from './routes/agenda.routes.js';
import { notesRouter } from './routes/notes.routes.js';
import { weeklyRouter } from './routes/weekly.routes.js';
import { monthlyRouter } from './routes/monthly.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { backupRouter } from './routes/backup.routes.js';
import { voiceNotesRouter } from './routes/voice-notes.routes.js';
import { imagesRouter } from './routes/images.routes.js';
import { categoriesRouter } from './routes/categories.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { searchRouter } from './routes/search.routes.js';
import { whiteboardRouter } from './routes/whiteboard.routes.js';
import { requireAuth } from './middleware/auth.middleware.js';

const candidateDistPaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];
const clientDist = candidateDistPaths.find((p) => fs.existsSync(p)) || candidateDistPaths[0];

export const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Public API Routes
app.use('/api/auth', authRouter);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Protected API Routes — every request needs a valid Bearer token
app.use('/api', requireAuth);
app.use('/api', agendaRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/priorities', prioritiesRouter);
app.use('/api/schedule-events', eventsRouter);
app.use('/api/daily-notes', dailyNotesRouter);
app.use('/api/weekly-plan', weeklyRouter);
app.use('/api/monthly-plan', monthlyRouter);
app.use('/api/notes', notesRouter);
app.use('/api/voice-notes', voiceNotesRouter);
app.use('/api/images', imagesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/backup', backupRouter);
app.use('/api/search', searchRouter);
app.use('/api/whiteboards', whiteboardRouter);

// Serve frontend static files
app.use(express.static(clientDist));

// SPA fallback for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexHtml = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  next();
});
