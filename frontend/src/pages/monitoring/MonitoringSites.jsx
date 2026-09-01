import { useAuth } from "../../context/AuthContext.jsx";
import EntityManager from "../../components/monitoring/EntityManager.jsx";
import { monitoringSitesApi } from "../../api/monitoring.js";
import { canManageSiteInfra, canDelete as canDeleteRole } from "../../utils/permissions.js";

const HABITAT_OPTIONS = ["Forest", "Grassland", "Wetland", "Desert", "Mountain", "Coastal", "Other"].map((h) => ({
  value: h,
  label: h,
}));

const emptyForm = {
  site_name: "",
  location: "",
  latitude: "",
  longitude: "",
  habitat_type: "",
  protected_area: "",
  description: "",
};

export default function MonitoringSites() {
  const { user } = useAuth();

  const fields = [
    { name: "site_name", label: "Site Name", required: true },
    { name: "location", label: "Location", required: true },
    { name: "latitude", label: "Latitude", type: "number", step: "any", required: true },
    { name: "longitude", label: "Longitude", type: "number", step: "any", required: true },
    { name: "habitat_type", label: "Habitat Type", type: "select", options: HABITAT_OPTIONS, required: true },
    { name: "protected_area", label: "Protected Area", optional: true },
    { name: "description", label: "Description / Notes", type: "textarea", optional: true },
  ];

  const columns = [
    { key: "site_name", label: "Site Name" },
    { key: "location", label: "Location" },
    { key: "habitat_type", label: "Habitat" },
    { key: "protected_area", label: "Protected Area" },
    {
      key: "coords",
      label: "GPS",
      render: (item) => `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`,
    },
  ];

  return (
    <EntityManager
      title="Monitoring Sites"
      singular="Monitoring Site"
      description="Register and manage wildlife monitoring locations"
      api={monitoringSitesApi}
      columns={columns}
      fields={fields}
      emptyForm={emptyForm}
      canCreate={canManageSiteInfra(user?.role)}
      canUpdate={canManageSiteInfra(user?.role)}
      canDelete={canDeleteRole(user?.role)}
      filters={[{ name: "habitat_type", label: "All Habitats", options: HABITAT_OPTIONS }]}
    />
  );
}
