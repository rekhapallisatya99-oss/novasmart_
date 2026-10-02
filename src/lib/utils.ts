import type { FreshnessStatus, OrderStatus, StoreCategory } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 100000) {
    return (num / 100000).toFixed(1) + 'L';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatFullNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHrs > 0) return `${diffHrs}h ago`;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

export function freshnessLabel(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh': return 'Fresh';
    case 'stale': return 'Stale';
    case 'critical': return 'Critical';
  }
}

export function freshnessColor(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'stale': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'critical': return 'text-red-700 bg-red-50 border-red-200';
  }
}

export function freshnessHours(date: string): number {
  const now = new Date();
  const past = new Date(date);
  return Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
}

export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    picking: 'Picking',
    packed: 'Packed',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

export function orderStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending': return 'text-slate-700 bg-slate-100 border-slate-200';
    case 'confirmed': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'picking': return 'text-cyan-700 bg-cyan-50 border-cyan-200';
    case 'packed': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'out_for_delivery': return 'text-violet-700 bg-violet-50 border-violet-200';
    case 'delivered': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
  }
}

export function categoryLabel(category: StoreCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function categoryColor(category: StoreCategory): string {
  switch (category) {
    case 'grocery': return 'text-green-700 bg-green-50 border-green-200';
    case 'pharmacy': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'bakery': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'stationery': return 'text-cyan-700 bg-cyan-50 border-cyan-200';
    case 'other': return 'text-slate-700 bg-slate-100 border-slate-200';
  }
}

export function reliabilityColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

export function reliabilityBg(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function reliabilityLabel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

export function ticketStatusLabel(status: string): string {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function ticketStatusColor(status: string): string {
  switch (status) {
    case 'open': return 'text-red-700 bg-red-50 border-red-200';
    case 'in_progress': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'resolved': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'closed': return 'text-slate-700 bg-slate-100 border-slate-200';
    default: return 'text-slate-700 bg-slate-100 border-slate-200';
  }
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'text-red-700 bg-red-50 border-red-200';
    case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'low': return 'text-slate-700 bg-slate-100 border-slate-200';
    default: return 'text-slate-700 bg-slate-100 border-slate-200';
  }
}

export function promotionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    discount: 'Discount',
    cashback: 'Cashback',
    free_delivery: 'Free Delivery',
    bogo: 'Buy 1 Get 1',
  };
  return labels[type] || type;
}
