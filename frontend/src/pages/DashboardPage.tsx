import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  Eye,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Pill,
  Syringe,
  AlertCircle
} from 'lucide-react';
import { ClinicalRecord } from '../types/clinical';
import { listRecords } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, truncateText } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecords(searchTerm, statusFilter);
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDashboardData();
  };

  // Metrics
  const totalCount = records.length;
  const pendingCount = records.filter((r) => r.review_status === 'pending').length;
  const reviewedCount = records.filter((r) => r.review_status === 'reviewed').length;
  const confirmedCount = records.filter((r) => r.review_status === 'confirmed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Emergency Clinical Records Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status of first-responder notes, AI clinical extractions, and verification audit trails.
          </p>
        </div>
        <Link
          to="/create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Clinical Note</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Demo Records</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono mt-3">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Fictional responder encounters</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">Draft / Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-300 font-mono mt-3">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires human review</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-300">Under Review</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-cyan-300 font-mono mt-3">{reviewedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Being verified by staff</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Confirmed & Signed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono mt-3">{confirmedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Exportable to FHIR/EHR</div>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1427] border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, medication, procedure..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Records</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Under Review</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Recent Clinical Documentation</h2>
          <span className="text-xs text-slate-400 font-mono">Showing {records.length} records</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading clinical records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm space-y-3">
            <p>No records found matching your criteria.</p>
            <Link
              to="/create"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              <Plus className="w-4 h-4" /> Create a new clinical note
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#080d1c] text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Record ID</th>
                  <th className="px-6 py-3.5">Event Time</th>
                  <th className="px-6 py-3.5">Source Note Snippet</th>
                  <th className="px-6 py-3.5">Medications / Procedures</th>
                  <th className="px-6 py-3.5">Review Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {records.map((rec) => (
                  <tr key={rec.record_id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Record ID */}
                    <td className="px-6 py-4 font-mono font-semibold text-cyan-300 whitespace-nowrap">
                      {rec.record_id}
                    </td>

                    {/* Time */}
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {rec.event_timestamp || formatDate(rec.created_at)}
                    </td>

                    {/* Note Snippet */}
                    <td className="px-6 py-4 text-xs max-w-xs text-slate-300">
                      {truncateText(rec.source_note, 75)}
                    </td>

                    {/* Extracted meds & procedures */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {rec.medications.map((m, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/70 border border-blue-800/60 text-blue-300 text-[11px]"
                          >
                            <Pill className="w-2.5 h-2.5 text-cyan-400" />
                            {m.name}
                          </span>
                        ))}
                        {rec.procedures.map((p, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800/60 text-purple-300 text-[11px]"
                          >
                            <Syringe className="w-2.5 h-2.5 text-purple-400" />
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={rec.review_status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        to={`/records/${rec.record_id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-900/40 transition-colors"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

