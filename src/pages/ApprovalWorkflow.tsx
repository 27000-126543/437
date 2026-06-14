import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronRight,
  Filter,
  ChevronDown,
  ArrowLeft,
  Send,
  FileCheck,
  AlertTriangle,
  Check,
  X,
  MessageSquare,
  History,
  Award,
  FileBarChart,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { ApprovalStage, ApprovalDecision, SimulationTask } from '@/types';

type Tab = 'pending' | 'approved' | 'rejected' | 'all';

export default function ApprovalWorkflow() {
  const navigate = useNavigate();
  const { tasks, approveTask, currentRole } = useAppStore();
  const [tab, setTab] = useState<Tab>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showF, setShowF] = useState(false);
  const [comment, setComment] = useState('');

  const needsApproval = tasks.filter(t => t.currentStage !== 'none' && t.status === 'completed');
  const approved = tasks.filter(t => t.approvals.some(a => a.stage === 'manager_confirm' && a.decision === 'approved'));
  const rejected = tasks.filter(t => t.approvals.some(a => a.decision === 'rejected'));

  const displayedTasks: SimulationTask[] = (() => {
    switch (tab) {
      case 'pending': return needsApproval;
      case 'approved': return approved;
      case 'rejected': return rejected;
      default: return tasks.filter(t => t.approvals.length > 0 || t.currentStage !== 'none');
    }
  })();

  const selected = tasks.find(t => t.id === selectedId) ?? displayedTasks[0];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending', label: '待审批', count: needsApproval.length },
    { key: 'approved', label: '已通过', count: approved.length },
    { key: 'rejected', label: '已驳回', count: rejected.length },
    { key: 'all', label: '全部', count: tasks.filter(t => t.approvals.length > 0 || t.currentStage !== 'none').length },
  ];

  const canApprove = (stage: ApprovalStage) => {
    if (currentRole === 'fluid_engineer' && stage === 'engineer_verify') return true;
    if (currentRole === 'project_manager' && stage === 'manager_confirm') return true;
    if (currentRole === 'chief_scientist') return true;
    return false;
  };

  const doApprove = (decision: ApprovalDecision) => {
    if (!selected || selected.currentStage === 'none') return;
    approveTask(selected.id, selected.currentStage as ApprovalStage, decision, comment || (decision === 'approved' ? '审批通过' : '驳回申请'));
    setComment('');
    setSelectedId(null);
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="两级审批工作流"
        subtitle="流体工程师验证稳定性 → 项目负责人确认实验可行性 → 推送光刻系统"
        tags={[
          { label: `${needsApproval.length} 项待办`, color: needsApproval.length > 0 ? 'border-alert-orange/40 text-alert-orange bg-alert-orange/5' : 'border-data-green/40 text-data-green bg-data-green/5' },
        ]}
        actions={
          <>
            <button onClick={() => setShowF(!showF)} className="btn-secondary text-xs flex items-center gap-1.5">
              <Filter size={13} /> 筛选 <ChevronDown size={12} />
            </button>
            <button onClick={() => navigate('/tasks')} className="btn-secondary text-xs flex items-center gap-1.5">
              <ArrowLeft size={13} /> 返回任务
            </button>
          </>
        }
      />

      {/* Workflow diagram */}
      <div className="glass-panel p-5 mb-4">
        <div className="flex items-center justify-between relative">
          {[
            { l: '模拟完成', s: 'completed', i: CheckCircle2 },
            { l: '流体工程师验证', s: 'engineer', i: ClipboardCheck },
            { l: '项目负责人确认', s: 'manager', i: FileCheck },
            { l: '推送光刻系统', s: 'litho', i: Send },
          ].map((step, i) => {
            const Icon = step.i;
            const done = i < 3;
            const active = i === 1 && needsApproval.some(t => t.currentStage === 'engineer_verify');
            return (
              <div key={step.s} className="flex-1 flex flex-col items-center relative">
                {i < 3 && (
                  <div
                    className={
                      'absolute top-4 left-1/2 w-full h-0.5 -z-0 ' +
                      (done ? 'bg-gradient-to-r from-data-green/80 to-tech-cyan/80' : 'bg-surface/60')
                    }
                  />
                )}
                <div
                  className={clsx(
                    'relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2',
                    done
                      ? 'bg-data-green/20 border-data-green text-data-green shadow-glow-green'
                      : active
                        ? 'bg-tech-cyan/20 border-tech-cyan text-tech-cyan animate-pulse shadow-glow-cyan'
                        : 'bg-surface/30 border-surface text-neut-1',
                  )}
                >
                  <Icon size={20} />
                </div>
                <div className={clsx('text-xs font-medium', done || active ? 'text-neut-2' : 'text-neut-1')}>
                  {step.l}
                </div>
                <div className="text-[10px] text-neut-1 mt-0.5">
                  {i === 0 && approved.length + needsApproval.length + ' 项'}
                  {i === 1 && needsApproval.filter(t => t.currentStage === 'engineer_verify').length + ' 项待处理'}
                  {i === 2 && needsApproval.filter(t => t.currentStage === 'manager_confirm').length + ' 项待处理'}
                  {i === 3 && approved.filter(t => t.pushedToLithography).length + ' 项已推送'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab nav */}
      <div className="glass-panel p-1.5 mb-4 inline-flex gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              'px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition-all ' +
              (tab === t.key
                ? 'bg-tech-cyan/15 text-tech-cyan shadow-glow-cyan border border-tech-cyan/30'
                : 'text-neut-1 hover:text-neut-2 hover:bg-surface/30')
            }
          >
            {t.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface/50">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* List */}
        <div className="glass-panel p-3 xl:col-span-2 max-h-[calc(100vh-360px)] overflow-y-auto">
          <div className="text-xs text-neut-1 px-2 mb-2 flex items-center justify-between">
            <span>审批列表</span>
            <span className="text-[10px] font-mono">{displayedTasks.length} 项</span>
          </div>
          <div className="space-y-2">
            {displayedTasks.map(t => {
              const isSel = selected?.id === t.id;
              const latest = t.approvals[t.approvals.length - 1];
              const isPending = t.currentStage !== 'none';
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    isSel
                      ? 'border-tech-cyan/60 bg-tech-cyan/10 shadow-glow-cyan'
                      : 'border-surface/50 bg-deep-space/40 hover:border-tech-cyan/30 hover:bg-surface/20',
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-neut-2 truncate">{t.name}</div>
                      <div className="text-[10px] text-neut-1 font-mono mt-0.5">{t.id}</div>
                    </div>
                    {isPending ? (
                      <span className="status-badge border border-alert-orange/50 bg-alert-orange/10 text-alert-orange text-[10px]">
                        <Clock size={10} /> 待处理
                      </span>
                    ) : latest?.decision === 'approved' ? (
                      <span className="status-badge border border-data-green/50 bg-data-green/10 text-data-green text-[10px]">
                        <Check size={10} /> 已通过
                      </span>
                    ) : (
                      <span className="status-badge border border-alert-red/50 bg-alert-red/10 text-alert-red text-[10px]">
                        <X size={10} /> 已驳回
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neut-1">
                      {t.currentStage === 'engineer_verify' ? '第一级：流体工程师验证' :
                       t.currentStage === 'manager_confirm' ? '第二级：项目负责人确认' :
                       latest ? `${latest.approverName}` : '—'}
                    </span>
                    <span className="text-neut-1 font-mono">
                      CV {t.statistics?.cvDiameter.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
            {displayedTasks.length === 0 && (
              <div className="text-center py-10 text-neut-1 text-xs">暂无审批记录</div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="glass-panel p-5 xl:col-span-3">
          {selected ? (
            <div>
              <div className="flex items-start justify-between mb-5 pb-4 border-b border-surface/50">
                <div>
                  <h2 className="heading-display text-lg text-neut-2 mb-1">{selected.name}</h2>
                  <p className="text-[11px] text-neut-1">
                    任务 ID: {selected.id} · 负责人: {selected.owner} · 完成时间: {new Date(selected.updatedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/tasks/${selected.id}/report`)}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <FileBarChart size={13} /> 查看完整报告
                </button>
              </div>

              {/* Approval timeline */}
              <div className="mb-5">
                <h3 className="text-xs text-neut-1 uppercase tracking-wider mb-3">审批时间线</h3>
                <div className="space-y-3">
                  {/* Step 1: completed */}
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-data-green/20 border border-data-green/60 flex items-center justify-center text-data-green text-xs">
                        <Check size={13} />
                      </div>
                      <div className="absolute left-1/2 top-7 w-0.5 h-6 -translate-x-1/2 bg-surface/60" />
                    </div>
                    <div className="pb-4">
                      <div className="text-xs text-neut-2 font-medium">模拟任务完成</div>
                      <div className="text-[10px] text-neut-1 mt-0.5">
                        液滴分析阶段结束，生成综合报告
                      </div>
                    </div>
                  </div>

                  {/* Step 2: engineer */}
                  <div className="flex gap-3">
                    {(() => {
                      const eng = selected.approvals.find(a => a.stage === 'engineer_verify');
                      const pending = selected.currentStage === 'engineer_verify';
                      const done = !!eng;
                      return (
                        <>
                          <div className={clsx(
                            'relative w-7 h-7 rounded-full border flex items-center justify-center text-xs',
                            done && eng?.decision === 'approved' ? 'bg-data-green/20 border-data-green/60 text-data-green' :
                            done && eng?.decision === 'rejected' ? 'bg-alert-red/20 border-alert-red/60 text-alert-red' :
                            pending ? 'bg-tech-cyan/20 border-tech-cyan text-tech-cyan animate-pulse' :
                            'bg-surface/30 border-surface text-neut-1'
                          )}>
                            {done && eng?.decision === 'approved' ? <Check size={13} /> :
                             done && eng?.decision === 'rejected' ? <X size={13} /> :
                             pending ? <Clock size={13} /> : '2'}
                          </div>
                          <div className="absolute left-1/2 top-7 w-0.5 h-6 -translate-x-1/2 bg-surface/60" />
                        </>
                      );
                    })()}
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-xs text-neut-2 font-medium">流体工程师验证</div>
                        <span className="text-[10px] text-neut-1 px-1.5 py-0.5 rounded bg-surface/40">第一级</span>
                      </div>
                      {(() => {
                        const eng = selected.approvals.find(a => a.stage === 'engineer_verify');
                        const pending = selected.currentStage === 'engineer_verify';
                        if (eng) {
                          return (
                            <>
                              <div className="text-[11px] text-neut-1">
                                {eng.approverName} · {new Date(eng.createdAt).toLocaleString('zh-CN')}
                              </div>
                              <div className="mt-1.5 p-2 rounded-md bg-surface/20 border border-surface/60 text-[11px] text-neut-2">
                                {eng.comments}
                              </div>
                            </>
                          );
                        }
                        if (pending) {
                          return <div className="text-[11px] text-tech-cyan">等待流体工程师处理...</div>;
                        }
                        return <div className="text-[11px] text-neut-1">尚未到达此阶段</div>;
                      })()}
                    </div>
                  </div>

                  {/* Step 3: manager */}
                  <div className="flex gap-3">
                    {(() => {
                      const mgr = selected.approvals.find(a => a.stage === 'manager_confirm');
                      const pending = selected.currentStage === 'manager_confirm';
                      const done = !!mgr;
                      return (
                        <>
                          <div className={clsx(
                            'w-7 h-7 rounded-full border flex items-center justify-center text-xs',
                            done && mgr?.decision === 'approved' ? 'bg-data-green/20 border-data-green/60 text-data-green' :
                            done && mgr?.decision === 'rejected' ? 'bg-alert-red/20 border-alert-red/60 text-alert-red' :
                            pending ? 'bg-tech-cyan/20 border-tech-cyan text-tech-cyan animate-pulse' :
                            'bg-surface/30 border-surface text-neut-1'
                          )}>
                            {done && mgr?.decision === 'approved' ? <Check size={13} /> :
                             done && mgr?.decision === 'rejected' ? <X size={13} /> :
                             pending ? <Clock size={13} /> : '3'}
                          </div>
                        </>
                      );
                    })()}
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-xs text-neut-2 font-medium">项目负责人确认</div>
                        <span className="text-[10px] text-neut-1 px-1.5 py-0.5 rounded bg-surface/40">第二级</span>
                      </div>
                      {(() => {
                        const mgr = selected.approvals.find(a => a.stage === 'manager_confirm');
                        const pending = selected.currentStage === 'manager_confirm';
                        if (mgr) {
                          return (
                            <>
                              <div className="text-[11px] text-neut-1">
                                {mgr.approverName} · {new Date(mgr.createdAt).toLocaleString('zh-CN')}
                              </div>
                              <div className="mt-1.5 p-2 rounded-md bg-surface/20 border border-surface/60 text-[11px] text-neut-2">
                                {mgr.comments}
                              </div>
                              {mgr.decision === 'approved' && (
                                <div className="mt-2 text-[11px] text-data-green flex items-center gap-1">
                                  <Award size={12} /> 已推送至光刻掩模版生成系统
                                </div>
                              )}
                            </>
                          );
                        }
                        if (pending) {
                          return <div className="text-[11px] text-tech-cyan">等待项目负责人处理...</div>;
                        }
                        return <div className="text-[11px] text-neut-1">尚未到达此阶段</div>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { l: '生成频率', v: selected.statistics?.generationFrequency.toFixed(0) ?? '—', u: 'Hz', c: 'text-tech-cyan' },
                  { l: '变异系数 CV', v: selected.statistics?.cvDiameter.toFixed(2) ?? '—', u: '%', c: (selected.statistics?.cvDiameter ?? 10) < 5 ? 'text-data-green' : 'text-alert-orange' },
                  { l: '平均直径', v: selected.statistics?.meanDiameter.toFixed(2) ?? '—', u: 'μm', c: 'text-purple-400' },
                  { l: '卫星液滴', v: selected.statistics?.hasSatellite ? (selected.statistics.satelliteCount + '个') : '无', u: '', c: selected.statistics?.hasSatellite ? 'text-alert-red' : 'text-data-green' },
                ].map((m, i) => (
                  <div key={i} className="p-3 rounded-md border border-surface/60 bg-deep-space/40 text-center">
                    <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-1">{m.l}</div>
                    <div className={'data-number text-lg ' + m.c}>{m.v}<span className="text-[10px] text-neut-1 ml-0.5">{m.u}</span></div>
                  </div>
                ))}
              </div>

              {/* Action section */}
              {selected.currentStage !== 'none' && canApprove(selected.currentStage as ApprovalStage) ? (
                <div className="p-4 rounded-lg border border-tech-cyan/30 bg-gradient-to-br from-tech-cyan/5 to-transparent">
                  <div className="text-xs text-neut-1 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-tech-cyan" />
                    {selected.currentStage === 'engineer_verify' ? '流体工程师审批操作' : '项目负责人审批操作'}
                  </div>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="请输入审批意见..."
                    className="input-field h-20 resize-none mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => doApprove('rejected')} className="btn-danger text-xs flex items-center gap-1.5">
                      <XCircle size={13} /> 驳回
                    </button>
                    <button onClick={() => doApprove('approved')} className="btn-primary text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> 通过
                    </button>
                  </div>
                </div>
              ) : selected.currentStage === 'none' && selected.approvals.length > 0 ? (
                <div className="p-4 rounded-md border border-data-green/30 bg-data-green/5 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-data-green shrink-0" />
                  <div>
                    <div className="text-sm text-neut-2 font-medium">两级审批均已通过</div>
                    <div className="text-[11px] text-neut-1 mt-0.5">
                      模拟结果已确认可行，已推送至光刻掩模版生成系统。
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-md border border-surface/50 bg-deep-space/40 text-center text-sm text-neut-1">
                  当前角色无此阶段审批权限
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-neut-1 text-sm">
              请选择一项审批任务查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
