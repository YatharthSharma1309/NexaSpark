export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

export type Product = {
  id: string;
  sku: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  condition: string;
  subcategory?: string;
  modelName?: string;
  warrantyMonths?: number;
  specs: Record<string, string | number | boolean>;
  stockQuantity: number;
  images: string[];
};

export type CartLine = {
  productId: string;
  quantity: number;
  product: {
    id: string;
    sku: string;
    title: string;
    price: number;
    currency: string;
    stockQuantity: number;
    images: string[];
  } | null;
};

export type OrderLine = {
  productId: string | null;
  sku: string;
  title: string;
  price: number;
  quantity: number;
  modelName?: string;
  specsSnapshot: Record<string, unknown>;
};

export type Order = {
  id: string;
  status: string;
  subtotalAmount: number;
  discountAmount: number;
  couponCode: string;
  totalAmount: number;
  currency: string;
  lines: OrderLine[];
  createdAt?: string;
};

export type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  createdAt?: string;
  user: { id: string | null; name?: string; email?: string };
};

export type WishlistItem = {
  productId: string;
  product: {
    id: string;
    sku: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
  } | null;
};
