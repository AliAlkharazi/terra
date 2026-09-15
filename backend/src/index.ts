import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { districtsRouter } from './routes/districts';
import { transactionsRouter } from './routes/transactions';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/districts', districtsRouter);
app.use('/transactions', transactionsRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`Terra backend listening on http://localhost:${port}`));
