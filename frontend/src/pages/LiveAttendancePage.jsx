import React, { useState, useRef, useEffect } from 'react';
import { Camera, Play, Square, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck, RefreshCw, BookOpen } from 'lucide-react';

export default function LiveAttendancePage() {
  const [subject, setSubject] = useState('Computer Science');
  const [isLive, setIsLive] = useState(false);
  const [statusState, setStatusState] = useState('Scanning');
  const [statusMessage, setStatusMessage] = useState('Looking for faces...');
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [markedSessionList, setMarkedSessionList] = useState([]);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamIntervalRef = useRef(null);

  useEffect(() => {
    return () => stopLiveStream();
  }, []);

  const startLiveStream = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsLive(true);

      // Start stream loop
      streamIntervalRef.current = setInterval(processFrame, 400);
    } catch (err) {
      setCameraError("Webcam access denied or unavailable. Please check your camera permissions.");
      setIsLive(false);
    }
  };

  const stopLiveStream = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
    setStatusState('Scanning');
    setStatusMessage('Camera stopped.');
    setDetectedFaces([]);
  };

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameB64 = canvas.toDataURL('image/jpeg', 0.7);

    try {
      const res = await fetch('/api/recognition/predict-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame_b64: frameB64, subject: subject })
      });

      if (!res.ok) return;

      const data = await res.json();
      setStatusState(data.status || 'Scanning');
      setStatusMessage(data.message || 'Processing...');
      setDetectedFaces(data.faces || []);

      // Track newly marked students in session
      if (data.faces) {
        data.faces.forEach(f => {
          if (f.student && f.attendance_marked) {
            setMarkedSessionList(prev => {
              if (prev.some(p => p.enrollment === f.student.enrollment)) return prev;
              return [{ ...f.student, time: new Date().toLocaleTimeString() }, ...prev];
            });
          }
        });
      }
    } catch (err) {
      console.error("Predict frame error:", err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Live Face Recognition</h1>
          <p className="text-xs text-slate-400 mt-1">Automatic attendance marking with OpenCV LBPH engine.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Subject selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-400">Subject:</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-100 border-none focus:outline-none cursor-pointer"
            >
              <option value="Computer Science" className="bg-slate-900">Computer Science</option>
              <option value="Mathematics" className="bg-slate-900">Mathematics</option>
              <option value="Physics" className="bg-slate-900">Physics</option>
              <option value="General" className="bg-slate-900">General</option>
            </select>
          </div>

          {/* Start/Stop Camera */}
          {!isLive ? (
            <button
              onClick={startLiveStream}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Camera Recognition</span>
            </button>
          ) : (
            <button
              onClick={stopLiveStream}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Grid: Video Stream & Live Recognition Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video stream container */}
        <div className="lg:col-span-2 glass-card p-4 rounded-2xl border border-slate-800 space-y-4">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Bounding Boxes Overlay */}
            {isLive && videoRef.current && (
              <div className="absolute inset-0 pointer-events-none">
                {detectedFaces.map((face, idx) => {
                  const [x, y, w, h] = face.bbox || [0, 0, 0, 0];
                  // Scale coordinates relative to video container if needed
                  const isRecognized = face.status === "Recognized";
                  const isUnknown = face.status === "Unknown";

                  return (
                    <div
                      key={idx}
                      className={`absolute border-2 rounded-lg transition-all ${
                        isRecognized ? 'border-emerald-400 bg-emerald-500/10' :
                        isUnknown ? 'border-rose-500 bg-rose-500/10' : 'border-amber-400 bg-amber-500/10'
                      }`}
                      style={{
                        left: `${(x / 640) * 100}%`,
                        top: `${(y / 480) * 100}%`,
                        width: `${(w / 640) * 100}%`,
                        height: `${(h / 480) * 100}%`
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-slate-900/90 text-[10px] font-bold px-2 py-0.5 rounded text-white border border-slate-700 whitespace-nowrap">
                        {face.student ? `${face.student.name} (${face.confidence})` : face.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLive && (
              <div className="text-center space-y-3">
                <Camera className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500">Camera stream inactive. Click "Start Camera Recognition" above.</p>
              </div>
            )}
          </div>

          {/* Status state badge */}
          <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
              <span className="font-semibold text-slate-300">Status: <span className="text-blue-400">{statusState}</span></span>
            </div>
            <span className="text-slate-400">{statusMessage}</span>
          </div>
        </div>

        {/* Live Recognition Details Side Panel */}
        <div className="space-y-6">
          {/* Detected Face Info */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Recognition Status</span>
            </h3>

            {detectedFaces.length > 0 ? (
              <div className="space-y-3">
                {detectedFaces.map((f, idx) => (
                  <div key={idx} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-100">
                        {f.student ? f.student.name : 'Unknown Person'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        f.status === 'Recognized' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        f.status === 'Unknown' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {f.status}
                      </span>
                    </div>

                    {f.student && (
                      <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                        <p>Enrollment: <span className="text-slate-200 font-mono">{f.student.enrollment}</span></p>
                        <p>Distance Confidence: <span className="text-blue-400 font-mono">{f.confidence}</span></p>
                        {f.attendance_marked && (
                          <div className="mt-2 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Attendance Marked ✓</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                Looking for faces in camera view...
              </div>
            )}
          </div>

          {/* Session Attendance Log & Deduplication Notice */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Session Log</h3>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>

            <p className="text-[11px] text-slate-400 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg">
              Duplicate protection active: Students are marked present once per subject session.
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {markedSessionList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="font-semibold text-slate-200">{item.name} ({item.enrollment})</span>
                  <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
                </div>
              ))}
              {markedSessionList.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-2">No students marked in this session yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
