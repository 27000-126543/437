import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import {
  Upload,
  FileUp,
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Sparkles,
  X,
  Info,
  Droplets,
  Grid3x3,
  Activity,
  Gauge,
  Zap,
} from 'lucide-react';
import Droplet3DView from '@/components/Droplet3DView';
import { GEOMETRY_META, type GeometryType } from '@/types';
import { clsx } from 'clsx';

const STEPS = [
  { id: 0, label: '几何构型', icon: Grid3x3, desc: '上传或选择微流道几何' },
  { id: 1, label: '流体参数', icon: Droplets, desc: '两相流体物性参数' },
  { id: 2, label: '边界条件', icon: Activity, desc: '流速、压力、润湿性' },
  { id: 3, label: '网格设置', icon: Grid3x3, desc: '自适应网格参数' },
  { id: 4, label: '确认提交', icon: Check, desc: '预览并启动模拟' },
];

export default function NewSimulation() {
  const navigate = useNavigate();
  const { createTask, geometries, fluidPresets, updateTaskProgress } = useAppStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    taskName: '',
    geometryId: '',
    geometryType: 'flow-focusing' as GeometryType,
    channelWidth: 80,
    channelDepth: 40,
    interfacialTension: 12.5,
    continuousViscosity: 8.5,
    dispersedViscosity: 2.1,
    flowRateRatio: 7,
    continuousVelocity: 0.028,
    dispersedPressure: 48,
    surfaceWettability: 75,
    adaptiveMesh: true,
    refinementLevel: 4,
    boundaryLayers: 5,
    meshQualityTarget: 0.9,
    uploadedFile: null as File | null,
    uploadedFileName: '',
  });
  const [dragOver, setDragOver] = useState(false);

  const setField = (k: any, v: any) => setForm(f => ({ ...f, [k]: v }));

  const canProceed = () => {
    if (step === 0) return form.geometryId || form.uploadedFileName || true;
    if (step === 1)
      return (
        form.interfacialTension > 0 &&
        form.continuousViscosity > 0 &&
        form.dispersedViscosity > 0
      );
    if (step === 2)
      return form.flowRateRatio > 0 && form.continuousVelocity > 0 && form.dispersedPressure > 0;
    if (step === 3) return form.refinementLevel >= 1 && form.meshQualityTarget > 0;
    return form.taskName.trim().length > 2;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setField('uploadedFile', f);
      setField('uploadedFileName', f.name);
      setField('geometryId', geometries[0].id);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setField('uploadedFile', f);
      setField('uploadedFileName', f.name);
      setField('geometryId', geometries[0].id);
    }
  };

  const submit = () => {
    const task = createTask({
      name: form.taskName || `${GEOMETRY_META[form.geometryType].label} - 新模拟任务`,
      geometryId: form.geometryId || geometries[0].id,
      fluidParams: {
        interfacialTension: form.interfacialTension,
        continuousViscosity: form.continuousViscosity,
        dispersedViscosity: form.dispersedViscosity,
        flowRateRatio: form.flowRateRatio,
        continuousVelocity: form.continuousVelocity,
        dispersedPressure: form.dispersedPressure,
        surfaceWettability: form.surfaceWettability,
      },
    });
    // 自动推进前两个阶段以演示状态流转
    setTimeout(() => updateTaskProgress(task.id), 1200);
    setTimeout(() => updateTaskProgress(task.id), 2400);
    navigate(`/tasks/${task.id}/monitor`);
  };

  const estimatedCells = Math.round(
    (form.channelWidth * form.channelDepth * 500) / Math.pow(2, form.refinementLevel) * 60,
  );

  return (
    <div className="min-h-full max-w-7xl mx-auto">
      <PageHeader
        title="新建两相流模拟任务"
        subtitle="配置微流道几何、流体物性与边界条件，系统将自动构建模型与自适应网格"
        actions={
          <button onClick={() => navigate('/tasks')} className="btn-secondary text-sm flex items-center gap-2">
            <ArrowLeft size={14} /> 返回任务列表
          </button>
        }
      />

      {/* Stepper */}
      <div className="glass-panel p-5 mb-5">
        <div className="flex items-start justify-between relative">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.id} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      'relative z-10 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all',
                      done
                        ? 'bg-data-green/20 border-data-green text-data-green shadow-glow-green'
                        : active
                          ? 'bg-tech-cyan/20 border-tech-cyan text-tech-cyan shadow-glow-cyan scale-110'
                          : 'bg-surface/30 border-surface text-neut-1',
                    )}
                  >
                    {done ? <Check size={17} /> : <Icon size={17} />}
                  </div>
                  <div className={clsx('mt-2 text-xs font-medium', active ? 'text-tech-cyan' : done ? 'text-neut-2' : 'text-neut-1')}>
                    {s.label}
                  </div>
                  <div className="mt-0.5 text-[10px] text-neut-1 text-center max-w-[140px]">{s.desc}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={clsx(
                      'absolute top-5 right-0 translate-x-1/2 w-full h-0.5 -z-0',
                      done ? 'bg-gradient-to-r from-data-green to-tech-cyan' : 'bg-surface/60',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Form */}
        <div className="glass-panel p-6 xl:col-span-2">
          {step === 0 && (
            <div>
              <h2 className="heading-display text-lg text-neut-2 mb-1 flex items-center gap-2">
                <Grid3x3 size={18} className="text-tech-cyan" />
                微流道几何构型
              </h2>
              <p className="text-sm text-neut-1 mb-5">上传几何文件或选择内置构型模板</p>

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={clsx(
                  'border-2 border-dashed rounded-xl p-8 text-center transition-all mb-5',
                  dragOver
                    ? 'border-tech-cyan bg-tech-cyan/5'
                    : form.uploadedFileName
                      ? 'border-data-green/50 bg-data-green/5'
                      : 'border-surface hover:border-tech-cyan/50 hover:bg-surface/20',
                )}
              >
                {form.uploadedFileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-data-green/20 border border-data-green/50 flex items-center justify-center">
                      <FileUp size={18} className="text-data-green" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-neut-2 font-medium">{form.uploadedFileName}</div>
                      <div className="text-[11px] text-neut-1 mt-0.5">文件已就绪，可进行参数配置</div>
                    </div>
                    <button
                      onClick={() => { setField('uploadedFile', null); setField('uploadedFileName', ''); }}
                      className="ml-4 p-1.5 rounded hover:bg-alert-red/10 text-neut-1 hover:text-alert-red"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={36} className="mx-auto text-neut-1 mb-3" />
                    <div className="text-sm text-neut-2 mb-1">拖放几何文件到此区域，或</div>
                    <label className="inline-block">
                      <input type="file" accept=".stl,.step,.iges,.stp,.obj" onChange={onFileSelect} className="hidden" />
                      <span className="text-sm text-tech-cyan cursor-pointer hover:underline">点击选择文件</span>
                    </label>
                    <div className="text-[11px] text-neut-1 mt-2">支持 STL / STEP / IGES / OBJ · 最大 120MB</div>
                  </>
                )}
              </div>

              <div className="text-xs text-neut-1 mb-2 uppercase tracking-wider">或选择内置构型</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(GEOMETRY_META) as GeometryType[]).map(k => {
                  const active = form.geometryType === k;
                  return (
                    <button
                      key={k}
                      onClick={() => {
                        setField('geometryType', k);
                        const g = geometries.find(x => x.type === k);
                        if (g) {
                          setField('geometryId', g.id);
                          setField('channelWidth', g.channelWidth);
                          setField('channelDepth', g.channelDepth);
                        }
                      }}
                      className={clsx(
                        'p-3 rounded-lg border text-left transition-all relative overflow-hidden',
                        active
                          ? 'border-tech-cyan/60 bg-tech-cyan/10 shadow-glow-cyan'
                          : 'border-surface/60 bg-deep-space/40 hover:border-tech-cyan/30',
                      )}
                    >
                      {active && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-tech-cyan flex items-center justify-center">
                          <Check size={10} className="text-deep-space" />
                        </div>
                      )}
                      <div className="h-16 rounded-md bg-mid-space/60 mb-2 overflow-hidden">
                        <Droplet3DView geometryType={k} channelWidth={60} animate={false} />
                      </div>
                      <div className="text-xs font-medium text-neut-2">{GEOMETRY_META[k].label}</div>
                      <div className="text-[10px] text-neut-1 mt-0.5 line-clamp-2">{GEOMETRY_META[k].desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <label className="label-text">通道宽度 (μm)</label>
                  <input
                    type="number"
                    value={form.channelWidth}
                    onChange={e => setField('channelWidth', +e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">通道深度 (μm)</label>
                  <input
                    type="number"
                    value={form.channelDepth}
                    onChange={e => setField('channelDepth', +e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="heading-display text-lg text-neut-2 mb-1 flex items-center gap-2">
                <Droplets size={18} className="text-tech-cyan" />
                两相流体物性参数
              </h2>
              <p className="text-sm text-neut-1 mb-5">连续相（外层）与分散相（液滴相）的基础物理属性</p>

              <div className="p-3 rounded-md border border-tech-cyan/30 bg-tech-cyan/5 mb-5 flex gap-3">
                <Info size={16} className="text-tech-cyan shrink-0 mt-0.5" />
                <div className="text-xs text-neut-2 leading-relaxed">
                  油包水体系通常界面张力 5-25 mN/m，水包油体系 1-8 mN/m。
                  连续相黏度高于分散相有利于单分散液滴生成。
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label-text">界面张力 γ (mN/m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.interfacialTension}
                    onChange={e => setField('interfacialTension', +e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.1"
                    value={form.interfacialTension}
                    onChange={e => setField('interfacialTension', +e.target.value)}
                    className="w-full mt-2 accent-tech-cyan"
                  />
                </div>
                <div>
                  <label className="label-text">连续相黏度 μc (mPa·s)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.continuousViscosity}
                    onChange={e => setField('continuousViscosity', +e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="range"
                    min="0.5"
                    max="100"
                    step="0.1"
                    value={form.continuousViscosity}
                    onChange={e => setField('continuousViscosity', +e.target.value)}
                    className="w-full mt-2 accent-tech-cyan"
                  />
                </div>
                <div>
                  <label className="label-text">分散相黏度 μd (mPa·s)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.dispersedViscosity}
                    onChange={e => setField('dispersedViscosity', +e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="range"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={form.dispersedViscosity}
                    onChange={e => setField('dispersedViscosity', +e.target.value)}
                    className="w-full mt-2 accent-tech-cyan"
                  />
                </div>
              </div>

              <div className="text-xs text-neut-1 uppercase tracking-wider mt-6 mb-3">快速加载预设</div>
              <div className="grid grid-cols-3 gap-3">
                {fluidPresets.map((fp, i) => (
                  <button
                    key={fp.id}
                    onClick={() =>
                      setForm(f => ({
                        ...f,
                        interfacialTension: fp.interfacialTension,
                        continuousViscosity: fp.continuousViscosity,
                        dispersedViscosity: fp.dispersedViscosity,
                        flowRateRatio: fp.flowRateRatio,
                        continuousVelocity: fp.continuousVelocity,
                        dispersedPressure: fp.dispersedPressure,
                        surfaceWettability: fp.surfaceWettability,
                      }))
                    }
                    className="p-3 rounded-md border border-surface/60 bg-deep-space/40 hover:border-tech-cyan/40 hover:bg-surface/30 transition-all text-left"
                  >
                    <div className="text-xs font-medium text-neut-2 mb-1">预设 #{i + 1}</div>
                    <div className="text-[11px] text-neut-1 font-mono space-y-0.5">
                      <div>γ = {fp.interfacialTension} mN/m</div>
                      <div>μc/μd = {fp.continuousViscosity}/{fp.dispersedViscosity}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="heading-display text-lg text-neut-2 mb-1 flex items-center gap-2">
                <Activity size={18} className="text-tech-cyan" />
                边界条件与润湿性
              </h2>
              <p className="text-sm text-neut-1 mb-5">流速比、入口流速、压力驱动与通道表面润湿性</p>

              <div className="grid grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="label-text flex items-center justify-between">
                    <span>流速比 Qc : Qd</span>
                    <span className="font-mono text-tech-cyan">{form.flowRateRatio.toFixed(2)} : 1</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.flowRateRatio}
                    onChange={e => setField('flowRateRatio', +e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.1"
                    value={form.flowRateRatio}
                    onChange={e => setField('flowRateRatio', +e.target.value)}
                    className="w-full mt-2 accent-tech-cyan"
                  />
                </div>
                <div>
                  <label className="label-text flex items-center justify-between">
                    <span>连续相入口流速 Vc (m/s)</span>
                    <span className="font-mono text-tech-cyan">{form.continuousVelocity.toFixed(4)}</span>
                  </label>
                  <input
                    type="number"
                    step="0.0005"
                    value={form.continuousVelocity}
                    onChange={e => setField('continuousVelocity', +e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.0005"
                    value={form.continuousVelocity}
                    onChange={e => setField('continuousVelocity', +e.target.value)}
                    className="w-full mt-2 accent-tech-cyan"
                  />
                </div>
                <div>
                  <label className="label-text flex items-center justify-between">
                    <span>分散相驱动压力 Pd (kPa)</span>
                    <span className="font-mono text-tech-cyan">{form.dispersedPressure}</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={form.dispersedPressure}
                    onChange={e => setField('dispersedPressure', +e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="1"
                    value={form.dispersedPressure}
                    onChange={e => setField('dispersedPressure', +e.target.value)}
                    className="w-full mt-2 accent-alert-orange"
                  />
                </div>
                <div>
                  <label className="label-text flex items-center justify-between">
                    <span>通道表面接触角 θ (°)</span>
                    <span className="font-mono text-tech-cyan">{form.surfaceWettability}°</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-data-green">亲水</span>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      step="1"
                      value={form.surfaceWettability}
                      onChange={e => setField('surfaceWettability', +e.target.value)}
                      className="flex-1 accent-tech-cyan"
                    />
                    <span className="text-[10px] text-alert-orange">疏水</span>
                  </div>
                  <input
                    type="number"
                    value={form.surfaceWettability}
                    onChange={e => setField('surfaceWettability', +e.target.value)}
                    className="input-field mt-2"
                  />
                </div>
              </div>

              <div className="p-3 rounded-md border border-alert-orange/30 bg-alert-orange/5 flex gap-3">
                <Zap size={16} className="text-alert-orange shrink-0 mt-0.5" />
                <div className="text-xs text-neut-2 leading-relaxed">
                  <span className="text-alert-orange font-medium">智能建议：</span>
                  根据所选构型「{GEOMETRY_META[form.geometryType].label}」，推荐流速比 5-10、连续相流速 0.02-0.04 m/s 以获得稳定单分散液滴。
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="heading-display text-lg text-neut-2 mb-1 flex items-center gap-2">
                <Grid3x3 size={18} className="text-tech-cyan" />
                计算网格设置
              </h2>
              <p className="text-sm text-neut-1 mb-5">自适应网格加密方案，平衡计算精度与资源消耗</p>

              <div className="flex items-center gap-3 mb-5">
                <label className="flex items-center gap-2 p-3 rounded-md border border-surface bg-deep-space/40 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={form.adaptiveMesh}
                    onChange={e => setField('adaptiveMesh', e.target.checked)}
                    className="accent-tech-cyan"
                  />
                  <div>
                    <div className="text-xs text-neut-2 font-medium">启用自适应网格加密</div>
                    <div className="text-[11px] text-neut-1">在相界面区域自动加密，全局节省约40%计算量</div>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-md border border-surface bg-deep-space/40 cursor-pointer flex-1">
                  <Gauge size={16} className="text-tech-cyan" />
                  <div>
                    <div className="text-xs text-neut-2 font-medium">预计网格规模</div>
                    <div className="text-[11px] font-mono text-tech-cyan">{(estimatedCells / 1e6).toFixed(2)} M 单元</div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-text">基础加密层级</label>
                  <select
                    value={form.refinementLevel}
                    onChange={e => setField('refinementLevel', +e.target.value)}
                    className="input-field"
                  >
                    {[2, 3, 4, 5, 6, 7].map(l => (
                      <option key={l} value={l}>Level {l} ({Math.pow(2, l)} 细分)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">边界层数量</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={form.boundaryLayers}
                    onChange={e => setField('boundaryLayers', +e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">网格质量目标</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="1"
                    value={form.meshQualityTarget}
                    onChange={e => setField('meshQualityTarget', +e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 rounded-md border border-surface bg-mid-space/30">
                <div className="text-xs text-neut-1 uppercase tracking-wider mb-3">资源预估</div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="data-number text-xl text-tech-cyan">{(estimatedCells / 1e6).toFixed(2)}M</div>
                    <div className="text-[10px] text-neut-1 mt-1">网格单元</div>
                  </div>
                  <div>
                    <div className="data-number text-xl text-data-green">6-12</div>
                    <div className="text-[10px] text-neut-1 mt-1">计算小时</div>
                  </div>
                  <div>
                    <div className="data-number text-xl text-alert-orange">128</div>
                    <div className="text-[10px] text-neut-1 mt-1">内存占用 (GB)</div>
                  </div>
                  <div>
                    <div className="data-number text-xl text-neut-2">24</div>
                    <div className="text-[10px] text-neut-1 mt-1">CPU 核心</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="heading-display text-lg text-neut-2 mb-1 flex items-center gap-2">
                <Sparkles size={18} className="text-tech-cyan" />
                配置确认与提交
              </h2>
              <p className="text-sm text-neut-1 mb-5">请检查参数设置，确认无误后启动模拟任务</p>

              <div className="mb-4">
                <label className="label-text">模拟任务名称</label>
                <input
                  value={form.taskName}
                  onChange={e => setField('taskName', e.target.value)}
                  placeholder={`${GEOMETRY_META[form.geometryType].label} - Qc/Qd=${form.flowRateRatio} - ${new Date().toLocaleDateString()}`}
                  className="input-field text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-md border border-surface/60 bg-deep-space/40">
                  <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-2">几何构型</div>
                  <div className="text-sm text-neut-2 font-medium mb-1">{GEOMETRY_META[form.geometryType].label}</div>
                  <div className="text-[11px] text-neut-1 font-mono space-y-0.5">
                    <div>{form.uploadedFileName || '内置模板'}</div>
                    <div>宽 {form.channelWidth}μm × 深 {form.channelDepth}μm</div>
                  </div>
                </div>
                <div className="p-3 rounded-md border border-surface/60 bg-deep-space/40">
                  <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-2">流体物性</div>
                  <div className="text-[11px] font-mono text-neut-2 space-y-0.5">
                    <div>界面张力 γ = {form.interfacialTension} mN/m</div>
                    <div>μc = {form.continuousViscosity} / μd = {form.dispersedViscosity} mPa·s</div>
                    <div>黏度比 λ = {(form.continuousViscosity / form.dispersedViscosity).toFixed(2)}</div>
                  </div>
                </div>
                <div className="p-3 rounded-md border border-surface/60 bg-deep-space/40">
                  <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-2">边界条件</div>
                  <div className="text-[11px] font-mono text-neut-2 space-y-0.5">
                    <div>流速比 Qc/Qd = {form.flowRateRatio} : 1</div>
                    <div>Vc = {form.continuousVelocity.toFixed(4)} m/s</div>
                    <div>Pd = {form.dispersedPressure} kPa</div>
                    <div>θ = {form.surfaceWettability}°</div>
                  </div>
                </div>
                <div className="p-3 rounded-md border border-surface/60 bg-deep-space/40">
                  <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-2">网格设置</div>
                  <div className="text-[11px] font-mono text-neut-2 space-y-0.5">
                    <div>{form.adaptiveMesh ? '✓ 自适应' : '✗ 自适应'} · Level {form.refinementLevel}</div>
                    <div>边界层 {form.boundaryLayers} 层</div>
                    <div>规模 ≈ {(estimatedCells / 1e6).toFixed(2)} M 单元</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-tech-cyan/30 bg-gradient-to-br from-tech-cyan/5 to-blue-900/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tech-cyan/20 border border-tech-cyan/40 flex items-center justify-center shrink-0">
                    <Sparkles size={18} className="text-tech-cyan" />
                  </div>
                  <div>
                    <div className="text-sm text-neut-2 font-medium mb-1">AI 推荐评分</div>
                    <div className="text-[12px] text-neut-1 mb-2">
                      根据您的参数组合，预计可生成单分散性良好的液滴，尺寸变异系数 CV ≈
                      <span className="data-number text-data-green ml-1 text-base"> 2.8%</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Circle
                          key={i}
                          size={14}
                          className={i <= 4 ? 'text-data-green fill-data-green' : 'text-surface'}
                        />
                      ))}
                      <span className="text-[11px] text-neut-1 ml-1 self-center">优秀（4.2/5）</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between pt-4 border-t border-surface/50">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={14} /> 上一步
            </button>
            <div className="text-xs font-mono text-neut-1">
              步骤 {step + 1} / {STEPS.length}
            </div>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
                disabled={!canProceed()}
                className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一步 <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canProceed()}
                className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles size={14} /> 启动模拟任务
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="glass-panel p-4">
            <div className="text-xs text-neut-1 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Circle size={8} className="text-data-green fill-data-green animate-pulse" />
              实时预览
            </div>
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-surface/50">
              <Droplet3DView
                geometryType={form.geometryType}
                channelWidth={form.channelWidth}
                hasSatellite={form.flowRateRatio < 3}
              />
            </div>
          </div>

          <div className="glass-panel p-4">
            <div className="text-xs text-neut-1 uppercase tracking-wider mb-3">关键无量纲数</div>
            <div className="space-y-3">
              {[
                {
                  l: '毛细管数 Ca',
                  v: ((form.continuousViscosity * 1e-3 * form.continuousVelocity) / (form.interfacialTension * 1e-3)).toExponential(2),
                  r: (form.continuousViscosity * form.continuousVelocity) / form.interfacialTension < 0.1
                    ? 'good'
                    : 'warn',
                },
                {
                  l: '雷诺数 Re',
                  v: ((1000 * form.continuousVelocity * (form.channelWidth * 1e-6)) / (form.continuousViscosity * 1e-3)).toExponential(2),
                  r: 'good',
                },
                {
                  l: '韦伯数 We',
                  v: (
                    (1000 * Math.pow(form.continuousVelocity, 2) * (form.channelWidth * 1e-6)) /
                    (form.interfacialTension * 1e-3)
                  ).toExponential(2),
                  r: 'warn',
                },
                {
                  l: 'Ohnesorge Oh',
                  v: Math.sqrt(form.continuousViscosity / form.dispersedViscosity / 1000).toFixed(3),
                  r: 'good',
                },
              ].map((k, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-neut-2 font-mono">{k.l}</span>
                  <span
                    className={
                      'data-number text-xs ' +
                      (k.r === 'good' ? 'text-data-green' : 'text-alert-orange')
                    }
                  >
                    {k.v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-4">
            <div className="text-xs text-neut-1 uppercase tracking-wider mb-3">模拟流水线</div>
            <div className="space-y-2">
              {[
                { n: '三维模型构建', d: '30s' },
                { n: '自适应网格生成', d: '4-8min' },
                { n: '两相流场初始化', d: '2min' },
                { n: '瞬态求解器计算', d: '5-10h' },
                { n: '液滴统计分析', d: '2min' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-tech-cyan/15 border border-tech-cyan/40 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-tech-cyan" />
                  </div>
                  <span className="text-xs text-neut-2 flex-1">{s.n}</span>
                  <span className="text-[10px] font-mono text-neut-1">{s.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
