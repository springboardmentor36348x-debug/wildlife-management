import React, { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import "../App.css";

function AudioSensors() {
  const { token } = useContext(AuthContext);

  const [sensors, setSensors] = useState([]);
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
      .get("/audio-sensors/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setSensors(res.data))
      .catch((err) => console.log(err));

    api
      .get("/monitoring-sites/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setSites(res.data))
      .catch((err) => console.log(err));
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.monitoring_site_id) {
      alert("Please select a monitoring site");
      return;
    }

    api
      .post("/audio-sensors/", formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSensors([...sensors, res.data]);

        alert("Audio Sensor Registered ✅");

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

  return (
    
    <DashboardLayout title="Audio Sensors">
      <div className="dashboard-container">
        <h2>Audio Sensors</h2>

        <ul>
          {sensors.map((sensor) => (
            <li key={sensor.id}>
              {sensor.device_code} — {sensor.status} (Battery:{" "}
              {sensor.battery_level}%)
            </li>
          ))}
        </ul>

        <hr />

        <h3>Register Audio Sensor</h3>

        <form onSubmit={handleSubmit}>
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

          <br />
          <br />

          <input
            type="text"
            name="device_code"
            placeholder="Device Code"
            value={formData.device_code}
            onChange={handleChange}
            required
          />

          <br />
          <br />

          <input
            type="text"
            name="model_name"
            placeholder="Model Name"
            value={formData.model_name}
            onChange={handleChange}
            required
          />

          <br />
          <br />

          <input
            type="date"
            name="installation_date"
            value={formData.installation_date}
            onChange={handleChange}
            required
          />

          <br />
          <br />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <br />
          <br />

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

          <br />
          <br />

          <button type="submit">Register Audio Sensor</button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default AudioSensors;