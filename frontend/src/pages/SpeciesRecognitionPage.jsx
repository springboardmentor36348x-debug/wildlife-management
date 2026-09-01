import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const STEPS = ["Upload", "Detect", "Results", "Confirm"];

function StepIndicator({ current }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                done
                  ? "bg-canopy-600 text-white"
                  : active
                  ? "bg-ochre-400 text-bark-900"
                  : "bg-canopy-100 text-canopy-500"
              }`}
            >
              {done ? "✓" : idx}
            </div>
            <span className={`text-sm ${active ? "text-bark-900 font-medium" : "text-canopy-600"}`}>{label}</span>
            {idx < STEPS.length && <div className="w-8 h-px bg-canopy-200 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

function BoundingBoxOverlay({ imgRef, detections }) {
  const [dims, setDims] = useState(null);

  useEffect(() => {
    function updateDims() {
      if (imgRef.current && imgRef.current.naturalWidth) {
        setDims({
          renderedW: imgRef.current.clientWidth,
          renderedH: imgRef.current.clientHeight,
          naturalW: imgRef.current.naturalWidth,
          naturalH: imgRef.current.naturalHeight,
        });
      }
    }
    updateDims();
    window.addEventListener("resize", updateDims);
    const id = setTimeout(updateDims, 50); // catch late image decode
    return () => {
      window.removeEventListener("resize", updateDims);
      clearTimeout(id);
    };
  }, [imgRef, detections]);

  if (!dims || !dims.naturalW) return null;
  const scaleX = dims.renderedW / dims.naturalW;
  const scaleY = dims.renderedH / dims.naturalH;

  return (
    <>
      {detections.map((d, i) => (
        <div
          key={i}
          className="absolute border-2 border-ochre-500 bg-ochre-400/10 pointer-events-none"
          style={{
            left: d.bbox.x * scaleX,
            top: d.bbox.y * scaleY,
            width: d.bbox.width * scaleX,
            height: d.bbox.height * scaleY,
          }}
        >
          <span className="absolute -top-6 left-0 bg-ochre-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap capitalize">
            {d.label} · {(d.confidence * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </>
  );
}

const SOUND_LABEL_DISPLAY = {
  bird_call: "Bird call",
  mammal_vocalization: "Mammal vocalization",
  amphibian_call: "Amphibian call",
  insect_sound: "Insect sound",
};

export default function SpeciesRecognitionPage() {
  const navigate = useNavigate();
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [mode, setMode] = useState(null); // "image" | "audio"
  const [previewUrl, setPreviewUrl] = useState(null);
  const [observation, setObservation] = useState(null);
  const [detection, setDetection] = useState(null); // image detection result
  const [soundResult, setSoundResult] = useState(null); // audio detection result
  const [confirmed, setConfirmed] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listAllSites().then(setSites).catch(() => {});
  }, []);

  const result = mode === "audio" ? soundResult : detection;
  const currentStep = confirmed ? 4 : result ? 3 : observation || uploading ? 2 : 1;
  const displayImageUrl = mode === "image" ? (observation ? api.fileUrl(observation.file_reference) : previewUrl) : null;
  const displayAudioUrl = mode === "audio" ? (observation ? api.fileUrl(observation.file_reference) : previewUrl) : null;

  async function handleFile(selected) {
    if (!selected) return;
    const isImage = selected.type.startsWith("image/");
    const isAudio = selected.type.startsWith("audio/");
    if (!isImage && !isAudio) {
      setError("Please choose an image (camera trap photo) or an audio file (wildlife recording).");
      return;
    }
    setError("");
    setMode(isImage ? "image" : "audio");
    setPreviewUrl(URL.createObjectURL(selected));
    setObservation(null);
    setDetection(null);
    setSoundResult(null);
    setConfirmed(false);

    setUploading(true);
    try {
      const obs = isImage
        ? await api.uploadObservationImage(selected, { siteId: siteId || undefined })
        : await api.uploadObservationAudio(selected, { siteId: siteId || undefined });
      setObservation(obs);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function runDetection() {
    if (!observation) return;
    setError("");
    setDetecting(true);
    try {
      if (mode === "image") {
        const res = await api.detectSpecies(observation.id);
        setDetection(res);
      } else {
        const res = await api.detectSound(observation.id);
        setSoundResult(res);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setDetecting(false);
    }
  }

  function reset() {
    setMode(null);
    setPreviewUrl(null);
    setObservation(null);
    setDetection(null);
    setSoundResult(null);
    setConfirmed(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-bark-900">Species Recognition</h1>
        <p className="text-canopy-700 text-sm mt-1">
          Upload a camera trap image or a wildlife audio recording and run pretrained animal detection, end to end,
          in one guided flow.
        </p>
      </div>

      <StepIndicator current={currentStep} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: controls */}
        <div className="card p-5 space-y-4 lg:col-span-1">
          <div>
            <label className="label">Step 1 · Monitoring site (optional)</label>
            <select
              className="input"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              disabled={!!observation}
            >
              <option value="">No survey yet — just testing</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.site_name}
                </option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl px-4 py-8 text-center cursor-pointer transition-colors ${
              dragOver ? "border-canopy-500 bg-canopy-50" : "border-canopy-200 hover:bg-canopy-50/60"
            }`}
          >
            <p className="text-sm font-medium text-bark-900">Drop a wildlife image or audio clip here</p>
            <p className="text-xs text-canopy-600 mt-1">
              or click to browse — camera trap photo (JPEG/PNG) or audio recording (WAV/MP3)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {uploading && <p className="text-xs text-canopy-600">Uploading {mode}…</p>}
          {observation && !uploading && (
            <p className="text-xs text-canopy-700">
              ✓ Uploaded {mode} — Observation {observation.id.slice(0, 8)}…
            </p>
          )}

          <div>
            <p className="label mb-1">Step 2 · Detection</p>
            <button className="btn-primary w-full" onClick={runDetection} disabled={!observation || detecting}>
              {detecting ? "Detecting…" : mode === "audio" ? "Detect Sound" : "Detect Species"}
            </button>
          </div>

          {result && (
            <button className="btn-secondary w-full" onClick={reset}>
              Start over with a new file
            </button>
          )}
        </div>

        {/* Right: image/audio + results */}
        <div className="card p-5 lg:col-span-2 space-y-4">
          {!displayImageUrl && !displayAudioUrl && (
            <div className="h-64 flex items-center justify-center text-sm text-canopy-500">
              No file selected yet.
            </div>
          )}

          {displayImageUrl && (
            <div className="relative inline-block max-w-full">
              <img
                ref={imgRef}
                src={displayImageUrl}
                alt="Uploaded wildlife capture"
                className="max-w-full max-h-[420px] rounded-lg bg-canopy-100"
              />
              {detection && detection.detections.length > 0 && (
                <BoundingBoxOverlay imgRef={imgRef} detections={detection.detections} />
              )}
            </div>
          )}

          {displayAudioUrl && (
            <div className="bg-canopy-50 border border-canopy-100 rounded-lg p-4">
              <p className="text-xs text-canopy-600 mb-2">Uploaded audio clip</p>
              <audio controls src={displayAudioUrl} className="w-full" />
            </div>
          )}

          {mode === "image" && detection && (
            <div className="space-y-3">
              <p className="label mb-1">Step 3 · Results</p>
              {detection.detected ? (
                <div>
                  <h3 className="font-display font-semibold text-bark-900 mb-2">
                    {detection.count} animal{detection.count !== 1 ? "s" : ""} detected
                  </h3>
                  <ul className="divide-y divide-canopy-100">
                    {detection.detections.map((d, i) => (
                      <li key={i} className="text-sm text-bark-900 flex items-center justify-between py-1.5">
                        <span className="capitalize">{d.label}</span>
                        <span className="text-canopy-600">{(d.confidence * 100).toFixed(1)}% confidence</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-canopy-50 border border-canopy-100 rounded-lg px-4 py-3 text-sm text-canopy-700">
                  No animal detected in this image. Try a different photo, or one with a clearer view of the subject.
                </div>
              )}
              <ConfirmBlock confirmed={confirmed} setConfirmed={setConfirmed} navigate={navigate} />
            </div>
          )}

          {mode === "audio" && soundResult && (
            <div className="space-y-3">
              <p className="label mb-1">Step 3 · Results</p>
              {soundResult.detected ? (
                <div>
                  <h3 className="font-display font-semibold text-bark-900 mb-2">
                    {SOUND_LABEL_DISPLAY[soundResult.label] || soundResult.label} detected
                  </h3>
                  <p className="text-sm text-canopy-700 mb-3">
                    {(soundResult.confidence * 100).toFixed(1)}% confidence
                  </p>
                  {soundResult.all_matches.length > 1 && (
                    <div>
                      <p className="text-xs font-medium text-bark-900 mb-1">Other possible matches</p>
                      <ul className="divide-y divide-canopy-100">
                        {soundResult.all_matches.slice(1).map((m, i) => (
                          <li key={i} className="text-sm text-bark-900 flex items-center justify-between py-1.5">
                            <span>
                              {SOUND_LABEL_DISPLAY[m.label] || m.label}{" "}
                              <span className="text-xs text-canopy-500">({m.raw_class})</span>
                            </span>
                            <span className="text-canopy-600">{(m.confidence * 100).toFixed(1)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-canopy-50 border border-canopy-100 rounded-lg px-4 py-3 text-sm text-canopy-700">
                  No animal sound detected above the confidence threshold in this clip.
                </div>
              )}
              <ConfirmBlock confirmed={confirmed} setConfirmed={setConfirmed} navigate={navigate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmBlock({ confirmed, setConfirmed, navigate }) {
  return (
    <>
      <p className="label mb-1 pt-2">Step 4 · Confirm &amp; Save</p>
      {!confirmed ? (
        <button className="btn-primary" onClick={() => setConfirmed(true)}>
          Confirm &amp; Save
        </button>
      ) : (
        <div className="bg-canopy-50 border border-canopy-100 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-canopy-700">
            Saved to the Observation record — the dashboard's species breakdown is already up to date.
          </p>
          <button className="btn-secondary text-sm" onClick={() => navigate("/")}>
            View on Dashboard
          </button>
        </div>
      )}
    </>
  );
}
