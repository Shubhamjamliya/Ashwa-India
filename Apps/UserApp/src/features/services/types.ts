export type CatalogService = {
  key: string;
  name: string;
  description?: string;
  image?: string;
};

export type PriceUnit = 'visit' | 'hour' | 'day' | 'job';

export type ProviderSummary = {
  id: string;
  businessName?: string;
  description?: string;
  gallery?: string[];
  rating?: { average: number; count: number };
  price?: { amount: number; unit: PriceUnit };
  distanceKm?: number | null;
};

export type ProviderPricing = {
  serviceKey: string;
  amount: number;
  unit: PriceUnit;
  note?: string;
};

export type ProviderDetail = {
  id: string;
  businessName?: string;
  description?: string;
  experienceYears: number;
  rating: { average: number; count: number };
  serviceTypes: string[];
  gallery?: string[];
  pricing?: ProviderPricing[];
  certifications?: string;
  serviceZones?: { id: string; name: string }[];
  location?: string;
  phone?: string;
  email?: string;
};

export type ProviderReview = {
  id: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export const UNIT_LABEL: Record<PriceUnit, string> = {
  visit: 'per visit',
  hour: 'per hour',
  day: 'per day',
  job: 'per job',
};
