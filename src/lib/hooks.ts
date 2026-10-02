import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DailyMetric, Order, Store, SupportTicket, Promotion, InventoryItem } from '@/types';

export function useAdminData() {
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [metricsRes, storesRes, ordersRes, ticketsRes, promosRes] = await Promise.all([
          supabase.from('daily_metrics').select('*').order('metric_date', { ascending: true }),
          supabase.from('stores').select('*').order('reliability_score', { ascending: true }),
          supabase.from('orders').select(`*, store:stores(*)`).order('created_at', { ascending: false }).limit(50),
          supabase.from('support_tickets').select(`*, order:orders(*)`).order('created_at', { ascending: false }).limit(50),
          supabase.from('promotions').select('*').order('spent', { ascending: false }),
        ]);

        setMetrics(metricsRes.data as DailyMetric[] || []);
        setStores(storesRes.data as Store[] || []);
        setRecentOrders(ordersRes.data as Order[] || []);
        setTickets(ticketsRes.data as SupportTicket[] || []);
        setPromotions(promosRes.data as Promotion[] || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return { metrics, stores, recentOrders, tickets, promotions, loading, error };
}

export function useInventoryStats() {
  const [stats, setStats] = useState({ fresh: 0, stale: 0, critical: 0, total: 0 });
  const [byCity, setByCity] = useState<{ city: string; fresh: number; stale: number; critical: number }[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase
        .from('inventory')
        .select('freshness_status, store:stores(city)');

      if (!data) return;

      const counts = { fresh: 0, stale: 0, critical: 0, total: 0 };
      const cityMap: Record<string, { fresh: number; stale: number; critical: number }> = {};

      data.forEach((item: any) => {
        const fs = item.freshness_status;
        counts[fs as keyof typeof counts]++;
        counts.total++;

        const city = item.store?.city || 'Unknown';
        if (!cityMap[city]) cityMap[city] = { fresh: 0, stale: 0, critical: 0 };
        cityMap[city][fs as 'fresh' | 'stale' | 'critical']++;
      });

      setStats(counts);
      setByCity(Object.entries(cityMap).map(([city, vals]) => ({ city, ...vals })));
    }
    fetchStats();
  }, []);

  return { stats, byCity };
}

export function useStoreInventory(storeId: string | null) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) {
      setInventory([]);
      return;
    }

    async function fetchInventory() {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select(`*, product:products(*)`)
        .eq('store_id', storeId)
        .order('freshness_status', { ascending: false })
        .order('last_updated_at', { ascending: true });

      if (!error && data) {
        setInventory(data as unknown as InventoryItem[]);
      }
      setLoading(false);
    }
    fetchInventory();
  }, [storeId]);

  return { inventory, loading, setInventory };
}

export function useStoreOrders(storeId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) {
      setOrders([]);
      return;
    }

    async function fetchOrders() {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*)`)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setOrders(data as Order[]);
      }
      setLoading(false);
    }
    fetchOrders();
  }, [storeId]);

  return { orders, loading };
}
