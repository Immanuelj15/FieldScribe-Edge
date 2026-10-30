import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Brain,
  FileCheck2,
  Share2,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  HardDrive,
  Cpu,
  FileJson
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-blue-500/10 via-sky-400/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        
        {/* Hackathon badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-8 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Nebius x NVIDIA Global AI Hackathon 2026 Submission</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Turn Emergency Notes Into{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
            Structured Clinical Records
          </span>
        </h1>

        {/* Hero Description */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Capture first-responder notes, extract key clinical information, and create reviewable structured records using AI.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/create"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Mic className="w-5 h-5" />
            <span>Create Clinical Note</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-base shadow-2xs transition-all flex items-center justify-center gap-2"
          >
            <span>View Clinical Dashboard</span>
          </Link>
        </div>

        {/* Live Metrics preview banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-200 text-left">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-2xl font-bold text-blue-600 font-mono">&lt; 3 sec</div>
            <div className="text-xs text-slate-500 mt-1">Extraction Latency</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-2xl font-bold text-emerald-600 font-mono">100%</div>
            <div className="text-xs text-slate-500 mt-1">Human-in-the-Loop</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-2xl font-bold text-sky-600 font-mono">FHIR-Lite</div>
            <div className="text-xs text-slate-500 mt-1">Standardized Export</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-2xl font-bold text-indigo-600 font-mono">Zero Hallucination</div>
            <div className="text-xs text-slate-500 mt-1">Fidelity Rule Guard</div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-16 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-3 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>The Emergency Documentation Problem</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
                Emergency care is fast. Manual documentation is slow and fragmented.
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                First responders administer critical medications, dosages, and procedures under extreme cognitive pressure. Vital details—such as route of administration, exact timestamps, and reassessment vitals—are frequently lost on torn paper scraps or delayed until hours after hospital transfer.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">1</div>
                  <p className="text-xs text-slate-600"><strong>Unstructured Voice Memos:</strong> Paramedics speak quickly, using abbreviations and conversational phrasing that EHR systems cannot digest.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">2</div>
                  <p className="text-xs text-slate-600"><strong>Omission of Critical Fields:</strong> Missing administration routes or missing procedure timestamps create legal and patient-safety risks.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">3</div>
                  <p className="text-xs text-slate-600"><strong>AI Hallucination Risk:</strong> Generic LLMs often guess medical dosages or invent procedures, which is impermissible in healthcare.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600 font-mono">FIELD AMBULANCE DISPATCH</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">FieldScribe Solution</span>
              </div>
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono italic">
                "Patient found conscious after a fall. First responder administered 500 milligrams of DemoMed by oral route at 10:15 AM. Wound dressing performed at 10:20 AM."
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200 text-blue-900">
                  <span className="font-semibold">Extracted Medication:</span>
                  <span>DemoMed (500 milligrams, Oral, 10:15 AM)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-900">
                  <span className="font-semibold">Extracted Procedure:</span>
                  <span>Wound dressing (10:20 AM)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="font-semibold">Missing Info Audit:</span>
                  <span>Vital signs (BP / HR) not in verbatim text</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2 font-mono">Workflow Architecture</h2>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">How FieldScribe Edge Works</h3>
          <p className="mt-2 text-slate-600 text-sm">From frantic verbal dispatch to verified electronic health record in seconds.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative hover:border-blue-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-blue-600 font-semibold mb-1">STEP 01</div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Voice or Typed Input</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Responders dictate in the field using browser Web Speech API or keyboard input when radio/engine noise is elevated.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative hover:border-blue-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-indigo-600 font-semibold mb-1">STEP 02</div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Ollama or Nebius AI</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Infers with local NVIDIA Nemotron-Mini via Ollama or at scale with Nebius Token Factory to isolate clinical entities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative hover:border-emerald-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-emerald-600 font-semibold mb-1">STEP 03</div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Human-in-the-Loop Review</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              The medic reviews extracted fields, flags missing clinical info, edits any discrepancy, and adds an official attestation note.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative hover:border-purple-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-purple-600 font-semibold mb-1">STEP 04</div>
            <h4 className="text-base font-bold text-slate-900 mb-2">FHIR-Lite & JSON Export</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export verified records into FHIR-lite R4 JSON bundles or human-readable narrative text for immediate hospital handoff.
            </p>
          </div>

        </div>
      </section>

      {/* AI Technology & Hackathon Alignment Section */}
      <section className="py-16 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2 font-mono">
              <Cpu className="w-4 h-4" />
              <span>Multi-Provider AI Architecture</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Flexible Local & Cloud Inference for Critical Care</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-2">
                <HardDrive className="w-4 h-4" />
                <span>Local Ollama Provider</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Privacy & Edge Autonomy</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connects to local Ollama daemon for offline field use on paramedic laptops, running lightweight NVIDIA Nemotron-Mini or Llama models with zero cloud dependency.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-2">
                <Cpu className="w-4 h-4" />
                <span>Nebius Token Factory</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">NVIDIA Nemotron-70B Cloud</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connects through Nebius Token Factory API with enterprise GPU acceleration, delivering sub-second inference and deep medical entity reasoning.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-2">
                <FileJson className="w-4 h-4" />
                <span>Pydantic Validation Guard</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Zero-Hallucination Guardrails</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every extracted entity is validated against strict Pydantic schemas. Unstated routes or times are flagged as missing documentation rather than guessed.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
          Ready to experience AI-powered clinical documentation?
        </h3>
        <p className="text-slate-600 text-sm mb-8 max-w-xl mx-auto">
          Test with pre-configured emergency scenarios or dictate your own first-responder note.
        </p>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Mic className="w-5 h-5" />
          <span>Launch FieldScribe Note Creator</span>
        </Link>
      </section>

    </div>
  );
};
