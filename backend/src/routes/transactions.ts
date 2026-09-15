import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthedRequest, requireAuth } from '../middleware/auth';

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

transactionsRouter.get('/', async (req: AuthedRequest, res) => {
  const month = req.query.month as string | undefined;
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: req.userId,
      ...(month ? { date: { gte: new Date(`${month}-01T00:00:00.000Z`), lt: new Date(nextMonth(month) + '-01T00:00:00.000Z') } } : {}),
    },
    orderBy: { date: 'desc' },
  });
  res.json(transactions);
});

const createTxSchema = z.object({
  districtId: z.string().uuid(),
  amount: z.number(),
  note: z.string().optional().default(''),
  date: z.string().datetime().optional(),
});

transactionsRouter.post('/', async (req: AuthedRequest, res) => {
  const parsed = createTxSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const district = await prisma.district.findFirst({ where: { id: parsed.data.districtId, userId: req.userId } });
  if (!district) return res.status(404).json({ error: 'District not found' });

  const tx = await prisma.transaction.create({
    data: {
      userId: req.userId!,
      districtId: district.id,
      amount: parsed.data.amount,
      note: parsed.data.note,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
    },
  });
  res.status(201).json(tx);
});

transactionsRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const tx = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  await prisma.transaction.delete({ where: { id: tx.id } });
  res.status(204).send();
});

function nextMonth(monthISO: string): string {
  const [y, m] = monthISO.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
