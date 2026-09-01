import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import EntityManager from "../../components/monitoring/EntityManager.jsx";
import { surveysApi, monitoringSitesApi, cameraTrapsApi, audioSensorsApi } from "../../api/monitoring.js";
import { canManageSiteInfra, canDelete as canDeleteRole } from "../../utils/permissions.js";

const emptyForm = {
  survey_name: "",
  monitoring_site_id: "",
  camera_trap_id: "",
  audio_sensor_id: "",
  survey_date: "",
  description: "",
};

export default function Surveys() {
  const { user, token } = useAuth();
  const [siteOptions, setSiteOptions] = useState([]);
  const [cameraOptions, setCameraOptions] = useState([]);
  const [sensorOptions, setSensorOptions] = useState([]);

  useEffect(() => {
    monitoringSitesApi
      .list(token, {})
      .then((sites) => setSiteOptions(sites.map((s) => ({ value: s.id, label: s.site_name }))))
      .catch(() => {});
    cameraTrapsApi
      .list(token, {})
      .then((cams) => setCameraOptions(cams.map((c) => ({ value: c.id, label: c.camera_name }))))
      .catch(() => {});
    audioSensorsApi
      .list(token, {})
      .then((sensors) => setSensorOptions(sensors.map((s) => ({ value: s.id, label: s.sensor_name }))))
      .catch(() => {});
  }, [token]);

  const fields = [
    { name: "survey_name", label: "Survey Name / Title", required: true },
    { name: "monitoring_site_id", label: "Monitoring Site", type: "select", options: siteOptions, required: true },
    { name: "survey_date", label: "Survey Date", type: "date", required: true },
    {
      name: "camera_trap_id",
      label: "Monitoring Device — Camera Trap (optional)",
      type: "select",
      options: cameraOptions,
      optional: true,
    },
    {
      name: "audio_sensor_id",
      label: "Monitoring Device — Audio Sensor (optional)",
      type: "select",
      options: sensorOptions,
      optional: true,
    },
    { name: "description", label: "Description / Notes", type: "textarea", optional: true },
  ];

  const columns = [
    { key: "survey_name", label: "Survey" },
    { key: "monitoring_site_name", label: "Site" },
    { key: "survey_date", label: "Date", render: (item) => new Date(item.survey_date).toLocaleDateString() },
    {
      key: "device",
      label: "Device",
      render: (item) => item.camera_trap_name || item.audio_sensor_name || "—",
    },
  ];

  return (
    <EntityManager
      title="Surveys"
      singular="Survey"
      description="Create and manage wildlife surveys across monitoring sites"
      api={surveysApi}
      columns={columns}
      fields={fields}
      emptyForm={emptyForm}
      canCreate={canManageSiteInfra(user?.role)}
      canUpdate={canManageSiteInfra(user?.role)}
      canDelete={canDeleteRole(user?.role)}
      filters={[{ name: "site_id", label: "All Sites", options: siteOptions }]}
    />
  );
}
