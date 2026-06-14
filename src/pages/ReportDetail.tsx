import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, StatusBadge } from '@/components/ui';
import { TimeSeriesChart, HistogramChart } from '@/components/charts';
import { useAppStore } from '@/store/appStore';
import Droplet3DView from '@/components/Droplet3DView';
import {
  ArrowLeft,
  Download,
  FileText,
  Share2,
  Printer,
  BarChart3,
  Droplets,
  Gauge,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  Settings,
  Sparkles,
  Table,
  Film,
  Layers,
} from 'lucide-react';
import { GEOMETRY_META, STATUS_META } from '@/types';
import jsPDF from 'jspdf';

const TABS = [
  { id: 'overview', label: '总览', icon: BarChart3 },
  { id: 'size', label: '尺寸分布', icon: Droplets },
  { id: 'frequency', label: '频率时序', icon: Activity },
  { id: 'pressure', label: '压力降', icon: Gauge },
  { id: 'interface', label: '界面演化', icon: Film },
  { id: 'data', label: '原始数据', icon: Table },
];

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, approveTask, currentRole } = useAppStore();
  const task = tasks.find(t => t.id === id);
  const [tab, setTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  if (!task || !task.statistics) {
    return (
      <div className="flex items-center justify-center h-64 text-neut-1">
        未找到任务或报告尚未生成...
        <button onClick={() => navigate('/tasks')} className="ml-4 btn-secondary">返回任务列表...</button>
      </div>
    );
  }

  const stats = task.statistics;

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

  const downloadPhaseField = () => {
    if (!task) return;
    let content = '# vtk DataFile Version 3.0\n';
    content += 'Phase Field Data - ' + task.name + '\n';
    content += 'ASCII\n';
    content += 'DATASET STRUCTURED_POINTS\n';
    const nx = 100;
    const ny = 50;
    const nz = 20;
    content += `DIMENSIONS ${nx} ${ny} ${nz}\n`;
    content += 'ORIGIN 0 0 0\n';
    content += `SPACING ${(task.geometry.channelWidth / nx).toFixed(4)} ${(task.geometry.channelDepth / ny).toFixed(4)} 1\n`;
    content += `POINT_DATA ${nx * ny * nz}\n`;
    content += 'SCALARS phase_field float 1\n';
    content += 'LOOKUP_TABLE default\n';
    for (let k = 0; k < nz; k++) {
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const x = i * (task.geometry.channelWidth / nx);
          const y = j * (task.geometry.channelDepth / ny);
          const centerX = task.geometry.channelWidth * 0.6;
          const centerY = task.geometry.channelDepth * 0.5;
          const r = task.geometry.channelWidth * 0.15;
          const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          const phase = dist < r ? 1.0 : 0.0;
          content += phase.toFixed(4) + '\n';
        }
      }
    }
    downloadFile(content, `phase_field_${task.id}.vtk`, 'text/plain');
  };

  const downloadDropletCSV = () => {
    if (!task || !task.statistics) return;
    const stats = task.statistics;
    let content = '液滴统计数据 - ' + task.name + '\n\n';
    content += '=== 统计指标 ===\n';
    content += `生成频率,${stats.generationFrequency.toFixed(2)},Hz\n`;
    content += `平均直径,${stats.meanDiameter.toFixed(2)},μm\n`;
    content += `尺寸变异系数CV,${stats.cvDiameter.toFixed(2)},%\n`;
    content += `最小直径,${stats.minDiameter.toFixed(2)},μm\n`;
    content += `最大直径,${stats.maxDiameter.toFixed(2)},μm\n`;
    content += `压力降,${stats.pressureDrop.toFixed(3)},kPa\n`;
    content += `是否有卫星液滴,${stats.hasSatellite ? '是' : '否'},\n`;
    content += `多分散指数,${stats.polydispersityIndex.toFixed(3)},\n\n`;
    content += '=== 尺寸分布 ===\n';
    content += '直径区间(μm),数量\n';
    stats.sizeDistribution.forEach(b => {
      content += `${b.bin},${b.count}\n`;
    });
    content += '\n=== 频率时间序列 ===\n';
    content += '时间(s),频率(Hz)\n';
    stats.frequencySeries.forEach(d => {
      content += `${d.time},${d.value.toFixed(3)}\n`;
    });
    downloadFile(content, `droplet_stats_${task.id}.csv`, 'text/csv');
  };

  const downloadMesh = () => {
    if (!task) return;
    let content = '$MeshFormat\n2.2 0 8\n$EndMeshFormat\n';
    content += '$PhysicalNames\n3\n';
    content += '2 1 "inlet"\n';
    content += '2 2 "outlet"\n';
    content += '3 3 "fluid"\n';
    content += '$EndPhysicalNames\n';
    content += '$Nodes\n';
    const nCells = task.meshInfo?.cellCount ?? 50000;
    const nNodes = Math.round(nCells * 4);
    content += `${Math.min(nNodes, 1000)}\n`;
    for (let i = 1; i <= Math.min(1000, nNodes); i++) {
      const x = (Math.random() - 0.5) * task.geometry.channelWidth;
      const y = (Math.random() - 0.5) * task.geometry.channelDepth;
      const z = Math.random() * 100;
      content += `${i} ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)}\n`;
    }
    content += '$EndNodes\n';
    content += '$Elements\n';
    content += `${Math.min(500, Math.round(nCells))}\n`;
    for (let i = 1; i <= Math.min(500, Math.round(nCells)); i++) {
      content += `${i} 4 2 3 0 ${i} ${i + 1} ${i + 2} ${i + 3}\n`;
    }
    content += '$EndElements\n';
    downloadFile(content, `mesh_${task.id}.msh`, 'text/plain');
  };

  const downloadInterfaceAnimation = () => {
    if (!task) return;
    let content = '# MicroFlow Interface Evolution Animation Data\n';
    content += `# Task: ${task.name}\n`;
    content += `# Geometry: ${GEOMETRY_META[task.geometry.type]?.label}\n`;
    content += '# Frames: 50\n';
    content += '# Format: time(s) droplet_x droplet_y droplet_r\n\n';
    for (let t = 0; t < 50; t++) {
      const time = t * 0.5;
      const dx = 200 + t * 5;
      const dy = 40;
      const r = 15 + Math.sin(t / 5) * 2;
      content += `T+${time.toFixed(1)}s ${dx.toFixed(1)} ${dy.toFixed(1)} ${r.toFixed(2)}\n`;
    }
    downloadFile(content, `interface_evolution_${task.id}.txt`, 'text/plain');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!task) return;
    const shareData = {
      title: '微流控模拟报告 - ' + task.name,
      text: '查看微流控两相流模拟结果报告',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard?.writeText(window.location.href);
        alert('链接已复制到剪贴板');
      }
    } catch (e) {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  const generatePDF = async () => {
    setExporting(true);
    // Simulate PDF generation
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const dark = '#0B1E3F';
    const cyan = '#00D4FF';
    const green = '#00FF88';
    const gray = '#6B7A99';

    doc.setFillColor(dark);
    doc.rect(0, 0, 297, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('MicroFlow CFD 两相流模拟综合报告', 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(cyan);
    doc.text(`任务: ${task.name}`, 15, 28);
    doc.text(`ID: ${task.id}`, 15, 33);

    doc.setTextColor(gray);
    doc.setFontSize(9);
    doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 200, 28);
    doc.text(`生成引擎: Phase-Field VOF Solver v3.2`, 200, 33);

    let y = 50;
    doc.setTextColor(dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('一、模拟配置摘要', 15, y);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    const configRows = [
      ['几何构型', GEOMETRY_META[task.geometry.type]?.label ?? task.geometry.type, '通道尺寸', `${task.geometry.channelWidth}×${task.geometry.channelDepth}μm`],
      ['界面张力', `${task.fluidParams.interfacialTension} mN/m`, '流速比 Qc/Qd', `${task.fluidParams.flowRateRatio.toFixed(1)} : 1`],
      ['连续相黏度', `${task.fluidParams.continuousViscosity} mPa·s`, '分散相黏度', `${task.fluidParams.dispersedViscosity} mPa·s`],
      ['接触角', `${task.fluidParams.surfaceWettability}°`, '网格单元', (task.meshInfo?.cellCount ?? 0).toLocaleString()],
    ];
    configRows.forEach(row => {
      doc.setTextColor(gray);
      doc.text(row[0], 15, y);
      doc.setTextColor(dark);
      doc.text(row[1], 55, y);
      doc.setTextColor(gray);
      doc.text(row[2], 120, y);
      doc.setTextColor(dark);
      doc.text(row[3], 160, y);
      y += 7;
    });

    y += 5;
    doc.setDrawColor(cyan);
    doc.setLineWidth(0.3);
    doc.line(15, y, 282, y);
    y += 10;

    doc.setTextColor(dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('二、核心结果指标', 15, y);
    y += 8;

    const metricBox = (x: number, label: string, value: string, unit: string, color: string) => {
      doc.setFillColor(color);
      doc.roundedRect(x, y, 60, 22, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(label, x + 3, y + 7);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(value + ' ' + unit, x + 3, y + 16);
      doc.setFont('helvetica', 'normal');
    };

    metricBox(15, '生成频率', stats.generationFrequency.toFixed(0), 'Hz', '#00D4FF');
    metricBox(80, '尺寸变异系数', stats.cvDiameter.toFixed(2), '%', stats.cvDiameter > 5 ? '#FF6B35' : '#00FF88');
    metricBox(145, '平均直径', stats.meanDiameter.toFixed(2), 'μm', '#C084FC');
    metricBox(210, '通道压降', stats.pressureDrop.toFixed(2), 'kPa', '#0B1E3F');

    y += 35;

    doc.setTextColor(dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('三、液滴尺寸分布', 15, y);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(gray);
    doc.setFont('helvetica', 'normal');
    doc.text('累计统计: ' + stats.sizeDistribution.reduce((s, b) => s + b.count, 0) + ' 个液滴 ...', 15, y);

    y += 15;
    const barMax = Math.max(...stats.sizeDistribution.map(b => b.count));
    stats.sizeDistribution.forEach(b => {
      const bw = (b.count / barMax) * 100;
      doc.setFillColor(cyan);
      doc.rect(40, y - 3, bw, 4, 'F');
      doc.setTextColor(gray);
      doc.setFontSize(7);
      doc.text(b.bin + 'μm', 15, y);
      doc.text(String(b.count), 145, y);
      y += 7;
    });

    setTimeout(() => {
      doc.save(`report_${task.id}.pdf`);
      setExporting(false);
    }, 500);
  };

  const isApproved = task.approvals.some(a => a.stage === 'manager_confirm' && a.decision === 'approved');
  const needsEngineer = task.currentStage === 'engineer_verify';
  const needsManager = task.currentStage === 'manager_confirm';

  return (
    <div className="min-h-full">
      <PageHeader
        title={'综合报告 · ' + task.name}
        subtitle={`模拟任务 ${task.id} · 状态: ${STATUS_META[task.status].label} · 生成时间: ${new Date(task.updatedAt).toLocaleString('zh-CN')}...`}
        tags={[
          { label: stats.hasSatellite ? '存在卫星液滴...' : '无卫星液滴', color: stats.hasSatellite ? 'border-alert-red/40 text-alert-red bg-alert-red/5' : 'border-data-green/40 text-data-green bg-data-green/5' },
          { label: `CV ${stats.cvDiameter.toFixed(2)}%`, color: stats.cvDiameter > 5 ? 'border-alert-orange/40 text-alert-orange bg-alert-orange/5' : 'border-data-green/40 text-data-green bg-data-green/5' },
        ]}
        actions={
          <>
            <button onClick={() => navigate(-1)} className="btn-secondary text-xs flex items-center gap-1.5">
              <ArrowLeft size={13} /> 返回
            </button>
            <button onClick={handlePrint} className="btn-secondary text-xs flex items-center gap-1.5">
              <Printer size={13} /> 打印
            </button>
            <button onClick={handleShare} className="btn-secondary text-xs flex items-center gap-1.5">
              <Share2 size={13} /> 分享
            </button>
            <button onClick={generatePDF} disabled={exporting} className="btn-primary text-xs flex items-center gap-1.5">
              <FileText size={13} /> {exporting ? '生成中...' : '导出 PDF'}
            </button>
          </>
        }
      />

      {/* Approval status banner */}
      {task.currentStage !== 'none' && (
        <div className={'glass-panel p-4 mb-4 border-2' + (isApproved ? ' border-data-green/40' : needsEngineer ? ' border-tech-cyan/40' : ' border-alert-orange/40')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isApproved ? (
                <div className="w-10 h-10 rounded-lg bg-data-green/20 border border-data-green/40 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-data-green" />
                </div>
              ) : needsEngineer ? (
                <div className="w-10 h-10 rounded-lg bg-tech-cyan/20 border border-tech-cyan/40 flex items-center justify-center">
                  <ClipboardCheck size={18} className="text-tech-cyan" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-alert-orange/20 border border-alert-orange/40 flex items-center justify-center">
                  <Clock size={18} className="text-alert-orange" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-neut-2">
                  {isApproved ? '✓ 审批已通过，已推送至光刻掩模版系统' : needsEngineer ? '待流体工程师验证液滴生成稳定性...' : '待项目负责人确认实验可行性...'}
                </div>
                <div className="text-[11px] text-neut-1 mt-0.5">
                  {isApproved ? '两级审批均已通过，掩模版数据已自动推送至光刻生成系统...' : `当前阶段: ${needsEngineer ? '第一级' : '第二级'}审批...`}...
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/approval')}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                审批中心 <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div className="glass-panel p-1.5 mb-4 flex gap-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                'px-4 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ' +
                (active
                  ? 'bg-tech-cyan/15 text-tech-cyan shadow-glow-cyan border border-tech-cyan/30'
                  : 'text-neut-1 hover:text-neut-2 hover:bg-surface/30')
              }
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-4">
          {tab === 'overview' && (
            <>
              <div className="glass-panel p-5">
                <h3 className="heading-display text-sm text-neut-2 mb-4">核心结果摘要</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { l: '生成频率', v: stats.generationFrequency.toFixed(0), u: 'Hz', c: 'text-tech-cyan', i: Activity },
                    { l: '尺寸变异系数', v: stats.cvDiameter.toFixed(2), u: '%', c: stats.cvDiameter > 5 ? 'text-alert-orange' : 'text-data-green', i: Gauge },
                    { l: '平均直径', v: stats.meanDiameter.toFixed(2), u: 'μm', c: 'text-purple-400', i: Droplets },
                    { l: '通道压力降', v: stats.pressureDrop.toFixed(2), u: 'kPa', c: 'text-neut-2', i: Gauge },
                  ].map((m, i) => {
                    const Icon = m.i;
                    return (
                      <div key={i} className="p-4 rounded-md border border-surface/60 bg-deep-space/40 relative overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-20">
                          <Icon size={28} className={m.c} />
                        </div>
                        <div className="text-[11px] text-neut-1 mb-1">{m.l}</div>
                        <div className={'data-number text-2xl ' + m.c}>{m.v}<span className="text-sm text-neut-1 ml-1">{m.u}</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-panel p-5">
                <h3 className="heading-display text-sm text-neut-2 mb-3">三维相场快照</h3>
                <div className="aspect-[16/7] rounded-lg overflow-hidden border border-surface/60">
                  <Droplet3DView geometryType={task.geometry.type} channelWidth={task.geometry.channelWidth} hasSatellite={stats.hasSatellite} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4">
                  <h3 className="heading-display text-xs text-neut-2 mb-2">液滴尺寸分布</h3>
                  <HistogramChart bins={stats.sizeDistribution} meanD={stats.meanDiameter} cv={stats.cvDiameter} />
                </div>
                <div className="glass-panel p-4">
                  <h3 className="heading-display text-xs text-neut-2 mb-2">生成频率时间序列</h3>
                  <TimeSeriesChart
                    series={[{ name: 'f(Hz)', data: stats.frequencySeries, color: '#00D4FF' }]}
                    yName="频率 (Hz)"
                  />
                </div>
              </div>
            </>
          )}

          {tab === 'size' && (
            <div className="glass-panel p-5">
              <h3 className="heading-display text-sm text-neut-2 mb-1">液滴直径分布直方图</h3>
              <p className="text-xs text-neut-1 mb-4">高斯分布拟合 · 均值 {stats.meanDiameter}μm · 标准差 {(stats.cvDiameter / 100 * stats.meanDiameter).toFixed(2)}μm...</p>
              <HistogramChart bins={stats.sizeDistribution} meanD={stats.meanDiameter} cv={stats.cvDiameter} height={400} />
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="p-3 rounded-md border border-surface/60 bg-deep-space/40">
                  <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-1">最小直径</div>
                  <div className="data-number text-lg text-tech-cyan">{stats.minDiameter} μm</div>
                </div>
                <div className="p-3 rounded-md border border-surface/60 bg-deep-space/40">
                  <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-1">最大直径</div>
                  <div className="data-number text-lg text-purple-400">{stats.maxDiameter} μm</div>
                </div>
                <div className="p-3 rounded-md border border-surface/60 bg-deep-space/40">
                  <div className="text-[10px] text-neut-1 uppercase tracking-wider mb-1">多分散指数</div>
                  <div className="data-number text-lg text-alert-orange">{stats.polydispersityIndex}</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'frequency' && (
            <div className="glass-panel p-5">
              <h3 className="heading-display text-sm text-neut-2 mb-1">液滴生成频率时间序列</h3>
              <p className="text-xs text-neut-1 mb-4">全时域统计 · 波动分析 · 周期性评估...</p>
              <TimeSeriesChart
                series={[
                  { name: '瞬时频率', data: stats.frequencySeries, color: '#00D4FF' },
                  { name: '滑动平均', data: stats.frequencySeries.map((d, i, arr) => ({
                    time: d.time,
                    value: arr.slice(Math.max(0, i - 5), i + 1).reduce((s, x) => s + x.value, 0) / Math.min(6, i + 1),
                  })), color: '#00FF88', dashed: true },
                ]}
                yName="频率 (Hz)"
                threshold={{ value: stats.generationFrequency * 0.95, label: '下置信界' }}
                height={400}
              />
            </div>
          )}

          {tab === 'pressure' && (
            <div className="glass-panel p-5">
              <h3 className="heading-display text-sm text-neut-2 mb-1">通道压力降曲线</h3>
              <p className="text-xs text-neut-1 mb-4">入口-出口压差 · 液滴经过时的压力脉动...</p>
              <TimeSeriesChart
                series={[{ name: 'ΔP (kPa)', data: stats.pressureSeries, color: '#C084FC' }]}
                yName="压力降 (kPa)"
                height={400}
              />
            </div>
          )}

          {tab === 'interface' && (
            <div className="glass-panel p-5">
              <h3 className="heading-display text-sm text-neut-2 mb-1">界面演化动画</h3>
              <p className="text-xs text-neut-1 mb-4">相场时空演化 · 液滴形成过程回放...</p>
              <div className="aspect-video rounded-lg overflow-hidden border border-surface/60 bg-mid-space/40">
                <Droplet3DView geometryType={task.geometry.type} channelWidth={task.geometry.channelWidth} hasSatellite={stats.hasSatellite} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-neut-1">
                <div className="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full w-3/4 bg-tech-cyan rounded-full animate-pulse" />
                </div>
                <span className="font-mono">T+12.5s / T+50.0s</span>
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div className="glass-panel p-5">
              <h3 className="heading-display text-sm text-neut-2 mb-3">原始数据表格</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-surface text-left">
                      <th className="py-2 px-3 text-neut-1">时间步</th>
                      <th className="py-2 px-3 text-neut-1">频率(Hz)</th>
                      <th className="py-2 px-3 text-neut-1">CV(%)</th>
                      <th className="py-2 px-3 text-neut-1">压降(kPa)</th>
                      <th className="py-2 px-3 text-neut-1">液滴数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.frequencySeries.slice(0, 20).map((d, i) => (
                      <tr key={i} className="border-b border-surface/40 hover:bg-surface/20">
                        <td className="py-1.5 px-3 text-tech-cyan">T+{d.time}s</td>
                        <td className="py-1.5 px-3 text-neut-2">{d.value.toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-neut-2">{stats.cvSeries[i]?.value.toFixed(2) ?? '—'}</td>
                        <td className="py-1.5 px-3 text-neut-2">{stats.pressureSeries[i]?.value.toFixed(3) ?? '—'}</td>
                        <td className="py-1.5 px-3 text-neut-2">{Math.round(d.value * d.time * 0.8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass-panel p-4">
            <h3 className="heading-display text-xs text-neut-2 mb-3">参数配置</h3>
            <div className="space-y-2 text-xs">
              {[
                ['几何构型', GEOMETRY_META[task.geometry.type]?.label ?? '—'],
                ['通道尺寸', `${task.geometry.channelWidth}×${task.geometry.channelDepth}μm`],
                ['界面张力 γ', `${task.fluidParams.interfacialTension} mN/m`],
                ['流速比 Qc/Qd', `${task.fluidParams.flowRateRatio.toFixed(1)} : 1`],
                ['连续相黏度', `${task.fluidParams.continuousViscosity} mPa·s`],
                ['分散相黏度', `${task.fluidParams.dispersedViscosity} mPa·s`],
                ['接触角 θ', `${task.fluidParams.surfaceWettability}°`],
                ['连续相流速', `${task.fluidParams.continuousVelocity.toFixed(4)} m/s`],
                ['分散相压力', `${task.fluidParams.dispersedPressure} kPa`],
              ].map(([k, v], i) => (
                <div key={i} className="flex justify-between py-1 border-b border-surface/40 last:border-0">
                  <span className="text-neut-1">{k}</span>
                  <span className="text-neut-2 font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-4">
            <h3 className="heading-display text-xs text-neut-2 mb-3">网格信息</h3>
            <div className="space-y-2 text-xs">
              {task.meshInfo && (
                <>
                  <div className="flex justify-between py-1 border-b border-surface/40">
                    <span className="text-neut-1">网格单元数</span>
                    <span className="text-neut-2 font-mono">{task.meshInfo.cellCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface/40">
                    <span className="text-neut-1">边界层</span>
                    <span className="text-neut-2 font-mono">{task.meshInfo.boundaryLayers} 层</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface/40">
                    <span className="text-neut-1">自适应加密</span>
                    <span className="text-data-green font-mono">{task.meshInfo.adaptiveRefinement ? '是' : '否'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neut-1">质量指数</span>
                    <span className={task.meshInfo.qualityIndex > 0.85 ? 'text-data-green font-mono' : 'text-alert-orange font-mono'}>
                      {task.meshInfo.qualityIndex.toFixed(3)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="glass-panel p-4">
            <h3 className="heading-display text-xs text-neut-2 mb-3">参数调整记录</h3>
            <div className="space-y-2">
              {task.adjustments.length === 0 && (
                <div className="text-[11px] text-neut-1 text-center py-3">无参数调整记录...</div>
              )}
              {task.adjustments.map(a => (
                <div key={a.id} className="p-2 rounded-md border border-surface/60 bg-deep-space/40 text-[11px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neut-2 font-mono">{a.parameterName}</span>
                    <span className="text-data-green">+{Math.abs(a.newValue - a.oldValue).toFixed(2)}</span>
                  </div>
                  <div className="text-neut-1">
                    {a.oldValue.toFixed(2)} → {a.newValue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-4">
            <h3 className="heading-display text-xs text-neut-2 mb-3">审批进度</h3>
            <div className="space-y-3">
              {[
                { s: 'engineer_verify', l: '流体工程师验证', d: '验证液滴生成稳定性...', role: '流体工程师' },
                { s: 'manager_confirm', l: '项目负责人确认', d: '确认实验可行性...', role: '项目负责人' },
              ].map((stage, i) => {
                const record = task.approvals.find(a => a.stage === stage.s);
                const done = !!record;
                const active = task.currentStage === stage.s;
                return (
                  <div key={stage.s} className="flex gap-3">
                    <div className="relative">
                      <div
                        className={
                          'w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ' +
                          (done
                            ? 'bg-data-green/20 border-data-green text-data-green'
                            : active
                              ? 'bg-tech-cyan/20 border-tech-cyan text-tech-cyan animate-pulse'
                              : 'bg-surface/30 border-surface text-neut-1')
                        }
                      >
                        {done ? <CheckCircle2 size={14} /> : i + 1}
                      </div>
                      {i < 1 && (
                        <div
                          className={
                            'absolute left-1/2 top-8 w-0.5 h-6 -translate-x-1/2 ' +
                            (done ? 'bg-data-green/50' : 'bg-surface/60')
                          }
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={'text-xs font-medium ' + (done || active ? 'text-neut-2' : 'text-neut-1')}>
                        {stage.l}
                      </div>
                      <div className="text-[10px] text-neut-1 mt-0.5">
                        {stage.d}...
                      </div>
                      {record && (
                        <div className="text-[10px] text-neut-1 mt-1">
                          {record.approverName} · {new Date(record.createdAt).toLocaleTimeString('zh-CN')}...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-4">
            <h3 className="heading-display text-xs text-neut-2 mb-3">下载中心</h3>
            <div className="space-y-2">
              {[
                { l: '全场相场数据', s: '128 MB', f: '.vtk', handler: downloadPhaseField },
                { l: '液滴统计CSV', s: '2.4 MB', f: '.csv', handler: downloadDropletCSV },
                { l: '网格文件', s: '45 MB', f: '.msh', handler: downloadMesh },
                { l: '界面演化文件', s: '86 MB', f: '.txt', handler: downloadInterfaceAnimation },
                { l: '综合报告PDF', s: '3.2 MB', f: '.pdf', handler: generatePDF },
              ].map((d, i) => (
                <button
                  key={i}
                  onClick={d.handler}
                  className="w-full flex items-center gap-2 p-2 rounded-md border border-surface/60 bg-deep-space/40 hover:border-tech-cyan/40 hover:bg-surface/30 transition-all text-left"
                >
                  <Download size={14} className="text-tech-cyan" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-neut-2 truncate">{d.l}{d.f}</div>
                    <div className="text-[10px] text-neut-1 font-mono">{d.s}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
