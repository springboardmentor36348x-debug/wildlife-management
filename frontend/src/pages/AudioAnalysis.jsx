import React, { useState, useEffect } from 'react';
import { Upload, Music, Play, BarChart2, Save, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AudioAnalysis() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
      setAudioUrl(URL.createObjectURL(file));
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

      const res = await fetch('/api/v1/audio-analysis/analyze', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Bioacoustic analysis failed');
      }

      setAnalysisResult(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveObservation = async () => {
    if (!analysisResult || !selectedSurvey) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        survey_id: parseInt(selectedSurvey),
        species_name: analysisResult.detected_species,
        count: 1,
        confidence_score: analysisResult.confidence,
        observation_type: 'audio',
        file_path: analysisResult.file_path,
        behavior_observed: analysisResult.call_type,
        analysis_data: analysisResult,
        notes: `Bioacoustic signature: ${analysisResult.detected_species} (${analysisResult.call_type}). Latency: ${analysisResult.processing_time_ms} ms.`
      };

      const res = await fetch('/api/v1/audio-analysis/save-observation', {
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
        alert(err.detail || 'Failed to save bioacoustic record');
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
        <h2 className="text-xl font-extrabold text-slate-800">Wildlife Bioacoustic Recognition Engine</h2>
        <p className="text-sm text-slate-500 mt-1">Upload bioacoustic field audio recordings to run animal call detection, bird-song identification, and spectrogram feature extraction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800">1. Select Target & Audio</h3>
            
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
              <label className="block text-xs font-semibold text-slate-500 mb-2">Acoustic Audio Recording</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">Drag & Drop Audio</p>
                <p className="text-[10px] text-slate-400 mt-1">WAV, MP3, FLAC formats accepted</p>
              </div>
            </div>

            {selectedFile && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center text-slate-600">
                <span className="truncate max-w-[200px] font-semibold">{selectedFile.name}</span>
                <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}

            {audioUrl && (
              <div className="pt-2">
                <audio src={audioUrl} controls className="w-full h-10 border border-slate-100 rounded-lg" />
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
                Acoustic Analysis running...
              </>
            ) : (
              <>
                <Music className="h-4 w-4" />
                Run Bioacoustic AI
              </>
            )}
          </button>
        </div>

        {/* Spectrogram & Results Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg h-[240px] flex items-center justify-center relative">
            {analysisResult?.spectrogram_url ? (
              <img
                src={analysisResult.spectrogram_url}
                alt="Acoustic Mel Spectrogram"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-slate-500 text-sm space-y-2">
                <BarChart2 className="h-10 w-10 mx-auto text-slate-700" />
                <p>Mel-Spectrogram view will generate after AI feature extraction.</p>
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
                  Bioacoustic Identification
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  Latency: <b>{analysisResult.processing_time_ms} ms</b>
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Detected Species</p>
                  <p className="text-sm font-extrabold text-slate-800">{analysisResult.detected_species}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Call Call Type</p>
                  <p className="text-sm font-extrabold text-slate-800">{analysisResult.call_type}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Confidence Score</p>
                  <p className="text-sm font-extrabold text-slate-800">{analysisResult.confidence}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Frequency Band</p>
                  <p className="text-xs font-bold text-slate-800">{analysisResult.frequency_range}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Zero Crossing Rate</p>
                  <p className="text-xs font-bold text-slate-800">{analysisResult.features.zero_crossing_rate || 0.04}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">RMS Energy</p>
                  <p className="text-xs font-bold text-slate-800">{analysisResult.features.rms_energy || 0.08}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                {savedSuccess ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-sm py-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Bioacoustic observation saved to log!
                  </div>
                ) : (
                  <button
                    onClick={saveObservation}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-all"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Verify & Log Acoustic Call'}
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
