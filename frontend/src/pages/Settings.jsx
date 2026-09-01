import { useState } from "react";
import Card from "../components/ui/Card";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-forest-600" : "bg-surface-border"}`}
    >
      <span
        className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [theme, setTheme] = useState("Light");
  const [language, setLanguage] = useState("English");
  const [toggles, setToggles] = useState({
    email: true,
    push: true,
    sms: false,
    twoFactor: true,
  });

  const updateToggle = (key) => (value) => setToggles((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-forest-900">Settings</h1>
        <p className="text-sm text-forest-400">Customize your preferences</p>
      </div>

      <Card title="Appearance">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-forest-500">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm"
            >
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-forest-500">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm"
            >
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
        </div>
      </Card>

      <Card title="Notifications">
        <ul className="divide-y divide-surface-border">
          {[
            { key: "email", label: "Email Notifications", desc: "Receive email updates" },
            { key: "push", label: "Push Notifications", desc: "Receive push notifications" },
            { key: "sms", label: "SMS Alerts", desc: "Receive SMS alerts" },
          ].map((item) => (
            <li key={item.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-forest-900">{item.label}</p>
                <p className="text-xs text-forest-400">{item.desc}</p>
              </div>
              <Toggle checked={toggles[item.key]} onChange={updateToggle(item.key)} />
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Privacy & Security">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-forest-900">Two Factor Authentication</p>
            <p className="text-xs text-forest-400">Add an extra layer of security to your account</p>
          </div>
          <Toggle checked={toggles.twoFactor} onChange={updateToggle("twoFactor")} />
        </div>
      </Card>
    </div>
  );
}
