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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1329] border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">
              Export Clinical Record: <span className="font-mono text-cyan-300">{record.record_id}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-[#070b18] px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'json'
                ? 'bg-slate-800 text-cyan-300 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Standard JSON</span>
          </button>
          
          <button
            onClick={() => setActiveTab('fhir')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'fhir'
                ? 'bg-slate-800 text-cyan-300 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4 text-emerald-400" />
            <span>FHIR-Lite Bundle (Demo)</span>
          </button>

          <button
            onClick={() => setActiveTab('narrative')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'narrative'
                ? 'bg-slate-800 text-cyan-300 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Narrative Clinical Note (.txt)</span>
          </button>
        </div>

        {/* Notice for FHIR */}
        {activeTab === 'fhir' && (
          <div className="px-6 py-2 bg-emerald-950/40 border-b border-emerald-900/50 text-[11px] text-emerald-300">
            * <strong>FHIR-Lite Demo:</strong> HL7 FHIR R4-inspired Bundle containing Composition, MedicationAdministration, Procedure, and Observation resources for hackathon interoperability demonstration.
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-[#050914] text-slate-300">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
              Generating export...
            </div>
          ) : (
            <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">
              {content}
            </pre>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Status: <span className="text-white font-medium capitalize">{record.review_status}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shadow transition-colors"
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

