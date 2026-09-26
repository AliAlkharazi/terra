import { Router } from 'express';
import { z } from 'zod';

export const aiRouter = Router();

type CatalogEntry = {
  keys: string[];
  label: string;
  price: number;
  low: number;
  high: number;
  note: string;
};

const CATALOG: CatalogEntry[] = [
  { keys: ['g class', 'g-class', 'gclass', 'g wagen', 'gwagen', 'mercedes g', 'amg g'], label: 'Mercedes G-Class', price: 145000, low: 120000, high: 250000, note: 'new entry model in Germany' },
  { keys: ['porsche 911', '911 carrera'], label: 'Porsche 911', price: 135000, low: 110000, high: 220000, note: 'new base Carrera' },
  { keys: ['tesla model 3', 'model 3'], label: 'Tesla Model 3', price: 42000, low: 38000, high: 55000, note: 'new base in Germany' },
  { keys: ['tesla model y', 'model y'], label: 'Tesla Model Y', price: 48000, low: 44000, high: 62000, note: 'new base in Germany' },
  { keys: ['bmw m3', 'm3'], label: 'BMW M3', price: 95000, low: 85000, high: 120000, note: 'new Competition' },
  { keys: ['golf gti', 'gti'], label: 'VW Golf GTI', price: 42000, low: 38000, high: 48000, note: 'new in Germany' },
  { keys: ['car', 'auto', 'wagen'], label: 'a car', price: 28000, low: 15000, high: 45000, note: 'typical new compact' },
  { keys: ['iphone 16', 'iphone'], label: 'iPhone', price: 999, low: 699, high: 1449, note: 'current model DE' },
  { keys: ['macbook'], label: 'MacBook', price: 1799, low: 1299, high: 3499, note: 'base range' },
  { keys: ['playstation 5', 'ps5'], label: 'PlayStation 5', price: 450, low: 400, high: 550, note: 'disc version' },
  { keys: ['rolex'], label: 'Rolex', price: 9000, low: 7000, high: 15000, note: 'retail entry' },
  { keys: ['vacation', 'urlaub'], label: 'a vacation', price: 1200, low: 600, high: 3000, note: '1-week trip' },
  { keys: ['yacht'], label: 'a yacht', price: 250000, low: 80000, high: 2000000, note: 'small cabin' },
  { keys: ['house', 'haus', 'apartment', 'wohnung'], label: 'a home', price: 350000, low: 180000, high: 800000, note: 'small city flat DE' },
  { keys: ['ebike', 'e-bike'], label: 'an e-bike', price: 2800, low: 1800, high: 4500, note: 'mid-range DE' },
  { keys: ['laptop'], label: 'a laptop', price: 900, low: 500, high: 1800, note: 'mid-range' },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function catalogLookup(item: string) {
  const hay = normalize(item);
  let best: { entry: CatalogEntry; score: number } | null = null;
  for (const entry of CATALOG) {
    for (const key of entry.keys) {
      const needle = normalize(key);
      if (hay === needle || hay.includes(needle) || needle.includes(hay)) {
        const score = needle.length;
        if (!best || score > best.score) best = { entry, score };
      }
    }
  }
  if (!best) return null;
  const { entry } = best;
  return {
    label: entry.label,
    price: entry.price,
    low: entry.low,
    high: entry.high,
    note: entry.note,
    source: 'catalog' as const,
  };
}

async function openAiEstimate(item: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You estimate typical current retail prices in Germany / the EU in euros. Reply ONLY with JSON: {"label":string,"price":number,"low":number,"high":number,"note":string}. price is the most common new or usual street price. If unknown, still give a best guess. Never invent currencies other than EUR numbers.',
        },
        {
          role: 'user',
          content: `What does this usually cost in euros right now: "${item}"`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { label?: string; price?: number; low?: number; high?: number; note?: string };
  if (!parsed.price || !Number.isFinite(parsed.price) || parsed.price <= 0) return null;
  return {
    label: parsed.label?.trim() || item,
    price: Math.round(parsed.price),
    low: Math.round(parsed.low ?? parsed.price * 0.8),
    high: Math.round(parsed.high ?? parsed.price * 1.3),
    note: parsed.note?.trim() || 'AI market estimate',
    source: 'ai' as const,
  };
}

const bodySchema = z.object({
  item: z.string().min(1).max(120),
});

aiRouter.post('/price', async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'item required' });
    return;
  }

  const item = parsed.data.item.trim();

  try {
    const ai = await openAiEstimate(item);
    if (ai) {
      res.json(ai);
      return;
    }
  } catch (err) {
    console.warn('[ai/price] OpenAI failed, using catalog', err instanceof Error ? err.message : err);
  }

  const local = catalogLookup(item);
  if (local) {
    res.json(local);
    return;
  }

  res.status(404).json({ error: 'no estimate', item });
});
