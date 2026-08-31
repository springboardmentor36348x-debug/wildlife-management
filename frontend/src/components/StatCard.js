import React from "react";

function StatCard({ label, value, trend, trendUp = true, icon: Icon, tone = "green" }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className={`stat-icon tone-${tone}`}>
            <Icon size={17} />
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {trend && (
        <span className={"stat-trend " + (trendUp ? "up" : "down")}>
          {trendUp ? "▲" : "▼"} {trend}
        </span>
      )}
    </div>
  );
}

export default StatCard;