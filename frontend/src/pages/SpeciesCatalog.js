import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import SpeciesImage from "../components/SpeciesImage";

function SpeciesCatalog() {
  const [species, setSpecies] = useState([]);
  const [sourceDataset, setSourceDataset] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadSpecies();
  }, []);

  const loadSpecies = () => {
    api.get("/datasets/species")
      .then((res) => setSpecies(res.data))
      .catch((err) => console.log(err));
  };

  const handleImport = (e) => {
    e.preventDefault();
    if (!file || !sourceDataset) {
      alert("Select a dataset name and CSV file");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    setLoading(true);
    api.post(
      `/datasets/import?source_dataset=${encodeURIComponent(sourceDataset)}`,
      uploadData,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
      .then(() => {
        alert("Dataset imported ✅");
        setFile(null);
        setSourceDataset("");
        loadSpecies();
      })
      .catch((err) => {
        console.log(err);
        alert("Import failed ❌");
      })
      .finally(() => setLoading(false));
  };

  const handleScanImages = () => {
    setLoading(true);
    api.post("/datasets/scan-images")
      .then((res) => {
        alert("Image dataset scanned ✅");
        console.log(res.data.summary);
        loadSpecies();
      })
      .catch((err) => {
        console.log(err);
        alert("Scan failed ❌");
      })
      .finally(() => setLoading(false));
  };

  const taxonomicGroups = [...new Set(
    species.map((s) => s.taxonomic_group).filter(Boolean)
  )].sort();

  const filteredSpecies = species.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.common_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !groupFilter || s.taxonomic_group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const initials = (s) => (s.common_name || s.scientific_name || "?").charAt(0).toUpperCase();

  return (
    <DashboardLayout title="Species Catalog">
      <div className="panel" style={{ marginBottom: 22 }}>
        <button
          onClick={() => navigate(-1)}
          className="secondary"
          style={{ marginBottom: 16, width: "auto" }}
        >
          ← Back
        </button>

        <div className="panel-title">
          Species Catalog ({filteredSpecies.length} of {species.length})
        </div>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by scientific or common name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            <option value="">All Taxonomic Groups</option>
            {taxonomicGroups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {filteredSpecies.length === 0 ? (
          <p style={{ color: "var(--dl-text-dim)" }}>No species match your search.</p>
        ) : (
          <div className="species-grid">
            {filteredSpecies.map((s) => (
              <div className="species-card" key={s.id}>
                <SpeciesImage
                  commonName={s.common_name}
                  scientificName={s.scientific_name}
                  fallbackLetter={initials(s)}
                />
                <div className="species-card-body">
                  <div className="species-card-name">{s.common_name || s.scientific_name}</div>
                  {s.common_name && (
                    <div className="species-card-meta" style={{ fontStyle: "italic" }}>
                      {s.scientific_name}
                    </div>
                  )}
                  <div style={{ marginTop: 6 }}>
                    <StatusBadge status={s.conservation_status} />
                  </div>
                  <div className="species-card-meta">
                    {s.taxonomic_group || "Unknown group"} · {s.source_dataset}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dl-panels">
        <div className="panel">
          <div className="panel-title">Import Species Dataset (CSV)</div>
          <form onSubmit={handleImport}>
            <input
              type="text"
              placeholder="Source dataset name (e.g. iNaturalist)"
              value={sourceDataset}
              onChange={(e) => setSourceDataset(e.target.value)}
            />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Importing..." : "Import CSV"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-title">Scan Image Dataset Folder</div>
          <p style={{ color: "var(--dl-text-dim)", fontSize: 13 }}>
            Indexes images already present in the backend's dataset folder.
          </p>
          <button onClick={handleScanImages} disabled={loading}>
            {loading ? "Scanning..." : "Scan Images"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SpeciesCatalog;