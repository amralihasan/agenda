import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { CategoryCreateSchema, CategoryUpdateSchema } from '../validators/schemas.js';

export const categoriesRouter = Router();

// GET /api/categories
categoriesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    let categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Ensure default initial categories exist
    const defaultNames = ['Philosophy', 'Architecture', 'Archive', 'Editorial', 'Personal'];
    const existingNames = new Set(categories.map((c) => c.name));

    let createdAny = false;
    for (const name of defaultNames) {
      if (!existingNames.has(name)) {
        await prisma.category.create({
          data: {
            name,
            color: '#832613',
          },
        });
        createdAny = true;
      }
    }

    if (createdAny) {
      categories = await prisma.category.findMany({ orderBy: { createdAt: 'asc' } });
    }

    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories
categoriesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = CategoryCreateSchema.parse(req.body);
    const existing = await prisma.category.findFirst({
      where: { name: { equals: data.name } },
    });

    if (existing) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        color: data.color || '#832613',
      },
    });
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/categories/:id
categoriesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = CategoryUpdateSchema.parse(req.body);

    const oldCategory = await prisma.category.findUnique({ where: { id } });
    if (!oldCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (data.name && data.name !== oldCategory.name) {
      const existing = await prisma.category.findFirst({
        where: { name: { equals: data.name } },
      });
      if (existing && existing.id !== id) {
        return res.status(409).json({ error: 'Category name already in use' });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data,
    });

    // Update existing notes if category name changed
    if (data.name && data.name !== oldCategory.name) {
      await prisma.note.updateMany({
        where: { category: oldCategory.name },
        data: { category: data.name },
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/categories/:id
categoriesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Reassign notes with this category to 'General'
    await prisma.note.updateMany({
      where: { category: category.name },
      data: { category: 'General' },
    });

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, id, name: category.name });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
