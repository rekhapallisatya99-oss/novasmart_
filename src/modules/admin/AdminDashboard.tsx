import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Users, ShoppingBag, IndianRupee, Clock,
  XCircle, TicketCheck, Megaphone, AlertTriangle, Store as StoreIcon,
  BarChart3,
} from 'lucide-react';
import { useAdminData, useInventoryStats } from '@/lib/hooks';
import { StatCard } from '@/components/StatCard';
import { SimpleLineChart, DonutChart, ProgressBar } from '@/components/Charts';
import {
  formatCurrency, formatNumber, formatFullNumber, formatDate, timeAgo,
  reliabilityColor, reliabilityBg, reliabilityLabel,
  orderStatusLabel, orderStatusColor, categoryColor, categoryLabel,
  ticketStatusColor, ticketStatusLabel, priorityColor,
  promotionTypeLabel,
} from '@/lib/utils';
import type { Order, Store, DailyMetric, SupportTicket, Promotion } from '@/types';

type AdminTab = 'overview' | 'reliability' | 'orders' | 'stores' | 'tickets' | 'promotions';

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const { metrics, stores, recentOrders, tickets, promotions, loading } = useAdminData();
  const { stats, byCity } = useInventoryStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const current = metrics[metrics.length - 1];
  const sixMonthsAgo = metrics[0];
  const last30Days = metrics.slice(-30);

  const tabs: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'reliability', label: 'Reliability', icon: AlertTriangle },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'stores', label: 'Stores', icon: StoreIcon },
    { id: 'tickets', label: 'Support', icon: TicketCheck },
    { id: 'promotions', label: 'Promotions', icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin border-b border-slate-200 -mb-px">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-teal-500 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <OverviewTab
          current={current}
          sixMonthsAgo={sixMonthsAgo}
          last30Days={last30Days}
          stores={stores}
          recentOrders={recentOrders}
          tickets={tickets}
          inventoryStats={stats}
        />
      )}
      {tab === 'reliability' && (
        <ReliabilityTab stores={stores} inventoryStats={stats} byCity={byCity} recentOrders={recentOrders} />
      )}
      {tab === 'orders' && <OrdersTab orders={recentOrders} />}
      {tab === 'stores' && <StoresTab stores={stores} />}
      {tab === 'tickets' && <TicketsTab tickets={tickets} />}
      {tab === 'promotions' && <PromotionsTab promotions={promotions} />}
    </div>
  );
}

function OverviewTab({ current, sixMonthsAgo, last30Days, stores, recentOrders, tickets, inventoryStats }: any) {
  const calcChange = (curr: number, old: number) => {
    if (old === 0) return 0;
    return ((curr - old) / old) * 100;
  };

  const openTickets = tickets.filter((t: SupportTicket) => t.status === 'open' || t.status === 'in_progress').length;
  const lowReliabilityStores = stores.filter((s: Store) => s.reliability_score < 50).length;

  // Revenue trend (last 30 days)
  const revenueData = last30Days.map((m: DailyMetric) => ({
    label: new Date(m.metric_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value: Math.round(m.monthly_revenue / 100000 * 10) / 10,
  }));

  const cancelData = last30Days.map((m: DailyMetric) => ({
    label: new Date(m.metric_date).toLocaleDateString('en-IN', { day: 'numeric' }),
    value: m.cancellation_rate,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Key metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Registered Users"
          value={formatFullNumber(current.registered_users)}
          change={calcChange(current.registered_users, sixMonthsAgo.registered_users)}
          changeLabel="vs 6 months ago"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Monthly Active Users"
          value={formatFullNumber(current.active_users)}
          change={calcChange(current.active_users, sixMonthsAgo.active_users)}
          changeLabel="vs 6 months ago"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label="Monthly Orders"
          value={formatFullNumber(current.monthly_orders)}
          change={calcChange(current.monthly_orders, sixMonthsAgo.monthly_orders)}
          changeLabel="vs 6 months ago"
          icon={<ShoppingBag className="w-5 h-5" />}
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(current.avg_order_value)}
          change={calcChange(current.avg_order_value, sixMonthsAgo.avg_order_value)}
          changeLabel="vs 6 months ago"
          icon={<IndianRupee className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(current.monthly_revenue)}
          change={calcChange(current.monthly_revenue, sixMonthsAgo.monthly_revenue)}
          changeLabel="vs 6 months ago"
          icon={<IndianRupee className="w-5 h-5" />}
          subValue={`₹${(current.monthly_revenue / 100000).toFixed(1)} lakh`}
        />
        <StatCard
          label="Repeat Purchase Rate"
          value={`${current.repeat_purchase_rate}%`}
          change={calcChange(current.repeat_purchase_rate, sixMonthsAgo.repeat_purchase_rate)}
          changeLabel="vs 6 months ago"
          invertChange
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <StatCard
          label="Avg Delivery Time"
          value={`${current.avg_delivery_time} min`}
          change={calcChange(current.avg_delivery_time, sixMonthsAgo.avg_delivery_time)}
          changeLabel="vs 6 months ago"
          invertChange
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label="Cancellation Rate"
          value={`${current.cancellation_rate}%`}
          change={calcChange(current.cancellation_rate, sixMonthsAgo.cancellation_rate)}
          changeLabel="vs 6 months ago"
          invertChange
          icon={<XCircle className="w-5 h-5" />}
        />
      </div>

      {/* Alert banner */}
      {(lowReliabilityStores > 0 || current.cancellation_rate > 8) && (
        <div className="card p-4 border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Reliability Concerns Detected</p>
              <p className="text-xs text-amber-700 mt-1">
                {lowReliabilityStores > 0 && `${lowReliabilityStores} stores have low reliability scores. `}
                {current.cancellation_rate > 8 && `Cancellation rate is ${current.cancellation_rate}%, above the 8% target. `}
                Inventory freshness is at {current.inventory_freshness_score}%.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Revenue Trend</h3>
            <span className="text-xs text-slate-400">Last 30 days (in ₹ lakh)</span>
          </div>
          <SimpleLineChart
            data={revenueData}
            height={220}
            color="#0d9488"
            valueFormatter={(v) => `₹${v.toFixed(1)}L`}
          />
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Cancellation Rate Trend</h3>
            <span className="text-xs text-slate-400">Last 30 days (%)</span>
          </div>
          <SimpleLineChart
            data={cancelData}
            height={220}
            color="#dc2626"
            valueFormatter={(v) => `${v.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Inventory freshness + comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <h3 className="section-title mb-4">Inventory Freshness</h3>
          <DonutChart
            segments={[
              { label: 'Fresh', value: inventoryStats.fresh, color: '#10b981' },
              { label: 'Stale', value: inventoryStats.stale, color: '#f59e0b' },
              { label: 'Critical', value: inventoryStats.critical, color: '#ef4444' },
            ]}
            centerValue={`${inventoryStats.total}`}
            centerLabel="Total Items"
          />
        </div>
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4">6-Month Comparison</h3>
          <div className="space-y-3">
            <ComparisonRow label="Registered Users" old={sixMonthsAgo.registered_users} current={current.registered_users} formatter={formatFullNumber} good="up" />
            <ComparisonRow label="Monthly Active Users" old={sixMonthsAgo.active_users} current={current.active_users} formatter={formatFullNumber} good="up" />
            <ComparisonRow label="Monthly Orders" old={sixMonthsAgo.monthly_orders} current={current.monthly_orders} formatter={formatFullNumber} good="up" />
            <ComparisonRow label="Avg Order Value" old={sixMonthsAgo.avg_order_value} current={current.avg_order_value} formatter={formatCurrency} good="up" />
            <ComparisonRow label="Monthly Revenue" old={sixMonthsAgo.monthly_revenue} current={current.monthly_revenue} formatter={(v) => `₹${(v / 100000).toFixed(1)}L`} good="up" />
            <ComparisonRow label="Repeat Purchase Rate" old={sixMonthsAgo.repeat_purchase_rate} current={current.repeat_purchase_rate} formatter={(v) => `${v}%`} good="up" />
            <ComparisonRow label="Avg Delivery Time" old={sixMonthsAgo.avg_delivery_time} current={current.avg_delivery_time} formatter={(v) => `${v} min`} good="down" />
            <ComparisonRow label="Cancellation Rate" old={sixMonthsAgo.cancellation_rate} current={current.cancellation_rate} formatter={(v) => `${v}%`} good="down" />
            <ComparisonRow label="Support Tickets" old={sixMonthsAgo.support_tickets} current={current.support_tickets} formatter={formatFullNumber} good="down" />
            <ComparisonRow label="Promotional Spend" old={sixMonthsAgo.promotional_spend} current={current.promotional_spend} formatter={(v) => `₹${(v / 100000).toFixed(1)}L`} good="down" />
          </div>
        </div>
      </div>

      {/* Recent orders + tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="section-title mb-4">Recent Orders</h3>
          <div className="space-y-2">
            {recentOrders.slice(0, 8).map((order: Order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{order.order_number}</p>
                  <p className="text-xs text-slate-400 truncate">{order.customer_name} • {order.store?.name}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(order.total_amount)}</span>
                  <span className={`badge ${orderStatusColor(order.status)}`}>{orderStatusLabel(order.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Support Tickets</h3>
            <span className="text-xs text-slate-400">{openTickets} open</span>
          </div>
          <div className="space-y-2">
            {tickets.slice(0, 8).map((ticket: SupportTicket) => (
              <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{ticket.subject}</p>
                  <p className="text-xs text-slate-400 truncate">{ticket.ticket_number} • {ticket.customer_name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${priorityColor(ticket.priority)}`}>{ticket.priority}</span>
                  <span className={`badge ${ticketStatusColor(ticket.status)}`}>{ticketStatusLabel(ticket.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({ label, old, current, formatter, good }: {
  label: string;
  old: number;
  current: number;
  formatter: (v: number) => string;
  good: 'up' | 'down';
}) {
  const diff = current - old;
  const isGood = good === 'up' ? diff > 0 : diff < 0;
  const isNeutral = diff === 0;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-400">{formatter(old)}</span>
        <span className="text-slate-300">→</span>
        <span className="text-sm font-semibold text-slate-900">{formatter(current)}</span>
        {diff !== 0 && (
          <span className={`text-xs font-medium ${isNeutral ? 'text-slate-400' : isGood ? 'text-emerald-600' : 'text-red-600'}`}>
            {diff > 0 ? '+' : ''}{good === 'up' ? `${((diff / old) * 100).toFixed(1)}%` : `${((diff / old) * 100).toFixed(1)}%`}
          </span>
        )}
      </div>
    </div>
  );
}

function ReliabilityTab({ stores, inventoryStats, byCity, recentOrders }: any) {
  const lowReliability = stores.filter((s: Store) => s.reliability_score < 50).sort((a: Store, b: Store) => a.reliability_score - b.reliability_score);
  const cancelledOrders = recentOrders.filter((o: Order) => o.status === 'cancelled').slice(0, 15);
  const substitutionOrders = recentOrders.filter((o: Order) => o.has_substitution).slice(0, 10);

  const freshPct = inventoryStats.total > 0 ? (inventoryStats.fresh / inventoryStats.total) * 100 : 0;
  const stalePct = inventoryStats.total > 0 ? (inventoryStats.stale / inventoryStats.total) * 100 : 0;
  const criticalPct = inventoryStats.total > 0 ? (inventoryStats.critical / inventoryStats.total) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Freshness overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <h3 className="section-title mb-4">Inventory Freshness Score</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50" fill="none" stroke="#10b981" strokeWidth="12"
                  strokeDasharray={`${freshPct * 3.14} 314`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">{freshPct.toFixed(0)}%</span>
                <span className="text-xs text-slate-400">Fresh</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-3 text-center">
              {inventoryStats.total.toLocaleString()} inventory items tracked
            </p>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Freshness Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Fresh (updated &lt; 12h)
                </span>
                <span className="text-sm font-semibold text-slate-900">{inventoryStats.fresh}</span>
              </div>
              <ProgressBar value={inventoryStats.fresh} max={inventoryStats.total} color="bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Stale (1-3 days)
                </span>
                <span className="text-sm font-semibold text-slate-900">{inventoryStats.stale}</span>
              </div>
              <ProgressBar value={inventoryStats.stale} max={inventoryStats.total} color="bg-amber-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical (3+ days)
                </span>
                <span className="text-sm font-semibold text-slate-900">{inventoryStats.critical}</span>
              </div>
              <ProgressBar value={inventoryStats.critical} max={inventoryStats.total} color="bg-red-500" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">By City</h3>
          <div className="space-y-3">
            {byCity.map((c: any) => {
              const total = c.fresh + c.stale + c.critical;
              const freshPct = total > 0 ? (c.fresh / total) * 100 : 0;
              return (
                <div key={c.city}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{c.city}</span>
                    <span className="text-xs text-slate-400">{freshPct.toFixed(0)}% fresh</span>
                  </div>
                  <ProgressBar value={c.fresh} max={total} color="bg-emerald-500" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Low reliability stores */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Low Reliability Stores</h3>
          <span className="text-xs text-slate-400">{lowReliability.length} stores need attention</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-medium">Store</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">City</th>
                <th className="pb-2 font-medium">Reliability</th>
                <th className="pb-2 font-medium">Orders</th>
                <th className="pb-2 font-medium">Cancellations</th>
                <th className="pb-2 font-medium">Cancel Rate</th>
              </tr>
            </thead>
            <tbody>
              {lowReliability.slice(0, 15).map((store: Store) => {
                const cancelRate = store.total_orders > 0 ? (store.cancellations / store.total_orders) * 100 : 0;
                return (
                  <tr key={store.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 font-medium text-slate-900">{store.name}</td>
                    <td className="py-2.5"><span className={`badge ${categoryColor(store.category)}`}>{categoryLabel(store.category)}</span></td>
                    <td className="py-2.5 text-slate-600">{store.city}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${reliabilityBg(store.reliability_score)}`} style={{ width: `${store.reliability_score}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${reliabilityColor(store.reliability_score)}`}>
                          {store.reliability_score.toFixed(0)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-600">{store.total_orders}</td>
                    <td className="py-2.5 text-slate-600">{store.cancellations}</td>
                    <td className="py-2.5">
                      <span className={cancelRate > 10 ? 'text-red-600 font-medium' : 'text-slate-600'}>
                        {cancelRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation reasons + substitutions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="section-title mb-4">Recent Cancelled Orders</h3>
          <div className="space-y-2">
            {cancelledOrders.length === 0 && <p className="text-sm text-slate-400">No recent cancellations</p>}
            {cancelledOrders.map((order: Order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{order.order_number}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {order.cancellation_reason || 'Unknown reason'}
                  </p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{formatCurrency(order.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="section-title mb-4">Orders with Substitutions</h3>
          <div className="space-y-2">
            {substitutionOrders.length === 0 && <p className="text-sm text-slate-400">No recent substitutions</p>}
            {substitutionOrders.map((order: Order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{order.order_number}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {order.customer_name} • {order.items_count} items affected
                  </p>
                </div>
                <span className="text-xs text-amber-600 font-medium flex-shrink-0">Substituted</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  const statuses = ['all', 'pending', 'confirmed', 'picking', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
              statusFilter === s ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s === 'all' ? 'All Orders' : orderStatusLabel(s as any)}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-medium">Order #</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Store</th>
                <th className="pb-2 font-medium">Items</th>
                <th className="pb-2 font-medium">Total</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order: Order) => (
                <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="py-2.5 font-medium text-slate-900">{order.order_number}</td>
                  <td className="py-2.5 text-slate-600">{order.customer_name}</td>
                  <td className="py-2.5 text-slate-600 truncate max-w-[160px]">{order.store?.name}</td>
                  <td className="py-2.5 text-slate-600">{order.items_count}</td>
                  <td className="py-2.5 font-medium text-slate-900">{formatCurrency(order.total_amount)}</td>
                  <td className="py-2.5"><span className={`badge ${orderStatusColor(order.status)}`}>{orderStatusLabel(order.status)}</span></td>
                  <td className="py-2.5 text-xs text-slate-400">{formatDate(order.created_at)}</td>
                  <td className="py-2.5">
                    <div className="flex gap-1">
                      {order.has_substitution && (
                        <span className="badge text-amber-700 bg-amber-50 border-amber-200" title="Has substitution">Sub</span>
                      )}
                      {order.reliability_impact && (
                        <span className="badge text-red-700 bg-red-50 border-red-200" title="Reliability impact">Imp</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StoresTab({ stores }: { stores: Store[] }) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  const filtered = stores.filter(s =>
    (categoryFilter === 'all' || s.category === categoryFilter) &&
    (cityFilter === 'all' || s.city === cityFilter)
  );

  const categories = ['all', 'grocery', 'pharmacy', 'bakery', 'stationery', 'other'];
  const cities = ['all', 'Mumbai', 'Delhi', 'Bengaluru'];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                categoryFilter === c ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c === 'all' ? 'All Categories' : c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {cities.map(c => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                cityFilter === c ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c === 'all' ? 'All Cities' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-medium">Store</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">City</th>
                <th className="pb-2 font-medium">Area</th>
                <th className="pb-2 font-medium">Rating</th>
                <th className="pb-2 font-medium">Reliability</th>
                <th className="pb-2 font-medium">Orders</th>
                <th className="pb-2 font-medium">Cancel Rate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((store: Store) => {
                const cancelRate = store.total_orders > 0 ? (store.cancellations / store.total_orders) * 100 : 0;
                return (
                  <tr key={store.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-slate-900">{store.name}</td>
                    <td className="py-2.5"><span className={`badge ${categoryColor(store.category)}`}>{categoryLabel(store.category)}</span></td>
                    <td className="py-2.5 text-slate-600">{store.city}</td>
                    <td className="py-2.5 text-slate-600">{store.area}</td>
                    <td className="py-2.5 text-slate-600">{store.rating.toFixed(1)} ★</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${reliabilityBg(store.reliability_score)}`} style={{ width: `${store.reliability_score}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${reliabilityColor(store.reliability_score)}`}>
                          {reliabilityLabel(store.reliability_score)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-600">{store.total_orders}</td>
                    <td className="py-2.5">
                      <span className={cancelRate > 10 ? 'text-red-600 font-medium' : 'text-slate-600'}>
                        {cancelRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TicketsTab({ tickets }: { tickets: SupportTicket[] }) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filtered = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === s ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s === 'all' ? 'All Tickets' : ticketStatusLabel(s)}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-medium">Ticket #</th>
                <th className="pb-2 font-medium">Subject</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Priority</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket: SupportTicket) => (
                <tr key={ticket.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="py-2.5 font-medium text-slate-900">{ticket.ticket_number}</td>
                  <td className="py-2.5 text-slate-700">{ticket.subject}</td>
                  <td className="py-2.5 text-slate-600">{ticket.customer_name}</td>
                  <td className="py-2.5 text-slate-600 capitalize">{ticket.category.replace('_', ' ')}</td>
                  <td className="py-2.5"><span className={`badge ${priorityColor(ticket.priority)}`}>{ticket.priority}</span></td>
                  <td className="py-2.5"><span className={`badge ${ticketStatusColor(ticket.status)}`}>{ticketStatusLabel(ticket.status)}</span></td>
                  <td className="py-2.5 text-xs text-slate-400">{timeAgo(ticket.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PromotionsTab({ promotions }: { promotions: Promotion[] }) {
  const totalBudget = promotions.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = promotions.reduce((sum, p) => sum + p.spent, 0);
  const totalRedemptions = promotions.reduce((sum, p) => sum + p.redemptions, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Budget" value={formatCurrency(totalBudget)} icon={<Megaphone className="w-5 h-5" />} />
        <StatCard label="Total Spent" value={formatCurrency(totalSpent)} subValue={`${((totalSpent / totalBudget) * 100).toFixed(0)}% of budget`} />
        <StatCard label="Total Redemptions" value={formatFullNumber(totalRedemptions)} icon={<TicketCheck className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotions.map((promo: Promotion) => {
          const utilization = (promo.spent / promo.budget) * 100;
          const isOver = utilization > 80;
          return (
            <div key={promo.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-slate-900">{promo.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{promotionTypeLabel(promo.type)}</span>
                    {promo.code && (
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{promo.code}</span>
                    )}
                  </div>
                </div>
                <span className={`badge ${promo.is_active ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-700 bg-slate-100 border-slate-200'}`}>
                  {promo.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <p className="text-slate-400">Budget</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(promo.budget)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Spent</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(promo.spent)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Redemptions</p>
                  <p className="font-semibold text-slate-900">{formatNumber(promo.redemptions)}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Budget utilization</span>
                  <span className={`text-xs font-semibold ${isOver ? 'text-amber-600' : 'text-slate-600'}`}>
                    {utilization.toFixed(0)}%
                  </span>
                </div>
                <ProgressBar
                  value={promo.spent}
                  max={promo.budget}
                  color={isOver ? 'bg-amber-500' : 'bg-teal-500'}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
