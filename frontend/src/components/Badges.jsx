export function StatusBadge({ status }) {
  const map = {
    planned: { cls: "badge-low", label: "Planned" },
    active: { cls: "badge-ok", label: "Active" },
    completed: { cls: "badge-low", label: "Completed" },
    suspended: { cls: "badge-high", label: "Suspended" },
    registered: { cls: "badge-low", label: "Registered" },
    downloading: { cls: "badge-med", label: "Downloading" },
    ready: { cls: "badge-ok", label: "Ready" },
    failed: { cls: "badge-high", label: "Failed" },
  };
  const conf = map[status] || { cls: "badge-low", label: status };
  return <span className={`badge ${conf.cls}`}>{conf.label}</span>;
}

export function RoleBadge({ role }) {
  const labels = {
    administrator: "Administrator",
    researcher: "Wildlife Researcher",
    conservation_officer: "Conservation Officer",
    forest_department: "Forest Department",
  };
  return (
    <span className="badge bg-canopy-800 text-white">
      {labels[role] || role}
    </span>
  );
}
