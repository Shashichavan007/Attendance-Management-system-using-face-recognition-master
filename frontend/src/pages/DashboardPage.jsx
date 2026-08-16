import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Percent, BookOpen, Clock, ArrowUpRight, Camera, Cpu, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage({ onNavigate, onOpenRegisterModal }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, anaRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/analytics')
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (anaRes.ok) setAnalytics(await anaRes.json());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-800 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Students",
      value: summary?.total_students || 0,
      subtext: "Registered in system",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Present Today",
      value: summary?.present_today || 0,
      subtext: "Active in classes",
      icon: UserCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Absent Today",
      value: summary?.absent_today || 0,
      subtext: "Unmarked students",
      icon: UserX,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20"
    },
    {
      title: "Attendance Rate",
      value: `${summary?.attendance_rate || 0}%`,
      subtext: "Daily average",
      icon: Percent,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20"
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Attendance Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time attendance metrics and quick actions.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenRegisterModal}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Student</span>
          </button>

          <button
            onClick={() => onNavigate('live-attendance')}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Start Live Recognition</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                <div className={`p-2.5 rounded-xl border ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-slate-100 tracking-tight">{card.value}</h3>
                <p className="text-xs text-slate-500 mt-1">{card.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Grid: Charts & Last Recognition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Attendance Trend Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">7-Day Attendance Trend</h3>
              <p className="text-xs text-slate-400">Daily student present count</p>
            </div>
            <button onClick={() => onNavigate('analytics')} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              <span>View Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.daily_trends || []}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="present" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Last Recognition Card & Quick Status */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Last Recognition</h3>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>

            {summary?.last_recognition ? (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{summary.last_recognition.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                    Marked ✓
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Enrollment: <span className="text-slate-200 font-mono">{summary.last_recognition.enrollment}</span></p>
                  <p>Subject: <span className="text-slate-200">{summary.last_recognition.subject}</span></p>
                  <p>Time: <span className="text-slate-200 font-mono">{summary.last_recognition.date} {summary.last_recognition.time}</span></p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                No recent face recognition event logged today.
              </div>
            )}
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100">System Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('model-training')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-xs font-semibold text-slate-200 space-y-1"
              >
                <Cpu className="w-4 h-4 text-indigo-400" />
                <p>Train Model</p>
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-xs font-semibold text-slate-200 space-y-1"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <p>Export Reports</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
