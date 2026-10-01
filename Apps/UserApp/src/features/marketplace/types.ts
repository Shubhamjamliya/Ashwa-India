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
  breed: string;
  age?: number;
  gender?: 'mare' | 'stallion' | 'gelding';
  color?: string;
  height?: number;
  location?: string;
  price: number;
  description?: string;
  photos: string[];
  status: 'draft' | 'pending' | 'listed' | 'sold' | 'removed';
  createdAt: string;
};
