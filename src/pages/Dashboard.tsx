import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatCard } from '@/components/ui';
import { TrendAreaChart, HistogramChart, HeatmapChart } from '@/components/charts';
import { useAppStore } from '@/store/appStore';
import {
  Activity,
  Target,
  Zap,
  AlertTriangle,
  ChevronRight,
  Droplets,
  CheckCircle2,
  Timer,
  ListTodo,
} from 'lucide-react';
import { StatusBadge, StatusTimeline } from '@/components/ui';
import { GEOMETRY_META } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, dailyStats, alerts, geometries } = useAppStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const completed = tasks.filter(t => t.status === 'completed').length;
  const avgCv = tasks
    .filter(t => t.statistics)
    .reduce((s, t) => s + (t.statistics?.cvDiameter ?? 0), 0) /
    Math.max(1, tasks.filter(t => t.statistics).length);
  const convCount = dailyStats.slice(0, 7).reduce((s, d) => s + d.paramConvergenceCount, 0);
  const activeAlerts = alerts.filter(a => a.status === 'pending').length;

  const completionRate = (completed / Math.max(1, tasks.length)) * 100;
  const completedVsYesterday = 4.2;
  const cvVsYesterday = -8.1;
  const convVsYesterday = 12.3;

  const spark1 = dailyStats.slice(-14).map(d => d.completedTasks / Math.max(...dailyStats.map(x => x.totalTasks)));
  const spark2 = dailyStats.slice(-14).map(d => Math.max(0, 1 - d.avgCvDiameter / 6));
  const spark3 = dailyStats.slice(-14).map(d => Math.min(1, d.paramConvergenceCount / 10));
  const spark4 = dailyStats.slice(-14).map(d => Math.min(1, d.alertCount / 8));

  const latestTasks = [...tasks].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5);
  const pendingAlerts = alerts.filter(a => a.status === 'pending').slice(0, 4);

  // Heatmap data: geometry x flow ratio -> cv
  const geoTypes = Array.from(new Set(geometries.map(g => g.type)));
  const flowRatios = ['4:1', '6:1', '8:1', '10:1', '12:1', '15:1'];
  const heatRows = geoTypes.map(gt => ({
    label: GEOMETRY_META[gt]?.label ?? gt,
    values: flowRatios.map(() => +(1.5 + Math.random() * 6.5).toFixed(2)),
  }));

  const sizeDistAll = Array.from({ length: 11 }, (_, i) => {
    const bin = 16 + i * 2;
    return { bin, count: Math.round(Math.exp(-Math.pow((bin - 26) / 5, 2)) * 320 + Math.random() * 30) };
  });

  return (
    <div className="min-h-full">
      <PageHeader
        title="多相流模拟总览看板"
        subtitle={`实时监控微流控CFD仿真集群运行状态 · 系统时间 ${now.toLocaleTimeString('zh-CN')}`}
        tags={[
          { label: '集群在线' },
          { label: '24/32 节点', color: 'border-data-green/40 text-data-green bg-data-green/5' },
        ]}
        actions={
          <>
            <button
              onClick={() => navigate('/tasks')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <ListTodo size={15} />
              全部任务
            </button>
            <button
              onClick={() => navigate('/tasks/new')}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Zap size={15} />
              新建模拟
            </button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="模拟完成率"
          value={completionRate.toFixed(1)}
          unit="%"
          icon={<CheckCircle2 size={16} />}
          accent="cyan"
          trend={{ value: completedVsYesterday, label: '较昨日', isUp: true, isGood: true }}
          sparkline={spark1}
        />
        <StatCard
          label="平均尺寸变异系数"
          value={avgCv.toFixed(2)}
          unit="%"
          icon={<Target size={16} />}
          accent="green"
          trend={{ value: cvVsYesterday, label: '较昨日', isUp: false, isGood: true }}
          sparkline={spark2}
        />
        <StatCard
          label="本周参数优化收敛"
          value={convCount}
          unit="次"
          icon={<Zap size={16} />}
          accent="orange"
          trend={{ value: convVsYesterday, label: '较上周', isUp: true, isGood: true }}
          sparkline={spark3}
        />
        <StatCard
          label="待处理预警"
          value={activeAlerts}
          unit="条"
          icon={<AlertTriangle size={16} />}
          accent={activeAlerts > 3 ? 'red' : 'orange'}
          sparkline={spark4}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="heading-display text-sm text-neut-2 mb-1">任务吞吐与参数收敛趋势</h3>
              <p className="text-xs text-neut-1">近14日新建/完成任务数 · 参数优化自动收敛次数</p>
            </div>
            <div className="flex gap-1 text-[11px]">
              {['14天', '30天', '季度'].map((t, i) => (
                <button
                  key={t}
                  className={
                    'px-2 py-1 rounded border transition-colors ' +
                    (i === 0
                      ? 'border-tech-cyan/50 bg-tech-cyan/10 text-tech-cyan'
                      : 'border-surface text-neut-1 hover:border-tech-cyan/30 hover:text-neut-2')
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <TrendAreaChart
            data={dailyStats.map(d => ({
              date: d.date,
              completed: d.completedTasks,
              total: d.totalTasks,
              conv: d.paramConvergenceCount,
            }))}
          />
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="heading-display text-sm text-neut-2 mb-1">全局液滴尺寸分布</h3>
              <p className="text-xs text-neut-1">最近30天累计 {tasks.filter(t => t.statistics).reduce((s, t) => s + t.statistics!.sizeDistribution.reduce((a, b) => a + b.count, 0), 0)} 个液滴</p>
            </div>
            <Droplets size={16} className="text-tech-cyan" />
          </div>
          <HistogramChart bins={sizeDistAll} meanD={26.2} cv={avgCv} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="heading-display text-sm text-neut-2 mb-1">构型 × 流速比 变异系数热力图</h3>
              <p className="text-xs text-neut-1">不同几何构型在各流速比下的尺寸CV(%) · 绿=优</p>
            </div>
            <button
              onClick={() => navigate('/recommend')}
              className="text-[11px] text-tech-cyan flex items-center gap-1 hover:underline"
            >
              查看智能推荐 <ChevronRight size={12} />
            </button>
          </div>
          <HeatmapChart rows={heatRows} columns={flowRatios} />
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="heading-display text-sm text-neut-2 mb-1">最近模拟任务</h3>
              <p className="text-xs text-neut-1">按更新时间排序</p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-[11px] text-tech-cyan flex items-center gap-1 hover:underline"
            >
              全部 <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {latestTasks.map(t => (
              <button
                key={t.id}
                onClick={() => navigate(t.status === 'completed' ? `/tasks/${t.id}/report` : `/tasks/${t.id}/monitor`)}
                className="w-full text-left p-3 rounded-md border border-surface/50 bg-deep-space/30 hover:border-tech-cyan/40 hover:bg-surface/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="text-sm text-neut-2 font-medium truncate group-hover:text-tech-cyan">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-neut-1 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">{t.id}</span>
                      <span>·</span>
                      <span>{t.owner}</span>
                    </div>
                  </div>
                  <StatusBadge status={t.status} size="sm" />
                </div>
                <StatusTimeline status={t.status} progress={t.progress} compact />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass-panel p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="heading-display text-sm text-neut-2 mb-1">预警队列</h3>
              <p className="text-xs text-neut-1">待工程师复核的异常事件，超过24小时未处理将升级通报</p>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-[11px] text-tech-cyan flex items-center gap-1 hover:underline"
            >
              复核中心 <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {pendingAlerts.length === 0 && (
              <div className="text-center py-8 text-neut-1 text-sm">
                🎉 当前无待处理预警，系统运行平稳
              </div>
            )}
            {pendingAlerts.map(a => {
              const colors = {
                warning: 'border-alert-orange/50 bg-alert-orange/5',
                critical: 'border-alert-red/60 bg-alert-red/10',
                fatal: 'border-red-600 bg-red-900/20',
              }[a.level];
              return (
                <div key={a.id} className={'p-3 rounded-md border flex items-start gap-3 ' + colors}>
                  <AlertTriangle
                    size={18}
                    className={a.level === 'fatal' ? 'text-alert-red mt-0.5' : a.level === 'critical' ? 'text-alert-red mt-0.5' : 'text-alert-orange mt-0.5 shrink-0'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-neut-2">{a.taskName}</span>
                      <span className="text-[10px] font-mono text-neut-1 px-1.5 py-0.5 rounded bg-deep-space/50">
                        {a.taskId}
                      </span>
                    </div>
                    <div className="text-xs text-neut-2 mb-1">{a.description}</div>
                    <div className="text-[11px] text-neut-1 flex items-center gap-3">
                      <Timer size={11} />
                      <span>{new Date(a.createdAt).toLocaleString('zh-CN')}</span>
                      <span>阈值: {a.threshold}% · 实际: <span className="text-alert-orange font-mono">{a.actualValue.toFixed(2)}%</span></span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/alerts')}
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    复核
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="heading-display text-sm text-neut-2 mb-1">构型风险监控</h3>
              <p className="text-xs text-neut-1">连续3次异常将自动暂停并通知首席科学家</p>
            </div>
            <button
              onClick={() => navigate('/risk')}
              className="text-[11px] text-tech-cyan flex items-center gap-1 hover:underline"
            >
              管理 <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {geometries.slice(0, 4).map(g => {
              const failCount = g.consecutiveFailures ?? 0;
              const paused = g.riskPaused;
              return (
                <div key={g.id} className="p-3 rounded-md border border-surface/50 bg-deep-space/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-neut-2 font-medium">{GEOMETRY_META[g.type]?.label}</div>
                    {paused ? (
                      <span className="status-badge border border-alert-red/50 bg-alert-red/10 text-alert-red text-[10px]">
                        ⚠ 已暂停
                      </span>
                    ) : failCount > 0 ? (
                      <span className="status-badge border border-alert-orange/50 bg-alert-orange/10 text-alert-orange text-[10px]">
                        {failCount}/3 次
                      </span>
                    ) : (
                      <span className="status-badge border border-data-green/50 bg-data-green/10 text-data-green text-[10px]">
                        ✓ 正常
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neut-1 mb-2 font-mono">{g.fileName}</div>
                  <div className="h-1.5 rounded-full bg-surface/60 overflow-hidden">
                    <div
                      className={
                        'h-full rounded-full transition-all ' +
                        (paused
                          ? 'bg-alert-red'
                          : failCount > 1
                            ? 'bg-alert-orange'
                            : 'bg-gradient-to-r from-tech-cyan to-data-green')
                      }
                      style={{ width: `${(failCount / 3) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
