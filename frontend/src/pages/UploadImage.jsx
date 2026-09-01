import { useRef, useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, Layers, Eye, RefreshCw, FolderOpen, BookmarkCheck, Save, MapPin } from "lucide-react";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext.jsx";
import { monitoringSitesApi, observationsApi } from "../api/monitoring.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function UploadImage() {
  const { token } = useAuth();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [showAnnotated, setShowAnnotated] = useState(true);

  // Monitoring sites & saving observation state
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [savingObs, setSavingObs] = useState(false);
  const [obsSavedMessage, setObsSavedMessage] = useState(null);

  // Load monitoring sites on mount
  useEffect(() => {
    if (token) {
      monitoringSitesApi
        .list(token, {})
        .then((data) => {
          setSites(data || []);
          if (data && data.length > 0) {
            setSelectedSiteId(data[0].id.toString());
          }
        })
        .catch((err) => console.error("Failed to load monitoring sites:", err));
    }
  }, [token]);

  const handleFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
    setObsSavedMessage(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setObsSavedMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/detect-species`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setShowAnnotated(true);
    } catch (err) {
      console.error("YOLO Detection Error:", err);
      setError(
        err.message || "Failed to connect to backend server. Make sure FastAPI server is running on port 8000."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveObservation = async () => {
    if (!result || !token || !selectedSiteId) return;
    setSavingObs(true);
    setObsSavedMessage(null);

    try {
      const siteObj = sites.find((s) => s.id.toString() === selectedSiteId);
      const siteName = siteObj ? siteObj.site_name : "Selected Site";

      const payload = {
        species: result.primary_species || "Unknown Species",
        monitoring_site_id: parseInt(selectedSiteId, 10),
        observation_datetime: new Date().toISOString(),
        detection_source: "camera_trap",
        confidence_score: result.top_confidence || 0,
        notes: `YOLOv9 AI camera trap detection. Total detected: ${result.total_detected || 0} animal(s). Top confidence: ${result.top_confidence || 0}%`,
      };

      await observationsApi.create(token, payload);
      setObsSavedMessage(`✅ Saved "${result.primary_species}" (${result.top_confidence}%) to Observation History under ${siteName}!`);
    } catch (err) {
      console.error("Failed to save observation:", err);
      setError(`Failed to save observation: ${err.message}`);
    } finally {
      setSavingObs(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setObsSavedMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl shadow-2xs border border-wild-100">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Upload &amp; Analyze Wildlife Image</h1>
          <p className="text-sm text-slate-500">Run real-time species classification using your trained YOLOv9 model</p>
        </div>
        {file && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-wild-700 bg-wild-50 rounded-lg hover:bg-wild-100 transition-colors self-start sm:self-auto border border-wild-200"
          >
            <RefreshCw size={14} /> Upload Different Image
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Backend Server Connection Required</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Monitoring Site Selection Banner */}
      {sites.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800 text-white p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-slate-300">Target Monitoring Site:</span>
              <span className="ml-1 text-xs text-slate-400 font-normal">
                (Detections saved here will show in Observation History)
              </span>
            </div>
          </div>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="bg-slate-900 text-white border border-slate-700 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none focus:border-emerald-400"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.site_name} ({s.location})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Image Selector & Preview */}
        <Card title="Step 1: Select Image File">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className={`relative flex min-h-[290px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
              preview
                ? "border-wild-400 bg-slate-950 p-2 cursor-pointer"
                : "border-slate-300 bg-slate-50 cursor-pointer hover:border-wild-500 hover:bg-wild-50/50"
            }`}
          >
            {preview ? (
              <div className="relative w-full h-full min-h-[270px] flex items-center justify-center overflow-hidden rounded-lg">
                <img
                  src={result && showAnnotated && result.annotated_image ? result.annotated_image : preview}
                  alt="Selected Preview"
                  className="max-h-[320px] w-auto max-w-full object-contain rounded-lg shadow-md"
                />

                {/* Overlay Toggle Badge when result is available */}
                {result && result.annotated_image && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/20 shadow-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAnnotated(!showAnnotated);
                      }}
                      className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
                    >
                      <Layers size={14} />
                      {showAnnotated ? "Showing Bounding Boxes" : "Original View"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 flex flex-col items-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-wild-100 text-wild-600 shadow-2xs">
                  <UploadCloud size={28} />
                </div>
                <p className="text-sm font-semibold text-slate-700">Drag &amp; Drop your image here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse from computer</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-wild-600 rounded-lg hover:bg-wild-700 shadow-xs transition-colors"
                >
                  <FolderOpen size={15} /> Browse Image File
                </button>
                <p className="mt-3 text-[11px] font-medium text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full">
                  Supports JPG, PNG, WEBP, JPEG
                </p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!file || analyzing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-wild-600 py-3 text-sm font-semibold text-white transition-all hover:bg-wild-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-md"
            >
              {analyzing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Running YOLOv9 Model Inference...
                </>
              ) : file ? (
                <>
                  <Eye size={18} />
                  Analyze Image with YOLOv9 Model
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  Select Image First to Analyze
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Right Column: YOLO Detection Results */}
        <Card title="Step 2: Model Classification Results">
          {analyzing ? (
            <div className="flex min-h-[290px] flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-wild-200 border-t-wild-600" />
              <p className="text-sm font-semibold text-slate-800">Processing with trained YOLOv9 model...</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Extracting species class labels, confidence scores, and bounding box coordinates.
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Primary Header Card */}
              <div className="flex items-center justify-between rounded-xl bg-wild-50 p-4 border border-wild-200 shadow-2xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-wild-600">
                    Primary Classified Species
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{result.primary_species}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-wild-600">
                    Confidence
                  </span>
                  <div className="text-xl font-black text-emerald-600">
                    {result.top_confidence ? `${result.top_confidence}%` : "N/A"}
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Animals Detected</p>
                  <p className="text-lg font-bold text-slate-800 mt-0.5">{result.total_detected}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Trained Model</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate" title="best.pt (YOLOv9)">
                    best.pt (YOLOv9)
                  </p>
                </div>
              </div>

              {/* Detected Detections List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Detections Breakdown ({result.detections?.length || 0})
                </h4>

                {result.detections && result.detections.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {result.detections.map((det, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-wild-100 text-[10px] font-bold text-wild-700">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800">{det.species_name}</span>
                            <span className="ml-2 text-[10px] text-slate-400 font-mono">
                              Box: [{det.box.join(", ")}]
                            </span>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 border border-emerald-200">
                          {det.confidence}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                    <span>No species detected above confidence threshold. Try uploading a clearer image.</span>
                  </div>
                )}
              </div>

              {/* Confidence Indicator Bar */}
              {result.top_confidence > 0 && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>YOLOv9 Model Confidence</span>
                    <span>{result.top_confidence}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        result.top_confidence >= 80
                          ? "bg-emerald-500"
                          : result.top_confidence >= 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, result.top_confidence)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Saved Notification */}
              {obsSavedMessage && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <BookmarkCheck size={18} className="shrink-0 text-emerald-600" />
                  <span>{obsSavedMessage}</span>
                </div>
              )}

              {/* 1-Click Save to Observation History Button */}
              {result.total_detected > 0 && !obsSavedMessage && (
                <button
                  type="button"
                  onClick={handleSaveObservation}
                  disabled={savingObs || !selectedSiteId}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {savingObs ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving Observation to Database...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Detection to &quot;{sites.find((s) => s.id.toString() === selectedSiteId)?.site_name || "Observation History"}&quot; (1-Click)
                    </>
                  )}
                </button>
              )}

              {/* Upload New Image Button */}
              <button
                type="button"
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-wild-300 py-3 text-xs font-semibold text-wild-700 hover:bg-wild-50 hover:border-wild-500 transition-all"
              >
                <UploadCloud size={16} />
                Upload New Image &amp; Analyze Again
              </button>
            </div>
          ) : (
            <div className="flex min-h-[290px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center">
              <CheckCircle2 size={36} className="mb-2 text-wild-400" />
              <p className="text-sm font-semibold text-slate-700">Ready for Classification</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Select an image on the left card and click <strong>&quot;Analyze Image with YOLOv9 Model&quot;</strong> to get instant species detection results &amp; bounding boxes.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
