export type MarketEstimate = {
  label: string;
  price: number;
  low: number;
  high: number;
  note: string;
  source: 'catalog' | 'ai';
};

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
  { keys: ['used car', 'gebrauchtwagen'], label: 'used car', price: 12000, low: 3000, high: 25000, note: 'typical small used car' },
  { keys: ['car', 'auto', 'wagen'], label: 'a car', price: 28000, low: 15000, high: 45000, note: 'typical new compact' },

  { keys: ['iphone 16 pro', 'iphone 16'], label: 'iPhone 16', price: 999, low: 899, high: 1449, note: 'new unlocked DE' },
  { keys: ['iphone 15', 'iphone'], label: 'iPhone', price: 899, low: 699, high: 1299, note: 'current model DE' },
  { keys: ['macbook pro', 'macbook'], label: 'MacBook', price: 1799, low: 1299, high: 3499, note: 'base Pro / Air range' },
  { keys: ['ipad pro', 'ipad'], label: 'iPad', price: 799, low: 449, high: 1499, note: 'current range' },
  { keys: ['airpods', 'airpod'], label: 'AirPods', price: 179, low: 149, high: 299, note: 'Pro / standard' },
  { keys: ['playstation 5', 'ps5'], label: 'PlayStation 5', price: 450, low: 400, high: 550, note: 'disc version' },
  { keys: ['nintendo switch', 'switch'], label: 'Nintendo Switch', price: 320, low: 280, high: 380, note: 'OLED' },

  { keys: ['rolex', 'submariner'], label: 'Rolex', price: 9000, low: 7000, high: 15000, note: 'retail entry sports' },
  { keys: ['apple watch', 'watch'], label: 'Apple Watch', price: 449, low: 299, high: 899, note: 'Series / Ultra' },

  { keys: ['vacation', 'holiday', 'urlaub', 'mallorca', 'bali'], label: 'a vacation', price: 1200, low: 600, high: 3000, note: '1-week trip for one' },
  { keys: ['flight', 'flug'], label: 'a flight', price: 180, low: 60, high: 600, note: 'Europe return' },
  { keys: ['concert', 'konzert', 'festival'], label: 'a concert ticket', price: 85, low: 40, high: 250, note: 'arena show' },

  { keys: ['laptop'], label: 'a laptop', price: 900, low: 500, high: 1800, note: 'mid-range' },
  { keys: ['gaming pc', 'pc'], label: 'a gaming PC', price: 1400, low: 900, high: 2500, note: 'mid tower' },
  { keys: ['bike', 'fahrrad', 'bicycle'], label: 'a bike', price: 650, low: 300, high: 1500, note: 'city / hybrid' },
  { keys: ['ebike', 'e-bike'], label: 'an e-bike', price: 2800, low: 1800, high: 4500, note: 'mid-range DE' },

  { keys: ['sneakers', 'sneaker', 'jordan', 'yeezy'], label: 'sneakers', price: 140, low: 80, high: 250, note: 'hype / sports' },
  { keys: ['shoes', 'schuhe'], label: 'shoes', price: 90, low: 50, high: 180, note: 'everyday' },
  { keys: ['handbag', 'bag', 'tasche'], label: 'a bag', price: 120, low: 40, high: 800, note: 'fashion bag' },
  { keys: ['jacket', 'jacke'], label: 'a jacket', price: 110, low: 50, high: 400, note: 'winter / fashion' },

  { keys: ['sofa', 'couch'], label: 'a sofa', price: 900, low: 400, high: 2500, note: 'living room' },
  { keys: ['mattress', 'matratze'], label: 'a mattress', price: 500, low: 250, high: 1200, note: 'queen' },
  { keys: ['washing machine', 'waschmaschine'], label: 'a washing machine', price: 450, low: 300, high: 900, note: 'mid-range' },

  { keys: ['yacht', 'segelboot', 'boot'], label: 'a yacht', price: 250000, low: 80000, high: 2000000, note: 'small cabin / used' },
  { keys: ['house', 'haus', 'apartment', 'wohnung'], label: 'a home', price: 350000, low: 180000, high: 800000, note: 'small city flat DE' },
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

export function lookupCatalogPrice(item: string): MarketEstimate | null {
  const hay = normalize(item);
  if (!hay) return null;

  let best: { entry: CatalogEntry; score: number } | null = null;
  for (const entry of CATALOG) {
    for (const key of entry.keys) {
      const needle = normalize(key);
      if (!needle) continue;
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
    source: 'catalog',
  };
}
