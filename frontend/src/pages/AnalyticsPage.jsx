import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart as PieIcon, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics');
      if (res.ok) setAnalytics(await res.json());
    } catch (err) {
      console.error("Fetch analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-slate-800 rounded-xl"></div>
          <div className="h-64 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Attendance Analytics</h1>
        <p className="text-xs text-slate-400 mt-1">Deep insights into student engagement, subject performance, and daily trends.</p>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Line Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Daily Present Count (7 Days)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.daily_trends || []}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Present vs Absent Donut Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-400" />
            <span>Today's Ratio (Present vs Absent)</span>
          </h3>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.present_vs_absent || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(analytics?.present_vs_absent || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance Breakdown Bar Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Attendance by Subject</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.subject_breakdown || []}>
                <XAxis dataKey="subject" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
