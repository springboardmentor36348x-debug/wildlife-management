export default function StatCard({ icon: Icon, label, value, change, changeLabel = "from last month" }) {
  const isPositive = typeof change === "number" ? change >= 0 : true;

  return (
    <div className="flex items-start justify-between rounded-xl2 border border-surface-border bg-white p-5 shadow-card">
      <div>
        <p className="text-sm text-forest-400">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold text-forest-900">{value}</p>
        {change !== undefined && (
          <p className={`mt-1 text-xs ${isPositive ? "text-forest-500" : "text-red-500"}`}>
            {isPositive ? "+" : ""}
            {change}% {changeLabel}
          </p>
        )}
      </div>
      {Icon && (
        <div className="rounded-lg bg-forest-50 p-2.5 text-forest-600">
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}
