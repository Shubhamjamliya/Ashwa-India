export type ProductCategory = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
};

export type ProductSeller = {
  _id: string;
  name?: string;
  businessName?: string;
  phone: string;
};

export type Product = {
  _id: string;
  seller: ProductSeller;
  category: ProductCategory;
  name: string;
  price: number;
  stock: number;
  description?: string;
  photos: string[];
  status: 'draft' | 'active' | 'inactive';
  createdAt: string;
};

export type OrderItem = {
  product: { _id: string; name: string; price: number } | string;
  quantity: number;
  price: number;
};

export type Order = {
  _id: string;
  buyer: { _id: string; name?: string; phone: string };
  seller: ProductSeller;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  shippingAddress?: {
    label?: string;
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
  createdAt: string;
};
