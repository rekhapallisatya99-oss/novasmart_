import { Zap, ShoppingBag, Store, LayoutDashboard, RefreshCw } from 'lucide-react';
import type { AppRole } from '@/types';

interface AppShellProps {
  role: AppRole;
  onSwitchRole: () => void;
  children: React.ReactNode;
}

const roleConfig: Record<AppRole, { title: string; subtitle: string; icon: typeof ShoppingBag }> = {
  customer: { title: 'Customer', subtitle: 'Shop from local stores', icon: ShoppingBag },
  store_manager: { title: 'Store Manager', subtitle: 'Manage inventory & orders', icon: Store },
  admin: { title: 'NOVA CART Admin', subtitle: 'Platform intelligence', icon: LayoutDashboard },
};

export function AppShell({ role, onSwitchRole, children }: AppShellProps) {
  const config = roleConfig[role];
  const RoleIcon = config.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4.5 h-4.5 text-white" fill="white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">NOVA SMART</h1>
              <p className="text-[11px] text-slate-500 leading-tight">Inventory &amp; Order Reliability Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
              <RoleIcon className="w-4 h-4 text-slate-600" />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{config.title}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{config.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onSwitchRole}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Switch role"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch Role</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="max-w-[1400px] mx-auto px-6 text-center text-xs text-slate-400">
          NOVA SMART — Smart Local Inventory &amp; Order Reliability Platform for NOVA CART
        </div>
      </footer>
    </div>
  );
}
