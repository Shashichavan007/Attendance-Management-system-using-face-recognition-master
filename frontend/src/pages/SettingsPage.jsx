import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sliders, Camera, Volume2, Save, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SettingsPage({ voiceEnabled, setVoiceEnabled }) {
  const [threshold, setThreshold] = useState(70);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [duration, setDuration] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setThreshold(data.confidence_threshold || 70);
        setCameraIndex(data.camera_index || 0);
        setDuration(data.attendance_duration || 20);
        setVoiceEnabled(data.voice_notifications);
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage('');

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confidence_threshold: parseFloat(threshold),
          camera_index: parseInt(cameraIndex),
          attendance_duration: parseInt(duration),
          voice_notifications: voiceEnabled
        })
      });

      if (res.ok) {
        setMessage('✓ Settings updated successfully.');
      } else {
        setMessage('⚠️ Failed to update settings.');
      }
    } catch (err) {
      setMessage(`⚠️ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">System Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">Configure recognition sensitivity, camera hardware, and notifications.</p>
      </div>

      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        {/* Threshold Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>LBPH Recognition Confidence Threshold</span>
            </label>
            <span className="font-mono text-sm font-bold text-blue-400">{threshold}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            In OpenCV LBPH, lower distance value means stricter match requirements. Distance score below threshold triggers match.
          </p>
          <input
            type="range"
            min="30"
            max="120"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          {/* Camera Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Camera Hardware Index</span>
            </label>
            <select
              value={cameraIndex}
              onChange={(e) => setCameraIndex(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value={0}>Camera 0 (Default Integrated Webcam)</option>
              <option value={1}>Camera 1 (External USB Webcam)</option>
              <option value={2}>Camera 2 (Secondary Device)</option>
            </select>
          </div>

          {/* Voice Notifications */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Audio Voice Notifications (pyttsx3 / TTS)</span>
            </label>
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`w-full py-2.5 px-4 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${
                voiceEnabled
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <span>Text-To-Speech Feedback</span>
              <span>{voiceEnabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'}</span>
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-xs font-semibold border ${
            message.startsWith('✓') 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {message}
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
