// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_trending: boolean;
  rating: number;
  review_count: number;
  brand: string | null;
  in_stock: boolean;
  discount_percentage: number;
  category: Category;
  category_id: number;
  created_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductFilters {
  page?: number;
  page_size?: number;
  category_id?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: 'price' | 'rating' | 'created_at' | 'name';
  sort_order?: 'asc' | 'desc';
  featured?: boolean;
  trending?: boolean;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  subtotal: number;
  product: Product;
  created_at: string;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total: number;
  item_count: number;
  created_at: string;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Payment {
  id: number;
  payment_method: string;
  status: PaymentStatus;
  amount: number;
  transaction_id: string | null;
  card_last_four: string | null;
  failure_reason: string | null;
  processed_at: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string | null;
  shipping_zip: string;
  shipping_country: string;
  notes: string | null;
  items: OrderItem[];
  payment: Payment | null;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
}

export interface ShippingDetails {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zip_code: string;
  country: string;
}

export interface CreateOrderRequest {
  shipping: ShippingDetails;
  payment_method: string;
  card_last_four?: string;
  notes?: string;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string | { msg: string; type: string }[];
  message?: string;
}
