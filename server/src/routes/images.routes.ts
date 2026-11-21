import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { ImageAttachmentCreateSchema } from '../validators/schemas.js';

export const imagesRouter = Router();

// GET /api/images?targetType=...&targetId=...
imagesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { targetType, targetId } = req.query;
    const where: any = {};
    if (targetType) where.targetType = String(targetType);
    if (targetId) where.targetId = String(targetId);

    const images = await prisma.imageAttachment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(images);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/images
imagesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = ImageAttachmentCreateSchema.parse(req.body);
    const image = await prisma.imageAttachment.create({
      data: {
        caption: data.caption,
        imageData: data.imageData,
        targetType: data.targetType,
        targetId: data.targetId,
      },
    });
    res.status(201).json(image);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/images/:id
imagesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.imageAttachment.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
