import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-navy-900/90 border-b border-amber-500/20 text-xs text-amber-200/90 px-4 py-2 flex items-center justify-between backdrop-blur-sm">
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Hackathon Prototype Disclaimer:</strong> FieldScribe Edge is a documentation assistant for the Nebius x NVIDIA Hackathon 2026. Uses fictional demo data. Does not provide diagnoses, treatment recommendations, or HIPAA certified storage. Human review required.
        </span>
      </div>
      <div className="hidden md:flex items-center gap-1 text-slate-400 text-[11px] shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span>Human-in-the-Loop Enforced</span>
      </div>
    </div>
  );
};

