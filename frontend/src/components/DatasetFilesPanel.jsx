import { useEffect, useState } from "react";
import { api } from "../api/client";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DatasetFilesPanel({ datasetId, canManage, onFilesChanged }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setFiles(await api.listDatasetFiles(datasetId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  async function handleFileInput(e) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setError("");
    setUploading(true);
    try {
      await api.uploadDatasetFiles(datasetId, fileList);
      await refresh();
      onFilesChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(fileId) {
    try {
      await api.deleteDatasetFile(fileId);
      await refresh();
      onFilesChanged?.();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="bg-canopy-50/60 border-t border-canopy-100 px-4 py-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {canManage && (
        <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer text-sm mb-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v9M8 2L4.5 5.5M8 2l3.5 3.5M3 11.5V13a1 1 0 001 1h8a1 1 0 001-1v-1.5"
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {uploading ? "Uploading…" : "Upload sample files (images / audio)"}
          <input
            type="file"
            multiple
            accept="image/*,audio/*,.csv,.json,.zip"
            className="hidden"
            onChange={handleFileInput}
            disabled={uploading}
          />
        </label>
      )}

      {loading && <p className="text-xs text-canopy-600">Loading files…</p>}

      {!loading && files.length === 0 && (
        <p className="text-xs text-canopy-600">
          No real files uploaded yet for this dataset — only metadata is registered so far.
        </p>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {files.map((f) => (
            <div key={f.id} className="card p-2 relative group">
              {canManage && (
                <button
                  onClick={() => handleDelete(f.id)}
                  className="absolute top-1 right-1 z-10 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-xs text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove file"
                >
                  ×
                </button>
              )}
              {f.content_type?.startsWith("image/") ? (
                <img
                  src={api.fileUrl(f.url)}
                  alt={f.original_filename}
                  className="w-full h-20 object-cover rounded-md bg-canopy-100"
                />
              ) : f.content_type?.startsWith("audio/") ? (
                <div className="w-full h-20 flex items-center justify-center rounded-md bg-canopy-100">
                  <audio controls src={api.fileUrl(f.url)} className="w-full max-w-[110px] scale-90" />
                </div>
              ) : (
                <div className="w-full h-20 flex items-center justify-center rounded-md bg-canopy-100 text-canopy-500 text-xs">
                  {f.original_filename.split(".").pop()?.toUpperCase() || "FILE"}
                </div>
              )}
              <p className="text-[11px] text-bark-900 mt-1 truncate" title={f.original_filename}>
                {f.original_filename}
              </p>
              <p className="text-[10px] text-canopy-600">{formatBytes(f.file_size_bytes)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
