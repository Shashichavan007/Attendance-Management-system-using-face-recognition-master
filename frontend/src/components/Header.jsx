import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Moon, Sun, Clock, Wifi } from 'lucide-react';

export default function Header({ title, subtitle, voiceEnabled, setVoiceEnabled }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>System Online</span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{time.toLocaleTimeString()}</span>
        </div>

        {/* Voice notification toggle */}
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          title={voiceEnabled ? "Voice Notifications: ON" : "Voice Notifications: OFF"}
          className={`p-2 rounded-lg border transition-all ${
            voiceEnabled 
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' 
              : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
