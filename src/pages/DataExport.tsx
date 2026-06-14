import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import { HistogramChart } from '@/components/charts';
import {
  Download,
  Filter,
  ChevronDown,
  Table,
  FileSpreadsheet,
  Database,
  ChevronRight,
  Check,
  Eye,
  Settings,
  ArrowLeft,
  FileText,
  Film,
  Layers,
  Zap,
  FileDown,
} from 'lucide-react';
import { GEOMETRY_META, type GeometryType } from '@/types';
import { clsx } from 'clsx';

type ExportFormat = 'csv' | 'vtk' | 'tecplot' | 'json';

export default function DataExport() {
  const navigate = useNavigate();
  const { tasks, geometries } = useAppStore();
  const [showF, setShowF] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Filters
  const [geoFilter, setGeoFilter] = useState<string>('all');
  const [flowRatioRange, setFlowRatioRange] = useState<[number, number]>([1, 20]);
  const [tensionRange, setTensionRange] = useState<[number, number]>([1, 50]);
  const [widthRange, setWidthRange] = useState<[number, number]>([20, 200]);
  const [cvThreshold, setCvThreshold] = useState<number>(5);

  const filtered = tasks.filter(t => {
    if (geoFilter !== 'all' && t.geometry.type !== geoFilter) return false;
    if (t.fluidParams.flowRateRatio < flowRatioRange[0] || t.fluidParams.flowRateRatio > flowRatioRange[1]) return false;
    if (t.fluidParams.interfacialTension < tensionRange[0] || t.fluidParams.interfacialTension > tensionRange[1]) return false;
    if (t.geometry.channelWidth < widthRange[0] || t.geometry.channelWidth > widthRange[1]) return false;
    if ((t.statistics?.cvDiameter ?? 10) > cvThreshold) return false;
    return true;
  });

  const toggleTask = (id: string) => {
    setSelectedTasks(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setSelectedTasks(filtered.map(t => t.id));
  };

  const clearAll = () => {
    setSelectedTasks([]);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSV = (taskList: typeof filtered): string) => {
    const headers = [
      '任务ID', '任务名称', '几何构型', '通道宽度(μm)', '通道深度(μm)',
      '界面张力(mN/m)', '连续相黏度(mPa·s)', '分散相黏度(mPa·s)',
      '流速比Qc/Qd', '连续相流速(m/s)', '分散相压力(kPa)', '接触角(°)',
      '生成频率(Hz)', '平均直径(μm)', '尺寸CV(%)', '最小直径(μm)', '最大直径(μm)',
      '压力降(kPa)', '是否有卫星液滴', '多分散指数',
    ];
    const rows = taskList.map(t => [
      t.id,
      t.name,
      t.geometry.type,
      t.geometry.channelWidth,
      t.geometry.channelDepth,
      t.fluidParams.interfacialTension,
      t.fluidParams.continuousViscosity,
      t.fluidParams.dispersedViscosity,
      t.fluidParams.flowRateRatio,
      t.fluidParams.continuousVelocity,
      t.fluidParams.dispersedPressure,
      t.fluidParams.surfaceWettability,
      t.statistics?.generationFrequency ?? 'N/A',
      t.statistics?.meanDiameter ?? 'N/A',
      t.statistics?.cvDiameter ?? 'N/A',
      t.statistics?.minDiameter ?? 'N/A',
      t.statistics?.maxDiameter ?? 'N/A',
      t.statistics?.pressureDrop ?? 'N/A',
      t.statistics?.hasSatellite ? '是' : '否',
      t.statistics?.polydispersityIndex ?? 'N/A',
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const generateJSON = (taskList: typeof filtered): string => {
    const data = taskList.map(t => ({
      id: t.id,
      name: t.name,
      status: t.status,
      geometry: t.geometry,
      fluidParams: t.fluidParams,
      statistics: t.statistics,
      meshInfo: t.meshInfo,
      adjustments: t.adjustments,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
    return JSON.stringify(data, null, 2);
  };

  const generateVTK = (taskList: typeof filtered): string => {
    let content = '# vtk DataFile Version 3.0\n';
    content += 'MicroFlow CFD Phase Field Data\n';
    content += 'ASCII\n';
    content += 'DATASET RECTILINEAR_GRID\n';
    const nx = 50;
    const ny = 25;
    const nz = 1;
    content += `DIMENSIONS ${nx} ${ny} ${nz}\n`;
    content += `X_COORDINATES ${nx} float\n`;
    for (let i = 0; i < nx; i++) {
      content += (i * 2).toFixed(2) + ' ';
    }
    content += `\nY_COORDINATES ${ny} float\n`;
    for (let i = 0; i < ny; i++) {
      content += (i * 2).toFixed(2) + ' ';
    }
    content += `\nZ_COORDINATES ${nz} float\n0.0\n`;
    content += `POINT_DATA ${nx * ny * nz}\n`;
    content += 'SCALARS phase_field float 1\n';
    content += 'LOOKUP_TABLE default\n';
    for (let i = 0; i < nx * ny * nz; i++) {
      const x = (i % nx) * 2;
      const y = Math.floor(i / nx) * 2;
      const centerX = 100 + 20 * Math.sin(y / 25 * Math.PI);
      const r = 15;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - 25, 2));
      const phase = dist < r ? 1.0 : 0.0;
      content += phase.toFixed(4) + '\n';
    }
    content += '\nSCALARS velocity_x float 1\n';
    content += 'LOOKUP_TABLE default\n';
    for (let i = 0; i < nx * ny * nz; i++) {
      const vx = 0.02 + 0.005 * Math.sin(i / 100);
      content += vx.toFixed(6) + '\n';
    }
    return content;
  };

  const generateTecplot = (taskList: typeof filtered): string => {
    let content = 'TITLE = "MicroFlow CFD Simulation Data"\n';
    content += 'VARIABLES = "X" "Y" "Phase" "U" "V" "P"\n';
    content += `ZONE T="Zone 1" I=50 J=25 K=1 F=POINT\n';
    for (let j = 0; j < 25; j++) {
      for (let i = 0; i < 50; i++) {
        const x = i * 2;
        const y = j * 2;
        const centerX = 100 + 20 * Math.sin(y / 25 * Math.PI);
        const r = 15;
        const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - 25, 2));
        const phase = dist < r ? 1.0 : 0.0;
        const u = 0.028 + 0.005 * Math.sin(i / 10);
        const v = 0.001 * Math.cos(j / 5);
        const p = 50 + 5 * Math.sin(i / 20);
        content += `${x.toFixed(3)} ${y.toFixed(3)} ${phase.toFixed(4)} ${u.toFixed(6)} ${v.toFixed(6)} ${p.toFixed(3)}\n`;
      }
    }
    return content;
  };

  const handleExport = () => {
    const taskList = filtered.filter(t => selectedTasks.includes(t.id));
    if (taskList.length === 0) return;
    setExporting(true);
    setProgress(0);
    let current = 0;
    const total = taskList.length;
    const id = setInterval(() => {
      current++;
      const pct = Math.min(100, Math.round((current / total) * 100));
      setProgress(pct);
      if (current >= total) {
        clearInterval(id);
        setTimeout(() => {
          const timestamp = new Date().toISOString().slice(0, 10);
          const extMap: Record<ExportFormat, { gen: (tl: any) => string, mime: string, ext: string> = {
            csv: { gen: generateCSV, mime: 'text/csv', ext: '.csv' },
            json: { gen: generateJSON, mime: 'application/json', ext: '.json' },
            vtk: { gen: generateVTK, mime: 'text/plain', ext: '.vtk' },
            tecplot: { gen: generateTecplot, mime: 'text/plain', ext: '.plt' },
          };
          const cfg = extMap[format];
          const content = cfg.gen(taskList);
          downloadFile(content, `microflow_export_${timestamp}${cfg.ext}`, cfg.mime);
          setExporting(false);
          setProgress(0);
        }, 600);
      }
    }, 200);
  };

  const formats: { key: ExportFormat; label: string; icon: any; desc: string; ext: string }[] = [
    { key: 'csv', label: 'CSV 表格', icon: FileSpreadsheet, desc: '液滴统计数据，Excel兼容', ext: '.csv' },
    { key: 'vtk', label: 'VTK 场数据', icon: Database, desc: '全场相场、速度、压力', ext: '.vtk' },
    { key: 'tecplot', label: 'TecPlot 格式', icon: Layers, desc: '专业CFD后处理格式', ext: '.plt' },
    { key: 'json', label: 'JSON 结构化', icon: FileText, desc: 'API 接口友好格式', ext: '.json' },
  ];

  const exportOptions = [
    { l: '液滴尺寸分布数据', checked: true },
    { l: '生成频率时间序列', checked: true },
    { l: '压力降时间序列', checked: true },
    { l: 'CV 变异系数序列', checked: false },
    { l: '全场速度场数据', checked: false },
    { l: '相场等值面数据', checked: false },
    { l: '网格质量信息', checked: true },
    { l: '模拟日志与参数', checked: true },
  ];

  // Sample preview data
  const previewData = filtered.slice(0, 3);
  const avgDist = Array.from({ length: 11 }, (_, i) => {
    const bin = 18 + i * 2;
    return { bin, count: Math.round(Math.exp(-Math.pow((bin - 25) / 4, 2)) * 240 + Math.random() * 20) };
  });

  return (
    <div className="min-h-full">
      <PageHeader
        title="数据导出中心"
        subtitle="按参数维度筛选并导出全场相场数据和液滴统计结果"
        tags={[
          { label: `${selectedTasks.length} 项已选`, color: selectedTasks.length > 0 ? 'border-tech-cyan/40 text-tech-cyan bg-tech-cyan/5' : 'border-neut-1/40 text-neut-1 bg-neut-1/5' },
        ]}
        actions={
          <>
            <button onClick={() => navigate('/tasks')} className="btn-secondary text-xs flex items-center gap-1.5">
              <ArrowLeft size={13} /> 返回任务
            </button>
            <button
              onClick={handleExport}
              disabled={selectedTasks.length === 0 || exporting}
              className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-40"
            >
              <Download size={13} /> {exporting ? '导出中...' : '批量导出'}
            </button>
          </>
        }
      />

      {/* Export progress */}
      {exporting && (
        <div className="glass-panel p-4 mb-4 border-tech-cyan/40">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-neut-2 font-medium flex items-center gap-2">
              <FileDown size={16} className="text-tech-cyan animate-bounce" />
              正在导出 {selectedTasks.length} 个任务的数据...
            </div>
            <span className="data-number text-sm text-tech-cyan">{Math.min(100, progress).toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-tech-cyan to-data-green transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Filters */}
        <div className="glass-panel p-4 xl:col-span-1">
          <div className="text-xs text-neut-1 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>筛选条件</span>
            <button onClick={() => setShowF(!showF)} className="text-tech-cyan text-[11px]">
              重置
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label-text">几何构型</label>
              <select value={geoFilter} onChange={e => setGeoFilter(e.target.value)} className="input-field text-xs">
                <option value="all">全部构型</option>
                {Object.entries(GEOMETRY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text flex justify-between">
                <span>流速比 Qc/Qd</span>
                <span className="font-mono text-tech-cyan">{flowRatioRange[0]} - {flowRatioRange[1]}</span>
              </label>
              <div className="space-y-2">
                <input
                  type="range" min="1" max="30" value={flowRatioRange[0]}
                  onChange={e => setFlowRatioRange([+e.target.value, flowRatioRange[1]])}
                  className="w-full accent-tech-cyan"
                />
                <input
                  type="range" min="1" max="30" value={flowRatioRange[1]}
                  onChange={e => setFlowRatioRange([flowRatioRange[0], +e.target.value])}
                  className="w-full accent-tech-cyan"
                />
              </div>
            </div>

            <div>
              <label className="label-text flex justify-between">
                <span>界面张力 (mN/m)</span>
                <span className="font-mono text-tech-cyan">{tensionRange[0]} - {tensionRange[1]}</span>
              </label>
              <div className="space-y-2">
                <input
                  type="range" min="1" max="50" value={tensionRange[0]}
                  onChange={e => setTensionRange([+e.target.value, tensionRange[1]])}
                  className="w-full accent-tech-cyan"
                />
                <input
                  type="range" min="1" max="50" value={tensionRange[1]}
                  onChange={e => setTensionRange([tensionRange[0], +e.target.value])}
                  className="w-full accent-tech-cyan"
                />
              </div>
            </div>

            <div>
              <label className="label-text flex justify-between">
                <span>通道宽度 (μm)</span>
                <span className="font-mono text-tech-cyan">{widthRange[0]} - {widthRange[1]}</span>
              </label>
              <div className="space-y-2">
                <input
                  type="range" min="10" max="300" step="5" value={widthRange[0]}
                  onChange={e => setWidthRange([+e.target.value, widthRange[1]])}
                  className="w-full accent-tech-cyan"
                />
                <input
                  type="range" min="10" max="300" step="5" value={widthRange[1]}
                  onChange={e => setWidthRange([widthRange[0], +e.target.value])}
                  className="w-full accent-tech-cyan"
                />
              </div>
            </div>

            <div>
              <label className="label-text flex justify-between">
                <span>CV ≤ {cvThreshold}%</span>
                <span className="font-mono text-data-green">{cvThreshold}%</span>
              </label>
              <input
                type="range" min="1" max="15" step="0.5" value={cvThreshold}
                onChange={e => setCvThreshold(+e.target.value)}
                className="w-full accent-data-green"
              />
            </div>

            <div className="pt-2 border-t border-surface/50">
              <div className="flex justify-between text-[11px] text-neut-1 mb-2">
                <span>筛选结果</span>
                <span className="font-mono text-tech-cyan">{filtered.length} / {tasks.length}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={selectAll} className="flex-1 btn-secondary text-xs py-1.5">
                  全选
                </button>
                <button onClick={clearAll} className="flex-1 btn-secondary text-xs py-1.5">
                  清空
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Task list + format */}
        <div className="xl:col-span-3 space-y-4">
          {/* Format selection */}
          <div className="glass-panel p-4">
            <div className="text-xs text-neut-1 uppercase tracking-wider mb-3">导出格式</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formats.map(f => {
                const Icon = f.icon;
                const active = format === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className={clsx(
                      'p-3 rounded-lg border text-left transition-all relative',
                      active
                        ? 'border-tech-cyan/60 bg-tech-cyan/10 shadow-glow-cyan'
                        : 'border-surface/50 bg-deep-space/40 hover:border-tech-cyan/30',
                    )}
                  >
                    {active && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-data-green flex items-center justify-center">
                        <Check size={12} className="text-deep-space" />
                      </div>
                    )}
                    <Icon size={20} className={active ? 'text-tech-cyan' : 'text-neut-1'} />
                    <div className={'text-sm font-medium mt-2 ' + (active ? 'text-neut-2' : 'text-neut-2')}>
                      {f.label}
                    </div>
                    <div className="text-[10px] text-neut-1 mt-0.5">{f.desc}</div>
                    <div className="text-[10px] font-mono text-neut-1 mt-1">{f.ext}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export options */}
          <div className="glass-panel p-4">
            <div className="text-xs text-neut-1 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Settings size={12} /> 导出内容选项
              </span>
              <span className="text-[10px] text-neut-1 font-mono">8 项可选</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {exportOptions.map((o, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-md border border-surface/50 bg-deep-space/40 cursor-pointer hover:border-tech-cyan/30 transition-all"
                >
                  <input type="checkbox" defaultChecked={o.checked} className="accent-tech-cyan" />
                  <span className="text-xs text-neut-2">{o.l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Task list */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-neut-1 uppercase tracking-wider flex items-center gap-1.5">
                <Table size={12} /> 可导出任务列表
              </div>
              <span className="text-[10px] text-neut-1 font-mono">
                已选 {selectedTasks.length} / {filtered.length}
              </span>
            </div>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <div className="text-center py-8 text-neut-1 text-xs">
                  没有符合筛选条件的任务
                </div>
              )}
              {filtered.map(t => {
                const checked = selectedTasks.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all',
                      checked
                        ? 'border-tech-cyan/60 bg-tech-cyan/10'
                        : 'border-surface/50 bg-deep-space/40 hover:border-tech-cyan/30',
                    )}
                  >
                    <div className={clsx(
                      'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all',
                      checked
                        ? 'bg-tech-cyan border-tech-cyan'
                        : 'border-surface bg-transparent',
                    )}>
                      {checked && <Check size={12} className="text-deep-space" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neut-2 font-medium truncate">{t.name}</div>
                      <div className="text-[11px] text-neut-1 font-mono mt-0.5">
                        {GEOMETRY_META[t.geometry.type]?.label} · Qc/Qd={t.fluidParams.flowRateRatio.toFixed(1)} · γ={t.fluidParams.interfacialTension}mN/m
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={'data-number text-xs ' + ((t.statistics?.cvDiameter ?? 10) < 5 ? 'text-data-green' : 'text-alert-orange')}>
                        CV {t.statistics?.cvDiameter.toFixed(2)}%
                      </div>
                      <div className="text-[10px] text-neut-1 font-mono">
                        {t.statistics?.generationFrequency.toFixed(0)}Hz
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/tasks/${t.id}/report`); }}
                      className="p-1.5 rounded hover:bg-tech-cyan/10 text-tech-cyan"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-neut-1 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={12} /> 数据预览（已选）
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <div className="text-[11px] text-neut-1 mb-1">平均液滴尺寸分布</div>
                <HistogramChart bins={avgDist} meanD={25} cv={3.2} height={140} />
              </div>
              <div>
                <div className="text-[11px] text-neut-1 mb-1">数据规模预估</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-surface/40">
                    <span className="text-neut-1">任务数</span>
                    <span className="font-mono text-neut-2">{selectedTasks.length} 个</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface/40">
                    <span className="text-neut-1">液滴总数</span>
                    <span className="font-mono text-neut-2">{(selectedTasks.length * 2400).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface/40">
                    <span className="text-neut-1">CSV 大小</span>
                    <span className="font-mono text-tech-cyan">{(selectedTasks.length * 0.8).toFixed(1)} MB</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neut-1">VTK 大小</span>
                    <span className="font-mono text-alert-orange">{(selectedTasks.length * 128).toFixed(0)} MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
