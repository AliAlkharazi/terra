import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthedRequest, requireAuth } from '../middleware/auth';

export const backupRouter = Router();
backupRouter.use(requireAuth);

const backupSchema = z.object({ data: z.unknown() });

backupRouter.put('/', async (req: AuthedRequest, res) => {
  const parsed = backupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const backup = await prisma.backup.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, data: parsed.data.data as any },
    update: { data: parsed.data.data as any },
  });
  res.json({ updatedAt: backup.updatedAt });
});

backupRouter.get('/', async (req: AuthedRequest, res) => {
  const backup = await prisma.backup.findUnique({ where: { userId: req.userId } });
  if (!backup) return res.status(404).json({ error: 'No backup found' });
  res.json({ data: backup.data, updatedAt: backup.updatedAt });
});
