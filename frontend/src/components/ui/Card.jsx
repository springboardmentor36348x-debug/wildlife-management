export default function Card({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-xl2 border border-surface-border bg-white p-5 shadow-card ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="font-display text-base font-semibold text-forest-900">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
