import { useState, useEffect } from 'react';
import {
  Store as StoreIcon, Package, ShoppingBag, AlertTriangle,
  CheckCircle, Clock, RefreshCw, TrendingUp, ChevronRight,
  Search, ArrowLeft, Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStoreInventory, useStoreOrders } from '@/lib/hooks';
import { updateInventoryFreshness, updateOrderStatus, batchRefreshInventory } from '@/lib/api';
import {
  formatCurrency, formatDate, formatDateTime, timeAgo,
  freshnessLabel, freshnessColor, freshnessHours,
  orderStatusLabel, orderStatusColor, categoryLabel, categoryColor,
  reliabilityColor, reliabilityBg, reliabilityLabel,
} from '@/lib/utils';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/Charts';
import type { Store, InventoryItem, Order } from '@/types';

export function StoreManagerModule() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStores() {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('reliability_score', { ascending: false });

      if (!error && data) {
        setStores(data as Store[]);
      }
      setLoading(false);
    }
    fetchStores();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedStore) {
    return <StorePicker stores={stores} onSelect={setSelectedStore} />;
  }

  return <StoreDashboard store={selectedStore} onBack={() => setSelectedStore(null)} />;
}

function StorePicker({ stores, onSelect }: { stores: Store[]; onSelect: (s: Store) => void }) {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');

  const filtered = stores.filter(s =>
    (cityFilter === 'all' || s.city === cityFilter) &&
    (search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.area.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Select Your Store</h2>
        <p className="text-sm text-slate-500 mt-1">Choose a store to manage its inventory and orders</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by store name or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'Mumbai', 'Delhi', 'Bengaluru'].map(c => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                cityFilter === c ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c === 'all' ? 'All Cities' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((store) => (
          <button
            key={store.id}
            onClick={() => onSelect(store)}
            className="card p-5 text-left hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <StoreIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{store.name}</h4>
                  <p className="text-xs text-slate-400">{store.city} • {store.area}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className={`badge ${categoryColor(store.category)}`}>{categoryLabel(store.category)}</span>
              <span className="text-xs text-slate-500">{store.rating.toFixed(1)} ★</span>
              <span className="text-xs text-slate-500">{store.total_orders} orders</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Reliability</span>
                <span className={`text-xs font-semibold ${reliabilityColor(store.reliability_score)}`}>
                  {reliabilityLabel(store.reliability_score)} ({store.reliability_score.toFixed(0)})
                </span>
              </div>
              <ProgressBar value={store.reliability_score} max={100} color={reliabilityBg(store.reliability_score)} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StoreDashboard({ store, onBack }: { store: Store; onBack: () => void }) {
  const [tab, setTab] = useState<'overview' | 'inventory' | 'orders'>('overview');
  const { inventory, loading: invLoading, setInventory } = useStoreInventory(store.id);
  const { orders, loading: ordersLoading } = useStoreOrders(store.id);

  const freshCount = inventory.filter(i => i.freshness_status === 'fresh').length;
  const staleCount = inventory.filter(i => i.freshness_status === 'stale').length;
  const criticalCount = inventory.filter(i => i.freshness_status === 'critical').length;
  const totalProducts = inventory.length;

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'picking');
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
    { id: 'inventory' as const, label: 'Inventory', icon: Package },
    { id: 'orders' as const, label: 'Orders', icon: ShoppingBag },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Store header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{store.name}</h2>
            <p className="text-sm text-slate-500">{store.city} • {store.area} • {categoryLabel(store.category)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${categoryColor(store.category)}`}>{categoryLabel(store.category)}</span>
          <span className="text-sm text-slate-500">{store.rating.toFixed(1)} ★</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 -mb-px">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <StoreOverview
          store={store}
          inventory={inventory}
          orders={orders}
          freshCount={freshCount}
          staleCount={staleCount}
          criticalCount={criticalCount}
          totalProducts={totalProducts}
          pendingOrders={pendingOrders.length}
          activeOrders={activeOrders.length}
          onRefreshInventory={async () => {
            const result = await batchRefreshInventory(store.id);
            if (result.success) {
              setInventory(inventory.map(i => ({ ...i, freshness_status: 'fresh', last_updated_at: new Date().toISOString() })));
            }
          }}
        />
      )}
      {tab === 'inventory' && (
        <InventoryManager
          store={store}
          inventory={inventory}
          loading={invLoading}
          onUpdateItem={async (id, qty, price) => {
            const result = await updateInventoryFreshness(id, qty, price);
            if (result.success) {
              setInventory(inventory.map(i =>
                i.id === id
                  ? { ...i, stock_quantity: qty, is_available: qty > 0, freshness_status: 'fresh', last_updated_at: new Date().toISOString(), selling_price: price ?? i.selling_price }
                  : i
              ));
            }
            return result;
          }}
          onBatchRefresh={async () => {
            const result = await batchRefreshInventory(store.id);
            if (result.success) {
              setInventory(inventory.map(i => ({ ...i, freshness_status: 'fresh', last_updated_at: new Date().toISOString() })));
            }
            return result;
          }}
        />
      )}
      {tab === 'orders' && (
        <OrderManager orders={orders} loading={ordersLoading} onUpdateStatus={updateOrderStatus} />
      )}
    </div>
  );
}

function StoreOverview({ store, inventory, orders, freshCount, staleCount, criticalCount, totalProducts, pendingOrders, activeOrders, onRefreshInventory }: any) {
  const cancelRate = store.total_orders > 0 ? (store.cancellations / store.total_orders) * 100 : 0;
  const freshnessPct = totalProducts > 0 ? (freshCount / totalProducts) * 100 : 0;

  const sortedByUrgency = [...inventory]
    .sort((a: InventoryItem, b: InventoryItem) => {
      const order = { critical: 0, stale: 1, fresh: 2 };
      return order[a.freshness_status] - order[b.freshness_status];
    })
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Reliability Score" value={store.reliability_score.toFixed(0)} subValue={reliabilityLabel(store.reliability_score)} icon={<Zap className="w-5 h-5" />} />
        <StatCard label="Total Products" value={totalProducts.toString()} icon={<Package className="w-5 h-5" />} />
        <StatCard label="Pending Orders" value={pendingOrders.toString()} icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Cancel Rate" value={`${cancelRate.toFixed(1)}%`} icon={<AlertTriangle className="w-5 h-5" />} invertChange />
      </div>

      {/* Freshness overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <h3 className="section-title mb-4">Inventory Freshness</h3>
          <div className="flex items-center justify-center py-3">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none" stroke={freshnessPct > 60 ? '#10b981' : freshnessPct > 30 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${freshnessPct * 3.14} 314`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{freshnessPct.toFixed(0)}%</span>
                <span className="text-[10px] text-slate-400">Fresh</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div>
              <p className="text-xs text-slate-400">Fresh</p>
              <p className="text-sm font-bold text-emerald-600">{freshCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Stale</p>
              <p className="text-sm font-bold text-amber-600">{staleCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Critical</p>
              <p className="text-sm font-bold text-red-600">{criticalCount}</p>
            </div>
          </div>
        </div>

        {/* Action panel */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={onRefreshInventory} className="btn-primary w-full">
              <RefreshCw className="w-4 h-4" />
              Refresh All Inventory ({staleCount + criticalCount} items)
            </button>
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-100">
              <p className="font-medium text-slate-600 mb-1">What does this do?</p>
              <p>Updates all stale and critical inventory items to "fresh" status, resetting their last-updated timestamp to now.</p>
            </div>
          </div>
        </div>

        {/* Store info */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Store Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Orders</span>
              <span className="text-sm font-semibold text-slate-900">{store.total_orders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Cancellations</span>
              <span className="text-sm font-semibold text-slate-900">{store.cancellations}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Cancellation Rate</span>
              <span className={`text-sm font-semibold ${cancelRate > 10 ? 'text-red-600' : 'text-slate-900'}`}>{cancelRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Customer Rating</span>
              <span className="text-sm font-semibold text-slate-900">{store.rating.toFixed(1)} ★</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Active Orders</span>
              <span className="text-sm font-semibold text-slate-900">{activeOrders}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent inventory items */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Items Needing Attention</h3>
        {sortedByUrgency.filter((i: InventoryItem) => i.freshness_status !== 'fresh').length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600 py-4">
            <CheckCircle className="w-5 h-5" />
            All inventory items are fresh and up to date.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedByUrgency.filter((i: InventoryItem) => i.freshness_status !== 'fresh').map((item: InventoryItem) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.product?.name}</p>
                    <p className="text-xs text-slate-400">Stock: {item.stock_quantity} • Updated {freshnessHours(item.last_updated_at)}h ago</p>
                  </div>
                </div>
                <span className={`badge ${freshnessColor(item.freshness_status)} flex-shrink-0`}>
                  {freshnessLabel(item.freshness_status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryManager({ store, inventory, loading, onUpdateItem, onBatchRefresh }: any) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = inventory.filter((item: InventoryItem) => {
    const matchSearch = search === '' || item.product?.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || item.freshness_status === filter;
    return matchSearch && matchFilter;
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaving(true);
    const qty = parseInt(editQty) || 0;
    const price = editPrice ? parseFloat(editPrice) : undefined;
    const result = await onUpdateItem(editingItem.id, qty, price);
    setSaving(false);
    if (result.success) {
      showToast('Inventory updated successfully');
      setEditingItem(null);
    } else {
      showToast(result.error || 'Failed to update');
    }
  };

  const handleBatchRefresh = async () => {
    setRefreshing(true);
    const result = await onBatchRefresh();
    setRefreshing(false);
    if (result.success) {
      showToast(`Refreshed ${result.refreshed} inventory items`);
    } else {
      showToast('Failed to refresh inventory');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-20 right-6 z-30 card px-4 py-3 flex items-center gap-2 animate-slide-up shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-slate-700">{toast}</span>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'fresh', 'stale', 'critical'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${
                filter === f ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={handleBatchRefresh} disabled={refreshing} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </button>
      </div>

      <div className="card p-5">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Brand</th>
                <th className="pb-2 font-medium">Stock</th>
                <th className="pb-2 font-medium">Price</th>
                <th className="pb-2 font-medium">Freshness</th>
                <th className="pb-2 font-medium">Last Updated</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: InventoryItem) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="py-2.5 font-medium text-slate-900">{item.product?.name}</td>
                  <td className="py-2.5 text-slate-600">{item.product?.brand}</td>
                  <td className="py-2.5">
                    <span className={item.stock_quantity === 0 ? 'text-red-600 font-medium' : 'text-slate-600'}>
                      {item.stock_quantity}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600">{item.selling_price ? formatCurrency(item.selling_price) : '—'}</td>
                  <td className="py-2.5">
                    <span className={`badge ${freshnessColor(item.freshness_status)}`}>
                      {freshnessLabel(item.freshness_status)}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-slate-400">{timeAgo(item.last_updated_at)}</td>
                  <td className="py-2.5">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setEditQty(item.stock_quantity.toString());
                        setEditPrice(item.selling_price?.toString() || '');
                      }}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Update Inventory</h3>
            <p className="text-sm text-slate-500 mb-4">{editingItem.product?.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Stock Quantity</label>
                <input
                  type="number"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="input-field"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Selling Price (₹)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                <p className="text-xs text-teal-700">
                  Updating stock will reset this item's freshness to "Fresh" and update the timestamp to now.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setEditingItem(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderManager({ orders, loading, onUpdateStatus }: any) {
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = statusFilter === 'active'
    ? orders.filter((o: Order) => o.status !== 'delivered' && o.status !== 'cancelled')
    : statusFilter === 'all'
    ? orders
    : orders.filter((o: Order) => o.status === statusFilter);

  const handleUpdate = async (orderId: string, status: string) => {
    setUpdating(orderId);
    await onUpdateStatus(orderId, status);
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statuses = ['active', 'all', 'pending', 'confirmed', 'picking', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
              statusFilter === s ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s === 'all' ? 'All Orders' : s === 'active' ? 'Active Orders' : orderStatusLabel(s as any)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card p-8 text-center">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No orders found</p>
          </div>
        )}
        {filtered.map((order: Order) => (
          <div key={order.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-slate-900">{order.order_number}</span>
                  <span className={`badge ${orderStatusColor(order.status)}`}>{orderStatusLabel(order.status)}</span>
                  {order.has_substitution && (
                    <span className="badge text-amber-700 bg-amber-50 border-amber-200">Substitution</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Customer</p>
                    <p className="font-medium text-slate-700">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Items</p>
                    <p className="font-medium text-slate-700">{order.items_count}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total</p>
                    <p className="font-medium text-slate-700">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Ordered</p>
                    <p className="font-medium text-slate-700">{formatDateTime(order.created_at)}</p>
                  </div>
                </div>
                {order.order_items && order.order_items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-1.5">Items:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {order.order_items.slice(0, 5).map((item, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded bg-slate-50 text-slate-600 border border-slate-100">
                          {item.quantity}× {item.product_name}
                          {item.substitution_status !== 'none' && (
                            <span className={`ml-1 ${item.substitution_status === 'out_of_stock' ? 'text-red-600' : 'text-amber-600'}`}>
                              ({item.substitution_status === 'out_of_stock' ? 'OOS' : 'Sub'})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status update controls */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {order.status === 'pending' && (
                  <button onClick={() => handleUpdate(order.id, 'confirmed')} disabled={updating === order.id} className="btn-primary text-xs px-3 py-1.5">
                    {updating === order.id ? '...' : 'Confirm'}
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button onClick={() => handleUpdate(order.id, 'picking')} disabled={updating === order.id} className="btn-primary text-xs px-3 py-1.5">
                    {updating === order.id ? '...' : 'Start Picking'}
                  </button>
                )}
                {order.status === 'picking' && (
                  <button onClick={() => handleUpdate(order.id, 'packed')} disabled={updating === order.id} className="btn-primary text-xs px-3 py-1.5">
                    {updating === order.id ? '...' : 'Pack Order'}
                  </button>
                )}
                {order.status === 'packed' && (
                  <button onClick={() => handleUpdate(order.id, 'out_for_delivery')} disabled={updating === order.id} className="btn-primary text-xs px-3 py-1.5">
                    {updating === order.id ? '...' : 'Dispatch'}
                  </button>
                )}
                {order.status === 'out_for_delivery' && (
                  <button onClick={() => handleUpdate(order.id, 'delivered')} disabled={updating === order.id} className="btn-primary text-xs px-3 py-1.5">
                    {updating === order.id ? '...' : 'Mark Delivered'}
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'confirmed') && (
                  <button onClick={() => handleUpdate(order.id, 'cancelled')} disabled={updating === order.id} className="btn-danger text-xs px-3 py-1.5">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
