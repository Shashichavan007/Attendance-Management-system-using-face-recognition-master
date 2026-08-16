import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Eye, Camera, Trash2, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function StudentManagementPage({ onOpenRegisterModal, onSelectStudent, onTrainModel }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/students?search=${encodeURIComponent(search)}` : '/api/students';
      const res = await fetch(url);
      if (res.ok) {
        setStudents(await res.json());
      }
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (enrollment) => {
    if (!window.confirm(`Are you sure you want to delete student ID ${enrollment}?`)) return;

    try {
      const res = await fetch(`/api/students/${enrollment}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStudents();
      }
    } catch (err) {
      console.error("Delete student error:", err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Student Directory</h1>
          <p className="text-xs text-slate-400 mt-1">Manage registered students, biometric samples, and attendance records.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onTrainModel}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2"
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Retrain LBPH Model</span>
          </button>

          <button
            onClick={onOpenRegisterModal}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name or enrollment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing <span className="text-slate-100 font-bold">{students.length}</span> student(s)
        </span>
      </div>

      {/* Students Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Loading student records...</span>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Enrollment ID</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Registered Date</th>
                  <th className="px-6 py-3.5">Face Samples</th>
                  <th className="px-6 py-3.5">Attendance %</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => (
                  <tr key={student.enrollment} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-blue-400">{student.enrollment}</td>
                    <td className="px-6 py-4 font-semibold text-slate-100">{student.name}</td>
                    <td className="px-6 py-4 text-slate-400">{student.created_at}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                        {student.sample_count || 0} / 50
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {student.attendance_rate || 0}%
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {student.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectStudent(student.enrollment)}
                        title="View Student Profile"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.enrollment)}
                        title="Delete Student"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-700 mx-auto" />
            <p>No student records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
