import type { Horse } from './types';

// Lease listings show their own rate and period; sale listings show the sale price.
export function priceLabel(horse: Pick<Horse, 'listingType' | 'leaseRate' | 'leasePeriod' | 'price'>) {
  if (horse.listingType === 'lease') {
    return `₹${(horse.leaseRate ?? 0).toLocaleString('en-IN')} / ${horse.leasePeriod || 'month'}`;
  }
  return `₹${(horse.price ?? 0).toLocaleString('en-IN')}`;
}
