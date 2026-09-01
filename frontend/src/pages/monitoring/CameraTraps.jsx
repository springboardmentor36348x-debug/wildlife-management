import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import EntityManager from "../../components/monitoring/EntityManager.jsx";
import { cameraTrapsApi, monitoringSitesApi } from "../../api/monitoring.js";
import { canManageSiteInfra, canDelete as canDeleteRole } from "../../utils/permissions.js";

const STATUS_OPTIONS = ["active", "inactive", "maintenance"].map((s) => ({ value: s, label: s }));

const emptyForm = {
  camera_name: "",
  monitoring_site_id: "",
  installation_date: "",
  status: "active",
  latitude: "",
  longitude: "",
  description: "",
};

function StatusPill({ status }) {
  const tone =
    status === "active"
      ? "bg-forest-50 text-forest-600"
      : status === "maintenance"
      ? "bg-amber-50 text-amber-600"
      : "bg-slate-100 text-slate-500";
  return <span className={`status-pill ${tone} capitalize`}>{status}</span>;
}

export default function CameraTraps() {
  const { user, token } = useAuth();
  const [siteOptions, setSiteOptions] = useState([]);

  useEffect(() => {
    monitoringSitesApi
      .list(token, {})
      .then((sites) => setSiteOptions(sites.map((s) => ({ value: s.id, label: s.site_name }))))
      .catch(() => {});
  }, [token]);

  const fields = [
    { name: "camera_name", label: "Camera Name", required: true },
    { name: "monitoring_site_id", label: "Monitoring Site", type: "select", options: siteOptions, required: true },
    { name: "installation_date", label: "Installation Date", type: "date", required: true },
    { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, required: true },
    { name: "latitude", label: "Latitude", type: "number", step: "any", optional: true },
    { name: "longitude", label: "Longitude", type: "number", step: "any", optional: true },
    { name: "description", label: "Description / Notes", type: "textarea", optional: true },
  ];

  const columns = [
    { key: "camera_name", label: "Camera Name" },
    { key: "monitoring_site_name", label: "Site" },
    { key: "status", label: "Status", render: (item) => <StatusPill status={item.status} /> },
    {
      key: "installation_date",
      label: "Installed",
      render: (item) => new Date(item.installation_date).toLocaleDateString(),
    },
  ];

  return (
    <EntityManager
      title="Camera Traps"
      singular="Camera Trap"
      description="Manage camera trap devices deployed across monitoring sites"
      api={cameraTrapsApi}
      columns={columns}
      fields={fields}
      emptyForm={emptyForm}
      canCreate={canManageSiteInfra(user?.role)}
      canUpdate={canManageSiteInfra(user?.role)}
      canDelete={canDeleteRole(user?.role)}
      filters={[
        { name: "status", label: "All Statuses", options: STATUS_OPTIONS },
        { name: "site_id", label: "All Sites", options: siteOptions },
      ]}
    />
  );
}
