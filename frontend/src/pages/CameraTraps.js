import React, { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import SitesMap from "../components/SitesMap";
import { CameraIcon } from "../components/Icons";

function CameraTraps() {
  const { token } = useContext(AuthContext);

  const [traps, setTraps] = useState([]);
  const [sites, setSites] = useState([]);

  const [formData, setFormData] = useState({
    monitoring_site_id: "",
    device_code: "",
    model_name: "",
    installation_date: "",
    status: "active",
    battery_level: 100,
  });

  useEffect(() => {
    if (!token) return;

    api
      .get("/camera-traps/", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setTraps(res.data))
      .catch((err) => console.log(err));

    api
      .get("/monitoring-sites/", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setSites(res.data))
      .catch((err) => console.log(err));
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.monitoring_site_id) {
      alert("Please select a monitoring site");
      return;
    }

    api
      .post("/camera-traps/", formData, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setTraps([...traps, res.data]);
        alert("Camera Trap Registered ✅");
        setFormData({
          monitoring_site_id: "",
          device_code: "",
          model_name: "",
          installation_date: "",
          status: "active",
          battery_level: 100,
        });
      })
      .catch((err) => console.log(err));
  };

  // Look up each trap's coordinates via its linked monitoring site so we
  // can plot cameras on the map even though the trap record itself only
  // stores monitoring_site_id, not lat/long directly.
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
  const mapPoints = traps
    .map((trap) => {
      const site = siteById[trap.monitoring_site_id];
      if (!site) return null;
      return {
        site_name: trap.device_code,
        habitat_type: `${trap.status} · ${site.site_name}`,
        latitude: site.latitude,
        longitude: site.longitude,
      };
    })
    .filter(Boolean);

  const batteryColor = (level) => {
    if (level >= 60) return "var(--dl-accent)";
    if (level >= 25) return "var(--dl-amber)";
    return "var(--dl-red)";
  };

  return (
    <DashboardLayout title="Camera Traps">
      {mapPoints.length > 0 && (
        <div className="panel" style={{ marginBottom: 22 }}>
          <div className="panel-title">Camera Trap Locations</div>
          <SitesMap sites={mapPoints} />
        </div>
      )}

      <div className="dl-panels">
        <div className="panel">
          <div className="panel-title">All Camera Traps ({traps.length})</div>

          {traps.length === 0 && (
            <p style={{ color: "var(--dl-text-dim)", fontSize: 13.5 }}>No camera traps registered yet.</p>
          )}

          {traps.map((trap) => (
            <div key={trap.id} className="site-row" style={{ cursor: "default" }}>
              <span className="site-row-icon"><CameraIcon size={16} /></span>
              <div className="site-row-info">
                <span className="site-row-name">{trap.device_code}</span>
                <span className={`status-badge ${trap.status}`}>{trap.status}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="battery-bar">
                  <div
                    className="battery-bar-fill"
                    style={{
                      width: `${trap.battery_level}%`,
                      background: batteryColor(trap.battery_level),
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: "var(--dl-text-dim)", minWidth: 32 }}>
                  {trap.battery_level}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">Register Camera Trap</div>

          <form onSubmit={handleSubmit}>
            <select
              name="monitoring_site_id"
              value={formData.monitoring_site_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Monitoring Site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.site_name}</option>
              ))}
            </select>

            <input
              type="text"
              name="device_code"
              placeholder="Device Code"
              value={formData.device_code}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="model_name"
              placeholder="Model Name"
              value={formData.model_name}
              onChange={handleChange}
              required
            />

            <div className="form-row-2col">
              <input
                type="date"
                name="installation_date"
                value={formData.installation_date}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="battery_level"
                placeholder="Battery Level"
                value={formData.battery_level}
                onChange={handleChange}
                min="0"
                max="100"
                required
              />
            </div>

            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <button type="submit">Register Camera Trap</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CameraTraps;