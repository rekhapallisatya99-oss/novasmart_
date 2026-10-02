interface SimpleBarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
}

export function SimpleBarChart({ data, height = 180, color = '#0d9488', valueFormatter }: SimpleBarChartProps) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * (height - 30);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
              <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                {valueFormatter ? valueFormatter(d.value) : d.value}
              </div>
              <div
                className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${Math.max(barHeight, 2)}px`,
                  backgroundColor: color,
                }}
              />
              <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SimpleLineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
}

export function SimpleLineChart({ data, height = 200, color = '#0d9488', valueFormatter }: SimpleLineChartProps) {
  const width = 100;
  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - 30 - ((d.value - minVal) / range) * (height - 50);
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const areaD = pathD + ` L ${width} ${height - 30} L 0 ${height - 30} Z`;

  // Show every Nth label
  const labelInterval = Math.ceil(data.length / 8);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#lineGradient)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="0.8" fill={color} className="opacity-0 group-hover:opacity-100" />
            {i % labelInterval === 0 && (
              <text x={p.x} y={height - 10} textAnchor="middle" fontSize="3" fill="#94a3b8">
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-1 text-[10px] text-slate-400">
        <span>{valueFormatter ? valueFormatter(minVal) : minVal}</span>
        <span>{valueFormatter ? valueFormatter(maxVal) : maxVal}</span>
      </div>
    </div>
  );
}

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ segments, size = 160, centerLabel, centerValue }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((s, i) => {
            const dash = (s.value / total) * circumference;
            const circle = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-xl font-bold text-slate-900">{centerValue}</span>}
            {centerLabel && <span className="text-xs text-slate-400">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-slate-600">{s.label}</span>
            <span className="text-xs font-semibold text-slate-900 ml-auto">
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: string;
}

export function ProgressBar({ value, max, color = 'bg-teal-500', height = 'h-2' }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
