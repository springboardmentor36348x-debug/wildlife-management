import React, { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

function Observations() {
  const [observations, setObservations] = useState([]);
  const [sites, setSites] = useState([]);

  const [formData, setFormData] = useState({
    monitoring_site_id: "",
    species_name: "",
    observation_type: "manual",
    notes: "",
  });

  useEffect(() => {
    loadObservations();
    loadSites();
  }, []);

  const loadObservations = () => {
    api
      .get("/observations/")
      .then((res) => setObservations(res.data))
      .catch((err) => console.log(err));
  };

  const loadSites = () => {
    api
      .get("/monitoring-sites/")
      .then((res) => setSites(res.data))
      .catch((err) => console.log(err));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    api
      .post("/observations/", formData)
      .then(() => {
        alert("Observation Added ✅");

        setFormData({
          monitoring_site_id: "",
          species_name: "",
          observation_type: "manual",
          notes: "",
        });

        loadObservations();
      })
      .catch((err) => {
        console.log(err);
        alert("Error adding observation ❌");
      });
  };

  return (
    <DashboardLayout title="Observations">
      <div className="dashboard-container">
        <h2>Observations</h2>

        {observations.length === 0 && <p>No observations found.</p>}

        <ul>
          {observations.map((obs) => (
            <li key={obs.id}>
              <strong>{obs.species_name}</strong> — {obs.observation_type}
            </li>
          ))}
        </ul>

        <hr />

        <h3>Add Observation</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <select
              name="monitoring_site_id"
              value={formData.monitoring_site_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Monitoring Site</option>

              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.site_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              name="species_name"
              placeholder="Species Name"
              value={formData.species_name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <select
              name="observation_type"
              value={formData.observation_type}
              onChange={handleChange}
            >
              <option value="manual">Manual</option>
              <option value="image">Image</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              name="notes"
              placeholder="Notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <button type="submit">Add Observation</button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default Observations;