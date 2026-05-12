import React, { useState, useMemo } from 'react';
import {
  Search, Phone, Mail, MapPin, ChevronRight, ArrowLeft, Home,
  MoreVertical, CheckCircle2, XCircle, AlertTriangle, MessageSquare,
  ShieldCheck, Send, Edit, Trash2, KeyRound, Check
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import './_group.css';

// Mock Data
const REGIONS = [
  { id: 1, name: "United States", slug: "us", locationsCount: 4, notOnboarded: 2, missingContact: 2 },
  { id: 2, name: "Israel", slug: "il", locationsCount: 4, notOnboarded: 1, missingContact: 1 },
  { id: 3, name: "United Kingdom", slug: "uk", locationsCount: 4, notOnboarded: 1, missingContact: 2 },
];

const COMMUNITIES = [
  { id: 101, regionId: 1, stateCode: "NY", name: "New York" },
  { id: 102, regionId: 1, stateCode: "NJ", name: "New Jersey" },
  { id: 201, regionId: 2, name: "Jerusalem" },
  { id: 202, regionId: 2, name: "Bnei Brak" },
  { id: 301, regionId: 3, name: "London" },
  { id: 302, regionId: 3, name: "Manchester" },
];

const LOCATIONS = [
  // US
  { id: 1, regionId: 1, communityId: 101, stateCode: "NY", name: "Crown Heights Banz", code: "USNY-001", coordinator: "Sarah Klein", phone: "+1-718-555-0143", email: "sarah@chbanz.org", pin: "1234", active: true, onboarded: true },
  { id: 2, regionId: 1, communityId: 101, stateCode: "NY", name: "Borough Park Gemach", code: "USNY-002", coordinator: "Rivka Stern", phone: "", email: "rivka@bpgmch.org", pin: "4321", active: true, onboarded: false },
  { id: 3, regionId: 1, communityId: 102, stateCode: "NJ", name: "Lakewood Earmuffs", code: "USNJ-001", coordinator: "Yossi Friedman", phone: "+1-732-555-0188", email: "yossi@lwbanz.org", pin: "5555", active: true, onboarded: true },
  { id: 4, regionId: 1, communityId: 102, stateCode: "NJ", name: "Toms River Banz", code: "USNJ-002", coordinator: "Chana Berger", phone: "+1-732-555-0211", email: "", pin: "9999", active: false, onboarded: false },
  // IL
  { id: 5, regionId: 2, communityId: 201, name: "Geulah Earmuffs Gemach", code: "ILJM-001", coordinator: "Devorah Cohen", phone: "+972-2-555-0167", email: "devorah@geulah.co.il", pin: "1111", active: true, onboarded: true },
  { id: 6, regionId: 2, communityId: 201, name: "Har Nof Banz", code: "ILJM-002", coordinator: "Esther Mor", phone: "+972-2-555-0190", email: "esther@harnof.co.il", pin: "2222", active: true, onboarded: true },
  { id: 7, regionId: 2, communityId: 202, name: "Bnei Brak Earmuffs", code: "ILBB-001", coordinator: "Miri Levy", phone: "+972-3-555-0145", email: "miri@bbgmch.co.il", pin: "3333", active: true, onboarded: true },
  { id: 8, regionId: 2, communityId: 202, name: "Ramat Gan Gemach", code: "ILBB-002", coordinator: "Shulamit Katz", phone: "", email: "shulamit@rgbanz.co.il", pin: "4444", active: true, onboarded: false },
  // UK
  { id: 9, regionId: 3, communityId: 301, name: "Stamford Hill Banz", code: "GBLN-001", coordinator: "Yael Goldstein", phone: "+44-20-7555-0123", email: "yael@shbanz.uk", pin: "5555", active: true, onboarded: true },
  { id: 10, regionId: 3, communityId: 301, name: "Golders Green Gemach", code: "GBLN-002", coordinator: "Bracha Weiss", phone: "+44-20-7555-0156", email: "bracha@ggbanz.uk", pin: "6666", active: true, onboarded: true },
  { id: 11, regionId: 3, communityId: 301, name: "Hendon Earmuffs", code: "GBLN-003", coordinator: "Tova Roth", phone: "+44-20-7555-0177", email: "", pin: "7777", active: true, onboarded: false },
  { id: 12, regionId: 3, communityId: 302, name: "Manchester Banz", code: "GBMN-001", coordinator: "Leah Davis", phone: "+44-161-555-0134", email: "leah@mcrbanz.uk", pin: "8888", active: true, onboarded: true },
];

export function DrillIn() {
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(1); // Default to US
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<number>>(new Set([1, 3])); // Default some selected to show bulk bar

  const selectedRegion = REGIONS.find(r => r.id === selectedRegionId);
  
  const communities = useMemo(() => {
    if (!selectedRegionId) return [];
    return COMMUNITIES.filter(c => c.regionId === selectedRegionId);
  }, [selectedRegionId]);

  const filteredLocations = useMemo(() => {
    if (!selectedRegionId) return [];
    let locs = LOCATIONS.filter(l => l.regionId === selectedRegionId);
    if (selectedCommunityId !== 'all') {
      locs = locs.filter(l => l.communityId === selectedCommunityId || (l.stateCode && l.stateCode === selectedCommunityId));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      locs = locs.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.code.toLowerCase().includes(q) || 
        l.coordinator.toLowerCase().includes(q)
      );
    }
    return locs;
  }, [selectedRegionId, selectedCommunityId, searchQuery]);

  const toggleLocation = (id: number) => {
    const newSet = new Set(selectedLocationIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLocationIds(newSet);
  };

  const toggleAll = () => {
    if (selectedLocationIds.size === filteredLocations.length) {
      setSelectedLocationIds(new Set());
    } else {
      setSelectedLocationIds(new Set(filteredLocations.map(l => l.id)));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-300 font-sans pb-32">
      {/* Background Orbs */}
      <div className="glow-orb bg-primary/20 w-[500px] h-[500px] top-[-100px] left-[-100px]" />
      <div className="glow-orb bg-secondary/10 w-[400px] h-[400px] bottom-[20%] right-[-50px]" />

      <div className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
        
        {/* Compact Region Strip */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {REGIONS.map(region => (
            <div 
              key={region.id} 
              onClick={() => { setSelectedRegionId(region.id); setSelectedCommunityId('all'); setSelectedLocationIds(new Set()); }}
              className={`flex-shrink-0 cursor-pointer p-4 rounded-2xl transition-all border ${
                selectedRegionId === region.id 
                  ? 'bg-primary/20 border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                  : 'glass-card hover:bg-slate-800/50 hover:border-slate-700/50'
              }`}
            >
              <h3 className="text-white font-semibold flex items-center gap-2">
                {region.name}
              </h3>
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">
                  {region.locationsCount} locations
                </Badge>
                {region.notOnboarded > 0 && (
                  <Badge variant="destructive" className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border-red-500/30">
                    {region.notOnboarded} not onboarded
                  </Badge>
                )}
                {region.missingContact > 0 && (
                  <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                    {region.missingContact} missing contact
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedRegionId && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Home className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                <ChevronRight className="w-4 h-4" />
                <span className="text-white font-medium">{selectedRegion?.name}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input 
                    placeholder="Search locations..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-950/50 border-slate-800 text-sm h-9 w-full md:w-64 rounded-full"
                  />
                </div>
                <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 rounded-full px-4 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  Add Location
                </Button>
              </div>
            </div>

            {/* Community Pills */}
            {communities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCommunityId('all')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedCommunityId === 'all'
                      ? 'bg-secondary text-secondary-foreground shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                      : 'glass-panel hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  All {selectedRegion?.slug === 'us' ? 'States' : 'Communities'}
                </button>
                {communities.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCommunityId(c.stateCode || c.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCommunityId === (c.stateCode || c.id)
                        ? 'bg-secondary text-secondary-foreground shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                        : 'glass-panel hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Select All Row */}
            {filteredLocations.length > 0 && (
              <div className="flex items-center justify-between px-2 text-sm text-slate-400">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <Checkbox 
                      checked={selectedLocationIds.size === filteredLocations.length && filteredLocations.length > 0} 
                      onCheckedChange={toggleAll}
                      className="w-5 h-5 border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  <span className="group-hover:text-slate-200 transition-colors">Select All ({filteredLocations.length})</span>
                </label>
              </div>
            )}

            {/* Location Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLocations.map(loc => {
                const isSelected = selectedLocationIds.has(loc.id);
                return (
                  <div 
                    key={loc.id} 
                    className={`glass-card p-5 relative overflow-hidden transition-all duration-300 border ${
                      isSelected 
                        ? 'border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                        : 'border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-300">
                          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer"><Send className="w-4 h-4 mr-2" /> Send Welcome SMS</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer"><MessageSquare className="w-4 h-4 mr-2" /> Send Restock Email</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer"><Edit className="w-4 h-4 mr-2" /> Edit Location</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer"><KeyRound className="w-4 h-4 mr-2" /> Change PIN</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-950/30 cursor-pointer"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => toggleLocation(loc.id)}
                        className="w-5 h-5 border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>

                    <div className="pr-12">
                      <h4 className="text-lg font-bold text-white mb-1 leading-tight">{loc.name}</h4>
                      <p className="text-xs font-mono text-slate-400 bg-slate-900/50 inline-block px-2 py-0.5 rounded border border-slate-800/50 mb-3">{loc.code}</p>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>{loc.coordinator}</span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Phone className={`w-4 h-4 mt-0.5 shrink-0 ${!loc.phone ? 'text-orange-500/50' : 'text-slate-500'}`} />
                        {loc.phone ? (
                          <span>{loc.phone}</span>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 border-orange-500/30 text-orange-400 bg-orange-500/10">MISSING PHONE</Badge>
                        )}
                      </div>

                      <div className="flex items-start gap-2">
                        <Mail className={`w-4 h-4 mt-0.5 shrink-0 ${!loc.email ? 'text-orange-500/50' : 'text-slate-500'}`} />
                        {loc.email ? (
                          <span className="truncate" title={loc.email}>{loc.email}</span>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 border-orange-500/30 text-orange-400 bg-orange-500/10">MISSING EMAIL</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <KeyRound className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-mono text-slate-400 bg-slate-900/50 px-2 rounded">••••</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-slate-800/50">
                      <Badge variant="outline" className={`border-transparent ${loc.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {loc.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className={`border-transparent ${loc.onboarded ? 'bg-primary/10 text-primary-foreground' : 'bg-slate-800 text-slate-400'}`}>
                        {loc.onboarded ? 'Onboarded' : 'Not onboarded'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredLocations.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No locations found matching your filters.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Sticky Bulk Action Bar */}
      {selectedLocationIds.size > 0 && (
        <div className="fixed bottom-0 md:bottom-8 left-0 right-0 z-50 flex justify-center animate-in slide-in-from-bottom-8 duration-300 p-4 md:p-0">
          <div className="glass-panel w-full md:w-auto bg-slate-900/90 border-primary/30 shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(59,130,246,0.15)] rounded-2xl md:rounded-full px-6 py-4 flex flex-col md:flex-row items-center gap-4 md:gap-6 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                {selectedLocationIds.size}
              </div>
              <span className="text-white font-medium text-sm">selected</span>
            </div>
            
            <div className="h-px md:h-8 w-full md:w-px bg-slate-800"></div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex-1 md:flex-none">
                <MessageSquare className="w-4 h-4 mr-2" /> Message
              </Button>
              <Button size="sm" variant="secondary" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full flex-1 md:flex-none">
                <Send className="w-4 h-4 mr-2" /> Send Welcome
              </Button>
              <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white rounded-full shrink-0" onClick={() => setSelectedLocationIds(new Set())}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}