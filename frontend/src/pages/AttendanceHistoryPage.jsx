import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Calendar, BookOpen, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState('');
  const [subject, setSubject] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, [date, subject]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let query = [];
      if (date) query.push(`date=${encodeURIComponent(date)}`);
      if (subject) query.push(`subject=${encodeURIComponent(subject)}`);

      const url = '/api/attendance' + (query.length > 0 ? `?${query.join('&')}` : '');
      const res = await fetch(url);
      if (res.ok) setRecords(await res.json());
    } catch (err) {
      console.error("Fetch attendance records error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r => 
    !search || 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.enrollment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Attendance Records</h1>
        <p className="text-xs text-slate-400 mt-1">Complete historical log of automatic and manual attendance entries.</p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-3 pr-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">All Subjects</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="General">General</option>
          </select>
        </div>

        {(date || subject || search) && (
          <button
            onClick={() => { setDate(''); setSubject(''); setSearch(''); }}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Loading records...</span>
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Enrollment ID</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Time</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-100">{r.name}</td>
                    <td className="px-6 py-4 font-mono text-blue-400">{r.enrollment}</td>
                    <td className="px-6 py-4 text-slate-300">{r.subject}</td>
                    <td className="px-6 py-4 text-slate-400">{r.date}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono">{r.time}</td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {r.method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Present</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <History className="w-8 h-8 text-slate-700 mx-auto" />
            <p>No attendance records match your filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
