import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, RefreshCw, Layers, Image as ImageIcon, UserCheck, HardDrive } from 'lucide-react';

export default function ModelTrainingPage() {
  const [modelStatus, setModelStatus] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelStatus();
  }, []);

  const fetchModelStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recognition/status');
      if (res.ok) setModelStatus(await res.json());
    } catch (err) {
      console.error("Fetch model status error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    try {
      setIsTraining(true);
      setTrainingMessage('Processing training images and building LBPH face histogram model...');

      const res = await fetch('/api/recognition/train', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        setTrainingMessage(`✓ ${data.message}`);
        fetchModelStatus();
      } else {
        setTrainingMessage(`⚠️ ${data.message || 'Training failed.'}`);
      }
    } catch (err) {
      setTrainingMessage(`⚠️ Error: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Recognition Model Management</h1>
        <p className="text-xs text-slate-400 mt-1">Train and optimize the OpenCV Local Binary Patterns Histograms (LBPH) engine.</p>
      </div>

      {/* Model Overview Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">LBPH Face Recognizer</h3>
              <p className="text-xs text-slate-400">Model File: <span className="font-mono text-slate-300">TrainingImageLabel/Trainner.yml</span></p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            modelStatus?.is_trained
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {modelStatus?.status || 'Unknown'}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-400" />
              Registered Students
            </span>
            <p className="text-2xl font-bold text-slate-100">{modelStatus?.registered_students || 0}</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              Training Face Samples
            </span>
            <p className="text-2xl font-bold text-slate-100">{modelStatus?.training_images || 0}</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              Last Trained Time
            </span>
            <p className="text-sm font-semibold text-slate-200 mt-1">{modelStatus?.last_trained_at || 'Never'}</p>
          </div>
        </div>

        {/* Action Button & Live Progress */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 max-w-md">
              Training converts cropped face sample images into numeric histogram features for instant, low-latency prediction.
            </p>

            <button
              onClick={handleTrainModel}
              disabled={isTraining}
              className={`px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
                isTraining
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
              }`}
            >
              {isTraining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
              <span>{isTraining ? 'Training LBPH Engine...' : 'Train / Retrain Model'}</span>
            </button>
          </div>

          {trainingMessage && (
            <div className={`p-4 rounded-xl text-xs font-semibold border ${
              trainingMessage.startsWith('✓') 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              {trainingMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
