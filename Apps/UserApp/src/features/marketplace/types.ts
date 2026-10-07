export type HorseCategory = {
  _id: string;
  name: string;
  slug: string;
};

export type HorseSeller = {
  _id: string;
  name?: string;
  businessName?: string;
  phone: string;
};

export type Horse = {
  _id: string;
  seller: HorseSeller;
  category: HorseCategory;
  name?: string;
  breed: string;
  listingType?: 'sale' | 'lease';
  leaseRate?: number;
  leasePeriod?: string;
  priceNegotiable?: boolean;
  age?: number;
  gender?: 'mare' | 'stallion' | 'gelding';
  color?: string;
  height?: number;
  location?: string;
  discipline?: string;
  trainingLevel?: string;
  scopeOfWork?: string[];
  health?: { vaccinationStatus?: 'complete' | 'partial' | 'none' | 'unknown'; notes?: string };
  registration?: { registry?: string; number?: string };
  videos?: string[];
  price: number;
  description?: string;
  photos: string[];
  status: 'draft' | 'pending' | 'listed' | 'sold' | 'removed';
  createdAt: string;
};
