import { api } from '@/api/client';
import { lookupCatalogPrice, type MarketEstimate } from './marketPrice';

export async function estimateMarketPrice(item: string): Promise<MarketEstimate | null> {
  const cleaned = item.trim();
  if (!cleaned || cleaned === 'this') return null;

  try {
    const remote = await api.estimatePrice(cleaned);
    if (remote?.price > 0) {
      return {
        label: remote.label,
        price: remote.price,
        low: remote.low,
        high: remote.high,
        note: remote.note,
        source: remote.source,
      };
    }
  } catch {
    // use catalog
  }

  return lookupCatalogPrice(cleaned);
}
