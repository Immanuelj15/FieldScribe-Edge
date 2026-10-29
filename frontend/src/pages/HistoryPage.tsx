import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  ArrowRight,
  Pill,
  Syringe,
  AlertCircle,
  FileCheck2,
  Calendar,
  Clock
} from 'lucide-react';
import { ClinicalRecord } from '../types/clinical';
import { listRecords } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, truncateText } from '../utils/formatters';

export const HistoryPage: React.FC = () => {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecords(searchTerm, statusFilter);
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <History className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Clinical Documentation History
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Complete archive of generated emergency responder clinical documentation, attestation audits, and FHIR export status. (Demonstration archive)
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1427] border border-slate-800">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search records by ID, medication, or symptom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All ({records.length})</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
      </div>

      {/* Records Cards List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading archive records...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-400 text-sm bg-red-950/20 rounded-2xl border border-red-900">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
          {error}
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
          <p>No records found in history matching your criteria.</p>
          <Link
            to="/create"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Create a new emergency record
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec.record_id}
              className="p-5 rounded-2xl bg-[#0b1329] border border-slate-800 hover:border-slate-700 transition-all shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-cyan-300 text-base">
                    {rec.record_id}
                  </span>
                  <StatusBadge status={rec.review_status} size="sm" />
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {rec.event_timestamp || 'No time stated'}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {formatDate(rec.created_at)}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-mono line-clamp-2">
                  "{rec.source_note}"
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {rec.medications.map((m, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/50 text-blue-300 text-[11px]"
                    >
                      <Pill className="w-2.5 h-2.5 text-cyan-400" />
                      {m.name} {m.dosage ? `(${m.dosage})` : ''}
                    </span>
                  ))}
                  {rec.procedures.map((p, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 text-purple-300 text-[11px]"
                    >
                      <Syringe className="w-2.5 h-2.5 text-purple-400" />
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <Link
                  to={`/records/${rec.record_id}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 text-xs font-semibold border border-cyan-800/60 transition-all hover:scale-[1.02]"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

