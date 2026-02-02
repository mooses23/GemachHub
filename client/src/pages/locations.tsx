import { HierarchicalLocationSearch } from "@/components/locations/hierarchical-location-search";

export default function Locations() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="glow-orb-blue top-20 -left-40 animate-float opacity-40"></div>
      <div className="glow-orb-teal top-1/3 -right-32 animate-float-delayed opacity-30"></div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <HierarchicalLocationSearch />
      </div>
    </div>
  );
}
