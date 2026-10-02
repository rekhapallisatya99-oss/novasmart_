import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  invertChange?: boolean;
  icon?: React.ReactNode;
  subValue?: string;
}

export function StatCard({ label, value, change, changeLabel, invertChange, icon, subValue }: StatCardProps) {
  const hasChange = change !== undefined;
  const isPositive = invertChange ? change! < 0 : change! > 0;
  const isNeutral = change === 0;

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5">{value}</p>
          {subValue && <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            {icon}
          </div>
        )}
      </div>
      {hasChange && (
        <div className="flex items-center gap-1.5 mt-3">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              isNeutral ? 'text-slate-500' : isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change!).toFixed(1)}%
          </span>
          {changeLabel && <span className="text-xs text-slate-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

interface StatCardMiniProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: string;
}

export function StatCardMini({ label, value, icon, accent = 'text-slate-900' }: StatCardMiniProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5">
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className={`text-lg font-bold ${accent} mt-1`}>{value}</p>
    </div>
  );
}
