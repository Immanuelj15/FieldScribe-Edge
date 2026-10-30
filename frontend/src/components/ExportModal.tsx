import React, { useState } from 'react';
import { X, Copy, Check, Download, FileJson, FileText, Share2 } from 'lucide-react';
import { ClinicalRecord } from '../types/clinical';
import { exportRecord } from '../services/api';
import { downloadFile } from '../utils/formatters';

interface Props {
  record: ClinicalRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<Props> = ({ record, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'json' | 'fhir' | 'narrative'>('json');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      loadExport(activeTab);
    }
  }, [isOpen, activeTab, record.record_id]);

  const loadExport = async (tab: 'json' | 'fhir' | 'narrative') => {
    setLoading(true);
    try {
      const data = await exportRecord(record.record_id, tab);
      if (typeof data === 'string') {
        setContent(data);
      } else {
        setContent(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setContent(`Error loading export: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeTab === 'narrative' ? 'txt' : 'json';
    const mime = activeTab === 'narrative' ? 'text/plain' : 'application/json';
    const filename = `${record.record_id}_${activeTab}.${ext}`;
    downloadFile(content, filename, mime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Export Clinical Record: <span className="font-mono text-blue-700">{record.record_id}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'json'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileJson className="w-4 h-4 text-blue-600" />
            <span>Standard JSON</span>
          </button>
          
          <button
            onClick={() => setActiveTab('fhir')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'fhir'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileJson className="w-4 h-4 text-emerald-600" />
            <span>FHIR-Lite Bundle</span>
          </button>

          <button
            onClick={() => setActiveTab('narrative')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'narrative'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Narrative Note (.txt)</span>
          </button>
        </div>

        {/* Notice for FHIR */}
        {activeTab === 'fhir' && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-[11px] text-emerald-800">
            * <strong>FHIR-Lite Specification:</strong> HL7 FHIR R4-inspired Bundle containing Composition, MedicationAdministration, Procedure, and Observation resources for clinical interoperability.
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-slate-900 text-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3" />
              Generating export...
            </div>
          ) : (
            <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">
              {content}
            </pre>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Status: <span className="text-slate-900 font-semibold capitalize">{record.review_status}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-300 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

