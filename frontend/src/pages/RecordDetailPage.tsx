import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Pill,
  Syringe,
  FileText,
  Save,
  Plus,
  Trash2,
  ShieldCheck,
  Cpu,
  Eye,
  Info
} from 'lucide-react';
import { ClinicalRecord, MedicationItem, ProcedureItem } from '../types/clinical';
import { getRecord, updateRecord, confirmRecord } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ExportModal } from '../components/ExportModal';
import { formatDate, formatConfidence } from '../utils/formatters';

export const RecordDetailPage: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const [record, setRecord] = useState<ClinicalRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // Editable local state
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [observations, setObservations] = useState<string[]>([]);
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [eventTimestamp, setEventTimestamp] = useState<string>('');

  const loadData = async () => {
    if (!recordId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRecord(recordId);
      setRecord(data);
      setMedications(data.medications || []);
      setProcedures(data.procedures || []);
      setObservations(data.observations || []);
      setMissingInfo(data.missing_information || []);
      setReviewerNotes(data.reviewer_notes || '');
      setEventTimestamp(data.event_timestamp || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [recordId]);

  // Medication handlers
  const handleMedChange = (index: number, field: keyof MedicationItem, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value || null };
    setMedications(updated);
  };

  const handleAddMed = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', route: '', timestamp: '', source_text: 'Added during human review' }
    ]);
  };

  const handleRemoveMed = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  // Procedure handlers
  const handleProcChange = (index: number, field: keyof ProcedureItem, value: string) => {
    const updated = [...procedures];
    updated[index] = { ...updated[index], [field]: value || null };
    setProcedures(updated);
  };

  const handleAddProc = () => {
    setProcedures([
      ...procedures,
      { name: '', timestamp: '', source_text: 'Added during human review' }
    ]);
  };

  const handleRemoveProc = (index: number) => {
    setProcedures(procedures.filter((_, i) => i !== index));
  };

  // Missing info handlers
  const handleRemoveMissing = (index: number) => {
    setMissingInfo(missingInfo.filter((_, i) => i !== index));
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (!recordId) return;
    setSaving(true);
    try {
      const updated = await updateRecord(recordId, {
        medications,
        procedures,
        observations,
        missing_information: missingInfo,
        reviewer_notes: reviewerNotes,
        event_timestamp: eventTimestamp || null,
        review_status: record?.review_status === 'confirmed' ? 'confirmed' : 'reviewed'
      });
      setRecord(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Confirm Record
  const handleConfirm = async () => {
    if (!recordId) return;
    setSaving(true);
    try {
      const confirmed = await confirmRecord(recordId, reviewerNotes || 'Verified and confirmed by first responder on duty.');
      setRecord(confirmed);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(`Confirm error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading clinical record...
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-red-500 text-base">{error || 'Record not found'}</div>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {record.record_id}
              </h1>
              <StatusBadge status={record.review_status} />
              {record.human_edited && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  Human-Edited
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
              <span>Created: {formatDate(record.created_at)}</span>
              {record.confirmed_at && (
                <span className="text-emerald-700 font-medium">
                  Confirmed: {formatDate(record.confirmed_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors"
          >
            <Share2 className="w-4 h-4 text-blue-600" />
            <span>Export (JSON / FHIR / Note)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-2xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Edits'}</span>
          </button>

          {record.review_status !== 'confirmed' && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Lock Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Model & Confidence Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-slate-500">AI Model Engine:</span>
          <span className="text-slate-900 font-mono truncate font-medium">
            {record.model_used || 'Nebius Token Factory (nvidia/Nemotron-70B)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-slate-500">Extraction Confidence:</span>
          <span className="text-emerald-700 font-mono font-bold">
            {formatConfidence(record.extraction_confidence)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-slate-500">Event Timestamp:</span>
          <input
            type="text"
            value={eventTimestamp}
            onChange={(e) => setEventTimestamp(e.target.value)}
            placeholder="e.g. 10:15 AM"
            className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs text-blue-700 font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Verbatim Source Note Box */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5 text-slate-800">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Original First-Responder Note (Verbatim Source)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Immutable audit reference</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 font-mono leading-relaxed">
          "{record.source_note}"
        </div>
      </div>

      {/* Critical Missing Documentation Gaps */}
      {missingInfo.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Missing Clinical Documentation Audit Flags ({missingInfo.length})</span>
          </div>
          <p className="text-xs text-amber-800/90">
            The AI engine detected the following documentation omissions in the source note. Please review and clarify prior to hospital handover.
          </p>
          <div className="space-y-1.5 pt-1">
            {missingInfo.map((flag, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200 text-xs text-amber-900 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>{flag}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMissing(idx)}
                  className="text-amber-700 hover:text-amber-900 text-[11px] font-medium"
                  title="Acknowledge / Dismiss flag"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Administered Medications ({medications.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={handleAddMed}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medication</span>
          </button>
        </div>

        {medications.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            No medications documented in source note. Click "Add Medication" if administered.
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Medication Name *
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                      placeholder="e.g. DemoMed, Epinephrine"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Dosage & Unit
                    </label>
                    <input
                      type="text"
                      value={med.dosage || ''}
                      onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                      placeholder="e.g. 500 mg, 0.3 mg"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Route of Administration
                    </label>
                    <input
                      type="text"
                      value={med.route || ''}
                      onChange={(e) => handleMedChange(idx, 'route', e.target.value)}
                      placeholder="e.g. oral, IV, IM, sublingual"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Administration Time
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={med.timestamp || ''}
                        onChange={(e) => handleMedChange(idx, 'timestamp', e.target.value)}
                        placeholder="e.g. 10:15 AM"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMed(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/60"
                        title="Delete medication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {med.source_text && (
                  <div className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-blue-600 font-semibold">Verbatim Source Snippet:</span> "{med.source_text}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Procedures Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Syringe className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Procedures & Interventions ({procedures.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={handleAddProc}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium border border-indigo-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Procedure</span>
          </button>
        </div>

        {procedures.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            No procedures documented in source note. Click "Add Procedure" if intervention performed.
          </div>
        ) : (
          <div className="space-y-3">
            {procedures.map((proc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Procedure Name *
                    </label>
                    <input
                      type="text"
                      value={proc.name}
                      onChange={(e) => handleProcChange(idx, 'name', e.target.value)}
                      placeholder="e.g. wound dressing, 12-lead ECG"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Procedure Time
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={proc.timestamp || ''}
                        onChange={(e) => handleProcChange(idx, 'timestamp', e.target.value)}
                        placeholder="e.g. 10:20 AM"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProc(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/60"
                        title="Delete procedure"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {proc.source_text && (
                  <div className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-indigo-600 font-semibold">Verbatim Source Snippet:</span> "{proc.source_text}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observations Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Explicit Clinical Observations</h2>
        </div>
        <p className="text-xs text-slate-500">
          Clinical states, patient conditions, and reassessment times extracted directly from the responder's verbatim statement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {observations.map((obs, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span>{obs}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Human Reviewer Attestation & Notes */}
      <div className="p-6 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">
            Human-in-the-Loop Reviewer Attestation
          </h2>
        </div>
        <p className="text-xs text-slate-600">
          As a qualified emergency medical responder, attest that you have reviewed the extracted medication names, dosages, routes, and procedure times against dispatch and physical evidence.
        </p>
        <textarea
          rows={3}
          value={reviewerNotes}
          onChange={(e) => setReviewerNotes(e.target.value)}
          placeholder="Add responder notes, verification remarks, or dispatch confirmation (e.g. 'Verified dosages against dispatch radio log. Reassessment confirmed at 10:30 AM')..."
          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-slate-600">
            Current Review Status: <span className="font-bold text-slate-900 capitalize">{record.review_status}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shadow-2xs"
            >
              Save As Reviewed
            </button>
            {record.review_status !== 'confirmed' && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Confirm & Lock Record
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {exportModalOpen && (
        <ExportModal
          record={record}
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
        />
      )}

    </div>
  );
};
