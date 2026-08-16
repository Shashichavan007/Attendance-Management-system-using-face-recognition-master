import React, { useState } from 'react';
import { FileSpreadsheet, Download, FileText, Table, Calendar, BookOpen } from 'lucide-react';

export default function ReportsPage() {
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');

  const getExportUrl = (format) => {
    let query = [];
    if (subject) query.push(`subject=${encodeURIComponent(subject)}`);
    if (date) query.push(`date=${encodeURIComponent(date)}`);
    const qStr = query.length > 0 ? `?${query.join('&')}` : '';
    return `/api/reports/${format}${qStr}`;
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Attendance Reports & Exports</h1>
        <p className="text-xs text-slate-400 mt-1">Generate and export formatted attendance data for academic and administrative records.</p>
      </div>

      {/* Filter Parameters */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100">Report Parameters</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Filter by Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">All Subjects</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Filter by Specific Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CSV Export */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Table className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">CSV Export</h3>
            <p className="text-xs text-slate-400">Raw comma-separated dataset compatible with legacy system workflows.</p>
          </div>

          <a
            href={getExportUrl('csv')}
            download
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold text-center shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </a>
        </div>

        {/* Excel Export */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">Excel Spreadsheet (.xlsx)</h3>
            <p className="text-xs text-slate-400">Styled spreadsheet with auto-calculated column widths and styled headers.</p>
          </div>

          <a
            href={getExportUrl('excel')}
            download
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold text-center shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel</span>
          </a>
        </div>

        {/* PDF Export */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">PDF Printable Report</h3>
            <p className="text-xs text-slate-400">Formally formatted PDF document suitable for printing and official record keeping.</p>
          </div>

          <a
            href={getExportUrl('pdf')}
            download
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold text-center shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>
    </div>
  );
}
