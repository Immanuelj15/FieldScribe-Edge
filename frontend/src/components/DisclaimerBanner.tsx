import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-blue-50/90 border-b border-blue-200/80 text-xs text-blue-950 px-4 py-2 flex items-center justify-between backdrop-blur-sm">
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Hackathon Prototype Disclaimer:</strong> FieldScribe Edge is an emergency documentation assistant for the Nebius x NVIDIA Hackathon 2026. Does not provide diagnoses, treatment recommendations, or HIPAA certified storage. Human review required.
        </span>
      </div>
      <div className="hidden md:flex items-center gap-1 text-slate-500 text-[11px] shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
        <span className="font-medium text-slate-700">Human-in-the-Loop Enforced</span>
      </div>
    </div>
  );
};

