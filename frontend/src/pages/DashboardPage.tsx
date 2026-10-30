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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Emergency Clinical Records Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status of first-responder notes, AI clinical extractions, and verification audit trails.
          </p>
        </div>
        <Link
          to="/create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Clinical Note</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Clinical Records</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-3">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active emergency records</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Draft / Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-700 font-mono mt-3">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Requires human review</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-700">Under Review</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-700 font-mono mt-3">{reviewedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Being verified by staff</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Confirmed & Signed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-700 font-mono mt-3">{confirmedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Exportable to FHIR/EHR</div>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, medication, procedure..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Records</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Under Review</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <h2 className="text-base font-semibold text-slate-900">Recent Clinical Documentation</h2>
          <span className="text-xs text-slate-500 font-mono">Showing {records.length} records</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading clinical records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm space-y-3">
            <p>No clinical records created yet.</p>
            <Link
              to="/create"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              <Plus className="w-4 h-4" /> Create the first clinical note
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Record ID</th>
                  <th className="px-6 py-3.5">Event Time</th>
                  <th className="px-6 py-3.5">Source Note Snippet</th>
                  <th className="px-6 py-3.5">Medications / Procedures</th>
                  <th className="px-6 py-3.5">Review Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {records.map((rec) => (
                  <tr key={rec.record_id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Record ID */}
                    <td className="px-6 py-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {rec.record_id}
                    </td>

                    {/* Time */}
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {rec.event_timestamp || formatDate(rec.created_at)}
                    </td>

                    {/* Note Snippet */}
                    <td className="px-6 py-4 text-xs max-w-xs text-slate-600">
                      {truncateText(rec.source_note, 75)}
                    </td>

                    {/* Extracted meds & procedures */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {rec.medications.map((m, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium"
                          >
                            <Pill className="w-2.5 h-2.5 text-blue-600" />
                            {m.name}
                          </span>
                        ))}
                        {rec.procedures.map((p, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-medium"
                          >
                            <Syringe className="w-2.5 h-2.5 text-indigo-600" />
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
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
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
