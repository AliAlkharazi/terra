import type { MoneyLock } from '@/types';

const MS_DAY = 86_400_000;

export function unlockAtFromDays(days: number, now = Date.now()): string {
  return new Date(now + Math.max(1, days) * MS_DAY).toISOString();
}

export function isLockActive(lock: MoneyLock, now = Date.now()): boolean {
  return Date.parse(lock.unlockAt) > now && lock.amount > 0;
}

export function activeLocks(locks: MoneyLock[] | undefined, now = Date.now()): MoneyLock[] {
  return (locks ?? []).filter((lock) => isLockActive(lock, now));
}

export function lockedTotal(locks: MoneyLock[] | undefined, now = Date.now()): number {
  return Math.round(activeLocks(locks, now).reduce((sum, lock) => sum + lock.amount, 0) * 100) / 100;
}

export function daysLeft(lock: MoneyLock, now = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(lock.unlockAt) - now) / MS_DAY));
}
