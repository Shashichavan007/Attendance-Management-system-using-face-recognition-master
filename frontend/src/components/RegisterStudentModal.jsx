import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, CheckCircle2, User, Hash, AlertCircle, RefreshCw, Cpu } from 'lucide-react';

export default function RegisterStudentModal({ isOpen, onClose, onRegisteredSuccess, onTrainModel }) {
  const [step, setStep] = useState(1);
  const [enrollment, setEnrollment] = useState('');
  const [name, setName] = useState('');
  const [capturedCount, setCapturedCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Position your face inside the frame');
  const [errorMsg, setErrorMsg] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureIntervalRef = useRef(null);

  useEffect(() => {
    if (step === 2 || step === 3) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setErrorMsg("Camera access failed. Please allow webcam permissions.");
    }
  };

  const stopCamera = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!enrollment.trim() || !name.trim()) {
      setErrorMsg("Enrollment Number and Name are required.");
      return;
    }

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment: enrollment.trim(), name: name.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Registration failed.");
      }

      setStep(2);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const startCaptureProcess = () => {
    setStep(3);
    setIsCapturing(true);
    setCapturedCount(0);

    captureIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.videoWidth === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frameB64 = canvas.toDataURL('image/jpeg', 0.8);

      try {
        const res = await fetch('/api/students/capture-samples', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enrollment: enrollment.trim(),
            name: name.trim(),
            frame_b64: frameB64
          })
        });

        const data = await res.json();

        if (data.face_detected && data.saved) {
          setCapturedCount(data.sample_count);
          setStatusMsg(`Face detected — Sample ${data.sample_count} / 50 captured!`);

          if (data.sample_count >= 50) {
            clearInterval(captureIntervalRef.current);
            setIsCapturing(false);
            stopCamera();
            setStep(4);
            if (onRegisteredSuccess) onRegisteredSuccess();
          }
        } else {
          setStatusMsg(data.message || "Position your face inside the frame...");
        }
      } catch (err) {
        console.error("Frame capture error:", err);
      }
    }, 250);
  };

  const handleFinish = () => {
    onClose();
    setStep(1);
    setEnrollment('');
    setName('');
    setCapturedCount(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100">Register New Student Face</h3>
          </div>
          <button onClick={handleFinish} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="px-6 pt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-blue-400' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 border flex items-center justify-center text-[10px]">1</span>
            <span>Details</span>
          </div>
          <div className="w-8 h-[1px] bg-slate-800"></div>
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-blue-400' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 border flex items-center justify-center text-[10px]">2</span>
            <span>Position</span>
          </div>
          <div className="w-8 h-[1px] bg-slate-800"></div>
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-blue-400' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 border flex items-center justify-center text-[10px]">3</span>
            <span>Capture</span>
          </div>
          <div className="w-8 h-[1px] bg-slate-800"></div>
          <div className={`flex items-center gap-1.5 ${step >= 4 ? 'text-blue-400' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 border flex items-center justify-center text-[10px]">4</span>
            <span>Done</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Details */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Enrollment ID</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1024"
                    value={enrollment}
                    onChange={(e) => setEnrollment(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Student Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
                >
                  Next: Camera Setup &rarr;
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Position Camera */}
          {step === 2 && (
            <div className="space-y-4 text-center">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                {/* Bounding box guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-60 border-2 border-dashed border-blue-400/80 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-[10px] bg-blue-600/80 text-white px-2 py-0.5 rounded font-mono">Face Alignment Guide</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400">Position your face inside the frame guidelines under clear lighting before starting capture.</p>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  &larr; Back
                </button>
                <button
                  onClick={startCaptureProcess}
                  className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Face Capture (50 Samples)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Capturing */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-400">{statusMsg}</span>
                  <span className="font-mono text-slate-300 font-bold">{capturedCount} / 50</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${(capturedCount / 50) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Samples captured: {capturedCount} / 50</span>
                {isCapturing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />}
              </div>
            </div>
          )}

          {/* STEP 4: Registration Complete */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-slate-100">Face Registration Complete!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Successfully recorded 50 face samples for student <span className="text-slate-200 font-semibold">{name}</span> (ID: {enrollment}).
              </p>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleFinish}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleFinish();
                    if (onTrainModel) onTrainModel();
                  }}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Train Recognition Model Now</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
