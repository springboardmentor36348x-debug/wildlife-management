import { useState } from "react";
import { AlertTriangle, Droplets, Users } from "lucide-react";
import Card from "../components/ui/Card";

const TABS = ["All", "Wildlife Alerts", "Habitat Alerts", "Population Alerts"];

const NOTIFICATIONS = [
  {
    icon: AlertTriangle,
    tone: "text-red-500 bg-red-50",
    title: "Wildlife Alert",
    message: "Tiger spotted in Bandhavgarh National Park",
    time: "2 hours ago",
    category: "Wildlife Alerts",
  },
  {
    icon: Droplets,
    tone: "text-blue-500 bg-blue-50",
    title: "Habitat Alert",
    message: "Deforestation activity detected in buffer zone",
    time: "5 hours ago",
    category: "Habitat Alerts",
  },
  {
    icon: Users,
    tone: "text-amber-500 bg-amber-50",
    title: "Population Alert",
    message: "Elephant population increased in Jim Corbett NP",
    time: "1 day ago",
    category: "Population Alerts",
  },
  {
    icon: Droplets,
    tone: "text-blue-500 bg-blue-50",
    title: "Habitat Alert",
    message: "Water source drying up in critical habitat",
    time: "2 days ago",
    category: "Habitat Alerts",
  },
];

export default function Notifications() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const filtered =
    activeTab === "All" ? NOTIFICATIONS : NOTIFICATIONS.filter((n) => n.category === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-forest-900">Notifications</h1>
        <p className="text-sm text-forest-400">Stay updated with wildlife alerts and notifications</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-forest-600 text-white" : "bg-white text-forest-500 border border-surface-border"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card action={<button className="text-xs font-medium text-forest-600">View All Notifications</button>}>
        <ul className="divide-y divide-surface-border">
          {filtered.map((n, i) => (
            <li key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`rounded-lg p-2 ${n.tone}`}>
                <n.icon size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-forest-900">{n.title}</p>
                <p className="text-xs text-forest-500">{n.message}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-forest-400">{n.time}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
