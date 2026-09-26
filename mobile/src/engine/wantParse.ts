import type { DistrictId } from '@/types';

export type WantParse = {
  item: string;
  amount: number | null;
};

const STOP = new Set(
  'i me my want wanna buy get a an the some new please can i afford this that for of to do you we us could would like need kaufen kann ich mir neue ein eine den die das euro euros eur'.split(
    ' '
  )
);

const AMOUNT_RE =
  /(?:€\s*(\d+(?:[.,]\d{1,2})?))|(?:(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|euro|euros))|(?:(?:for|für)\s*(\d+(?:[.,]\d{1,2})?))/gi;

export function parseWant(raw: string): WantParse {
  const text = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!text) return { item: '', amount: null };

  let amount: number | null = null;
  const cleaned = text.replace(AMOUNT_RE, (...args) => {
    const groups = args.slice(1, 4) as Array<string | undefined>;
    const num = groups.find(Boolean);
    if (num && amount == null) amount = Number(num.replace(',', '.'));
    return ' ';
  });

  const item = cleaned
    .split(/[^a-zäöüß0-9]+/i)
    .filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w))
    .join(' ')
    .trim();

  return { item: item || 'this', amount };
}

type Family = {
  key: string;
  districtId: DistrictId;
  prior: number;
  words: string[];
};

export const FAMILIES: Family[] = [
  { key: 'shoes', districtId: 'dining', prior: 89, words: ['shoe', 'shoes', 'sneaker', 'sneakers', 'trainer', 'trainers', 'boot', 'boots', 'nike', 'adidas', 'schuhe'] },
  { key: 'clothes', districtId: 'dining', prior: 45, words: ['jacket', 'hoodie', 'shirt', 'jeans', 'coat', 'clothes', 'kleidung'] },
  { key: 'coffee', districtId: 'dining', prior: 3.6, words: ['coffee', 'kaffee', 'latte', 'espresso'] },
  { key: 'eating', districtId: 'dining', prior: 16, words: ['lunch', 'dinner', 'pizza', 'diner', 'takeaway', 'restaurant', 'essen', 'essen gehen'] },
  { key: 'groceries', districtId: 'groceries', prior: 42, words: ['groceries', 'rewe', 'aldi', 'food', 'einkauf', 'supermarket'] },
  { key: 'travel', districtId: 'transport', prior: 12, words: ['train', 'bus', 'uber', 'taxi', 'ticket', 'pass', 'flug', 'travel'] },
  { key: 'home', districtId: 'property', prior: 40, words: ['rent', 'ikea', 'lamp', 'furniture', 'miete'] },
  { key: 'bills', districtId: 'bills', prior: 30, words: ['bill', 'phone', 'electric', 'internet', 'versicherung'] },
];

export function guessFamily(item: string) {
  const hay = item.toLowerCase();
  return FAMILIES.find((f) => f.words.some((w) => hay.includes(w))) ?? null;
}
