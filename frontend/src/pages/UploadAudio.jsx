import { useRef, useState } from "react";
import axios from "axios";
import { UploadCloud, Play, Loader2, AudioLines } from "lucide-react";
import Card from "../components/ui/Card";

const API_BASE = "http://localhost:8000";

export default function UploadAudio() {
  const inputRef = useRef(null);
  const resultRef = useRef(null);
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setAudioUrl(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_BASE}/api/v1/analyze-audio`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const data = response.data;

      setResult({
        species: data.recommended_species,
        confidence: data.confidence,
        callType: data.sound_category,
        habitat: data.raw_class.replace(/_/g, " ").toUpperCase(),
        status: data.status,
      });

      // Auto-scroll to result card after analysis
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const msg =
        err?.response?.data?.detail || err.message || "Audio analysis failed.";
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-wild-900">Upload Bird & Wildlife Audio</h1>
        <p className="text-sm text-slate-500">Upload audio recordings for AI-powered bioacoustic species classification</p>
      </div>

      {/* Upload & Result Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Audio Player Card */}
        <Card title="Audio Recording Input">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-wild-400/40 bg-wild-50/70 text-center hover:border-wild-500 hover:bg-wild-50 transition-all duration-200"
          >
            <UploadCloud size={30} className="mb-2 text-wild-600" />
            <p className="text-sm font-semibold text-wild-900">Drag & Drop audio file here</p>
            <p className="text-xs text-slate-500">or click to browse from computer</p>
            <p className="mt-1.5 text-[11px] font-medium text-wild-600">Supports WAV, MP3, OGG, FLAC, M4A</p>
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {/* Selected File Badge */}
          {file && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-wild-100/60 p-2.5 px-3 border border-wild-400/20">
              <span className="text-xs font-semibold text-wild-900 truncate">
                🎵 {file.name}
              </span>
              <span className="text-[11px] text-wild-700 font-medium ml-2">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="mt-3 rounded-lg border border-wild-100 bg-wild-50 p-2">
              <audio controls src={audioUrl} className="w-full h-8" />
            </div>
          )}

          {/* ✅ Analyze Audio Button — Inside Audio Recording Input Card */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className={`mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-sm
              ${!file
                ? "bg-slate-300 text-slate-600 cursor-not-allowed border border-slate-300 opacity-90"
                : analyzing
                  ? "bg-wild-700 cursor-wait text-white"
                  : "bg-wild-600 hover:bg-wild-700 cursor-pointer text-white shadow-md hover:shadow-lg active:scale-[0.99]"
              }`}
          >
            {analyzing ? (
              <>
                <Loader2 size={18} className="animate-spin text-white" />
                Analyzing Audio... Please Wait
              </>
            ) : (
              <>
                🎵 Analyze Audio
              </>
            )}
          </button>
        </Card>

        {/* Prediction Result Card */}
        <div ref={resultRef}>
          <Card title="AI Bioacoustic Prediction">
            {analyzing ? (
              <div className="flex h-52 flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="animate-spin text-wild-600" />
                <p className="text-sm text-wild-900 font-semibold">AI Model is analyzing audio...</p>
                <p className="text-xs text-slate-500">Extracting Mel-Spectrogram & Running PyTorch Inference</p>
              </div>
            ) : error ? (
              <div className="flex h-52 flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-semibold text-red-600">⚠️ Analysis Failed</p>
                <p className="text-xs text-slate-500">{error}</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Species Name Box */}
                <div className="rounded-xl bg-wild-900 text-white p-4 shadow-sm">
                  <p className="text-xs text-wild-100/70 mb-0.5">Detected Wildlife Sound</p>
                  <p className="text-lg font-bold text-white">🦜 {result.species}</p>
                  <p className="text-xs text-wild-400 mt-1 font-medium">{result.callType}</p>
                </div>

                {/* Confidence Bar */}
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-xs font-medium text-slate-600">Confidence Score</p>
                    <p className="text-xs font-bold text-wild-700">{result.confidence}%</p>
                  </div>
                  <div className="w-full h-3 bg-wild-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-wild-600 rounded-full transition-all duration-700"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                    <p className="text-[11px] font-medium text-slate-500">Sound Category</p>
                    <p className="font-semibold text-wild-900 text-xs mt-0.5">{result.callType}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                    <p className="text-[11px] font-medium text-slate-500">Detected Class</p>
                    <p className="font-semibold text-wild-900 text-xs mt-0.5">{result.habitat}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-52 flex-col items-center justify-center text-center p-4">
                <AudioLines size={36} className="text-wild-400/50 mb-2" />
                <p className="text-sm font-medium text-slate-600">No Audio Analyzed Yet</p>
                <p className="text-xs text-slate-400 mt-1">Upload an audio file and click 'Analyze Audio' to see AI predictions here.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

