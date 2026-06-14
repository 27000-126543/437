import { create } from 'zustand';
import type {
  SimulationTask,
  Alert,
  Recommendation,
  DailyStats,
  SimulationStatus,
  GeometryConfig,
  FluidParams,
  AlertStatus,
  ApprovalDecision,
} from '@/types';
import { generateMockTasks, generateRecommendations, generateDailyStats, GEOMETRY_LIST, FLUID_PRESETS } from '@/data/mockData';

interface AppState {
  tasks: SimulationTask[];
  alerts: Alert[];
  recommendations: Recommendation[];
  dailyStats: DailyStats[];
  geometries: GeometryConfig[];
  fluidPresets: FluidParams[];
  currentRole: 'microfluidic_engineer' | 'fluid_engineer' | 'project_manager' | 'chief_scientist';
  currentUser: string;
  selectedTaskId: string | null;
  filters: { status?: SimulationStatus; search?: string };

  setSelectedTaskId: (id: string | null) => void;
  setFilters: (f: Partial<AppState['filters']>) => void;
  setCurrentRole: (r: AppState['currentRole']) => void;

  createTask: (input: {
    name: string;
    geometryId: string;
    fluidParams: Partial<FluidParams>;
  }) => SimulationTask;

  updateTaskProgress: (taskId: string) => void;
  setTaskStatus: (taskId: string, status: SimulationStatus) => void;

  handleAlert: (
    alertId: string,
    action: 'approve' | 'reject',
    comments: string,
  ) => void;

  createAlertForTask: (taskId: string) => void;

  approveTask: (
    taskId: string,
    stage: 'engineer_verify' | 'manager_confirm',
    decision: ApprovalDecision,
    comments: string,
  ) => void;

  toggleGeometryRisk: (geoId: string) => void;
}

const STATUS_PROGRESSION: SimulationStatus[] = [
  'pending_verify',
  'mesh_generation',
  'initialization',
  'two_phase_computing',
  'droplet_analysis',
  'completed',
];

const genId = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create<AppState>((set, get) => {
  const initTasks = generateMockTasks();
  const initAlerts = initTasks.flatMap(t => t.alerts);
  return {
    tasks: initTasks,
    alerts: initAlerts,
    recommendations: generateRecommendations(),
    dailyStats: generateDailyStats(),
    geometries: GEOMETRY_LIST,
    fluidPresets: FLUID_PRESETS,
    currentRole: 'microfluidic_engineer',
    currentUser: '陈工',
    selectedTaskId: initTasks[0]?.id ?? null,
    filters: {},

    setSelectedTaskId: id => set({ selectedTaskId: id }),
    setFilters: f => set(state => ({ filters: { ...state.filters, ...f } })),
    setCurrentRole: r => set({ currentRole: r }),

    createTask: input => {
      const geo = get().geometries.find(g => g.id === input.geometryId) ?? get().geometries[0];
      const preset = get().fluidPresets[0];
      const fluid: FluidParams = {
        ...preset,
        id: 'fp-' + genId(),
        ...input.fluidParams,
      };
      const task: SimulationTask = {
        id: 'task-' + genId(),
        name: input.name,
        status: 'pending_verify',
        progress: 2,
        geometry: { ...geo },
        fluidParams: fluid,
        alerts: [],
        adjustments: [],
        approvals: [],
        owner: get().currentUser,
        ownerRole: get().currentRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentStage: 'none',
        pushedToLithography: false,
      };
      set(state => ({ tasks: [task, ...state.tasks] }));
      return task;
    },

    updateTaskProgress: taskId => {
      set(state => ({
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          if (t.status === 'completed' || t.status === 'error_fallback') return t;
          const idx = STATUS_PROGRESSION.indexOf(t.status);
          const nextIdx = Math.min(idx + 1, STATUS_PROGRESSION.length - 1);
          const newStatus = STATUS_PROGRESSION[nextIdx];
          const progressMap: Record<SimulationStatus, number> = {
            pending_verify: 2,
            mesh_generation: 18,
            initialization: 32,
            two_phase_computing: 62,
            droplet_analysis: 88,
            completed: 100,
            error_fallback: t.progress,
          };
          const shouldAlert = newStatus === 'two_phase_computing' && Math.random() > 0.6;
          return {
            ...t,
            status: newStatus,
            progress: progressMap[newStatus],
            updatedAt: new Date().toISOString(),
            currentStage: newStatus === 'completed' ? 'engineer_verify' : t.currentStage,
          };
        }),
      }));
      if (Math.random() > 0.5) {
        setTimeout(() => get().createAlertForTask(taskId), 1500);
      }
    },

    setTaskStatus: (taskId, status) => {
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                status,
                progress:
                  status === 'completed'
                    ? 100
                    : status === 'error_fallback'
                      ? t.progress
                      : t.progress,
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      }));
    },

    createAlertForTask: taskId => {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;
      const isCv = Math.random() > 0.5;
      const cv = 5 + Math.random() * 6;
      const freqFluct = 5.5 + Math.random() * 4;
      const alert: Alert = {
        id: 'alt-' + genId(),
        taskId,
        taskName: task.name,
        level: (cv > 8 ? 'critical' : 'warning') as Alert['level'],
        type: isCv ? 'cv_exceed' : 'frequency_fluctuation',
        description: isCv
          ? `尺寸变异系数CV=${cv.toFixed(2)}% 超过5%阈值`
          : `液滴生成频率波动${freqFluct.toFixed(2)}% 超过5%告警值`,
        threshold: 5,
        actualValue: isCv ? cv : freqFluct,
        status: 'pending',
        createdAt: new Date().toISOString(),
        adjustSuggestion: {
          param: 'flowRateRatio',
          oldValue: task.fluidParams.flowRateRatio,
          newValue: Math.round((task.fluidParams.flowRateRatio + 1.2) * 100) / 100,
        },
      };
      set(state => ({
        alerts: [alert, ...state.alerts],
        tasks: state.tasks.map(t =>
          t.id === taskId ? { ...t, alerts: [...t.alerts, alert], updatedAt: new Date().toISOString() } : t,
        ),
      }));
    },

    handleAlert: (alertId, action, comments) => {
      const newStatus: AlertStatus = action === 'approve' ? 'approved' : 'rejected';
      set(state => {
        const alert = state.alerts.find(a => a.id === alertId);
        if (!alert) return state;
        const updatedAlerts = state.alerts.map(a =>
          a.id === alertId
            ? {
                ...a,
                status: newStatus,
                reviewedBy: state.currentUser,
                reviewedAt: new Date().toISOString(),
                reviewComments: comments,
              }
            : a,
        );
        let updatedTasks = state.tasks.map(t =>
          t.id === alert.taskId
            ? { ...t, alerts: t.alerts.map(a => (a.id === alertId ? updatedAlerts.find(x => x.id === alertId)! : a)) }
            : t,
        );
        if (action === 'approve' && alert.adjustSuggestion) {
          updatedTasks = updatedTasks.map(t => {
            if (t.id !== alert.taskId) return t;
            const newAdj = {
              id: 'adj-' + genId(),
              taskId: t.id,
              parameterName: '流速比 (Qc/Qd)',
              oldValue: alert.adjustSuggestion!.oldValue,
              newValue: alert.adjustSuggestion!.newValue,
              reason: alert.description + '；' + (comments || '工程师复核通过，自动调整参数'),
              operator: state.currentUser,
              createdAt: new Date().toISOString(),
            };
            return {
              ...t,
              adjustments: [...t.adjustments, newAdj],
              fluidParams: {
                ...t.fluidParams,
                flowRateRatio: alert.adjustSuggestion!.newValue,
              },
              status: 'two_phase_computing' as SimulationStatus,
              progress: 55,
              updatedAt: new Date().toISOString(),
            };
          });
        }
        return { alerts: updatedAlerts, tasks: updatedTasks };
      });
    },

    approveTask: (taskId, stage, decision, comments) => {
      set(state => ({
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          const record = {
            id: 'app-' + genId(),
            taskId,
            stage,
            approverRole: stage === 'engineer_verify' ? 'fluid_engineer' : 'project_manager',
            approverName: stage === 'engineer_verify' ? '流体工程师 王工' : '项目负责人 张经理',
            decision,
            comments,
            createdAt: new Date().toISOString(),
          };
          const nextStage: SimulationTask['currentStage'] =
            stage === 'engineer_verify' && decision === 'approved'
              ? 'manager_confirm'
              : stage === 'manager_confirm' && decision === 'approved'
                ? 'none'
                : t.currentStage;
          return {
            ...t,
            approvals: [...t.approvals, record],
            currentStage: nextStage,
            pushedToLithography:
              stage === 'manager_confirm' && decision === 'approved' ? true : t.pushedToLithography,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },

    toggleGeometryRisk: geoId => {
      set(state => ({
        geometries: state.geometries.map(g =>
          g.id === geoId
            ? { ...g, riskPaused: !g.riskPaused, consecutiveFailures: g.riskPaused ? 0 : 3 }
            : g,
        ),
      }));
    },
  };
});
