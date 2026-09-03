import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, BookOpen, Compass, Search } from 'lucide-react';

export default function SpeciesCatalog() {
  const [speciesList, setSpeciesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSpecies() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/species', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSpeciesList(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSpecies();
  }, []);

  const filteredSpecies = speciesList.filter(s => {
    const matchesSearch = s.common_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.scientific_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup ? s.species_group.toLowerCase() === selectedGroup.toLowerCase() : true;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-col md:flex-row gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Wildlife Species Catalog</h2>
          <p className="text-sm text-slate-500 mt-1">Explore taxonomic logs, diet categories, and IUCN conservation statuses.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search common or scientific..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">All Groups</option>
            <option value="mammal">Mammals</option>
            <option value="bird">Birds</option>
            <option value="reptile">Reptiles</option>
            <option value="amphibian">Amphibians</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecies.map((sp) => (
            <div key={sp.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{sp.common_name}</h3>
                    <p className="text-xs text-slate-400 italic mt-0.5">{sp.scientific_name}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full ${
                    sp.is_endangered ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                  }`}>
                    {sp.conservation_status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{sp.description || "No species catalog notes registered."}</p>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-4 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Taxonomic Group</span>
                    <span className="font-semibold">{sp.species_group}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Diet Type</span>
                    <span className="font-semibold">{sp.diet_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Preferred Habitat</span>
                    <span className="font-semibold truncate block">{sp.habitat_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">IUCN Red List Code</span>
                    <span className="font-semibold">{sp.iucn_status || "LC"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  Observations: {sp.total_observations || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
