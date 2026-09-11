import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const SEVERITY_DOT = {
  critical: "bg-red-500",
  warning: "bg-ochre-500",
  info: "bg-canopy-400",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState({ total: 0, unread: 0, critical: 0, warning: 0, info: 0 });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  function refreshSummary() {
    api.getNotificationSummary().then(setSummary).catch(() => {});
  }

  useEffect(() => {
    refreshSummary();
    const interval = setInterval(refreshSummary, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      api
        .listNotifications()
        .then((rows) => setNotifications(rows.slice(0, 6)))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-canopy-100 transition-colors"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {summary.unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {summary.unread > 9 ? "9+" : summary.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 card shadow-lg z-20 overflow-hidden">
          <div className="px-4 py-3 border-b border-canopy-100 flex items-center justify-between">
            <p className="font-display font-semibold text-sm text-bark-900">Alerts</p>
            <button
              className="text-xs text-canopy-700 hover:underline"
              onClick={() => {
                api.markAllNotificationsRead().then(() => {
                  refreshSummary();
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                });
              }}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-canopy-100">
            {loading && <p className="text-sm text-canopy-600 px-4 py-4">Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p className="text-sm text-canopy-600 px-4 py-4">No active alerts. All clear.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.is_read) {
                    api.markNotificationRead(n.id).then(refreshSummary);
                  }
                  setOpen(false);
                  navigate("/notifications");
                }}
                className={`w-full text-left px-4 py-3 hover:bg-canopy-50 transition-colors ${
                  n.is_read ? "" : "bg-canopy-50/60"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[n.severity] || "bg-canopy-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-bark-900 leading-tight">{n.title}</p>
                    <p className="text-xs text-canopy-600 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
            className="w-full text-center text-xs font-semibold text-canopy-800 py-2.5 border-t border-canopy-100 hover:bg-canopy-50"
          >
            View all alerts
          </button>
        </div>
      )}
    </div>
  );
}
