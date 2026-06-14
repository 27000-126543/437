import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import {
  ShieldAlert,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  History,
  ChevronRight,
  FileText,
  Users,
  Clock,
  Zap,
  ArrowLeft,
  Eye,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  X,
  Send,
} from 'lucide-react';
import { GEOMETRY_META, type GeometryType } from '@/types';
import { clsx } from 'clsx';

interface FailureLog {
  id: string;
  taskId: string;
  taskName: string;
  date: string;
  reason: string;
  cvValue: number;
  hasSatellite: boolean;
}

export default function RiskManagement() {
  const navigate = useNavigate();
  const { geometries, tasks, toggleGeometryRisk, currentRole } = useAppStore();
  const [selectedGeo, setSelectedGeo] = useState<string | null>(geometries[1]?.id ?? null);

  const geo = geometries.find(g => g.id === selectedGeo) ?? geometries[0];
  const relatedTasks = tasks.filter(t => t.geometry.id === geo?.id);
  const failedTasks = relatedTasks.filter(
    t => t.statistics?.hasSatellite || (t.statistics?.cvDiameter ?? 0) > 5,
  );

  const failureLogs: FailureLog[] = failedTasks.map(t => ({
    id: 'fl-' + t.id,
    taskId: t.id,
    taskName: t.name,
    date: t.createdAt,
    reason: t.statistics?.hasSatellite ? '卫星液滴' : 'CV > 5%',
    cvValue: t.statistics?.cvDiameter ?? 0,
    hasSatellite: t.statistics?.hasSatellite ?? false,
  }));

  const pausedCount = geometries.filter(g => g.riskPaused).length;
  const atRiskCount = geometries.filter(g => (g.consecutiveFailures ?? 0) > 0 && !g.riskPaused).length;

  const isChief = currentRole === 'chief_scientist';

  return (
    <div className="min-h-full">
      <PageHeader
        title="构型风险管理"
        subtitle="监控几何构型连续异常情况，连续3次异常自动暂停并通知首席科学家"
        tags={[
          pausedCount > 0
            ? { label: `${pausedCount} 个构型已暂停`, color: 'border-alert-red/40 text-alert-red bg-alert-red/5' }
            : { label: '全部正常', color: 'border-data-green/40 text-data-green bg-data-green/5' },
          atRiskCount > 0
            ? { label: `${atRiskCount} 个高风险`, color: 'border-alert-orange/40 text-alert-orange bg-alert-orange/5' }
            : null,
        ].filter(Boolean) as any}
        actions={
          <>
            <button onClick={() => navigate('/tasks')} className="btn-secondary text-xs flex items-center gap-1.5">
              <ArrowLeft size={13} /> 返回任务
            </button>
            <button className="btn-secondary text-xs flex items-center gap-1.5">
              <Users size={13} /> 通知首席科学家
            </button>
          </>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { l: '几何构型总数', v: geometries.length, c: 'text-tech-cyan', i: FileText },
          { l: '正常运行', v: geometries.filter(g => !g.riskPaused && (g.consecutiveFailures ?? 0) === 0).length, c: 'text-data-green', i: CheckCircle2 },
          { l: '高风险构型', v: atRiskCount, c: 'text-alert-orange', i: AlertTriangle },
          { l: '已暂停构型', v: pausedCount, c: 'text-alert-red', i: PauseCircle },
        ].map((m, i) => {
          const Icon = m.i;
          return (
            <div key={i} className="glass-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] text-neut-1 uppercase tracking-wider">{m.l}</div>
                <Icon size={16} className={m.c} />
              </div>
              <div className={'heading-display text-2xl ' + m.c}>{m.v}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Geometry list */}
        <div className="glass-panel p-3 xl:col-span-2 max-h-[calc(100vh-340px)] overflow-y-auto">
          <div className="text-xs text-neut-1 px-2 mb-2 flex items-center justify-between">
            <span>几何构型列表</span>
            <span className="text-[10px] font-mono">{geometries.length} 个</span>
          </div>
          <div className="space-y-2">
            {geometries.map(g => {
              const active = g.id === selectedGeo;
              const failCount = g.consecutiveFailures ?? 0;
              const paused = g.riskPaused;
              const riskLevel = paused ? 'critical' : failCount >= 2 ? 'warning' : failCount > 0 ? 'caution' : 'safe';
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGeo(g.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    active
                      ? 'border-tech-cyan/60 bg-tech-cyan/10 shadow-glow-cyan'
                      : 'border-surface/50 bg-deep-space/40 hover:border-tech-cyan/30 hover:bg-surface/20',
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-neut-2">{GEOMETRY_META[g.type]?.label}</div>
                      <div className="text-[10px] text-neut-1 font-mono mt-0.5">{g.fileName}</div>
                    </div>
                    {paused ? (
                      <span className="status-badge border border-alert-red/50 bg-alert-red/10 text-alert-red text-[10px]">
                        <PauseCircle size={10} /> 已暂停
                      </span>
                    ) : failCount > 0 ? (
                      <span className="status-badge border border-alert-orange/50 bg-alert-orange/10 text-alert-orange text-[10px]">
                        {failCount}/3 次
                      </span>
                    ) : (
                      <span className="status-badge border border-data-green/50 bg-data-green/10 text-data-green text-[10px]">
                        <CheckCircle2 size={10} /> 正常
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-neut-1 mb-2">
                    <span>通道 {g.channelWidth}μm</span>
                    <span>·</span>
                    <span>深度 {g.channelDepth}μm</span>
                  </div>

                  {/* Risk bar */}
                  <div className="flex gap-1">
                    {[1, 2, 3].map(level => {
                      const reached = failCount >= level;
                      return (
                        <div
                          key={level}
                          className={clsx(
                            'flex-1 h-2 rounded transition-all',
                            reached
                              ? level === 3
                                ? 'bg-alert-red'
                                : 'bg-alert-orange'
                              : 'bg-surface/50',
                          )}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] text-neut-1 mt-1 font-mono">
                    <span>第1次</span>
                    <span>第2次</span>
                    <span>第3次</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="glass-panel p-5 xl:col-span-3">
          {geo && (
            <div>
              <div className="flex items-start justify-between mb-5 pb-4 border-b border-surface/50">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="heading-display text-lg text-neut-2">{GEOMETRY_META[geo.type]?.label}</h2>
                    {geo.riskPaused ? (
                      <span className="status-badge border border-alert-red/50 bg-alert-red/10 text-alert-red text-[10px]">
                        <AlertOctagon size={10} /> 风险暂停
                      </span>
                    ) : (geo.consecutiveFailures ?? 0) > 0 ? (
                      <span className="status-badge border border-alert-orange/50 bg-alert-orange/10 text-alert-orange text-[10px]">
                        <AlertTriangle size={10} /> 高风险
                      </span>
                    ) : (
                      <span className="status-badge border border-data-green/50 bg-data-green/10 text-data-green text-[10px]">
                        <ShieldAlert size={10} /> 受控
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neut-1">
                    {geo.structure} · 通道尺寸 {geo.channelWidth} × {geo.channelDepth} μm
                  </p>
                </div>
                {isChief && (
                  <div className="flex gap-2">
                    {geo.riskPaused ? (
                      <button
                        onClick={() => toggleGeometryRisk(geo.id)}
                        className="btn-secondary text-xs flex items-center gap-1.5 text-data-green border-data-green/40 hover:bg-data-green/10"
                      >
                        <PlayCircle size={13} /> 恢复使用
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleGeometryRisk(geo.id)}
                        className="btn-danger text-xs flex items-center gap-1.5"
                      >
                        <PauseCircle size={13} /> 暂停构型
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { l: '相关任务数', v: relatedTasks.length, u: '项', c: 'text-tech-cyan' },
                  { l: '失败任务数', v: failedTasks.length, u: '项', c: 'text-alert-orange' },
                  { l: '连续失败', v: geo.consecutiveFailures ?? 0, u: '次', c: (geo.consecutiveFailures ?? 0) >= 3 ? 'text-alert-red' : 'text-alert-orange' },
                  { l: '成功率', v: relatedTasks.length > 0 ? Math.round(((relatedTasks.length - failedTasks.length) / relatedTasks.length) * 100) : 100, u: '%', c: 'text-data-green' },
                ].map((m, i) => (
                  <div key={i} className="p-3 rounded-md border border-surface/60 bg-deep-space/40">
                    <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-1">{m.l}</div>
                    <div className={'data-number text-xl ' + m.c}>
                      {m.v}<span className="text-xs text-neut-1 ml-0.5">{m.u}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk description */}
              {geo.riskPaused && (
                <div className="p-4 rounded-lg border-2 border-alert-red/50 bg-gradient-to-r from-alert-red/10 to-transparent mb-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-alert-red/20 border border-alert-red/40 flex items-center justify-center shrink-0">
                      <AlertOctagon size={18} className="text-alert-red" />
                    </div>
                    <div>
                      <div className="text-sm text-alert-red font-medium mb-1">该构型已被自动暂停</div>
                      <div className="text-xs text-neut-2 mb-2">
                        连续 {(geo.consecutiveFailures ?? 0)} 次模拟出现卫星液滴或尺寸变异系数超过 5%，
                        系统已自动暂停该构型的新任务提交，并通知首席科学家。
                      </div>
                      <div className="text-[11px] text-neut-1">
                        建议：优化通道尺寸、调整表面润湿性或更换表面活性剂配方后再恢复使用。
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Failure log */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="heading-display text-sm text-neut-2 flex items-center gap-2">
                    <History size={14} className="text-tech-cyan" />
                    异常历史记录
                  </h3>
                  <span className="text-[10px] text-neut-1 font-mono">{failureLogs.length} 条记录</span>
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {failureLogs.length === 0 && (
                    <div className="text-center py-8 text-neut-1 text-xs">暂无异常记录 🎉</div>
                  )}
                  {failureLogs.map(fl => (
                    <div
                      key={fl.id}
                      className="p-3 rounded-md border border-surface/50 bg-deep-space/40 hover:border-tech-cyan/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {fl.hasSatellite ? (
                            <XCircle size={14} className="text-alert-red shrink-0" />
                          ) : (
                            <AlertTriangle size={14} className="text-alert-orange shrink-0" />
                          )}
                          <span className="text-sm text-neut-2 font-medium">{fl.taskName}</span>
                        </div>
                        <span className="text-[10px] text-neut-1 font-mono shrink-0">
                          {new Date(fl.date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="text-neut-1">
                          异常原因: <span className="text-neut-2">{fl.reason}</span>
                        </span>
                        <span className="text-neut-1">
                          CV值: <span className={'font-mono ' + (fl.cvValue > 5 ? 'text-alert-orange' : 'text-data-green')}>{fl.cvValue.toFixed(2)}%</span>
                        </span>
                        <button
                          onClick={() => navigate(`/tasks/${fl.taskId}/report`)}
                          className="ml-auto text-tech-cyan text-[11px] flex items-center gap-0.5 hover:underline"
                        >
                          查看报告 <ChevronRight size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {isChief && (
                <div className="mt-5 pt-4 border-t border-surface/50 flex items-center justify-between">
                  <div className="text-[11px] text-neut-1">
                    <Users size={12} className="inline mr-1" />
                    首席科学家权限：可暂停/恢复几何构型
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs flex items-center gap-1.5">
                      <Send size={12} /> 发送通知
                    </button>
                    <button
                      onClick={() => toggleGeometryRisk(geo.id)}
                      className={geo.riskPaused ? 'btn-primary text-xs flex items-center gap-1.5' : 'btn-danger text-xs flex items-center gap-1.5'}
                    >
                      {geo.riskPaused ? (
                        <><PlayCircle size={12} /> 恢复构型使用</>
                      ) : (
                        <><PauseCircle size={12} /> 暂停此构型</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
