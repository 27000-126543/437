export type SimulationStatus =
  | 'pending_verify'
  | 'mesh_generation'
  | 'initialization'
  | 'two_phase_computing'
  | 'droplet_analysis'
  | 'completed'
  | 'error_fallback';

export const STATUS_META: Record<SimulationStatus, { label: string; color: string; icon: string }> = {
  pending_verify: { label: '待校验', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', icon: 'Clock' },
  mesh_generation: { label: '网格生成', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', icon: 'Grid3x3' },
  initialization: { label: '初始化', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40', icon: 'Loader2' },
  two_phase_computing: { label: '两相流计算', color: 'bg-tech-cyan/20 text-tech-cyan border-tech-cyan/40', icon: 'Activity' },
  droplet_analysis: { label: '液滴分析', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: 'Droplets' },
  completed: { label: '完成', color: 'bg-data-green/20 text-data-green border-data-green/40', icon: 'CheckCircle2' },
  error_fallback: { label: '异常回退', color: 'bg-alert-red/20 text-alert-red border-alert-red/40', icon: 'AlertTriangle' },
};

export const STATUS_ORDER: SimulationStatus[] = [
  'pending_verify',
  'mesh_generation',
  'initialization',
  'two_phase_computing',
  'droplet_analysis',
  'completed',
];

export type GeometryType = 'T-junction' | 'flow-focusing' | 'co-flow' | 'step-emulsification';

export const GEOMETRY_META: Record<GeometryType, { label: string; desc: string }> = {
  'T-junction': { label: 'T型交叉', desc: '经典剪切诱导液滴生成结构' },
  'flow-focusing': { label: '流动聚焦', desc: '高单分散性聚焦结构' },
  'co-flow': { label: '同轴流', desc: '毛细管同轴流动结构' },
  'step-emulsification': { label: '阶梯乳化', desc: '基于微通道阶梯骤缩结构' },
};

export type AlertLevel = 'warning' | 'critical' | 'fatal';
export type AlertType = 'frequency_fluctuation' | 'cv_exceed' | 'satellite_droplet' | 'pressure_spike';
export type AlertStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export const ALERT_META: Record<AlertLevel, { label: string; color: string }> = {
  warning: { label: '预警', color: 'border-alert-orange/60 bg-alert-orange/5' },
  critical: { label: '严重', color: 'border-alert-red/70 bg-alert-red/10' },
  fatal: { label: '致命', color: 'border-red-600 bg-red-900/30' },
};

export const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  frequency_fluctuation: '生成频率波动',
  cv_exceed: '尺寸变异系数超限',
  satellite_droplet: '卫星液滴出现',
  pressure_spike: '通道压力骤升',
};

export interface GeometryConfig {
  id: string;
  type: GeometryType;
  fileName: string;
  channelWidth: number;
  channelDepth: number;
  orificeWidth?: number;
  structure: string;
  riskPaused?: boolean;
  consecutiveFailures?: number;
}

export interface FluidParams {
  id: string;
  interfacialTension: number;
  continuousViscosity: number;
  dispersedViscosity: number;
  flowRateRatio: number;
  continuousVelocity: number;
  dispersedPressure: number;
  surfaceWettability: number;
}

export interface DropletStatistics {
  id: string;
  taskId: string;
  generationFrequency: number;
  cvDiameter: number;
  meanDiameter: number;
  minDiameter: number;
  maxDiameter: number;
  pressureDrop: number;
  sizeDistribution: { bin: number; count: number }[];
  frequencySeries: { time: number; value: number }[];
  pressureSeries: { time: number; value: number }[];
  cvSeries: { time: number; value: number }[];
  hasSatellite: boolean;
  satelliteCount: number;
  polydispersityIndex: number;
}

export interface Alert {
  id: string;
  taskId: string;
  taskName: string;
  level: AlertLevel;
  type: AlertType;
  description: string;
  threshold: number;
  actualValue: number;
  status: AlertStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
  adjustSuggestion?: {
    param: string;
    oldValue: number;
    newValue: number;
  };
}

export interface ParameterAdjustment {
  id: string;
  taskId: string;
  parameterName: string;
  oldValue: number;
  newValue: number;
  reason: string;
  operator: string;
  createdAt: string;
}

export type ApprovalStage = 'engineer_verify' | 'manager_confirm';
export type ApprovalDecision = 'pending' | 'approved' | 'rejected';

export interface ApprovalRecord {
  id: string;
  taskId: string;
  stage: ApprovalStage;
  approverRole: string;
  approverName: string;
  decision: ApprovalDecision;
  comments: string;
  createdAt: string;
}

export interface SimulationTask {
  id: string;
  name: string;
  status: SimulationStatus;
  progress: number;
  geometry: GeometryConfig;
  fluidParams: FluidParams;
  statistics?: DropletStatistics;
  alerts: Alert[];
  adjustments: ParameterAdjustment[];
  approvals: ApprovalRecord[];
  owner: string;
  ownerRole: string;
  createdAt: string;
  updatedAt: string;
  currentStage: ApprovalStage | 'none';
  pushedToLithography: boolean;
  meshInfo?: {
    cellCount: number;
    boundaryLayers: number;
    adaptiveRefinement: boolean;
    qualityIndex: number;
  };
}

export interface Recommendation {
  id: string;
  geometryType: GeometryType;
  geometryLabel: string;
  optimalContinuousVelocity: number;
  optimalDispersedPressure: number;
  optimalFlowRateRatio: number;
  predictedCv: number;
  predictedFrequency: number;
  confidence: number;
  sourceTaskCount: number;
  sourceTaskIds: string[];
  createdAt: string;
  tags: string[];
}

export interface DailyStats {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgCvDiameter: number;
  paramConvergenceCount: number;
  alertCount: number;
  avgSimulationDuration: number;
}
