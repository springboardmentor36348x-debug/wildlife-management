import { X } from "lucide-react";

export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm overflow-y-auto">
    <div className="relative z-[10000] my-auto flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl border border-surface-border">
      <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-5 py-4 bg-surface/50 rounded-t-2xl">
        <h3 className="font-display text-base font-semibold text-forest-900">{title}</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-forest-400 hover:bg-forest-50 hover:text-forest-600 transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer && (
        <div className="flex shrink-0 justify-end gap-3 border-t border-surface-border px-5 py-4 bg-surface/30 rounded-b-2xl">{footer}</div>
      )}
    </div>
  </div>

);
}
