import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, StatusBadge, StatusTimeline } from '@/components/ui';
import { TimeSeriesChart, GaugeChart, HistogramChart } from '@/components/charts';
import { useAppStore } from '@/store/appStore';
import Droplet3DView from '@/components/Droplet3DView';
import {
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  Bell,
  Cpu,
  Clock,
  Gauge,
  Grid3x3,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Activity,
  ThermometerSun,
  Droplets,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function RealtimeMonitor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, updateTaskProgress, createAlertForTask } = useAppStore();
  const task = tasks.find(t => t.id === id);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(4823);

  useEffect(() => {
    const id1 = setInterval(() => setTick(t => t + 1), 1500);
    const id2 = setInterval(() => !paused && setElapsed(e => e + 1), 1000);
    return () => { clearInterval(id1); clearInterval(id2); };
  }, [paused]);

  useEffect(() => {
    if (!task || tick === 0) return;
    // 每10个tick自动推进阶段
    if (tick > 0 && tick % 10 === 0 && !paused) {
      if (task.status !== 'completed' && task.status !== 'error_fallback') {
        updateTaskProgress(task.id);
      }
    }
    // 模拟预警
    if (tick > 0 && tick % 18 === 0 && !paused && task.status === 'two_phase_computing') {
      createAlertForTask(task.id);
    }
  }, [tick]);

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64 text-neut-1">
        未找到任务 {id}
        <button onClick={() => navigate('/tasks')} className="ml-4 btn-secondary">返回</button>
      </div>
    );
  }

  const stats = task.statistics;
  const baseFreq = stats?.generationFrequency ?? 180;
  const baseCv = stats?.cvDiameter ?? 2.5;
  const baseP = stats?.pressureDrop ?? 3.2;
  const liveFreq = baseFreq + Math.sin(tick / 2) * 8 + (Math.random() - 0.5) * 4;
  const liveCv = baseCv + Math.sin(tick / 3) * 0.5 + (Math.random() - 0.5) * 0.3;
  const liveP = baseP + Math.sin(tick / 4) * 0.2;

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const cpuLoad = 78 + Math.sin(tick / 5) * 8;
  const memUse = 62 + Math.sin(tick / 6) * 6;

  const isRunning = task.status === 'two_phase_computing' || task.status === 'mesh_generation' || task.status === 'initialization';

  return (
    <div className="min-h-full">
      <PageHeader
        title={task.name}
        subtitle={`任务 ID: ${task.id} · 负责人: ${task.owner}`}
        tags={[
          { label: isRunning ? '运行中' : '非活动', color: isRunning ? 'border-data-green/40 text-data-green bg-data-green/5' : 'border-neut-1/40 text-neut-1 bg-neut-1/5' },
        ]}
        actions={
          <>
            <button onClick={() => navigate('/tasks')} className="btn-secondary text-xs flex items-center gap-1.5">
              <ArrowLeft size={13} /> 返回
            </button>
            {task.status === 'completed' ? (
              <button onClick={() => navigate(`/tasks/${task.id}/report`)} className="btn-primary text-xs flex items-center gap-1.5">
                <BarChart3 size={13} /> 查看报告
              </button>
            ) : (
              <>
                <button onClick={() => setPaused(p => !p)} className="btn-secondary text-xs flex items-center gap-1.5">
                  {paused ? <Play size={13} /> : <Pause size={13} />} {paused ? '继续' : '暂停'}
                </button>
                <button onClick={() => updateTaskProgress(task.id)} className="btn-primary text-xs flex items-center gap-1.5">
                  <Play size={13} /> 推进阶段
                </button>
              </>
            )}
          </>
        }
      />

      {/* Status + Runtime Header */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        <div className="glass-panel p-4 xl:col-span-2">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <StatusBadge status={task.status} size="md" />
              <div>
                <div className="text-xs text-neut-1">进度 {task.progress}%</div>
                <div className="text-xs text-neut-1 flex items-center gap-1">
                  <Clock size={11} /> 已运行 {formatTime(elapsed)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <div className="text-neut-1">计算步</div>
                <div className="text-tech-cyan">{(12000 + tick * 48).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-neut-1">时间步长</div>
                <div className="text-data-green">1.2e-6 s</div>
              </div>
              <div>
                <div className="text-neut-1">库朗数</div>
                <div className="text-neut-2">0.38</div>
              </div>
            </div>
          </div>
          <StatusTimeline status={task.status} progress={task.progress} />
        </div>

        <div className="glass-panel p-4">
          <div className="text-xs text-neut-1 uppercase tracking-wider mb-3">计算资源占用</div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neut-1 flex items-center gap-1.5"><Cpu size={12} /> CPU</span>
                <span className="font-mono text-tech-cyan">{cpuLoad.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-tech-cyan to-data-green transition-all duration-500" style={{ width: `${cpuLoad}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neut-1 flex items-center gap-1.5"><Activity size={12} /> 内存</span>
                <span className="font-mono text-tech-cyan">{memUse.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-tech-cyan transition-all duration-500" style={{ width: `${memUse}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neut-1 flex items-center gap-1.5"><ThermometerSun size={12} /> GPU 温度</span>
                <span className="font-mono text-alert-orange">{(62 + Math.sin(tick / 4) * 3).toFixed(0)}°C</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-data-green via-tech-cyan to-alert-orange transition-all duration-500" style={{ width: `${65}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface/50 grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div>
              <div className="text-neut-1">MPI节点</div>
              <div className="text-neut-2">12 / 16</div>
            </div>
            <div>
              <div className="text-neut-1">I/O带宽</div>
              <div className="text-neut-2">{(2.3 + Math.random() * 0.6).toFixed(1)} GB/s</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-5">
        {/* 3D Viewport */}
        <div className="glass-panel p-4 xl:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="heading-display text-sm text-neut-2 mb-0.5">相场三维可视化</h3>
              <p className="text-[11px] text-neut-1">VOF / Phase-Field 相场显示 · 可交互旋转</p>
            </div>
            <div className="flex gap-1">
              {['XY', 'YZ', 'XZ', '3D'].map((v, i) => (
                <button
                  key={v}
                  className={
                    'px-2.5 py-1 rounded text-[10px] font-mono border transition-colors ' +
                    (i === 3
                      ? 'border-tech-cyan/50 bg-tech-cyan/10 text-tech-cyan'
                      : 'border-surface text-neut-1 hover:border-tech-cyan/30 hover:text-neut-2')
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="aspect-[16/7] rounded-lg overflow-hidden border border-surface/60">
            <Droplet3DView
              geometryType={task.geometry.type}
              channelWidth={task.geometry.channelWidth}
              hasSatellite={stats?.hasSatellite}
            />
          </div>
        </div>

        {/* Gauges */}
        <div className="space-y-4">
          <div className="glass-panel p-3">
            <GaugeChart
              value={liveFreq}
              max={500}
              label="生成频率"
              unit="Hz"
              threshold={baseFreq * 1.05}
            />
          </div>
          <div className="glass-panel p-3">
            <GaugeChart
              value={liveCv}
              max={10}
              label="尺寸变异系数"
              unit="%"
              threshold={5}
            />
          </div>
          <div className="glass-panel p-3">
            <GaugeChart value={liveP} max={12} label="通道压力降" unit="kPa" />
          </div>
        </div>
      </div>

      {/* Time Series Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="heading-display text-xs text-neut-2 mb-0.5">生成频率时间序列</h3>
              <p className="text-[10px] text-neut-1">实时更新 · 阈值 5% 波动告警</p>
            </div>
            <Droplets size={14} className="text-tech-cyan" />
          </div>
          <TimeSeriesChart
            series={[{
              name: '生成频率 f(Hz)',
              data:
                stats?.frequencySeries.map((d, i) => ({
                  time: d.time,
                  value: d.value + Math.sin((tick + i) / 3) * 2,
                })) ?? [],
              color: '#00D4FF',
            }]}
            yName="频率 (Hz)"
            threshold={{ value: baseFreq * 0.95, label: '下阈值' }}
            height={220}
          />
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="heading-display text-xs text-neut-2 mb-0.5">CV变异系数曲线</h3>
              <p className="text-[10px] text-neut-1">超过5%触发复核流程</p>
            </div>
            <Gauge size={14} className="text-alert-orange" />
          </div>
          <TimeSeriesChart
            series={[{
              name: 'CV (%)',
              data:
                stats?.cvSeries.map((d, i) => ({
                  time: d.time,
                  value: Math.min(8, d.value + Math.sin((tick + i) / 4) * 0.4),
                })) ?? [],
              color: '#00FF88',
            }]}
            yName="CV (%)"
            threshold={{ value: 5, label: '告警阈值', color: '#FF6B35' }}
            height={220}
          />
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="heading-display text-xs text-neut-2 mb-0.5">压力降曲线</h3>
              <p className="text-[10px] text-neut-1">通道入口-出口压差</p>
            </div>
            <Zap size={14} className="text-purple-400" />
          </div>
          <TimeSeriesChart
            series={[{
              name: 'ΔP (kPa)',
              data:
                stats?.pressureSeries.map((d, i) => ({
                  time: d.time,
                  value: d.value + Math.sin((tick + i) / 5) * 0.15,
                })) ?? [],
              color: '#C084FC',
            }]}
            yName="压力 (kPa)"
            height={220}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Size Distribution */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="heading-display text-xs text-neut-2 mb-0.5">在线液滴尺寸分布</h3>
              <p className="text-[10px] text-neut-1">累计计数 {stats ? stats.sizeDistribution.reduce((s, b) => s + b.count, 0) + tick * 7 : 0}</p>
            </div>
          </div>
          {stats && <HistogramChart bins={stats.sizeDistribution} meanD={stats.meanDiameter} cv={liveCv} height={240} />}
        </div>

        {/* Alerts Log */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="heading-display text-xs text-neut-2 mb-0.5">事件与预警日志</h3>
              <p className="text-[10px] text-neut-1">实时系统事件流</p>
            </div>
            <Bell size={14} className="text-neut-1" />
          </div>
          <div className="space-y-2 max-h-[270px] overflow-y-auto pr-1">
            {[
              { t: -5, l: 'info', m: '自适应网格加密，第 3 轮迭代完成' },
              { t: -30, l: 'warn', m: '界面张力梯度 > 阈值，建议检查表面活性剂' },
              { t: -80, l: 'info', m: '两相流初始化完成，VOF=0.5' },
              { t: -120, l: 'info', m: '边界条件加载：入口速度 0.028 m/s' },
              { t: -200, l: 'ok', m: `网格生成：${task.meshInfo?.cellCount.toLocaleString() ?? '1.2M'} 单元` },
              { t: -300, l: 'info', m: '任务调度：分配至 GPU 节点 node-07' },
              ...task.alerts.slice(0, 2).map(a => ({
                t: -Math.round((Date.now() - +new Date(a.createdAt)) / 1000),
                l: a.level === 'fatal' ? 'err' : a.level === 'critical' ? 'err' : 'warn',
                m: a.description,
              })),
            ].sort((a, b) => b.t - a.t).map((e, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="font-mono text-neut-1 shrink-0 w-12">
                  {e.t > -60 ? `${-e.t}s前` : e.t > -3600 ? `${Math.floor(-e.t / 60)}m前` : `${Math.floor(-e.t / 3600)}h前`}
                </span>
                <span
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                    e.l === 'err' ? 'bg-alert-red' : e.l === 'warn' ? 'bg-alert-orange' : e.l === 'ok' ? 'bg-data-green' : 'bg-tech-cyan',
                  )}
                />
                <span className="text-neut-2 flex-1">{e.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mesh & Params */}
        <div className="glass-panel p-4">
          <h3 className="heading-display text-xs text-neut-2 mb-3">配置与网格信息</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-surface/40">
              <span className="text-neut-1">几何构型</span>
              <span className="text-neut-2 font-mono">{task.geometry.fileName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface/40">
              <span className="text-neut-1">通道尺寸</span>
              <span className="text-neut-2 font-mono">{task.geometry.channelWidth}×{task.geometry.channelDepth}μm</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface/40">
              <span className="text-neut-1">流速比 Qc/Qd</span>
              <span className="text-tech-cyan font-mono">{task.fluidParams.flowRateRatio.toFixed(1)}:1</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface/40">
              <span className="text-neut-1">界面张力 γ</span>
              <span className="text-neut-2 font-mono">{task.fluidParams.interfacialTension} mN/m</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface/40">
              <span className="text-neut-1">μc / μd</span>
              <span className="text-neut-2 font-mono">{task.fluidParams.continuousViscosity}/{task.fluidParams.dispersedViscosity} mPa·s</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface/40">
              <span className="text-neut-1">接触角 θ</span>
              <span className="text-neut-2 font-mono">{task.fluidParams.surfaceWettability}°</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface/40">
              <span className="text-neut-1 flex items-center gap-1"><Grid3x3 size={11} /> 网格单元</span>
              <span className="text-neut-2 font-mono">{task.meshInfo?.cellCount.toLocaleString() ?? '—'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neut-1">网格质量</span>
              <span className={clsx('font-mono', task.meshInfo && task.meshInfo.qualityIndex > 0.85 ? 'text-data-green' : 'text-alert-orange')}>
                {task.meshInfo?.qualityIndex.toFixed(3) ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {task.alerts.filter(a => a.status === 'pending').length > 0 && (
        <div className="mt-5 p-4 rounded-xl border-2 border-alert-red/50 bg-gradient-to-r from-alert-red/10 to-alert-orange/5 shadow-glow-orange">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-alert-red/20 border border-alert-red/40 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-alert-red" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-alert-red font-medium mb-1">⚠ 待处理预警 ({task.alerts.filter(a => a.status === 'pending').length}条)</div>
              <div className="text-xs text-neut-2 mb-3">
                有模拟指标超过预设阈值，请前往预警复核中心处理，或点击下方按钮立即跳转。
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/alerts')} className="btn-primary text-xs flex items-center gap-1.5">
                  <Eye size={12} /> 前往复核中心
                </button>
                <button onClick={() => updateTaskProgress(task.id)} className="btn-secondary text-xs">
                  忽略并继续
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
