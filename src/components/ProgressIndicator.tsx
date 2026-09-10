export interface ProgressIndicatorProps {
  value: number; // 0-100
  label?: string;
  color?: 'success' | 'warning' | 'danger' | 'neutral';
  animated?: boolean;
  showLabel?: boolean;
}

const colorMap = {
  success: 'bg-entrada',
  warning: 'bg-diario',
  danger: 'bg-saida',
  neutral: 'bg-gray-500',
};

export function ProgressIndicator({
  value,
  label,
  color = 'success',
  animated = true,
  showLabel = true,
}: ProgressIndicatorProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full space-y-2">
      {label && <div className="text-xs font-semibold text-gray-400 uppercase">{label}</div>}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-card-hover/30 rounded-full overflow-hidden border border-card-hover/50">
          <div
            className={`h-full ${colorMap[color]} transition-all ${animated ? 'duration-500 ease-out' : ''}`}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
        {showLabel && <span className="text-sm font-bold text-gray-300 min-w-12 text-right">{Math.round(clampedValue)}%</span>}
      </div>
    </div>
  );
}
