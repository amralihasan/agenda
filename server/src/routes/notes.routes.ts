import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { NoteCreateSchema, NoteUpdateSchema } from '../validators/schemas.js';

export const notesRouter = Router();

// GET /api/notes?search=...&category=...
notesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;
    const where: any = {};

    if (category && category !== 'All') {
      where.category = String(category);
    }

    if (search) {
      const searchStr = String(search).toLowerCase();
      where.OR = [
        { title: { contains: searchStr } },
        { content: { contains: searchStr } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes
notesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = NoteCreateSchema.parse(req.body);
    const note = await prisma.note.create({ data });
    res.status(201).json(note);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/notes/:id
notesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = NoteUpdateSchema.parse(req.body);
    const note = await prisma.note.update({
      where: { id },
      data,
    });
    res.json(note);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/notes/:id
notesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.note.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
