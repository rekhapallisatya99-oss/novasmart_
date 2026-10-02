export type StoreCategory = 'grocery' | 'pharmacy' | 'bakery' | 'stationery' | 'other';
export type City = 'Mumbai' | 'Delhi' | 'Bengaluru';
export type FreshnessStatus = 'fresh' | 'stale' | 'critical';
export type OrderStatus = 'pending' | 'confirmed' | 'picking' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SubstitutionStatus = 'none' | 'substituted' | 'out_of_stock';
export type PromotionType = 'discount' | 'cashback' | 'free_delivery' | 'bogo';
export type AppRole = 'customer' | 'store_manager' | 'admin';

export interface Store {
  id: string;
  name: string;
  category: StoreCategory;
  city: City;
  area: string;
  address: string | null;
  phone: string | null;
  rating: number;
  is_active: boolean;
  reliability_score: number;
  total_orders: number;
  cancellations: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: StoreCategory;
  brand: string | null;
  unit: string | null;
  mrp: number;
  image_url: string | null;
  description: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  store_id: string;
  product_id: string;
  stock_quantity: number;
  is_available: boolean;
  last_updated_at: string;
  freshness_status: FreshnessStatus;
  selling_price: number | null;
  product?: Product;
  store?: Store;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  store_id: string;
  status: OrderStatus;
  total_amount: number;
  items_count: number;
  delivery_address: string | null;
  delivery_time_minutes: number | null;
  cancellation_reason: string | null;
  payment_method: string;
  created_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  has_substitution: boolean;
  reliability_impact: boolean;
  store?: Store;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  substitution_status: SubstitutionStatus;
  substituted_with: string | null;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  customer_name: string;
  order_id: string | null;
  subject: string;
  description: string | null;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  resolved_at: string | null;
  order?: Order;
}

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  value: number;
  code: string | null;
  budget: number;
  spent: number;
  redemptions: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  store_id: string | null;
  created_at: string;
}

export interface DailyMetric {
  id: string;
  metric_date: string;
  registered_users: number;
  active_users: number;
  monthly_orders: number;
  avg_order_value: number;
  monthly_revenue: number;
  repeat_purchase_rate: number;
  avg_delivery_time: number;
  cancellation_rate: number;
  support_tickets: number;
  promotional_spend: number;
  inventory_freshness_score: number;
  total_stores: number;
  active_stores: number;
}
