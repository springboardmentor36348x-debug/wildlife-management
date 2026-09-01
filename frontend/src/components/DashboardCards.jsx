import { useEffect, useState } from "react";
import axios from "axios";

import {
  FaPaw,
  FaDatabase,
  FaChartBar,
  FaLeaf,
} from "react-icons/fa";

function DashboardCards() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/population/summary"
      );

      setData(response.data);
    } catch (error) {
      console.log("Unable to load dashboard data");
    }
  }

  const cards = [
    {
      title: "Total Detections",
      value: data ? data.total_detections : "—",
      icon: <FaDatabase />,
      iconBg: "bg-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-400/20",
      text: "text-blue-400",
    },
    {
      title: "Species Richness",
      value: data ? data.species_richness : "—",
      icon: <FaPaw />,
      iconBg: "bg-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-400/20",
      text: "text-amber-400",
    },
    {
      title: "Species Records",
      value: data ? data.species?.length : "—",
      icon: <FaChartBar />,
      iconBg: "bg-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-400/20",
      text: "text-purple-400",
    },
    {
      title: "Population Analysis",
      value: data ? "Available" : "—",
      icon: <FaLeaf />,
      iconBg: "bg-cyan-500",
      bg: "bg-cyan-500/10",
      border: "border-cyan-400/20",
      text: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bg} ${card.border}
          border rounded-2xl p-6 shadow-xl
          hover:-translate-y-1 transition-all duration-300`}
        >

          <div className="flex items-center justify-between">

            <div
              className={`${card.iconBg}
              w-12 h-12 rounded-xl
              flex items-center justify-center
              text-white text-xl shadow-lg`}
            >
              {card.icon}
            </div>

          </div>

          <p className="text-slate-400 text-sm mt-6">
            {card.title}
          </p>

          <h2
            className={`text-3xl font-bold ${card.text} mt-2`}
          >
            {card.value}
          </h2>

        </div>
      ))}

    </div>
  );
}

export default DashboardCards;