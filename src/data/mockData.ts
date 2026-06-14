import type {
  SimulationTask,
  Alert,
  ParameterAdjustment,
  ApprovalRecord,
  Recommendation,
  DailyStats,
  GeometryConfig,
  FluidParams,
  DropletStatistics,
  SimulationStatus,
  GeometryType,
} from '@/types';

const rand = (min: number, max: number, dec = 2) =>
  Number((Math.random() * (max - min) + min).toFixed(dec));

const genId = () => Math.random().toString(36).slice(2, 10);

const genSizeDistribution = () => {
  const bins = [];
  for (let i = 16; i <= 36; i += 2) {
    bins.push({
      bin: i,
      count: Math.round(Math.exp(-Math.pow(i - 25, 2) / 18) * rand(40, 80)),
    });
  }
  return bins;
};

const genTimeSeries = (base: number, variance: number, points = 60) => {
  const data = [];
  let val = base;
  for (let i = 0; i < points; i++) {
    val = base + (Math.random() - 0.5) * variance * 2 + Math.sin(i / 8) * variance * 0.3;
    data.push({ time: i, value: Number(val.toFixed(3)) });
  }
  return data;
};

const GEOMETRIES: GeometryConfig[] = [
  {
    id: 'geo-001',
    type: 'flow-focusing',
    fileName: 'FF_50um_orifice.stl',
    channelWidth: 100,
    channelDepth: 50,
    orificeWidth: 50,
    structure: '三通道流动聚焦，聚焦区长度150μm',
    consecutiveFailures: 0,
  },
  {
    id: 'geo-002',
    type: 'T-junction',
    fileName: 'TJ_80um_channel.step',
    channelWidth: 80,
    channelDepth: 40,
    structure: '标准T型交叉，两相垂直入口',
    consecutiveFailures: 3,
    riskPaused: true,
  },
  {
    id: 'geo-003',
    type: 'flow-focusing',
    fileName: 'FF_30um_shrink.iges',
    channelWidth: 80,
    channelDepth: 30,
    orificeWidth: 30,
    structure: '聚焦式骤缩结构，适配高黏度体系',
    consecutiveFailures: 0,
  },
  {
    id: 'geo-004',
    type: 'step-emulsification',
    fileName: 'SE_microwell_array.stl',
    channelWidth: 200,
    channelDepth: 60,
    structure: '阶梯式乳化阵列，8并行微孔单元',
    consecutiveFailures: 1,
  },
  {
    id: 'geo-005',
    type: 'co-flow',
    fileName: 'CF_capillary_pair.stl',
    channelWidth: 120,
    channelDepth: 120,
    structure: '毛细管同轴，内径30μm/外径80μm',
    consecutiveFailures: 0,
  },
];

const FLUID_SETS: FluidParams[] = [
  {
    id: 'fp-001',
    interfacialTension: 12.5,
    continuousViscosity: 8.5,
    dispersedViscosity: 2.1,
    flowRateRatio: 6.5,
    continuousVelocity: 0.025,
    dispersedPressure: 45,
    surfaceWettability: 72,
  },
  {
    id: 'fp-002',
    interfacialTension: 8.2,
    continuousViscosity: 15.0,
    dispersedViscosity: 5.0,
    flowRateRatio: 8.0,
    continuousVelocity: 0.032,
    dispersedPressure: 62,
    surfaceWettability: 85,
  },
  {
    id: 'fp-003',
    interfacialTension: 22.0,
    continuousViscosity: 5.0,
    dispersedViscosity: 0.9,
    flowRateRatio: 4.5,
    continuousVelocity: 0.018,
    dispersedPressure: 28,
    surfaceWettability: 65,
  },
];

const STATUSES: SimulationStatus[] = [
  'completed',
  'completed',
  'completed',
  'two_phase_computing',
  'mesh_generation',
  'droplet_analysis',
  'initialization',
  'pending_verify',
  'error_fallback',
];

const NAMES = [
  'FF-50μm HFE-7500/水-PEG 油包水',
  'TJ-80μm 琼脂糖微球制备',
  'FF-30μm 单克隆细胞包埋',
  'SE-MW 数字PCR液滴生成',
  'CF-CAP PLGA药物微球',
  'FF-50μm 高内相比乳液优化',
  'TJ-80μm 酶催化微反应器',
  'FF-30μm mRNA脂质纳米粒',
  'FF-50μm 循环肿瘤细胞捕获',
  'SE-MW 多重免疫编码微球',
  'CF-CAP 高黏度油相体系',
  'FF-30μm 单分散水凝胶',
];

export function generateMockTasks(): SimulationTask[] {
  const tasks: SimulationTask[] = [];
  for (let i = 0; i < 12; i++) {
    const status = STATUSES[i % STATUSES.length];
    const geo = GEOMETRIES[i % GEOMETRIES.length];
    const fp = FLUID_SETS[i % FLUID_SETS.length];
    const hasStats = ['completed', 'droplet_analysis', 'error_fallback'].includes(status) || status === 'two_phase_computing';
    const meanD = rand(22, 30);
    const cv = status === 'completed' ? rand(1.5, 4.2) : status === 'error_fallback' ? rand(6, 12) : rand(2, 5);
    const freq = status === 'completed' ? rand(80, 350) : rand(50, 400);
    const pDrop = rand(1.2, 8.5);
    const hasSat = status === 'error_fallback' ? true : cv > 4.5;

    const alerts: Alert[] = [];
    if (i === 2 || i === 7) {
      alerts.push({
        id: 'alt-' + genId(),
        taskId: 'task-' + (i + 1),
        taskName: NAMES[i],
        level: cv > 5 ? 'critical' : 'warning',
        type: cv > 6 ? 'cv_exceed' : 'frequency_fluctuation',
        description:
          cv > 5
            ? `尺寸变异系数超过5%阈值，实际CV=${cv.toFixed(2)}%`
            : `生成频率波动幅度达${rand(5.5, 8)}%，超过5%告警阈值`,
        threshold: 5,
        actualValue: cv > 5 ? cv : rand(5.5, 9),
        status: i === 2 ? 'pending' : 'approved',
        createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
        adjustSuggestion: {
          param: 'flowRateRatio',
          oldValue: fp.flowRateRatio,
          newValue: fp.flowRateRatio + rand(0.5, 1.5),
        },
      });
    }
    if (hasSat) {
      alerts.push({
        id: 'alt-sat-' + genId(),
        taskId: 'task-' + (i + 1),
        taskName: NAMES[i],
        level: 'fatal',
        type: 'satellite_droplet',
        description: '检测到卫星液滴生成，均匀性严重下降',
        threshold: 0,
        actualValue: Math.round(rand(3, 12)),
        status: 'pending',
        createdAt: new Date(Date.now() - i * 1800_000).toISOString(),
      });
    }

    const adjustments: ParameterAdjustment[] = [];
    if (alerts.some(a => a.status === 'approved')) {
      adjustments.push({
        id: 'adj-' + genId(),
        taskId: 'task-' + (i + 1),
        parameterName: '流速比 (Qc/Qd)',
        oldValue: fp.flowRateRatio,
        newValue: fp.flowRateRatio + rand(0.5, 2),
        reason: '频率波动超标，提高连续相流速以增强剪切',
        operator: '李工',
        createdAt: new Date(Date.now() - i * 7200_000).toISOString(),
      });
    }

    const approvals: ApprovalRecord[] = [];
    if (status === 'completed') {
      const st = i % 3;
      if (st === 0 || st === 1) {
        approvals.push({
          id: 'app-e-' + genId(),
          taskId: 'task-' + (i + 1),
          stage: 'engineer_verify',
          approverRole: 'fluid_engineer',
          approverName: '流体工程师 王工',
          decision: 'approved',
          comments: '液滴生成稳定，CV<5%，无卫星液滴，符合要求',
          createdAt: new Date(Date.now() - i * 14400_000).toISOString(),
        });
      }
      if (st === 0) {
        approvals.push({
          id: 'app-m-' + genId(),
          taskId: 'task-' + (i + 1),
          stage: 'manager_confirm',
          approverRole: 'project_manager',
          approverName: '项目负责人 张经理',
          decision: 'approved',
          comments: '参数合理，实验可行性确认，已推送光刻系统',
          createdAt: new Date(Date.now() - i * 28800_000).toISOString(),
        });
      }
    }

    const statistics: DropletStatistics | undefined = hasStats
      ? {
          id: 'st-' + genId(),
          taskId: 'task-' + (i + 1),
          generationFrequency: freq,
          cvDiameter: cv,
          meanDiameter: meanD,
          minDiameter: Number((meanD - rand(3, 6)).toFixed(2)),
          maxDiameter: Number((meanD + rand(3, 6)).toFixed(2)),
          pressureDrop: pDrop,
          sizeDistribution: genSizeDistribution(),
          frequencySeries: genTimeSeries(freq, freq * 0.04),
          pressureSeries: genTimeSeries(pDrop, pDrop * 0.06),
          cvSeries: genTimeSeries(cv, cv * 0.12),
          hasSatellite: hasSat,
          satelliteCount: hasSat ? Math.round(rand(2, 15)) : 0,
          polydispersityIndex: Number((cv / 100 + rand(0, 0.03)).toFixed(4)),
        }
      : undefined;

    const progressMap: Record<SimulationStatus, number> = {
      pending_verify: 2,
      mesh_generation: 18,
      initialization: 32,
      two_phase_computing: 62,
      droplet_analysis: 88,
      completed: 100,
      error_fallback: 55,
    };

    const currentStage =
      status !== 'completed'
        ? 'none'
        : approvals.length === 0
          ? 'engineer_verify'
          : approvals.length === 1
            ? 'manager_confirm'
            : 'none';

    tasks.push({
      id: 'task-' + (i + 1),
      name: NAMES[i],
      status,
      progress: progressMap[status],
      geometry: { ...geo },
      fluidParams: { ...fp },
      statistics,
      alerts,
      adjustments,
      approvals,
      owner: ['陈工', '李工', '赵工', '孙工'][i % 4],
      ownerRole: 'microfluidic_engineer',
      createdAt: new Date(Date.now() - i * 86400_000 - rand(0, 8) * 3600_000).toISOString(),
      updatedAt: new Date(Date.now() - i * 3600_000).toISOString(),
      currentStage,
      pushedToLithography: approvals.some(a => a.stage === 'manager_confirm' && a.decision === 'approved'),
      meshInfo:
        status !== 'pending_verify'
          ? {
              cellCount: Math.round(rand(600000, 2400000, 0)),
              boundaryLayers: 5,
              adaptiveRefinement: true,
              qualityIndex: rand(0.82, 0.97),
            }
          : undefined,
    });
  }
  return tasks;
}

export function generateRecommendations(): Recommendation[] {
  const recs: Recommendation[] = [];
  const types: GeometryType[] = ['flow-focusing', 'T-junction', 'step-emulsification', 'co-flow'];
  const labels: Record<GeometryType, string> = {
    'flow-focusing': '流动聚焦 50μm 聚焦孔',
    'T-junction': 'T型交叉 80μm 通道',
    'step-emulsification': '阶梯乳化 60μm 微孔',
    'co-flow': '同轴流 30μm 毛细管',
  };
  types.forEach((t, i) => {
    recs.push({
      id: 'rec-' + genId(),
      geometryType: t,
      geometryLabel: labels[t],
      optimalContinuousVelocity: rand(0.02, 0.04),
      optimalDispersedPressure: rand(30, 65),
      optimalFlowRateRatio: rand(5, 10),
      predictedCv: rand(1.5, 3.2),
      predictedFrequency: rand(150, 320),
      confidence: rand(0.78, 0.96),
      sourceTaskCount: Math.round(rand(8, 25, 0)),
      sourceTaskIds: Array.from({ length: 5 }, () => 'task-' + Math.round(rand(1, 12, 0))),
      createdAt: new Date(Date.now() - i * 86400_000).toISOString(),
      tags: ['油包水', '水包油', '高单分散', '低CV'].slice(0, Math.round(rand(2, 4))),
    });
  });
  return recs;
}

export function generateDailyStats(): DailyStats[] {
  const stats: DailyStats[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const total = Math.round(rand(8, 16, 0));
    const completed = Math.round(total * rand(0.65, 0.95));
    stats.push({
      date: d.toISOString().slice(5, 10),
      totalTasks: total,
      completedTasks: completed,
      completionRate: Number((completed / total).toFixed(3)),
      avgCvDiameter: rand(2.2, 4.8),
      paramConvergenceCount: Math.round(rand(2, 7, 0)),
      alertCount: Math.round(rand(1, 5, 0)),
      avgSimulationDuration: rand(45, 120, 0),
    });
  }
  return stats;
}

export const GEOMETRY_LIST = GEOMETRIES;
export const FLUID_PRESETS = FLUID_SETS;
