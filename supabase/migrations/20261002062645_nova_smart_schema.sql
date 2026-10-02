/*
# NOVA SMART — Smart Local Inventory & Order Reliability Platform

## Overview
Creates the full schema for NOVA CART's inventory and order reliability platform.
Three modules (Customer, Store Manager, NOVA CART Admin) share the same data.

## New Tables
1. `stores` — 620 partner stores across 3 Indian cities (grocery, pharmacy, bakery, stationery, other)
2. `products` — product catalog with category, brand, unit, MRP
3. `inventory` — per-store stock levels with freshness tracking (last_updated_at, freshness_status)
4. `orders` — customer orders with full lifecycle (pending → confirmed → picking → packed → out_for_delivery → delivered / cancelled)
5. `order_items` — line items within orders, with substitution tracking
6. `support_tickets` — customer support tickets linked to orders
7. `promotions` — promotional campaigns with budget/spend tracking
8. `daily_metrics` — aggregated daily business metrics for trend analysis

## Security
- RLS enabled on all tables.
- Policies use `TO anon, authenticated` since this is a single-tenant demo platform with role-based UI (no real auth; role is selected in the UI).
- All data is intentionally shared across the three modules.
*/

-- ============ STORES ============
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('grocery', 'pharmacy', 'bakery', 'stationery', 'other')),
  city text NOT NULL CHECK (city IN ('Mumbai', 'Delhi', 'Bengaluru')),
  area text NOT NULL,
  address text,
  phone text,
  rating numeric(2,1) DEFAULT 4.0,
  is_active boolean DEFAULT true,
  reliability_score numeric(4,1) DEFAULT 50.0,
  total_orders integer DEFAULT 0,
  cancellations integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_stores" ON stores;
CREATE POLICY "anon_read_stores" ON stores FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_stores" ON stores;
CREATE POLICY "anon_write_stores" ON stores FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_stores" ON stores;
CREATE POLICY "anon_update_stores" ON stores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('grocery', 'pharmacy', 'bakery', 'stationery', 'other')),
  brand text,
  unit text,
  mrp numeric(10,2) NOT NULL,
  image_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_products" ON products;
CREATE POLICY "anon_write_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ INVENTORY ============
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity integer NOT NULL DEFAULT 0,
  is_available boolean DEFAULT true,
  last_updated_at timestamptz DEFAULT now(),
  freshness_status text NOT NULL DEFAULT 'fresh' CHECK (freshness_status IN ('fresh', 'stale', 'critical')),
  selling_price numeric(10,2),
  UNIQUE(store_id, product_id)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_inventory" ON inventory;
CREATE POLICY "anon_read_inventory" ON inventory FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_inventory" ON inventory;
CREATE POLICY "anon_write_inventory" ON inventory FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_inventory" ON inventory;
CREATE POLICY "anon_update_inventory" ON inventory FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_inventory" ON inventory;
CREATE POLICY "anon_delete_inventory" ON inventory FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_inventory_store ON inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_freshness ON inventory(freshness_status);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picking', 'packed', 'out_for_delivery', 'delivered', 'cancelled')),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  items_count integer NOT NULL DEFAULT 0,
  delivery_address text,
  delivery_time_minutes integer,
  cancellation_reason text,
  payment_method text DEFAULT 'upi' CHECK (payment_method IN ('upi', 'card', 'cod', 'wallet')),
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  has_substitution boolean DEFAULT false,
  reliability_impact boolean DEFAULT false
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_orders" ON orders;
CREATE POLICY "anon_read_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_orders" ON orders;
CREATE POLICY "anon_write_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ============ ORDER ITEMS ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  line_total numeric(10,2) NOT NULL,
  substitution_status text NOT NULL DEFAULT 'none' CHECK (substitution_status IN ('none', 'substituted', 'out_of_stock')),
  substituted_with text
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_order_items" ON order_items;
CREATE POLICY "anon_write_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============ SUPPORT TICKETS ============
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text,
  category text DEFAULT 'general' CHECK (category IN ('general', 'delivery', 'product_quality', 'cancellation', 'refund', 'payment')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_tickets" ON support_tickets;
CREATE POLICY "anon_read_tickets" ON support_tickets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_tickets" ON support_tickets;
CREATE POLICY "anon_write_tickets" ON support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tickets" ON support_tickets;
CREATE POLICY "anon_update_tickets" ON support_tickets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ PROMOTIONS ============
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('discount', 'cashback', 'free_delivery', 'bogo')),
  value numeric(10,2) NOT NULL,
  code text UNIQUE,
  budget numeric(12,2) NOT NULL DEFAULT 0,
  spent numeric(12,2) NOT NULL DEFAULT 0,
  redemptions integer NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_promotions" ON promotions;
CREATE POLICY "anon_read_promotions" ON promotions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_promotions" ON promotions;
CREATE POLICY "anon_write_promotions" ON promotions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_promotions" ON promotions;
CREATE POLICY "anon_update_promotions" ON promotions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ DAILY METRICS ============
CREATE TABLE IF NOT EXISTS daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL UNIQUE,
  registered_users integer NOT NULL DEFAULT 0,
  active_users integer NOT NULL DEFAULT 0,
  monthly_orders integer NOT NULL DEFAULT 0,
  avg_order_value numeric(10,2) NOT NULL DEFAULT 0,
  monthly_revenue numeric(12,2) NOT NULL DEFAULT 0,
  repeat_purchase_rate numeric(4,1) NOT NULL DEFAULT 0,
  avg_delivery_time numeric(4,1) NOT NULL DEFAULT 0,
  cancellation_rate numeric(4,1) NOT NULL DEFAULT 0,
  support_tickets integer NOT NULL DEFAULT 0,
  promotional_spend numeric(12,2) NOT NULL DEFAULT 0,
  inventory_freshness_score numeric(4,1) DEFAULT 0,
  total_stores integer NOT NULL DEFAULT 0,
  active_stores integer NOT NULL DEFAULT 0
);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_metrics" ON daily_metrics;
CREATE POLICY "anon_read_metrics" ON daily_metrics FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_metrics" ON daily_metrics;
CREATE POLICY "anon_write_metrics" ON daily_metrics FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_metrics" ON daily_metrics;
CREATE POLICY "anon_update_metrics" ON daily_metrics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON daily_metrics(metric_date DESC);