import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthedRequest, requireAuth } from '../middleware/auth';

export const districtsRouter = Router();
districtsRouter.use(requireAuth);

districtsRouter.get('/', async (req: AuthedRequest, res) => {
  const districts = await prisma.district.findMany({ where: { userId: req.userId } });
  res.json(districts);
});

const updateBudgetSchema = z.object({ monthlyBudget: z.number().nonnegative() });

districtsRouter.patch('/:id', async (req: AuthedRequest, res) => {
  const parsed = updateBudgetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const district = await prisma.district.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!district) return res.status(404).json({ error: 'District not found' });

  const updated = await prisma.district.update({ where: { id: district.id }, data: { monthlyBudget: parsed.data.monthlyBudget } });
  res.json(updated);
});
