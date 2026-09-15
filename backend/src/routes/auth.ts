import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';

export const authRouter = Router();

const DEFAULT_DISTRICTS = [
  { key: 'dining', label: 'Dining', icon: '🍜', monthlyBudget: 250 },
  { key: 'groceries', label: 'Groceries', icon: '🥬', monthlyBudget: 350 },
  { key: 'transport', label: 'Transport', icon: '🚇', monthlyBudget: 120 },
  { key: 'entertainment', label: 'Entertainment', icon: '🎭', monthlyBudget: 100 },
  { key: 'shopping', label: 'Shopping', icon: '🛍️', monthlyBudget: 150 },
  { key: 'subscriptions', label: 'Subscriptions', icon: '📡', monthlyBudget: 60 },
  { key: 'other', label: 'Other', icon: '🌾', monthlyBudget: 100 },
];

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

authRouter.post('/register', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash, districts: { create: DEFAULT_DISTRICTS } } });
  res.status(201).json({ token: signToken(user.id), userId: user.id });
});

authRouter.post('/login', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user.id), userId: user.id });
});

function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
}
