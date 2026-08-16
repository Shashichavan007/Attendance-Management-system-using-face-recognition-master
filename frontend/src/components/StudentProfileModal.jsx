import React from 'react';
import { X, User, Hash, Calendar, Percent, CheckCircle2, XCircle, Clock, Camera } from 'lucide-react';

export default function StudentProfileModal({ student, isOpen, onClose, onRegisterNewSamples }) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">{student.name}</h3>
              <p className="text-xs text-slate-400">Enrollment ID: {student.enrollment}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Key Metrics grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Attendance Rate</span>
              <span className={`text-xl font-bold ${student.attendance_rate >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {student.attendance_rate}%
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Present Classes</span>
              <span className="text-xl font-bold text-slate-100">{student.present_count || 0}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Face Samples</span>
              <span className="text-xl font-bold text-blue-400">{student.sample_count || 0}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Status</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mt-1">
                {student.status || 'Active'}
              </span>
            </div>
          </div>

          {/* Registration Info */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <p className="text-slate-400">Registered On: <span className="text-slate-200 font-medium">{student.created_at}</span></p>
              <p className="text-slate-400">Face Dataset: <span className="text-slate-200 font-medium">{student.actual_sample_count || student.sample_count} image crops stored</span></p>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onRegisterNewSamples) onRegisterNewSamples(student);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Register New Samples</span>
            </button>
          </div>

          {/* Recent Attendance History */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Attendance History</span>
            </h4>

            {student.attendance_history && student.attendance_history.length > 0 ? (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Subject</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Time</th>
                      <th className="px-4 py-2.5">Method</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {student.attendance_history.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 font-medium text-slate-200">{record.subject}</td>
                        <td className="px-4 py-2.5 text-slate-400">{record.date}</td>
                        <td className="px-4 py-2.5 text-slate-400 font-mono">{record.time}</td>
                        <td className="px-4 py-2.5 text-slate-400">{record.method}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
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
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No attendance logs found for this student.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
