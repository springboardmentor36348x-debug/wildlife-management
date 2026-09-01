import Sidebar from "../components/Sidebar";

function Wildlife() {
  return (
    <div className="flex min-h-screen bg-[#0b1120]">

      <Sidebar />

      <main className="ml-64 flex-1 p-8">

        {/* Header */}
        <div className="mb-10">

          <p className="text-orange-400 text-sm font-semibold uppercase tracking-[0.2em]">
            Wildlife Intelligence
          </p>

          <h1 className="text-4xl font-bold text-white mt-2">
            Wildlife Species
          </h1>

          <p className="text-slate-400 mt-3 max-w-2xl">
            Explore wildlife species detected and monitored through the
            intelligence system.
          </p>

        </div>


        {/* Main Information Panel */}
        <div className="bg-[#111827] border border-white/10 rounded-3xl p-10 shadow-2xl">

          <div className="flex flex-col md:flex-row items-center gap-8">

            {/* Icon */}
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-6xl shadow-lg shadow-orange-500/20">
              🐾
            </div>


            <div className="flex-1 text-center md:text-left">

              <h2 className="text-2xl font-bold text-white">
                Wildlife Species Monitoring
              </h2>

              <p className="text-slate-400 mt-3 leading-relaxed">
                This section is designed to display the wildlife species
                identified by the AI detection system. Species information
                will be presented using the actual detection data available
                in the project.
              </p>

            </div>

          </div>

        </div>


        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

          <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-6 hover:-translate-y-1 transition">

            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white text-2xl">
              🔍
            </div>

            <h3 className="text-xl font-bold text-white mt-5">
              AI Identification
            </h3>

            <p className="text-slate-400 text-sm mt-2">
              Wildlife identification is performed through the image
              detection module.
            </p>

          </div>


          <div className="bg-purple-500/10 border border-purple-400/20 rounded-2xl p-6 hover:-translate-y-1 transition">

            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white text-2xl">
              🧠
            </div>

            <h3 className="text-xl font-bold text-white mt-5">
              Intelligence
            </h3>

            <p className="text-slate-400 text-sm mt-2">
              Detection results can be used for wildlife monitoring and
              analysis.
            </p>

          </div>


          <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-2xl p-6 hover:-translate-y-1 transition">

            <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center text-white text-2xl">
              📊
            </div>

            <h3 className="text-xl font-bold text-white mt-5">
              Data Insights
            </h3>

            <p className="text-slate-400 text-sm mt-2">
              Actual detection records are used for further analysis.
            </p>

          </div>

        </div>


        {/* Empty State */}
        <div className="mt-8 bg-[#111827] border border-dashed border-slate-600 rounded-2xl p-10 text-center">

          <div className="text-5xl mb-4">
            🐾
          </div>

          <h2 className="text-xl font-bold text-white">
            Species Data
          </h2>

          <p className="text-slate-400 mt-2 max-w-xl mx-auto">
            Species cards will appear here when wildlife detection data is
            available from the system.
          </p>

        </div>

      </main>

    </div>
  );
}

export default Wildlife;