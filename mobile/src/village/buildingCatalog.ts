import type { DistrictId } from '@/types';
import { BUILD_COST_MIN } from '@/engine/buildings';

export type BuildingShopTab = 'everyday' | 'city' | 'work' | 'life';

export type BuildingCatalogEntry = {
  id: string;
  label: string;
  tab: BuildingShopTab;
  /** Budget pocket this shop item opens (bank → vault, not placeable). */
  districtId?: DistrictId | 'vault';
  cost: number;
  blurb: string;
};

/** Clash-style shop catalog — labels match the buildings Ali asked for. */
export const BUILDING_CATALOG: BuildingCatalogEntry[] = [
  { id: 'diner', label: 'Diner', tab: 'everyday', districtId: 'dining', cost: BUILD_COST_MIN, blurb: 'Eating out' },
  { id: 'barn', label: 'Barn', tab: 'everyday', districtId: 'groceries', cost: BUILD_COST_MIN, blurb: 'Groceries & food' },
  { id: 'supermarket', label: 'Supermarket', tab: 'everyday', districtId: 'supermarket', cost: 25, blurb: 'Big weekly shop' },
  { id: 'train_station', label: 'Train Station', tab: 'everyday', districtId: 'transport', cost: BUILD_COST_MIN, blurb: 'Travel & commute' },
  { id: 'car_workshop', label: 'Car Workshop', tab: 'everyday', districtId: 'car_workshop', cost: 25, blurb: 'Car care & fuel' },
  { id: 'utility', label: 'Utility', tab: 'city', districtId: 'bills', cost: BUILD_COST_MIN, blurb: 'Power, water, phone' },
  { id: 'apartment', label: 'Apartment', tab: 'city', districtId: 'property', cost: BUILD_COST_MIN, blurb: 'Rent & home' },
  { id: 'bank', label: 'Bank', tab: 'city', districtId: 'vault', cost: 0, blurb: 'Main vault — always open' },
  { id: 'office', label: 'Office Building', tab: 'work', districtId: 'office', cost: 40, blurb: 'Work & income costs' },
  { id: 'factory', label: 'Factory', tab: 'work', districtId: 'factory', cost: 50, blurb: 'Tools & materials' },
  { id: 'mall', label: 'Mall', tab: 'work', districtId: 'mall', cost: 60, blurb: 'Shopping trips' },
  { id: 'cinema', label: 'Cinema', tab: 'life', districtId: 'cinema', cost: 20, blurb: 'Fun & nights out' },
  { id: 'library', label: 'Library', tab: 'life', districtId: 'library', cost: 15, blurb: 'Books & quiet time' },
  { id: 'school', label: 'School', tab: 'life', districtId: 'school', cost: 30, blurb: 'Kids & classes' },
  { id: 'university', label: 'University', tab: 'life', districtId: 'university', cost: 40, blurb: 'Studies & courses' },
  { id: 'hospital', label: 'Hospital', tab: 'life', districtId: 'hospital', cost: 35, blurb: 'Health & care' },
];

export const SHOP_TABS: { id: BuildingShopTab; label: string }[] = [
  { id: 'everyday', label: 'Everyday' },
  { id: 'city', label: 'City' },
  { id: 'work', label: 'Work' },
  { id: 'life', label: 'Life' },
];
