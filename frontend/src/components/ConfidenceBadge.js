import React from "react";

function ConfidenceBadge({ value }) {
  const pct = value * 100;
  let color = "#4ade80";
  let label = "High";
  if (pct < 50) {
    color = "#f87171";
    label = "Low";
  } else if (pct < 80) {
    color = "#facc15";
    label = "Medium";
  }

  return (
    <span style={{
      color, fontWeight: 600, fontSize: "13px",
      display: "inline-flex", alignItems: "center", gap: "6px",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      {pct.toFixed(1)}% ({label})
    </span>
  );
}

export default ConfidenceBadge;