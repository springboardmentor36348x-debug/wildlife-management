import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

function EcosystemHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/ecosystem/health"
      );

      setData(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load ecosystem health data.");
    } finally {
      setLoading(false);
    }
  }

  const factors = [
    {
      key: "species_diversity",
      title: "Species Diversity",
      icon: "🐾",
      color: "bg-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-400/20",
    },
    {
      key: "population_stability",
      title: "Population Stability",
      icon: "📈",
      color: "bg-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-400/20",
    },
    {
      key: "habitat_quality",
      title: "Habitat Quality",
      icon: "🌳",
      color: "bg-teal-500",
      bg: "bg-teal-500/10",
      border: "border-teal-400/20",
    },
    {
      key: "endangered_species_status",
      title: "Endangered Species Status",
      icon: "🛡️",
      color: "bg-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-400/20",
    },
    {
      key: "environmental_conditions",
      title: "Environmental Conditions",
      icon: "🌡️",
      color: "bg-cyan-500",
      bg: "bg-cyan-500/10",
      border: "border-cyan-400/20",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#0b1120]">

      <Sidebar />

      <main className="ml-64 flex-1 p-8">

        {/* Header */}
        <div className="mb-8">

          <p className="text-cyan-400 text-sm font-semibold uppercase tracking-[0.2em]">
            Ecosystem Analytics
          </p>

          <h1 className="text-4xl font-bold text-white mt-2">
            Ecosystem Health
          </h1>

          <p className="text-slate-400 mt-2 max-w-3xl">
            Evaluate ecosystem health using the defined biodiversity,
            population, habitat and environmental factors.
          </p>

        </div>


        {/* Loading */}
        {loading && (
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-10 text-center">

            <div className="text-4xl animate-pulse mb-4">
              🌍
            </div>

            <p className="text-slate-300">
              Loading ecosystem health data...
            </p>

          </div>
        )}


        {/* Error */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-400/20 rounded-2xl p-6">

            <p className="text-red-400 font-semibold">
              {error}
            </p>

          </div>
        )}


        {/* Main Content */}
        {!loading && !error && data && (
          <>

            {/* Overall Score */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl">

              <div className="flex flex-col md:flex-row items-center gap-8">

                <div className="w-36 h-36 rounded-full border-8 border-slate-700 flex items-center justify-center">

                  <div className="text-center">

                    <p className="text-3xl font-bold text-slate-300">
                      {data.overall_score !== null
                        ? data.overall_score
                        : "—"}
                    </p>

                    <p className="text-xs text-slate-500">
                      SCORE
                    </p>

                  </div>

                </div>

                <div>

                  <h2 className="text-2xl font-bold text-white">
                    Overall Ecosystem Health
                  </h2>

                  <p className="text-slate-400 mt-2 max-w-2xl">
                    {data.overall_score !== null
                      ? "Overall ecosystem health score calculated from available data."
                      : "Overall health score is not available because the required ecosystem data is not yet available."}
                  </p>

                </div>

              </div>

            </div>


            {/* Factors */}
            <div className="mt-8">

              <h2 className="text-2xl font-bold text-white mb-5">
                Health Assessment Factors
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {factors.map((factor) => {

                  const factorData =
                    data.factors?.[factor.key];

                  const score = factorData?.score;
                  const weight = factorData?.weight;

                  return (
                    <div
                      key={factor.key}
                      className={`${factor.bg} ${factor.border} border rounded-2xl p-6`}
                    >

                      <div className="flex items-center justify-between">

                        <div
                          className={`w-12 h-12 ${factor.color} rounded-xl flex items-center justify-center text-2xl`}
                        >
                          {factor.icon}
                        </div>

                        <span className="text-white font-bold">
                          {weight}%
                        </span>

                      </div>


                      <h3 className="text-lg font-bold text-white mt-5">
                        {factor.title}
                      </h3>


                      <div className="mt-4">

                        <div className="flex justify-between text-sm">

                          <span className="text-slate-500">
                            Current score
                          </span>

                          <span className="text-slate-400">
                            {score !== null && score !== undefined
                              ? score
                              : "Not available"}
                          </span>

                        </div>


                        <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">

                          <div
                            className={`${factor.color} h-2 rounded-full`}
                            style={{
                              width:
                                score !== null &&
                                score !== undefined
                                  ? `${Math.min(score, 100)}%`
                                  : "0%",
                            }}
                          />

                        </div>

                      </div>


                      {/* Species richness is available from current data */}
                      {factor.key === "species_diversity" &&
                        factorData?.species_richness !== undefined && (

                          <div className="mt-4 text-sm text-slate-400">

                            Species richness:{" "}

                            <span className="text-purple-400 font-bold">
                              {factorData.species_richness}
                            </span>

                          </div>

                        )}

                    </div>
                  );
                })}

              </div>

            </div>


            {/* Information */}
            <div className="mt-8 bg-[#111827] border border-white/10 rounded-2xl p-7">

              <h2 className="text-xl font-bold text-white">
                Assessment Model
              </h2>

              <p className="text-slate-400 mt-3 leading-relaxed">
                {data.message}
              </p>

            </div>

          </>
        )}

      </main>

    </div>
  );
}

export default EcosystemHealth;