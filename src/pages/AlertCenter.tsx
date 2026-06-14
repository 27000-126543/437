import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import {
  AlertTriangle,
  Check,
  X,
  Clock,
  ChevronRight,
  MessageSquare,
  Filter,
  ChevronDown,
  Settings,
  Droplets,
  Gauge,
  Activity,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { ALERT_META, ALERT_TYPE_LABEL, type Alert, type AlertLevel, type AlertStatus } from '@/types';
import { clsx } from 'clsx';

export default function AlertCenter() {
  const navigate = useNavigate();
  const { alerts, handleAlert, tasks } = useAppStore();
  const [filter, setFilter] = useState<AlertStatus | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(alerts.find(a => a.status === 'pending')?.id ?? null);
  const [reviewComment, setReviewComment] = useState('');
  const [showF, setShowF] = useState(false);

  const filtered = alerts.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (levelFilter !== 'all' && a.level !== levelFilter) return false;
    return true;
  });

  const selected = filtered.find(a => a.id === selectedId) ?? filtered[0];
  const relatedTask = selected ? tasks.find(t => t.id === selected.taskId) : null;

  const statusCounts = {
    pending: alerts.filter(a => a.status === 'pending').length,
    reviewing: alerts.filter(a => a.status === 'reviewing').length,
    approved: alerts.filter(a => a.status === 'approved').length,
    rejected: alerts.filter(a => a.status === 'rejected').length,
  };

  const statusLabels: Record<AlertStatus, string> = {
    pending: '待处理',
    reviewing: '处理中',
    approved: '已通过',
    rejected: '已驳回',
  };

  const doAction = (action: 'approve' | 'reject') => {
    if (!selected) return;
    handleAlert(selected.id, action, reviewComment);
    setReviewComment('');
    setSelectedId(null);
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="预警复核中心"
        subtitle={`共 ${alerts.length} 条预警 · ${statusCounts.pending} 条待处理`}
        tags={[
          statusCounts.pending > 0
            ? { label: `${statusCounts.pending} 条待复核`, color: 'border-alert-red/40 text-alert-red bg-alert-red/5' }
            : { label: '无待处理', color: 'border-data-green/40 text-data-green bg-data-green/5' },
        ]}
        actions={
          <>
            <button onClick={() => setShowF(!showF)} className="btn-secondary text-xs flex items-center gap-1.5">
              <Filter size={13} /> 筛选 <ChevronDown size={12} />
            </button>
            <button
              onClick={() => navigate('/tasks')}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <ArrowLeft size={13} /> 返回任务
            </button>
          </>
        }
      />

      {showF && (
        <div className="glass-panel p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label-text">处理状态</label>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="input-field">
              <option value="all">全部状态</option>
              {(['pending', 'reviewing', 'approved', 'rejected'] as AlertStatus[]).map(s => (
                <option key={s} value={s}>{statusLabels[s]} ({statusCounts[s]})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">预警级别</label>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value as any)} className="input-field">
              <option value="all">全部级别</option>
              {(['warning', 'critical', 'fatal'] as AlertLevel[]).map(l => (
                <option key={l} value={l}>{ALERT_META[l].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">预警类型</label>
            <select className="input-field">
              <option value="all">全部类型</option>
              {Object.entries(ALERT_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {(['pending', 'reviewing', 'approved', 'rejected'] as AlertStatus[]).map(s => {
          const active = filter === s;
          const colors: Record<AlertStatus, string> = {
            pending: 'border-alert-orange/50 bg-alert-orange/5 text-alert-orange',
            reviewing: 'border-tech-cyan/50 bg-tech-cyan/5 text-tech-cyan',
            approved: 'border-data-green/50 bg-data-green/5 text-data-green',
            rejected: 'border-neut-1/50 bg-neut-1/5 text-neut-1',
          };
          return (
            <button
              key={s}
              onClick={() => setFilter(active ? 'all' : s)}
              className={
                'glass-panel p-4 text-left transition-all ' +
                (active ? 'border-2 ' + colors[s].split(' ')[0] : 'hover:border-tech-cyan/30')
              }
            >
              <div className="text-[11px] text-neut-1 uppercase tracking-wider mb-1">{statusLabels[s]}</div>
              <div className="heading-display text-2xl text-neut-2">{statusCounts[s]}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* List */}
        <div className="glass-panel p-3 xl:col-span-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          <div className="text-xs text-neut-1 px-2 mb-2 flex items-center justify-between">
            <span>预警列表</span>
            <span className="text-[10px] font-mono">{filtered.length} 条</span>
          </div>
          <div className="space-y-1">
            {filtered.map(a => {
              const isSel = selectedId === a.id;
              const meta = ALERT_META[a.level];
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-md border transition-all',
                    isSel
                      ? 'border-tech-cyan/60 bg-tech-cyan/10 shadow-glow-cyan'
                      : 'border-surface/50 bg-deep-space/30 hover:border-tech-cyan/30 hover:bg-surface/30',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={
                        'w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ' +
                        meta.color
                      }
                    >
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-neut-2 truncate">
                          {ALERT_TYPE_LABEL[a.type]}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border shrink-0 font-mono"
                          style={{ borderColor: 'currentColor' }}>
                          {ALERT_META[a.level].label}
                        </span>
                      </div>
                      <div className="text-[11px] text-neut-1 truncate mb-1">{a.taskName}</div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-neut-1">
                          <Clock size={10} className="inline mr-1" />
                          {new Date(a.createdAt).toLocaleTimeString('zh-CN')}
                        </span>
                        <StatusBadge status={'completed' as any} showIcon={false} />
                        <span className={
                          'font-mono ' +
                          (a.status === 'pending' ? 'text-alert-orange' :
                            a.status === 'approved' ? 'text-data-green' :
                            a.status === 'rejected' ? 'text-neut-1' : 'text-tech-cyan')
                        }>
                          {statusLabels[a.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="glass-panel p-5 xl:col-span-3">
          {selected ? (
            <div>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={'w-10 h-10 rounded-lg flex items-center justify-center border ' + ALERT_META[selected.level].color}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h2 className="heading-display text-lg text-neut-2">{ALERT_TYPE_LABEL[selected.type]}</h2>
                      <p className="text-[11px] text-neut-1">预警 ID: {selected.id}</p>
                    </div>
                  </div>
                </div>
                <span className={'status-badge text-[11px] border ' + ALERT_META[selected.level].color}>
                  {ALERT_META[selected.level].label}级别
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 rounded-md border border-surface/60 bg-deep-space/40">
                  <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-1.5">阈值</div>
                  <div className="data-number text-xl text-tech-cyan">{selected.threshold}%</div>
                </div>
                <div className="p-3 rounded-md border border-alert-orange/40 bg-alert-orange/5">
                  <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-1.5">实际值</div>
                  <div className="data-number text-xl text-alert-orange">{selected.actualValue.toFixed(2)}%</div>
                </div>
              </div>

              <div className="mb-5">
                <div className="text-xs text-neut-1 uppercase tracking-wider mb-2">预警描述</div>
                <p className="text-sm text-neut-2 leading-relaxed">{selected.description}</p>
              </div>

              {selected.adjustSuggestion && (
                <div className="p-4 rounded-md border border-tech-cyan/30 bg-gradient-to-r from-tech-cyan/5 to-transparent mb-5">
                  <div className="text-xs text-tech-cyan font-medium mb-2 flex items-center gap-1.5">
                    <Zap size={13} /> 系统建议调整
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-neut-1 mb-1">参数</div>
                      <div className="font-mono text-neut-2">{selected.adjustSuggestion.param}</div>
                    </div>
                    <div>
                      <div className="text-neut-1 mb-1">当前值</div>
                      <div className="font-mono text-neut-2">{selected.adjustSuggestion.oldValue.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-neut-1 mb-1">建议值</div>
                      <div className="font-mono text-data-green">{selected.adjustSuggestion.newValue.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

              {relatedTask && (
                <div className="p-3 rounded-md border border-surface/60 bg-deep-space/40 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-1">相关任务</div>
                      <div className="text-sm text-neut-2 font-medium">{relatedTask.name}</div>
                    </div>
                    <button
                      onClick={() => navigate(`/tasks/${relatedTask.id}/monitor`)}
                      className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"
                    >
                      查看监控 <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Review section */}
              {selected.status === 'pending' || selected.status === 'reviewing' ? (
                <div>
                  <div className="text-xs text-neut-1 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare size={12} /> 复核意见
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="请输入复核意见，系统将根据您的决定自动执行调整或回退"
                    className="input-field h-24 resize-none"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => doAction('reject')}
                      className="btn-danger text-xs flex items-center gap-1.5"
                    >
                      <X size={13} /> 驳回，标记为误报
                    </button>
                    <button
                      onClick={() => doAction('approve')}
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      <Check size={13} /> 通过并自动重算...
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-md border border-surface/50 bg-mid-space/30">
                  <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-2">处理结果</div>
                  <div className="flex items-center gap-2 mb-2">
                    {selected.status === 'approved' ? (
                      <span className="status-badge border border-data-green/50 bg-data-green/10 text-data-green text-[11px]">
                        <Check size={11} /> 已通过
                      </span>
                    ) : (
                      <span className="status-badge border border-neut-1/50 bg-neut-1/10 text-neut-1 text-[11px]">
                        <X size={11} /> 已驳回
                      </span>
                    )}
                    <span className="text-[11px] text-neut-1">
                      {selected.reviewedBy} · {new Date(selected.reviewedAt ?? '').toLocaleString('zh-CN')}...
                    </span>
                  </div>
                  {selected.reviewComments && (
                    <p className="text-xs text-neut-2 mt-2">
                      {selected.reviewComments}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-neut-1 text-sm">
              请选择一条预警查看详情...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
