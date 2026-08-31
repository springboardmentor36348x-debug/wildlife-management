import React from "react";

const STATUS_MAP = {
  least_concern: { label: "Least Concern", cls: "least-concern" },
  "least concern": { label: "Least Concern", cls: "least-concern" },
  vulnerable: { label: "Vulnerable", cls: "vulnerable" },
  endangered: { label: "Endangered", cls: "endangered" },
  critically_endangered: { label: "Critically Endangered", cls: "endangered" },
  invasive: { label: "Invasive", cls: "invasive" },
};

function StatusBadge({ status }) {
  if (!status) return null;
  const key = String(status).toLowerCase().trim();
  const entry = STATUS_MAP[key] || { label: status, cls: "unknown" };
  return <span className={`status-badge ${entry.cls}`}>{entry.label}</span>;
}

export default StatusBadge;