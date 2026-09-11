import { useEffect, useState } from "react";
import { api } from "../api/client";

function MetricBar({ label, value, sub }) {
  if (value === null || value === undefined) {
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-bark-900 font-medium">{label}</span>
          <span className="text-canopy-500">insufficient data</span>
        </div>
        <div className="h-2 rounded-full bg-canopy-100" />
        {sub && <p className="text-xs text-canopy-500 mt-1">{sub}</p>}
      </div>
    );
  }
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-bark-900 font-medium">{label}</span>
        <span className="text-canopy-700 font-semibold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-canopy-100 overflow-hidden">
        <div className="h-full bg-canopy-700 rounded-full" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      {sub && <p className="text-xs text-canopy-500 mt-1">{sub}</p>}
    </div>
  );
}

function StatCard({ label, value, note, measured }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-canopy-500 font-semibold">{label}</p>
      <p className="font-display text-2xl font-semibold text-bark-900 mt-1">
        {value === null || value === undefined ? "—" : value}
      </p>
      <p className={`text-xs mt-1 ${measured ? "text-canopy-600" : "text-ochre-600"}`}>
        {measured ? "Measured live" : "Configured target"}
      </p>
      {note && <p className="text-xs text-canopy-500 mt-1">{note}</p>}
    </div>
  );
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.getPerformanceMetrics().then(setMetrics).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  const sys = metrics?.system_performance;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-bark-900">Performance Metrics</h1>
          <p className="text-canopy-700 text-sm mt-1">
            AI model recognition/precision metrics and system latency (Milestone 4, FR-8). Figures marked
            "Measured live" are real numbers timed on this running backend against real stored data — nothing
            here is randomly generated.
          </p>
        </div>
        <button className="btn-secondary whitespace-nowrap" onClick={load}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {loading && <p className="text-sm text-canopy-600">Measuring…</p>}

      {sys && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Image Inference Latency"
            value={sys.image_inference_latency_ms.value_ms !== null ? `${sys.image_inference_latency_ms.value_ms} ms` : null}
            measured={sys.image_inference_latency_ms.is_measured}
            note={sys.image_inference_latency_ms.note}
          />
          <StatCard
            label="Audio Processing Latency"
            value={sys.audio_processing_latency_ms.value_ms !== null ? `${sys.audio_processing_latency_ms.value_ms} ms` : null}
            measured={sys.audio_processing_latency_ms.is_measured}
            note={sys.audio_processing_latency_ms.note}
          />
          <StatCard
            label="API Response Time"
            value={`${sys.api_response_time_ms.value_ms} ms`}
            measured={sys.api_response_time_ms.is_measured}
            note={`Target < ${sys.api_response_time_ms.target_ms} ms`}
          />
          <StatCard
            label="Concurrent Monitoring Capacity"
            value={sys.concurrent_monitoring_capacity.value}
            measured={sys.concurrent_monitoring_capacity.is_measured}
            note={sys.concurrent_monitoring_capacity.note}
          />
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="font-display font-semibold text-bark-900 mb-1">AI Model Recognition &amp; Precision</h2>
            <p className="text-xs text-canopy-600 mb-4">
              Average confidence score of real stored detections that have a species label.
            </p>
            <MetricBar
              label="Species Detection Precision"
              value={metrics.species_recognition.species_detection_precision.value_pct}
              sub={
                metrics.species_recognition.species_detection_precision.sample_size
                  ? `From ${metrics.species_recognition.species_detection_precision.sample_size} labeled image observation(s).`
                  : "No labeled image observations yet — run Image Detection to populate this."
              }
            />
            <MetricBar
              label="Bioacoustic Call Accuracy"
              value={metrics.bioacoustic.bioacoustic_call_accuracy.value_pct}
              sub={
                metrics.bioacoustic.bioacoustic_call_accuracy.sample_size
                  ? `From ${metrics.bioacoustic.bioacoustic_call_accuracy.sample_size} labeled audio observation(s).`
                  : "No labeled audio observations yet — run Audio Detection to populate this."
              }
            />
            <MetricBar
              label="Population Count Accuracy (labeling completeness)"
              value={metrics.population_intelligence.population_count_accuracy.value_pct}
              sub={metrics.population_intelligence.population_count_accuracy.note}
            />
          </div>

          <div className="card p-5">
            <h2 className="font-display font-semibold text-bark-900 mb-1">Honest Limitations</h2>
            <p className="text-xs text-canopy-600 mb-4">
              What isn't measured yet, and why — consistent with this project's no-fabricated-numbers approach.
            </p>
            <div className="text-sm text-canopy-700 space-y-3">
              <p>
                <span className="font-semibold text-bark-900">Noise Filtering Effectiveness: </span>
                {metrics.bioacoustic.noise_filtering_effectiveness.reason}
              </p>
              <p>
                <span className="font-semibold text-bark-900">Concurrent Monitoring Capacity: </span>
                {metrics.system_performance.concurrent_monitoring_capacity.note}
              </p>
              <p className="text-xs text-canopy-500">
                Last measured: {metrics.generated_at ? new Date(metrics.generated_at).toLocaleString() : "—"} ·
                Monitoring sites in system: {metrics.system_performance.total_monitoring_sites}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
