import React from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  Users, 
  Cpu, 
  History, 
  BarChart3, 
  PenTool, 
  FileSpreadsheet, 
  Settings,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live-attendance', label: 'Live Attendance', icon: Camera, badge: 'Live' },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'model-training', label: 'Recognition Model', icon: Cpu },
  { id: 'history', label: 'Attendance Records', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'manual-attendance', label: 'Manual Entry', icon: PenTool },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-blue-400 bg-clip-text text-transparent leading-none">
            AttendAI
          </h1>
          <p className="text-[10px] tracking-wider uppercase text-blue-400 font-semibold mt-1">
            Smart Face Recognition
          </p>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
        <span>Engine: LBPH + OpenCV</span>
        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">v2.0</span>
      </div>
    </aside>
  );
}
