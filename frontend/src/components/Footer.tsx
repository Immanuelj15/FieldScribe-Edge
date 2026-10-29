import React from 'react';
import { Shield, ExternalLink, Code2, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050811] border-t border-slate-800/80 text-slate-400 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white">
                FieldScribe <span className="text-cyan-400">Edge</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">
                v1.0.0
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Real-time voice-to-structured clinical note generation designed for first responders and emergency medical services. Converting unstructured emergency speech into human-reviewable, standardized clinical data.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Built for the <strong>Nebius x NVIDIA Global AI Hackathon 2026</strong></span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              AI Architecture
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <span className="text-cyan-400 font-medium">Platform:</span> Nebius Token Factory API
              </li>
              <li>
                <span className="text-cyan-400 font-medium">Model:</span> NVIDIA Nemotron-70B-Instruct
              </li>
              <li>
                <span className="text-cyan-400 font-medium">Validation:</span> Pydantic Strict Schemas
              </li>
              <li>
                <span className="text-cyan-400 font-medium">Interoperability:</span> FHIR-Lite JSON Bundle
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Compliance & Safety
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Human-in-the-Loop review enforced</span>
              </li>
              <li className="flex items-start gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                <span>Fictional demonstration data only</span>
              </li>
              <li>Open Source: MIT License</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 FieldScribe Edge. Nebius x NVIDIA Hackathon Submission.</p>
          <p className="text-slate-400">
            Documentation Assistant Prototype. Not certified for diagnostic or clinical treatment decisions.
          </p>
        </div>
      </div>
    </footer>
  );
};
