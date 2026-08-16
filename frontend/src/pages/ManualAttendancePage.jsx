import React, { useState, useEffect } from 'react';
import { PenTool, CheckCircle2, XCircle, Search, BookOpen, Calendar, Save, CheckSquare } from 'lucide-react';

export default function ManualAttendancePage() {
  const [subject, setSubject] = useState('Computer Science');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        const map = {};
        data.forEach(s => { map[s.enrollment] = true; }); // Default present
        setAttendanceMap(map);
      }
    } catch (err) {
      console.error("Fetch students error:", err);
    }
  };

  const toggleStudentStatus = (enrollment) => {
    setAttendanceMap(prev => ({
      ...prev,
      [enrollment]: !prev[enrollment]
    }));
  };

  const markAll = (status) => {
    const map = {};
    students.forEach(s => { map[s.enrollment] = status; });
    setAttendanceMap(map);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage('');

      const records = students.map(s => ({
        enrollment: s.enrollment,
        name: s.name,
        present: !!attendanceMap[s.enrollment]
      }));

      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, date, records })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`✓ Saved attendance for ${data.marked_students} present students in ${subject}.`);
      } else {
        setMessage(`⚠️ Failed to save manual attendance.`);
      }
    } catch (err) {
      setMessage(`⚠️ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Manual Attendance Entry</h1>
          <p className="text-xs text-slate-400 mt-1">Override or manually record student attendance for specific subjects.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || students.length === 0}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Manual Attendance'}</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Subject chooser */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-100 border-none focus:outline-none cursor-pointer"
            >
              <option value="Computer Science" className="bg-slate-900">Computer Science</option>
              <option value="Mathematics" className="bg-slate-900">Mathematics</option>
              <option value="Physics" className="bg-slate-900">Physics</option>
              <option value="General" className="bg-slate-900">General</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs text-slate-100 border-none focus:outline-none cursor-pointer"
            />
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAll(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll(false)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold border ${
          message.startsWith('✓') 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {message}
        </div>
      )}

      {/* Student List Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Enrollment ID</th>
              <th className="px-6 py-3.5">Student Name</th>
              <th className="px-6 py-3.5">Status Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredStudents.map((s) => {
              const isPresent = !!attendanceMap[s.enrollment];
              return (
                <tr key={s.enrollment} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-blue-400 font-bold">{s.enrollment}</td>
                  <td className="px-6 py-4 font-semibold text-slate-100">{s.name}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStudentStatus(s.enrollment)}
                      className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                        isPresent
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isPresent ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{isPresent ? 'PRESENT' : 'ABSENT'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
