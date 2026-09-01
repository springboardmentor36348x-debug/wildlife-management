import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import EntityManager from "../../components/monitoring/EntityManager.jsx";
import { observationsApi, monitoringSitesApi, surveysApi } from "../../api/monitoring.js";
import { canManageObservations, canDelete as canDeleteRole } from "../../utils/permissions.js";

const SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "camera_trap", label: "Camera Trap" },
  { value: "audio_sensor", label: "Audio Sensor" },
];

const emptyForm = {
  species: "",
  monitoring_site_id: "",
  survey_id: "",
  observation_datetime: "",
  detection_source: "manual",
  confidence_score: "",
  notes: "",
};

export default function Observations() {
  const { user, token } = useAuth();
  const [siteOptions, setSiteOptions] = useState([]);
  const [surveyOptions, setSurveyOptions] = useState([]);

  useEffect(() => {
    monitoringSitesApi
      .list(token, {})
      .then((sites) => setSiteOptions(sites.map((s) => ({ value: s.id, label: s.site_name }))))
      .catch(() => {});
    surveysApi
      .list(token, {})
      .then((surveys) => setSurveyOptions(surveys.map((s) => ({ value: s.id, label: s.survey_name }))))
      .catch(() => {});
  }, [token]);

  const fields = [
    { name: "species", label: "Species", required: true },
    { name: "monitoring_site_id", label: "Monitoring Site", type: "select", options: siteOptions, required: true },
    { name: "survey_id", label: "Survey (optional)", type: "select", options: surveyOptions, optional: true },
    { name: "observation_datetime", label: "Observation Date/Time", type: "datetime-local", required: true },
    { name: "detection_source", label: "Detection Source", type: "select", options: SOURCE_OPTIONS, required: true },
    {
      name: "confidence_score",
      label: "Confidence Score (%, optional — reserved for future AI)",
      type: "number",
      step: "any",
      optional: true,
    },
    { name: "notes", label: "Notes", type: "textarea", optional: true },
  ];

  const columns = [
    { key: "species", label: "Species" },
    { key: "monitoring_site_name", label: "Site" },
    {
      key: "observation_datetime",
      label: "Date/Time",
      render: (item) => new Date(item.observation_datetime).toLocaleString(),
    },
    {
      key: "detection_source",
      label: "Source",
      render: (item) => <span className="capitalize">{item.detection_source.replace("_", " ")}</span>,
    },
  ];

  return (
    <EntityManager
      title="Observation History"
      singular="Observation"
      description="Wildlife observation records from surveys and monitoring devices"
      api={observationsApi}
      columns={columns}
      fields={fields}
      emptyForm={emptyForm}
      searchParamName="species"
      canCreate={canManageObservations(user?.role)}
      canUpdate={canManageObservations(user?.role)}
      canDelete={canDeleteRole(user?.role)}
      filters={[
        { name: "site_id", label: "All Sites", options: siteOptions },
        { name: "detection_source", label: "All Sources", options: SOURCE_OPTIONS },
      ]}
    />
  );
}
