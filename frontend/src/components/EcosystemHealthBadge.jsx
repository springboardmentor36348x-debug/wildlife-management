const STATUS_STYLES = {
  Excellent: "bg-canopy-100 text-canopy-700",
  Healthy: "bg-canopy-100 text-canopy-700",
  "Moderate Concern": "bg-ochre-400/20 text-ochre-600",
  Vulnerable: "bg-ochre-400/20 text-ochre-600",
  Critical: "bg-red-100 text-red-700",
};

// Maps conservation_status labels to the existing badge-* CSS classes
// already defined in styles/index.css, reusing Milestone 1/2's visual
// language rather than introducing new colors.
const STATUS_BADGE_CLASS = {
  Excellent: "badge-ok",
  Healthy: "badge-ok",
  "Moderate Concern": "badge-med",
  Vulnerable: "badge-med",
  Critical: "badge-high",
};

export default function EcosystemHealthBadge({ score, status, size = "md" }) {
  if (score === undefined || score === null || !status) {
    return <span className="badge badge-low">No health score yet</span>;
  }

  const cls = STATUS_BADGE_CLASS[status] || "badge-low";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className={`badge ${cls} ${textSize} inline-flex items-center gap-1.5`}>
      <span className="font-semibold">{score}</span>
      <span>{status}</span>
    </span>
  );
}

export { STATUS_STYLES };
