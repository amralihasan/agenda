import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { VoiceNoteCreateSchema } from '../validators/schemas.js';

export const voiceNotesRouter = Router();

// GET /api/voice-notes?targetType=...&targetId=...
voiceNotesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { targetType, targetId } = req.query;
    const where: any = {};
    if (targetType) where.targetType = String(targetType);
    if (targetId) where.targetId = String(targetId);

    const voiceNotes = await prisma.voiceNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(voiceNotes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/voice-notes
voiceNotesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = VoiceNoteCreateSchema.parse(req.body);
    const voiceNote = await prisma.voiceNote.create({
      data: {
        title: data.title,
        audioData: data.audioData,
        duration: data.duration,
        targetType: data.targetType,
        targetId: data.targetId,
      },
    });
    res.status(201).json(voiceNote);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/voice-notes/:id
voiceNotesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.voiceNote.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
