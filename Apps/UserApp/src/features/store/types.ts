export type ProductCategory = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status?: string;
};

export type ProductSeller = {
  _id: string;
  name?: string;
  businessName?: string;
  phone: string;
};

// One buyable option of a product (a size, a colour...). Price falls back to the product's.
export type ProductVariant = {
  _id: string;
  label: string;
  price?: number | null;
  stock: number;
};

export type Product = {
  _id: string;
  seller: ProductSeller;
  category: ProductCategory;
  name: string;
  price: number;
  stock: number;
  variants?: ProductVariant[];
  ratingAverage?: number;
  ratingCount?: number;
  description?: string;
  photos: string[];
  status: 'draft' | 'active' | 'inactive';
  createdAt: string;
};

export type ProductReview = {
  _id: string;
  rating: number;
  comment?: string;
  buyer?: { name?: string };
  createdAt: string;
};

// Totals as the server will charge them (POST /store/cart/preview).
export type CartPreview = {
  subtotal: number;
  discount: number;
  gst?: { percent: number; amount: number };
  total: number;
  couponCode: string | null;
};

export type OrderItem = {
  product: { _id: string; name: string; price: number; photos?: string[] } | string;
  quantity: number;
  price: number;
  variantLabel?: string;
};

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export type Order = {
  _id: string;
  buyer: { _id: string; name?: string; phone: string };
  seller: ProductSeller;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  discount?: number;
  couponCode?: string;
  paymentMethod?: string;
  status: OrderStatus;
  statusHistory?: { status: OrderStatus; at: string; note?: string }[];
  courier?: { name?: string; trackingNumber?: string };
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
