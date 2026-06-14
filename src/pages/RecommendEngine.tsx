import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import { HistogramChart, HeatmapChart, TimeSeriesChart } from '@/components/charts';
import {
  Sparkles,
  Target,
  Zap,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  BarChart3,
  Play,
  Filter,
  ChevronDown,
  Droplets,
  Gauge,
  Activity,
  Layers,
  BrainCircuit,
  Cpu,
  Award,
  X,
  Check,
  Info,
  Edit3,
  ArrowRight,
} from 'lucide-react';
import { GEOMETRY_META, type GeometryType, type Recommendation } from '@/types';
import { clsx } from 'clsx';

export default function RecommendEngine() {
  const navigate = useNavigate();
  const { recommendations, tasks, createTask, geometries } = useAppStore();
  const [selectedGeo, setSelectedGeo] = useState<GeometryType | 'all'>('all');
  const [selectedRec, setSelectedRec] = useState(0);
  const [showF, setShowF] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmForm, setConfirmForm] = useState({
    taskName: '',
    continuousVelocity: 0,
    dispersedPressure: 0,
    flowRateRatio: 0,
  });

  const filteredRecs =
    selectedGeo === 'all'
      ? recommendations
      : recommendations.filter(r => r.geometryType === selectedGeo);

  const rec = filteredRecs[selectedRec] ?? filteredRecs[0];

  // History comparison data
  const historyTasks = tasks.filter(
    t => rec && t.geometry.type === rec.geometryType && t.statistics,
  ).slice(0, 8);

  // Heatmap: velocity x pressure -> cv
  const velocities = ['0.015', '0.020', '0.025', '0.030', '0.035', '0.040'];
  const pressures = ['20', '30', '40', '50', '60', '70'];
  const heatRows = pressures.map(p => ({
    label: p + ' kPa',
    values: velocities.map(() => +(1.5 + Math.random() * 5.5).toFixed(2)),
  }));

  // Size distribution comparison
  const recDist = Array.from({ length: 11 }, (_, i) => {
    const bin = 18 + i * 2;
    return { bin, count: Math.round(Math.exp(-Math.pow((bin - 26) / 3.5, 2)) * 280) };
  });
  const avgDist = Array.from({ length: 11 }, (_, i) => {
    const bin = 18 + i * 2;
    return { bin, count: Math.round(Math.exp(-Math.pow((bin - 25) / 5, 2)) * 200) };
  });

  const openConfirm = () => {
    if (!rec) return;
    setConfirmForm({
      taskName: `AI推荐方案 - ${rec.geometryLabel} - Qc=${rec.optimalContinuousVelocity.toFixed(3)}m/s`,
      continuousVelocity: rec.optimalContinuousVelocity,
      dispersedPressure: rec.optimalDispersedPressure,
      flowRateRatio: rec.optimalFlowRateRatio,
    });
    setShowConfirm(true);
  };

  const confirmAndCreate = () => {
    if (!rec) return;
    setApplying(true);
    setTimeout(() => {
      const geo = geometries.find(g => g.type === rec.geometryType);
      const t = createTask({
        name: confirmForm.taskName,
        geometryId: geo?.id,
        geometry: geo ? { ...geo } : undefined,
        fluidParams: {
          continuousVelocity: confirmForm.continuousVelocity,
          dispersedPressure: confirmForm.dispersedPressure,
          flowRateRatio: confirmForm.flowRateRatio,
          interfacialTension: 12.5,
          continuousViscosity: 8.5,
          dispersedViscosity: 2.1,
          surfaceWettability: 75,
        },
        recommendationSource: {
          recommendationId: rec.id,
          geometryLabel: rec.geometryLabel,
          predictedCv: rec.predictedCv,
          predictedFrequency: rec.predictedFrequency,
          confidence: rec.confidence,
        },
      });
      setShowConfirm(false);
      setApplying(false);
      navigate(`/tasks/${t.id}/monitor`);
    }, 800);
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="智能参数推荐引擎"
        subtitle="基于历史模拟数据的AI推荐，助力快速定位最优单分散液滴参数空间"
        tags={[
          { label: 'ML 模型 v2.4', color: 'border-tech-cyan/40 text-tech-cyan bg-tech-cyan/5' },
          { label: `${recommendations.length} 个构型方案`, color: 'border-data-green/40 text-data-green bg-data-green/5' },
        ]}
        actions={
          <>
            <button onClick={() => setShowF(!showF)} className="btn-secondary text-xs flex items-center gap-1.5">
              <Filter size={13} /> 筛选 <ChevronDown size={12} />
            </button>
            <button
              onClick={openConfirm}
              disabled={!rec}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Sparkles size={13} /> 应用推荐方案
            </button>
          </>
        }
      />

      {showF && (
        <div className="glass-panel p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label-text">几何构型</label>
            <select value={selectedGeo} onChange={e => setSelectedGeo(e.target.value as any)} className="input-field">
              <option value="all">全部构型</option>
              {Object.entries(GEOMETRY_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">目标 CV</label>
            <select className="input-field">
              <option>&lt; 2% (超单分散)</option>
              <option>&lt; 3% (高单分散)</option>
              <option>&lt; 5% (单分散)</option>
              <option>任意</option>
            </select>
          </div>
          <div>
            <label className="label-text">推荐排序</label>
            <select className="input-field">
              <option>置信度优先</option>
              <option>CV最小优先</option>
              <option>频率最高优先</option>
              <option>样本量优先</option>
            </select>
          </div>
        </div>
      )}

      {/* AI Engine banner */}
      <div className="glass-panel p-5 mb-4 relative overflow-hidden border-tech-cyan/30">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-tech-cyan/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-purple-500/15 to-transparent blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-tech-cyan/25 to-blue-900/40 border border-tech-cyan/40 flex items-center justify-center shadow-glow-cyan shrink-0">
            <BrainCircuit size={28} className="text-tech-cyan" />
          </div>
          <div className="flex-1">
            <h2 className="heading-display text-xl text-neut-2 mb-1">AI 参数优化引擎</h2>
            <p className="text-sm text-neut-1">
              基于 {tasks.length} 组历史模拟数据，{recommendations.length} 种几何构型的参数空间已完成模型训练。
              模型每 24 小时自动更新，支持实时推理最优工艺参数组合。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="data-number text-2xl text-tech-cyan">94.2%</div>
              <div className="text-[10px] text-neut-1 mt-1">预测准确率</div>
            </div>
            <div>
              <div className="data-number text-2xl text-data-green">68%</div>
              <div className="text-[10px] text-neut-1 mt-1">实验迭代减少</div>
            </div>
            <div>
              <div className="data-number text-2xl text-alert-orange">3.2x</div>
              <div className="text-[10px] text-neut-1 mt-1">研发效率提升</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Recommendation cards list */}
        <div className="glass-panel p-3 xl:col-span-1 max-h-[calc(100vh-320px)] overflow-y-auto">
          <div className="text-xs text-neut-1 px-2 mb-2 flex items-center justify-between">
            <span>推荐方案列表</span>
            <span className="text-[10px] font-mono text-tech-cyan">{filteredRecs.length} 个</span>
          </div>
          <div className="space-y-2">
            {filteredRecs.map((r, i) => {
              const active = i === selectedRec;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRec(i)}
                  className={clsx(
                    'w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden',
                    active
                      ? 'border-tech-cyan/60 bg-gradient-to-br from-tech-cyan/10 to-transparent shadow-glow-cyan'
                      : 'border-surface/50 bg-deep-space/40 hover:border-tech-cyan/30 hover:bg-surface/20',
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs font-medium text-neut-2">{r.geometryLabel}</div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={10}
                          className={s <= Math.round(r.confidence * 5) ? 'text-data-yellow fill-yellow-400' : 'text-surface'}
                          style={s <= Math.round(r.confidence * 5) ? { color: '#FFD166', fill: '#FFD166' } : {}}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div>
                      <div className="text-neut-1">CV 预测</div>
                      <div className="text-data-green text-sm">{r.predictedCv.toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="text-neut-1">频率</div>
                      <div className="text-tech-cyan text-sm">{r.predictedFrequency.toFixed(0)}Hz</div>
                    </div>
                    <div>
                      <div className="text-neut-1">流速比</div>
                      <div className="text-neut-2">{r.optimalFlowRateRatio.toFixed(1)}:1</div>
                    </div>
                    <div>
                      <div className="text-neut-1">数据量</div>
                      <div className="text-neut-2">{r.sourceTaskCount}组</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail view */}
        <div className="xl:col-span-3 space-y-4">
          {rec && (
            <>
              {/* Key params highlight */}
              <div className="glass-panel p-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="heading-display text-lg text-neut-2">{rec.geometryLabel} · 最优参数方案</h2>
                      <span className="status-badge border border-data-green/40 bg-data-green/10 text-data-green text-[10px]">
                        <Award size={11} /> 推荐度 {(rec.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-neut-1">
                      基于 {rec.sourceTaskCount} 组历史模拟数据训练，{GEOMETRY_META[rec.geometryType]?.desc}...
                    </p>
                  </div>
                  <button
                    onClick={openConfirm}
                    className="btn-primary text-sm flex items-center gap-1.5"
                  >
                    <Play size={14} /> 立即应用
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { l: '连续相流速', v: rec.optimalContinuousVelocity.toFixed(4), u: 'm/s', i: Activity, c: 'text-tech-cyan' },
                    { l: '分散相压力', v: rec.optimalDispersedPressure.toFixed(0), u: 'kPa', i: Gauge, c: 'text-purple-400' },
                    { l: '流速比 Qc/Qd', v: rec.optimalFlowRateRatio.toFixed(2), u: ':1', i: Zap, c: 'text-alert-orange' },
                    { l: '预期 CV', v: rec.predictedCv.toFixed(2), u: '%', i: Target, c: 'text-data-green' },
                  ].map((m, i) => {
                    const Icon = m.i;
                    return (
                      <div key={i} className="p-4 rounded-lg border border-surface/60 bg-deep-space/40 relative overflow-hidden">
                        <div className="absolute top-3 right-3">
                          <Icon size={16} className={m.c + ' opacity-40'} />
                        </div>
                        <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-1">{m.l}</div>
                        <div className={'data-number text-xl ' + m.c}>
                          {m.v}<span className="text-xs text-neut-1 ml-0.5">{m.u}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comparison charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-4">
                  <h3 className="heading-display text-xs text-neut-2 mb-3 flex items-center gap-2">
                    <BarChart3 size={13} className="text-tech-cyan" />
                    尺寸分布对比
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-data-green">● AI 推荐方案</span>
                        <span className="font-mono">CV {rec.predictedCv.toFixed(2)}%</span>
                      </div>
                      <HistogramChart bins={recDist} meanD={26} cv={rec.predictedCv} height={120} />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-tech-cyan">● 历史平均水平</span>
                        <span className="font-mono">CV 4.2%</span>
                      </div>
                      <HistogramChart bins={avgDist} meanD={25} cv={4.2} height={120} />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-surface/50 flex items-center gap-2">
                    <TrendingDown size={14} className="text-data-green" />
                    <span className="text-[11px] text-data-green">
                      CV 降低 {(4.2 - rec.predictedCv).toFixed(2)} 个百分点，单分散性显著提升
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-4">
                  <h3 className="heading-display text-xs text-neut-2 mb-3 flex items-center gap-2">
                    <Clock size={13} className="text-tech-cyan" />
                    历史任务表现
                  </h3>
                  <div className="space-y-2 max-h-[260px] overflow-y-auto">
                    {historyTasks.length === 0 && (
                      <div className="text-center py-8 text-neut-1 text-xs">暂无同构型历史数据</div>
                    )}
                    {historyTasks.map(t => (
                      <button
                        key={t.id}
                        onClick={() => navigate(`/tasks/${t.id}/report`)}
                        className="w-full p-2.5 rounded-md border border-surface/50 bg-deep-space/30 hover:border-tech-cyan/40 hover:bg-surface/20 transition-all text-left flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-md bg-surface/60 flex items-center justify-center shrink-0">
                          <Droplets size={14} className="text-tech-cyan" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-neut-2 truncate">{t.name}</div>
                          <div className="text-[10px] text-neut-1 font-mono mt-0.5">
                            Qc/Qd = {t.fluidParams.flowRateRatio.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={
                            'data-number text-xs ' +
                            ((t.statistics?.cvDiameter ?? 10) < 5 ? 'text-data-green' : 'text-alert-orange')
                          }>
                            CV {t.statistics?.cvDiameter.toFixed(2)}%
                          </div>
                          <div className="text-[10px] text-neut-1 font-mono">
                            {t.statistics?.generationFrequency.toFixed(0)}Hz
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Heatmap */}
              <div className="glass-panel p-5">
                <h3 className="heading-display text-sm text-neut-2 mb-2 flex items-center gap-2">
                  <Layers size={16} className="text-tech-cyan" />
                  参数空间热力图
                </h3>
                <p className="text-xs text-neut-1 mb-3">
                  连续相流速 × 分散相压力 → 尺寸变异系数 CV(%) · 绿色=优
                </p>
                <HeatmapChart rows={heatRows} columns={velocities} height={320} />
                <div className="mt-3 flex items-center gap-4 text-[11px] text-neut-1">
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-data-yellow" style={{ color: '#FFD166', fill: '#FFD166' }} />
                    推荐最优参数点
                  </span>
                  <span>已探索 {velocities.length * pressures.length * 0.6} 个参数组合</span>
                </div>
              </div>

              {/* Trend of optimization */}
              <div className="glass-panel p-5">
                <h3 className="heading-display text-sm text-neut-2 mb-2">模型优化收敛趋势</h3>
                <p className="text-xs text-neut-1 mb-3">近30天推荐方案预测 CV 持续下降，模型精度迭代提升</p>
                <TimeSeriesChart
                  series={[
                    { name: '预测CV', data: Array.from({ length: 30 }, (_, i) => ({ time: i, value: 5.5 - i * 0.12 + Math.sin(i / 4) * 0.3 })), color: '#00D4FF' },
                    { name: '实际平均CV', data: Array.from({ length: 30 }, (_, i) => ({ time: i, value: 6.2 - i * 0.09 + Math.sin(i / 5 + 1) * 0.4 })), color: '#00FF88', dashed: true },
                  ]}
                  yName="CV (%)"
                  height={260}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showConfirm && rec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-space/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xl mx-4 p-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 p-1.5 rounded hover:bg-surface/40 text-neut-1 hover:text-neut-2"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-tech-cyan/15 border border-tech-cyan/40 flex items-center justify-center">
                <Sparkles size={20} className="text-tech-cyan" />
              </div>
              <div>
                <h3 className="heading-display text-base text-neut-2">应用推荐方案</h3>
                <p className="text-xs text-neut-1 mt-0.5">确认参数后将创建新模拟任务</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-text">任务名称</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={confirmForm.taskName}
                    onChange={e => setConfirmForm(f => ({ ...f, taskName: e.target.value }))}
                    className="input-field flex-1 pr-9"
                  />
                  <button
                    onClick={() => setConfirmForm(f => ({ ...f, taskName: `AI推荐方案 - ${rec.geometryLabel} - Qc=${rec.optimalContinuousVelocity.toFixed(3)}m/s` }))}
                    className="px-2 text-tech-cyan hover:bg-tech-cyan/10 rounded text-xs"
                    title="重置为推荐名称"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-tech-cyan/30 bg-tech-cyan/5">
                <div className="text-xs text-tech-cyan font-medium mb-2 flex items-center gap-1.5">
                  <Info size={13} />
                  推荐构型信息
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-neut-1 text-[10px] mb-0.5">几何构型</div>
                    <div className="text-neut-2">{rec.geometryLabel}</div>
                  </div>
                  <div>
                    <div className="text-neut-1 text-[10px] mb-0.5">构型类型</div>
                    <div className="text-neut-2">{GEOMETRY_META[rec.geometryType].label}</div>
                  </div>
                  <div>
                    <div className="text-neut-1 text-[10px] mb-0.5">预测 CV</div>
                    <div className="text-neut-2 font-mono text-data-green">{rec.predictedCv.toFixed(2)} %</div>
                  </div>
                  <div>
                    <div className="text-neut-1 text-[10px] mb-0.5">预测生成频率</div>
                    <div className="text-neut-2 font-mono">{rec.predictedFrequency.toFixed(0)} Hz</div>
                  </div>
                  <div>
                    <div className="text-neut-1 text-[10px] mb-0.5">置信度</div>
                    <div className="text-neut-2 font-mono">{(rec.confidence * 100).toFixed(0)} %</div>
                  </div>
                  <div>
                    <div className="text-neut-1 text-[10px] mb-0.5">来源任务数</div>
                    <div className="text-neut-2 font-mono">{rec.sourceTaskCount} 个</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-surface/60 bg-deep-space/40">
                <div className="text-xs text-neut-2 font-medium mb-3 flex items-center gap-1.5">
                  <Zap size={13} className="text-data-green" />
                  推荐参数（可微调）
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label-text !text-[10px]">连续相流速 (m/s)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={confirmForm.continuousVelocity}
                      onChange={e => setConfirmForm(f => ({ ...f, continuousVelocity: +e.target.value }))}
                      className="input-field text-xs"
                    />
                  </div>
                  <div>
                    <label className="label-text !text-[10px]">分散相压力 (kPa)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={confirmForm.dispersedPressure}
                      onChange={e => setConfirmForm(f => ({ ...f, dispersedPressure: +e.target.value }))}
                      className="input-field text-xs"
                    />
                  </div>
                  <div>
                    <label className="label-text !text-[10px]">流速比 Qc/Qd</label>
                    <input
                      type="number"
                      step="0.1"
                      value={confirmForm.flowRateRatio}
                      onChange={e => setConfirmForm(f => ({ ...f, flowRateRatio: +e.target.value }))}
                      className="input-field text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-neut-1">
                <Info size={12} className="text-alert-orange shrink-0" />
                <span>创建后任务将自动追溯此推荐来源，报告页可查看推荐参数对比</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary text-sm flex-1"
                disabled={applying}
              >
                取消
              </button>
              <button
                onClick={confirmAndCreate}
                disabled={applying || !confirmForm.taskName.trim()}
                className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
              >
                {applying ? (
                  <>创建中...</>
                ) : (
                  <>
                    创建并开始模拟 <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
