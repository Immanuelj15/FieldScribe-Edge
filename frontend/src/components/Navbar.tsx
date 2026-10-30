import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Plus, LayoutDashboard, History, Sparkles, Cpu } from 'lucide-react';
import { fetchHealth } from '../services/api';
import { HealthStatus } from '../types/clinical';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.warn('Health check warning:', err));
  }, []);

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/create', label: 'Create Note', icon: Plus },
    { to: '/history', label: 'Record History', icon: History },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const provider = health?.provider || 'ollama';
  let engineLabel = 'AI Engine';
  let engineStatusDot = 'bg-cyan-400';
  let engineTooltip = '';

  if (provider === 'ollama') {
    const isAvailable = health?.ollama?.available;
    const model = health?.ollama?.model || 'nemotron-mini';
    engineLabel = isAvailable ? `Ollama: ${model}` : `Ollama: Offline`;
    engineStatusDot = isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400';
    engineTooltip = `Provider: Ollama Local\nModel: ${model}\nStatus: ${isAvailable ? 'Connected to local daemon' : 'Daemon unreachable (run "ollama serve")'}\nEndpoint: ${health?.ollama?.base_url || 'http://localhost:11434'}`;
  } else if (provider === 'nebius') {
    const isConfigured = health?.nebius?.api_key_configured;
    const model = health?.nebius?.configured_model || 'Nemotron-70B';
    engineLabel = isConfigured ? 'Nebius Cloud' : 'Nebius (No Key)';
    engineStatusDot = isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400';
    engineTooltip = `Provider: Nebius Token Factory Cloud\nModel: ${model}\nStatus: ${isConfigured ? 'API Key Configured' : 'Missing NEBIUS_API_KEY'}\nEndpoint: ${health?.nebius?.api_endpoint || 'api.studio.nebius.ai'}`;
  } else {
    engineLabel = 'Demo Safe-Engine';
    engineStatusDot = 'bg-blue-400';
    engineTooltip = 'Provider: Local Deterministic Rule-Based Engine (Demo Mode)';
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                FieldScribe <span className="text-blue-600">Edge</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                NVIDIA 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono hidden sm:block">
              Voice-to-Structured Clinical Records
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side: AI Engine Indicator & New Note button */}
        <div className="flex items-center gap-3">
          {/* Engine indicator */}
          <div
            title={engineTooltip}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-help transition-all hover:border-blue-400"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500 font-medium">Engine:</span>
            <span className="font-mono text-blue-700 font-semibold truncate max-w-[160px]">
              {engineLabel}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${engineStatusDot}`}
            />
          </div>

          <Link
            to="/create"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Note</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
