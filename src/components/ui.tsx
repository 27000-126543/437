import { STATUS_META, STATUS_ORDER, type SimulationStatus } from '@/types';
import { clsx } from 'clsx';
import {
  Clock,
  Grid3x3,
  Loader2,
  Activity,
  Droplets,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Clock,
  Grid3x3,
  Loader2,
  Activity,
  Droplets,
  CheckCircle2,
  AlertTriangle,
};

interface StatusBadgeProps {
  status: SimulationStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'sm', showIcon = true }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const Icon = ICON_MAP[meta.icon];
  return (
    <span
      className={clsx(
        'status-badge border',
        meta.color,
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs',
      )}
    >
      {showIcon && Icon && <Icon size={size === 'sm' ? 11 : 13} />}
      {meta.label}
    </span>
  );
}

interface StatusTimelineProps {
  status: SimulationStatus;
  progress?: number;
  compact?: boolean;
}

export function StatusTimeline({ status, progress, compact }: StatusTimelineProps) {
  const currentIdx = STATUS_ORDER.indexOf(status);
  const isError = status === 'error_fallback';
  return (
    <div className={clsx('w-full', compact ? '' : 'px-1')}>
      <div className="relative h-1.5 rounded-full bg-surface/50 overflow-hidden">
        <div
          className={clsx(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-700',
            isError
              ? 'bg-gradient-to-r from-alert-orange to-alert-red'
              : 'bg-gradient-to-r from-tech-cyan via-cyan-400 to-data-green',
          )}
          style={{ width: `${progress ?? Math.min(100, ((currentIdx + 1) / STATUS_ORDER.length) * 100)}%` }}
        />
        {!isError && status !== 'completed' && (
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-pulse" />
        )}
      </div>
      {!compact && (
        <div className="mt-2 grid grid-cols-6 gap-1 text-center">
          {STATUS_ORDER.map((s, i) => {
            const done = i < currentIdx || s === status;
            const active = s === status;
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full transition-all',
                    active && !isError
                      ? 'bg-tech-cyan scale-125 shadow-glow-cyan'
                      : done
                        ? 'bg-data-green'
                        : 'bg-surface',
                  )}
                />
                <div
                  className={clsx(
                    'text-[9px] leading-tight',
                    active && !isError ? 'text-tech-cyan font-medium' : done ? 'text-neut-2' : 'text-neut-1',
                  )}
                >
                  {STATUS_META[s].label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string; isUp: boolean; isGood: boolean };
  accent?: 'cyan' | 'green' | 'orange' | 'red';
  sparkline?: number[];
}

export function StatCard({ label, value, unit, icon, trend, accent = 'cyan', sparkline }: StatCardProps) {
  const accentColors = {
    cyan: 'from-tech-cyan/20 to-transparent text-tech-cyan',
    green: 'from-data-green/20 to-transparent text-data-green',
    orange: 'from-alert-orange/20 to-transparent text-alert-orange',
    red: 'from-alert-red/20 to-transparent text-alert-red',
  }[accent];
  const accentBorder = {
    cyan: 'border-tech-cyan/30',
    green: 'border-data-green/30',
    orange: 'border-alert-orange/30',
    red: 'border-alert-red/30',
  }[accent];

  return (
    <div className={clsx('glass-panel p-4 relative overflow-hidden border', accentBorder)}>
      <div className={clsx('absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br blur-2xl opacity-60', accentColors)} />
      <div className="relative flex items-start justify-between mb-3">
        <div>
          <div className="text-[11px] text-neut-1 uppercase tracking-wider mb-1">{label}</div>
          <div className="flex items-baseline gap-1">
            <span className="heading-display text-2xl bg-gradient-to-r from-white to-tech-cyan/80 bg-clip-text text-transparent">
              {value}
            </span>
            {unit && <span className="text-xs text-neut-1">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className={clsx('w-8 h-8 rounded-md flex items-center justify-center bg-gradient-to-br to-transparent', accentColors)}>
            {icon}
          </div>
        )}
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="h-8 w-full flex items-end gap-0.5 mt-2">
          {sparkline.map((v, i) => (
            <div
              key={i}
              className={clsx(
                'flex-1 rounded-t transition-all',
                accent === 'cyan' && 'bg-tech-cyan/60',
                accent === 'green' && 'bg-data-green/60',
                accent === 'orange' && 'bg-alert-orange/60',
                accent === 'red' && 'bg-alert-red/60',
              )}
              style={{ height: `${Math.max(10, v * 100)}%` }}
            />
          ))}
        </div>
      )}
      {trend && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          <span
            className={clsx(
              'font-mono font-medium',
              trend.isGood ? 'text-data-green' : 'text-alert-red',
            )}
          >
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-neut-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  tags?: { label: string; color?: string }[];
}

export function PageHeader({ title, subtitle, actions, tags }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="heading-display text-2xl text-neut-2">{title}</h1>
          {tags?.map((t, i) => (
            <span
              key={i}
              className={clsx(
                'text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium',
                t.color ?? 'border-tech-cyan/40 text-tech-cyan bg-tech-cyan/5',
              )}
            >
              {t.label}
            </span>
          ))}
        </div>
        {subtitle && <p className="text-sm text-neut-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
