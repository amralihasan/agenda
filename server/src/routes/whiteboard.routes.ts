import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import {
  WhiteboardCreateSchema,
  WhiteboardUpdateSchema,
} from '../validators/schemas.js';

export const whiteboardRouter = Router();

// GET /api/whiteboards
whiteboardRouter.get('/', async (_req: Request, res: Response) => {
  try {
    let boards = await prisma.whiteboard.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    if (boards.length === 0) {
      const initial = await prisma.whiteboard.create({
        data: {
          title: 'Sketchpad I',
          elements: '[]',
          bgStyle: 'grid',
        },
      });
      boards = [initial];
    }

    res.json(boards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whiteboards
whiteboardRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = WhiteboardCreateSchema.parse(req.body);
    const board = await prisma.whiteboard.create({ data });
    res.status(201).json(board);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/whiteboards/:id
whiteboardRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = WhiteboardUpdateSchema.parse(req.body);
    const board = await prisma.whiteboard.update({
      where: { id },
      data,
    });
    res.json(board);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/whiteboards/:id
whiteboardRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.whiteboard.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
