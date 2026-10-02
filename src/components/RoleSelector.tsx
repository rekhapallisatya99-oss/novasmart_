import { useState } from 'react';
import { ShoppingBag, Store, LayoutDashboard, ArrowRight, Zap } from 'lucide-react';
import type { AppRole } from '@/types';

interface RoleSelectorProps {
  onSelect: (role: AppRole) => void;
}

const roles = [
  {
    id: 'customer' as AppRole,
    title: 'Customer',
    description: 'Browse stores, find products, place orders, and track deliveries in real-time.',
    icon: ShoppingBag,
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    features: ['Browse 180+ local stores', 'Live inventory & freshness indicators', 'Place & track orders', 'Reliability-aware shopping'],
  },
  {
    id: 'store_manager' as AppRole,
    title: 'Store Manager',
    description: 'Manage your store inventory, keep stock fresh, and fulfil incoming customer orders.',
    icon: Store,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    features: ['Inventory freshness tracking', 'Stock updates & pricing', 'Order fulfilment pipeline', 'Store reliability score'],
  },
  {
    id: 'admin' as AppRole,
    title: 'NOVA CART Admin',
    description: 'Monitor platform-wide metrics, reliability trends, and manage all stores and orders.',
    icon: LayoutDashboard,
    color: 'from-slate-700 to-slate-900',
    bgColor: 'bg-slate-100',
    iconColor: 'text-slate-700',
    features: ['Business intelligence dashboard', 'Reliability & cancellation analytics', 'Store & promotion management', 'Support ticket oversight'],
  },
];

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">NOVA SMART</h1>
            <p className="text-xs text-slate-500">Smart Local Inventory &amp; Order Reliability Platform</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100 text-teal-700 text-xs font-medium border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse-soft" />
            NOVA CART Platform
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mt-4 tracking-tight">
            Choose your experience
          </h2>
          <p className="text-slate-600 mt-3 text-lg">
            Three connected modules sharing the same data. Select a role to explore the platform.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {roles.map((role) => {
            const Icon = role.icon;
            const isHovered = hovered === role.id;
            return (
              <button
                key={role.id}
                onClick={() => onSelect(role.id)}
                onMouseEnter={() => setHovered(role.id)}
                onMouseLeave={() => setHovered(null)}
                className="group text-left card p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300 cursor-pointer relative overflow-hidden"
                style={{
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                }}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${role.color}`} />
                <div className={`w-12 h-12 rounded-xl ${role.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${role.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{role.title}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{role.description}</p>
                <ul className="mt-4 space-y-2">
                  {role.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${role.color}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1.5 mt-5 text-sm font-medium text-slate-700 group-hover:gap-3 transition-all">
                  Enter module
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Stats strip */}
        <div className="max-w-5xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          {[
            { label: 'Partner Stores', value: '180+' },
            { label: 'Registered Users', value: '1.2L' },
            { label: 'Monthly Orders', value: '38.5K' },
            { label: 'Cities', value: '3' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
