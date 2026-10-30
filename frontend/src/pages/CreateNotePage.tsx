import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Sparkles,
  RotateCcw,
  Clock,
  AlertTriangle,
  FileText,
  Volume2,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { extractNote, createRecord, fetchHealth } from '../services/api';
import { HealthStatus } from '../types/clinical';

const PRESET_SCENARIOS = [
  {
    title: 'Fall & Trauma (Hackathon Prompt Example)',
    text: 'Patient found conscious after a fall. First responder administered 500 milligrams of a fictional demo medication named DemoMed by oral route at 10:15 AM. A basic wound dressing procedure was performed at 10:20 AM. Patient was reassessed at 10:30 AM.',
    time: '10:15 AM'
  },
  {
    title: 'Severe Allergic Reaction',
    text: 'En route to severe allergic reaction. Administered 0.3 mg Epinephrine auto-injector by intramuscular route in right thigh at 14:05. High-flow oxygen via non-rebreather mask applied at 14:08. Wheezing decreased by 14:15.',
    time: '14:05'
  },
  {
    title: 'Acute Chest Distress',
    text: 'Adult male experiencing chest tightness. Gave 324 mg chewable Aspirin orally at 18:40. 12-lead ECG procedure was performed at 18:45 showing sinus tachycardia. Nitroglycerin 0.4 mg sublingual administered at 18:48.',
    time: '18:40'
  }
];

export const CreateNotePage: React.FC = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState<string>('');
  const [eventTime, setEventTime] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => {});
  }, []);

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // Sync voice transcript to input area
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClear = () => {
    setInputText('');
    setEventTime('');
    resetTranscript();
    setErrorMessage(null);
  };

  const handleLoadPreset = (scenario: typeof PRESET_SCENARIOS[0]) => {
    setInputText(scenario.text);
    setEventTime(scenario.time);
    setErrorMessage(null);
  };

  const handleGenerateStructuredNote = async () => {
    if (!inputText.trim()) {
      setErrorMessage('Please type or dictate an emergency clinical note before generating.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const providerName = health?.provider === 'ollama'
      ? `Local Ollama (${health?.ollama?.model || 'nemotron-mini'})`
      : (health?.provider === 'nebius' ? 'Nebius Token Factory (NVIDIA Nemotron-70B)' : 'Deterministic Demo Engine');

    try {
      // Step 1
      setProcessingStep('Transcribing & normalizing audio / text input...');
      await new Promise((r) => setTimeout(r, 350));

      // Step 2
      setProcessingStep(`Sending to ${providerName}...`);
      const extraction = await extractNote(inputText, eventTime || undefined);

      // Step 3
      setProcessingStep('Executing Pydantic schema validation & zero-hallucination guard...');
      await new Promise((r) => setTimeout(r, 350));

      // Step 4: Persist draft record
      setProcessingStep('Creating draft clinical record for human review...');
      const newRecord = await createRecord({
        source_note: extraction.source_note,
        event_timestamp: extraction.event_timestamp || eventTime || null,
        medications: extraction.medications,
        procedures: extraction.procedures,
        observations: extraction.observations,
        missing_information: extraction.missing_information,
        extraction_confidence: extraction.extraction_confidence,
        model_used: extraction.model_used,
        review_status: 'pending'
      });

      // Redirect to review page
      navigate(`/records/${newRecord.record_id}`);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMessage(err.message || 'Failed to extract structured clinical note. Check backend connection.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const provider = health?.provider || 'ollama';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Create Clinical Note</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Voice & Text Input
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dictate via microphone or type your first-responder field notes. AI will extract medications, dosages, routes, procedures, and timestamps with strict zero-hallucination fidelity.
          </p>
        </div>

        {/* Current Provider Pill */}
        <div className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs flex items-center gap-2 text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Provider:</span>
          <span className="font-semibold text-cyan-300 uppercase">{provider}</span>
          {provider === 'ollama' && health?.ollama && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${health.ollama.available ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
              {health.ollama.available ? 'daemon active' : 'daemon offline'}
            </span>
          )}
        </div>
      </div>

      {/* Preset Scenarios for rapid 1-click test */}
      <div className="p-4 rounded-2xl bg-[#0b1329] border border-slate-800 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Hackathon Demo Scenarios (1-Click Fill)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-xs transition-all group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-cyan-300">
                {preset.title}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-1">
                {preset.text}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Card */}
      <div className="p-6 rounded-2xl bg-[#0d162d] border border-slate-700/80 shadow-2xl space-y-5">
        
        {/* Voice control banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#090f20] border border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleListening}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-emergency-red text-white animate-pulse shadow-lg shadow-red-500/30'
                  : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30'
              }`}
              title={isListening ? 'Stop Recording' : 'Start Voice Dictation'}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {isListening ? 'Listening to speech...' : 'Web Speech Voice Input'}
                </span>
                {isListening && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                    RECORDING LIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isSupported
                  ? 'Click microphone to speak. Emergency terminology and numbers are captured in real-time.'
                  : 'Browser Web Speech API unavailable. Please use the typed input box below.'}
              </p>
            </div>
          </div>

          {/* Event Timestamp Input */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Clock className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Event time (e.g. 10:15 AM)"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 w-full sm:w-44"
            />
          </div>
        </div>

        {/* Interim Speech Indicator */}
        {isListening && interimTranscript && (
          <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 italic flex items-center gap-2">
            <Volume2 className="w-4 h-4 animate-bounce text-cyan-400 shrink-0" />
            <span>Interim: "{interimTranscript}"</span>
          </div>
        )}

        {/* Speech Error Notice */}
        {speechError && (
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Text Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="font-semibold text-slate-300">
              First Responder Emergency Note (Spoken or Typed):
            </label>
            <span>{inputText.length} characters</span>
          </div>
          <textarea
            rows={7}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Dictate or type your field note here... E.g. 'Patient found conscious after a fall. First responder administered 500 milligrams of DemoMed by oral route at 10:15 AM. Wound dressing procedure performed at 10:20 AM.'"
            className="w-full bg-[#080d1b] border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
          />
        </div>

        {/* General Error Message with Actionable Help */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-200 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong>AI Provider Notice:</strong> {errorMessage}
              </div>
            </div>

            {/* Contextual help for Ollama */}
            {errorMessage.toLowerCase().includes('ollama') && (
              <div className="p-2.5 rounded bg-black/40 border border-red-900/60 font-mono text-[11px] text-red-300 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Terminal className="w-3.5 h-3.5" /> Quick Windows Fix:
                </div>
                <div>1. Start local daemon: <code className="text-white bg-slate-800 px-1 py-0.5 rounded">ollama serve</code></div>
                <div>2. Pull model if needed: <code className="text-white bg-slate-800 px-1 py-0.5 rounded">ollama pull {health?.ollama?.model || 'nemotron-mini'}</code></div>
                <div>3. Or switch to offline demo in <code className="text-white">backend/.env</code>: <code className="text-white bg-slate-800 px-1 py-0.5 rounded">AI_PROVIDER=demo</code></div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={isProcessing}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Input</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateStructuredNote}
            disabled={isProcessing || !inputText.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01]"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing AI Extraction...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Structured Note</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* AI Processing Modal / Status Overlay */}
      {isProcessing && (
        <div className="p-6 rounded-2xl bg-[#090f20] border border-cyan-500/40 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 animate-spin">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {provider === 'ollama' ? 'Local Ollama & NVIDIA Model' : (provider === 'nebius' ? 'Nebius Token Factory & NVIDIA Engine' : 'Deterministic Demo Safe-Engine')}
              </h3>
              <p className="text-xs text-cyan-300 font-mono mt-0.5">
                {processingStep}
              </p>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-2/3 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 font-mono">
            <div>✓ Voice/Text Ingested</div>
            <div>⚡ {provider === 'ollama' ? 'Ollama Daemon' : (provider === 'nebius' ? 'Nebius API' : 'Demo Engine')}</div>
            <div>🧠 {provider === 'ollama' ? (health?.ollama?.model || 'nemotron-mini') : (provider === 'nebius' ? 'Nemotron-70B' : 'Fidelity Guard')}</div>
            <div>🛡️ Pydantic Validation</div>
          </div>
        </div>
      )}

    </div>
  );
};
