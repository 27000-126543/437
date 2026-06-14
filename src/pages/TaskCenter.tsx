import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatusBadge, StatusTimeline } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import {
  Search,
  Filter,
  Eye,
  BarChart3,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Grid3x3,
  Droplets,
  Activity,
} from 'lucide-react';
import {
  STATUS_META,
  STATUS_ORDER,
  type SimulationStatus,
  GEOMETRY_META,
} from '@/types';
import { clsx } from 'clsx';

export default function TaskCenter() {
  const navigate = useNavigate();
  const { tasks, updateTaskProgress, setTaskStatus } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SimulationStatus | 'all'>('all');
  const [geoFilter, setGeoFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showF, setShowF] = useState(false);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (geoFilter !== 'all' && t.geometry.type !== geoFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(s) ||
          t.id.toLowerCase().includes(s) ||
          t.owner.toLowerCase().includes(s) ||
          t.geometry.fileName.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [tasks, search, statusFilter, geoFilter]);

  const countsByStatus = useMemo(() => {
    const c: Record<string, number> = {};
    tasks.forEach(t => { c[t.status] = (c[t.status] ?? 0) + 1; });
    c['error_fallback'] = c['error_fallback'] ?? 0;
    return c;
  }, [tasks]);

  const geoOptions = Array.from(new Set(tasks.map(t => t.geometry.type)));

  return (
    <div className="min-h-full">
      <PageHeader
        title="模拟任务中心"
        subtitle={`共 ${tasks.length} 个任务 · 显示 ${filtered.length} 条结果`}
        tags={[
          { label: `运行中 ${(countsByStatus['two_phase_computing'] ?? 0) + (countsByStatus['mesh_generation'] ?? 0) + (countsByStatus['initialization'] ?? 0)}` },
        ]}
        actions={
          <>
            <div className="flex border border-surface rounded p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={
                  'px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ' +
                  (viewMode === 'list' ? 'bg-tech-cyan/15 text-tech-cyan' : 'text-neut-1 hover:text-neut-2')
                }
              >
                <Activity size={13} /> 列表
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={
                  'px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ' +
                  (viewMode === 'kanban' ? 'bg-tech-cyan/15 text-tech-cyan' : 'text-neut-1 hover:text-neut-2')
                }
              >
                <Grid3x3 size={13} /> 看板
              </button>
            </div>
            <button onClick={() => setShowF(!showF)} className="btn-secondary text-xs flex items-center gap-1.5">
              <Filter size={13} /> 筛选 <ChevronDown size={12} />
            </button>
            <button
              onClick={() => navigate('/tasks/new')}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus size={13} /> 新建模拟
            </button>
          </>
        }
      />

      {showF && (
        <div className="glass-panel p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label-text">关键词搜索</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neut-1" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="任务名 / ID / 负责人 / 文件名"
                className="input-field pl-9"
              />
            </div>
          </div>
          <div>
            <label className="label-text">状态筛选</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="input-field"
            >
              <option value="all">全部状态</option>
              {STATUS_ORDER.concat(['error_fallback'] as any).map(s => (
                <option key={s} value={s}>{STATUS_META[s as SimulationStatus].label} ({countsByStatus[s] ?? 0})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">几何构型</label>
            <select
              value={geoFilter}
              onChange={e => setGeoFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">全部构型</option>
              {geoOptions.map(g => (
                <option key={g} value={g}>{GEOMETRY_META[g as keyof typeof GEOMETRY_META]?.label ?? g}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Overview status bar */}
      <div className="glass-panel p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-neut-1">全平台任务状态分布</div>
          <div className="text-[11px] text-neut-1 font-mono">完成率 {((countsByStatus['completed'] ?? 0) / Math.max(1, tasks.length) * 100).toFixed(1)}%</div>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-surface/50">
          {STATUS_ORDER.concat(['error_fallback'] as any).map((s, i) => {
            const w = ((countsByStatus[s] ?? 0) / tasks.length) * 100;
            const colors: any = {
              pending_verify: 'bg-yellow-500',
              mesh_generation: 'bg-blue-500',
              initialization: 'bg-purple-500',
              two_phase_computing: 'bg-tech-cyan',
              droplet_analysis: 'bg-emerald-500',
              completed: 'bg-data-green',
              error_fallback: 'bg-alert-red',
            };
            if (w < 1) return null;
            return (
              <div
                key={s}
                className={colors[s] + ' transition-all hover:brightness-125 cursor-pointer'}
                style={{ width: `${w}%` }}
                title={`${STATUS_META[s as SimulationStatus].label}: ${countsByStatus[s] ?? 0}`}
                onClick={() => setStatusFilter(s)}
              />
            );
          })}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface text-left">
                  <th className="px-4 py-3 text-[11px] font-medium text-neut-1 uppercase tracking-wider">任务</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-neut-1 uppercase tracking-wider">构型</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-neut-1 uppercase tracking-wider">流速比</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-neut-1 uppercase tracking-wider">负责人</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-neut-1 uppercase tracking-wider">状态 · 进度</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-neut-1 uppercase tracking-wider">CV / 频率</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-neut-1 uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => (
                  <tr
                    key={t.id}
                    className={
                      'border-b border-surface/40 transition-colors hover:bg-surface/20 ' +
                      (idx % 2 === 1 ? 'bg-deep-space/30' : '')
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-tech-cyan/20 to-blue-900/40 border border-tech-cyan/30 flex items-center justify-center shrink-0">
                          <Droplets size={15} className="text-tech-cyan" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-neut-2 font-medium truncate max-w-[260px]">{t.name}</div>
                          <div className="text-[11px] text-neut-1 font-mono mt-0.5">{t.id} · 创建于 {new Date(t.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-neut-2">{GEOMETRY_META[t.geometry.type]?.label}</div>
                      <div className="text-[11px] text-neut-1 font-mono mt-0.5">{t.geometry.channelWidth}μm / {t.geometry.channelDepth}μm</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-neut-2">{t.fluidParams.flowRateRatio.toFixed(1)} : 1</div>
                      <div className="text-[11px] text-neut-1 mt-0.5">γ={t.fluidParams.interfacialTension} mN/m</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-neut-2">{t.owner}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={t.status} />
                        <span className="text-[11px] font-mono text-neut-1">{t.progress}%</span>
                      </div>
                      <div className="w-44">
                        <StatusTimeline status={t.status} progress={t.progress} compact />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t.statistics ? (
                        <>
                          <div className={'text-xs font-mono ' + (t.statistics.cvDiameter > 5 ? 'text-alert-orange' : 'text-data-green')}>
                            CV: {t.statistics.cvDiameter.toFixed(2)}%
                          </div>
                          <div className="text-[11px] text-neut-1 mt-0.5">f = {t.statistics.generationFrequency.toFixed(0)} Hz</div>
                        </>
                      ) : (
                        <span className="text-[11px] text-neut-1">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {t.status !== 'completed' && t.status !== 'error_fallback' && (
                          <>
                            <button
                              onClick={() => updateTaskProgress(t.id)}
                              title="推进阶段"
                              className="p-1.5 rounded hover:bg-tech-cyan/10 text-tech-cyan"
                            >
                              <Play size={14} />
                            </button>
                            <button
                              title="暂停"
                              className="p-1.5 rounded hover:bg-surface/40 text-neut-1"
                            >
                              <Pause size={14} />
                            </button>
                          </>
                        )}
                        {t.status === 'error_fallback' && (
                          <button
                            onClick={() => {
                              setTaskStatus(t.id, 'two_phase_computing');
                            }}
                            title="重算"
                            className="p-1.5 rounded hover:bg-alert-orange/10 text-alert-orange"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(t.status === 'completed' ? `/tasks/${t.id}/report` : `/tasks/${t.id}/monitor`)}
                          className="p-1.5 rounded hover:bg-tech-cyan/10 text-tech-cyan"
                          title="监控面板"
                        >
                          {t.status === 'completed' ? <BarChart3 size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-alert-red/10 text-neut-1 hover:text-alert-red"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {STATUS_ORDER.concat(['error_fallback'] as any).map(st => {
            const col = filtered.filter(t => t.status === st);
            return (
              <div key={st} className="glass-panel p-3 min-h-[500px]">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface/60">
                  <StatusBadge status={st as SimulationStatus} />
                  <span className="text-[11px] font-mono text-neut-1">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map(t => (
                    <button
                      key={t.id}
                      onClick={() => navigate(t.status === 'completed' ? `/tasks/${t.id}/report` : `/tasks/${t.id}/monitor`)}
                      className="w-full text-left p-3 rounded-md border border-surface/50 bg-deep-space/40 hover:border-tech-cyan/40 hover:bg-surface/30 transition-all group"
                    >
                      <div className="text-xs text-neut-2 font-medium truncate mb-1 group-hover:text-tech-cyan">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-neut-1 font-mono mb-2">{t.id}</div>
                      <StatusTimeline status={t.status} progress={t.progress} compact />
                      {t.statistics && (
                        <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-data-green">CV {t.statistics.cvDiameter.toFixed(1)}%</span>
                          <span className="text-tech-cyan">{t.statistics.generationFrequency.toFixed(0)}Hz</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
