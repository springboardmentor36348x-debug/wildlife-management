import React, { useState, useEffect, useRef } from 'react';
import { Upload, Eye, Cpu, Compass, Save, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ImageAnalysis() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function loadSurveys() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/surveys', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSurveys(data);
          if (data.length > 0) setSelectedSurvey(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSurveys();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setSavedSuccess(false);
    }
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    setSavedSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/v1/image-analysis/analyze', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Analysis failed');
      }

      setAnalysisResult(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Draw bounding boxes on canvas when image and result load
  useEffect(() => {
    if (analysisResult && imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match the displayed image dimensions
      canvas.width = img.clientWidth;
      canvas.height = img.clientHeight;

      // Clear previous boxes
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = img.clientWidth / img.naturalWidth;
      const scaleY = img.clientHeight / img.naturalHeight;

      analysisResult.detections.forEach((det) => {
        const [x1, y1, x2, y2] = det.box;
        const width = (x2 - x1) * scaleX;
        const height = (y2 - y1) * scaleY;
        const left = x1 * scaleX;
        const top = y1 * scaleY;

        // Draw Box
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.strokeRect(left, top, width, height);

        // Draw Label Background
        ctx.fillStyle = '#f97316';
        const labelText = `${det.label} (${det.confidence}%)`;
        ctx.font = 'bold 12px sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillRect(left, top - 20, textWidth + 10, 20);

        // Draw Label Text
        ctx.fillStyle = '#0f172a';
        ctx.fillText(labelText, left + 5, top - 5);
      });
    }
  }, [analysisResult, previewUrl]);

  const saveObservation = async () => {
    if (!analysisResult || !selectedSurvey) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        survey_id: parseInt(selectedSurvey),
        species_name: analysisResult.detected_species,
        count: analysisResult.animal_count,
        confidence_score: analysisResult.confidence,
        observation_type: 'image',
        file_path: analysisResult.file_path,
        behavior_observed: analysisResult.behavior_detected,
        analysis_data: analysisResult,
        notes: `AI classification: ${analysisResult.detected_species}. Latency: ${analysisResult.processing_time_ms} ms.`
      };

      const res = await fetch('/api/v1/image-analysis/save-observation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSavedSuccess(true);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to save observation');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">Wildlife Image Intelligence Engine</h2>
        <p className="text-sm text-slate-500 mt-1">Upload camera-trap images to run real YOLOv8 animal detection, counting, and species classification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800">1. Select Target & Image</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Target Survey Project</label>
              <select
                value={selectedSurvey}
                onChange={(e) => setSelectedSurvey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>{s.survey_name} ({s.survey_id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Camera-Trap Capture Image</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">Drag & Drop Image</p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG formats accepted</p>
              </div>
            </div>

            {selectedFile && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center text-slate-600">
                <span className="truncate max-w-[200px] font-semibold">{selectedFile.name}</span>
                <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
          </div>

          <button
            onClick={runAnalysis}
            disabled={!selectedFile || analyzing}
            className="w-full py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-slate-950 bg-nature-400 hover:bg-nature-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Inference Processing...
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" />
                Run YOLOv8 Analytics
              </>
            )}
          </button>
        </div>

        {/* View & Bounding box Overlay Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg h-[400px] flex items-center justify-center relative">
            {previewUrl ? (
              <div className="relative max-h-full max-w-full flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Wildlife Preview"
                  className="max-h-[390px] max-w-full object-contain select-none"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute pointer-events-none"
                  style={{ top: 0, left: 0, width: '100%', height: '100%' }}
                />
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm space-y-2">
                <Eye className="h-10 w-10 mx-auto text-slate-700" />
                <p>No preview active. Upload an image to preview analysis canvas.</p>
              </div>
            )}

            {analysisResult && (
              <span className={`absolute top-4 right-4 text-[10px] uppercase font-black px-2.5 py-1 rounded shadow ${
                analysisResult.is_demo_fallback ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 text-white'
              }`}>
                {analysisResult.is_demo_fallback ? 'Demo / Fallback Mode' : 'AI Model Operational'}
              </span>
            )}
          </div>

          {analysisResult && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  YOLOv8 Detection Summary
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  Latency: <b>{analysisResult.processing_time_ms} ms</b>
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Primary Species</p>
                  <p className="text-sm font-extrabold text-slate-800 truncate">{analysisResult.detected_species}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Confidence Score</p>
                  <p className="text-sm font-extrabold text-slate-800">{analysisResult.confidence}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Animals Detected</p>
                  <p className="text-sm font-extrabold text-slate-800">{analysisResult.animal_count} count</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Capture Quality</p>
                  <p className="text-sm font-extrabold text-slate-800 capitalize">{analysisResult.image_quality}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                {savedSuccess ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-sm py-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Saved to Observations database!
                  </div>
                ) : (
                  <button
                    onClick={saveObservation}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-all"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Verify & Log Sighting'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
