import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  AlertTriangle,
  FileBarChart,
  Sparkles,
  ClipboardCheck,
  ShieldAlert,
  Download,
  Droplets,
  Bell,
  Search,
  User,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { path: '/', label: '总览看板', icon: LayoutDashboard, end: true },
  { path: '/tasks', label: '模拟任务中心', icon: ListTodo },
  { path: '/tasks/new', label: '新建模拟', icon: PlusCircle },
  { path: '/alerts', label: '预警复核中心', icon: AlertTriangle },
  { path: '/recommend', label: '智能推荐引擎', icon: Sparkles },
  { path: '/approval', label: '审批工作流', icon: ClipboardCheck },
  { path: '/risk', label: '构型风险管理', icon: ShieldAlert },
  { path: '/export', label: '数据导出中心', icon: Download },
];

const ROLES = [
  { key: 'microfluidic_engineer', label: '微流控工程师' },
  { key: 'fluid_engineer', label: '流体工程师' },
  { key: 'project_manager', label: '项目负责人' },
  { key: 'chief_scientist', label: '首席科学家' },
] as const;

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole, setCurrentRole, currentUser, alerts } = useAppStore();
  const pendingAlerts = alerts.filter(a => a.status === 'pending').length;
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [search, setSearch] = useState('');

  const currentRoleLabel = ROLES.find(r => r.key === currentRole)?.label ?? '';

  return (
    <div className="h-screen w-full flex bg-deep-space grid-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-surface/50 bg-mid-space/40 backdrop-blur-md flex flex-col">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-surface/50">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-tech-cyan to-blue-500 flex items-center justify-center shadow-glow-cyan">
            <Droplets size={18} className="text-white" />
          </div>
          <div>
            <div className="heading-display text-base text-neut-2">MicroFlow CFD</div>
            <div className="text-[10px] text-neut-1 uppercase tracking-widest">多相流模拟平台</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={clsx(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/30 shadow-glow-cyan'
                    : 'text-neut-1 hover:text-neut-2 hover:bg-surface/40 border border-transparent',
                )}
              >
                <Icon size={17} className={clsx(active ? 'text-tech-cyan' : 'group-hover:text-tech-cyan/80')} />
                <span>{item.label}</span>
                {item.path === '/alerts' && pendingAlerts > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-alert-red text-white">
                    {pendingAlerts}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-surface/50 space-y-2">
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-data-green animate-pulse" />
              <span className="text-[11px] text-data-green font-medium uppercase tracking-wider">
                集群状态
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div>
                <div className="text-neut-1">活跃节点</div>
                <div className="text-tech-cyan data-number text-sm">24 / 32</div>
              </div>
              <div>
                <div className="text-neut-1">队列任务</div>
                <div className="text-alert-orange data-number text-sm">7</div>
              </div>
              <div>
                <div className="text-neut-1">GPU利用率</div>
                <div className="text-data-green data-number text-sm">78%</div>
              </div>
              <div>
                <div className="text-neut-1">平均耗时</div>
                <div className="text-neut-2 data-number text-sm">86min</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 shrink-0 border-b border-surface/50 bg-mid-space/30 backdrop-blur flex items-center px-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neut-1" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && search.trim()) {
                  navigate('/tasks');
                }
              }}
              placeholder="搜索模拟任务 / 几何构型 / 报告..."
              className="input-field pl-9"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative w-9 h-9 rounded-md border border-surface bg-deep-space/50 flex items-center justify-center text-neut-1 hover:text-tech-cyan hover:border-tech-cyan/50 transition-colors">
              <Bell size={17} />
              {pendingAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-alert-red animate-pulse" />
              )}
            </button>

            <div className="divider-gradient w-px h-6" />

            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(s => !s)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-surface/60 bg-mid-space/50 hover:border-tech-cyan/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-tech-cyan/70 to-blue-600 flex items-center justify-center">
                  <User size={13} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-neut-2">{currentUser}</div>
                  <div className="text-[10px] text-neut-1 flex items-center gap-1">
                    {currentRoleLabel}
                    <ChevronDown size={10} />
                  </div>
                </div>
              </button>
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-52 glass-panel p-1 z-50">
                  <div className="px-3 py-2 text-[10px] text-neut-1 uppercase tracking-widest border-b border-surface/50 mb-1">
                    切换角色视图
                  </div>
                  {ROLES.map(r => (
                    <button
                      key={r.key}
                      onClick={() => {
                        setCurrentRole(r.key);
                        setShowRoleMenu(false);
                      }}
                      className={clsx(
                        'w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2',
                        currentRole === r.key
                          ? 'bg-tech-cyan/10 text-tech-cyan'
                          : 'text-neut-2 hover:bg-surface/40',
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
