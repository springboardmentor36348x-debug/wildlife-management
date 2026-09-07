import React, { useEffect, useState } from "react";
import { listMonitoringSites } from "../api/surveys";
import { uploadImage, uploadAudio } from "../api/media";

export default function ImageAudioUpload() {
  const [sites, setSites] = useState([]);
  const [monitoringSiteId, setMonitoringSiteId] = useState("");
  const [mode, setMode] = useState("image"); // "image" | "audio"
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listMonitoringSites().then((res) => setSites(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!file || !monitoringSiteId) {
      setError("Please select a monitoring site and a file.");
      return;
    }
    setSubmitting(true);
    try {
      const res =
        mode === "image"
          ? await uploadImage(file, monitoringSiteId)
          : await uploadAudio(file, monitoringSiteId);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Upload & Analyze</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Camera trap / drone images run through the Image Analysis Engine (species
        classification, animal counting, quality scoring). Audio recordings run through
        the Bioacoustic Recognition Engine (call detection, species classification).
      </p>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setMode("image");
              setResult(null);
            }}
            className={`px-4 py-2 rounded text-sm font-medium ${
              mode === "image" ? "bg-forest-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            📷 Image
          </button>
          <button
            onClick={() => {
              setMode("audio");
              setResult(null);
            }}
            className={`px-4 py-2 rounded text-sm font-medium ${
              mode === "audio" ? "bg-forest-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            🔊 Audio
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            required
            className="w-full border rounded px-3 py-2 text-sm"
            value={monitoringSiteId}
            onChange={(e) => setMonitoringSiteId(e.target.value)}
          >
            <option value="">Select monitoring site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            required
            type="file"
            accept={mode === "image" ? "image/*" : "audio/*"}
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border rounded px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-forest-600 hover:bg-forest-700 text-white py-2 rounded font-medium transition disabled:opacity-50"
          >
            {submitting ? "Analyzing..." : `Upload & Run ${mode === "image" ? "Image" : "Bioacoustic"} Analysis`}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold mb-3">
            Analysis Result{" "}
            <span className="text-xs text-gray-400 font-normal">
              ({result.processing_time_ms} ms)
            </span>
          </h2>

          {mode === "image" && (
            <p className="text-sm text-gray-600 mb-3">
              Image quality score: <strong>{(result.quality_score * 100).toFixed(0)}%</strong>
            </p>
          )}

          {result.detections.length === 0 ? (
            <p className="text-gray-400 text-sm">No species detected in this file.</p>
          ) : (
            <div className="space-y-2">
              {result.detections.map((d) => (
                <div key={d.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {d.species_common_name}{" "}
                      <span className="text-gray-400 text-xs italic">
                        {d.species_scientific_name}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {d.species_group} ·{" "}
                      {d.conservation_status.replaceAll("_", " ")} ·{" "}
                      {d.behavior || d.acoustic_event_type || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-forest-700">
                      {(d.confidence_score * 100).toFixed(0)}% confidence
                    </p>
                    <p className="text-xs text-gray-400">{d.individual_count} individual(s)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
