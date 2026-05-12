import React, { useState } from 'react';
import './_group.css';
import { 
  Search, Filter, Plus, MessageSquare, Send, CheckSquare,
  MoreVertical, Edit, KeyRound, Phone, Mail, Trash2, 
  MapPin, CheckCircle2, XCircle, TrendingUp, TrendingDown,
  ChevronDown, ChevronRight, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// --- Mock Data ---

type LocationStatus = 'Active' | 'Inactive';
type OnboardedStatus = 'Onboarded' | 'Not onboarded';

interface MockLocation {
  id: string;
  name: string;
  code: string;
  coordinator: string;
  phone: string | null;
  email: string | null;
  pin: string;
  status: LocationStatus;
  onboarded: OnboardedStatus;
}

interface Community {
  name: string;
  locations: MockLocation[];
}

interface Region {
  id: string;
  name: string;
  communities: Community[];
}

const MOCK_REGIONS: Region[] = [
  {
    id: 'us',
    name: 'United States',
    communities: [
      {
        name: 'New York',
        locations: [
          { id: 'loc-1', name: 'Crown Heights Banz', code: 'USNY-001', coordinator: 'Sarah Klein', phone: '+1-718-555-0143', email: 'sarah@chbanz.org', pin: '1234', status: 'Active', onboarded: 'Onboarded' },
          { id: 'loc-2', name: 'Borough Park Gemach', code: 'USNY-002', coordinator: 'Rivka Stern', phone: null, email: 'rivka@bpgmch.org', pin: '5678', status: 'Active', onboarded: 'Not onboarded' },
        ]
      },
      {
        name: 'New Jersey',
        locations: [
          { id: 'loc-3', name: 'Lakewood Earmuffs', code: 'USNJ-001', coordinator: 'Yossi Friedman', phone: '+1-732-555-0188', email: 'yossi@lwbanz.org', pin: '9012', status: 'Active', onboarded: 'Onboarded' },
          { id: 'loc-4', name: 'Toms River Banz', code: 'USNJ-002', coordinator: 'Chana Berger', phone: '+1-732-555-0211', email: null, pin: '3456', status: 'Inactive', onboarded: 'Not onboarded' },
        ]
      }
    ]
  },
  {
    id: 'il',
    name: 'Israel',
    communities: [
      {
        name: 'Jerusalem',
        locations: [
          { id: 'loc-5', name: 'Geulah Earmuffs Gemach', code: 'ILJM-001', coordinator: 'Devorah Cohen', phone: '+972-2-555-0167', email: 'devorah@geulah.co.il', pin: '1111', status: 'Active', onboarded: 'Onboarded' },
          { id: 'loc-6', name: 'Har Nof Banz', code: 'ILJM-002', coordinator: 'Esther Mor', phone: '+972-2-555-0190', email: 'esther@harnof.co.il', pin: '2222', status: 'Active', onboarded: 'Onboarded' },
        ]
      },
      {
        name: 'Bnei Brak',
        locations: [
          { id: 'loc-7', name: 'Bnei Brak Earmuffs', code: 'ILBB-001', coordinator: 'Miri Levy', phone: '+972-3-555-0145', email: 'miri@bbgmch.co.il', pin: '3333', status: 'Active', onboarded: 'Onboarded' },
          { id: 'loc-8', name: 'Ramat Gan Gemach', code: 'ILBB-002', coordinator: 'Shulamit Katz', phone: null, email: 'shulamit@rgbanz.co.il', pin: '4444', status: 'Active', onboarded: 'Not onboarded' },
        ]
      }
    ]
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    communities: [
      {
        name: 'London',
        locations: [
          { id: 'loc-9', name: 'Stamford Hill Banz', code: 'GBLN-001', coordinator: 'Yael Goldstein', phone: '+44-20-7555-0123', email: 'yael@shbanz.uk', pin: '5555', status: 'Active', onboarded: 'Onboarded' },
          { id: 'loc-10', name: 'Golders Green Gemach', code: 'GBLN-002', coordinator: 'Bracha Weiss', phone: '+44-20-7555-0156', email: 'bracha@ggbanz.uk', pin: '6666', status: 'Active', onboarded: 'Onboarded' },
          { id: 'loc-11', name: 'Hendon Earmuffs', code: 'GBLN-003', coordinator: 'Tova Roth', phone: '+44-20-7555-0177', email: null, pin: '7777', status: 'Active', onboarded: 'Not onboarded' },
        ]
      },
      {
        name: 'Manchester',
        locations: [
          { id: 'loc-12', name: 'Manchester Banz', code: 'GBMN-001', coordinator: 'Leah Davis', phone: '+44-161-555-0134', email: 'leah@mcrbanz.uk', pin: '8888', status: 'Active', onboarded: 'Onboarded' },
        ]
      }
    ]
  }
];

// --- Components ---

function MetricTile({ title, value, delta, isPositive, icon: Icon }: { title: string, value: string, delta: string, isPositive: boolean, icon: any }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start text-slate-400">
        <span className="text-sm font-medium">{title}</span>
        <Icon className="w-4 h-4 opacity-50" />
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      <div className={`text-xs flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{delta}</span>
        <span className="text-slate-500 ml-1">vs last week</span>
      </div>
    </div>
  );
}

export function OpsDashboard() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['loc-1', 'loc-3']));
  const [expandedCommunities, setExpandedCommunities] = useState<Set<string>>(new Set(['New York', 'New Jersey']));
  const [activeTab, setActiveTab] = useState('us');
  
  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };
  
  const toggleAllInCommunity = (community: Community, isSelected: boolean) => {
    const next = new Set(selectedIds);
    community.locations.forEach(l => {
      if (isSelected) next.add(l.id);
      else next.delete(l.id);
    });
    setSelectedIds(next);
  };
  
  const toggleCommunity = (name: string) => {
    const next = new Set(expandedCommunities);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpandedCommunities(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const activeRegion = MOCK_REGIONS.find(r => r.id === activeTab)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="glow-orb w-[600px] h-[600px] bg-primary/20 top-[-200px] left-[-100px]" />
      <div className="glow-orb w-[500px] h-[500px] bg-secondary/10 bottom-[-100px] right-[-100px]" />
      
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Operations</h1>
            <p className="text-slate-400 text-sm">Monitor and manage all gemach locations.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all rounded-full h-10 px-6">
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricTile title="Total Locations" value="12" delta="+1" isPositive={true} icon={MapPin} />
          <MetricTile title="Active" value="11" delta="+1" isPositive={true} icon={CheckCircle2} />
          <MetricTile title="Onboarded" value="75%" delta="+5%" isPositive={true} icon={CheckSquare} />
          <MetricTile title="Missing Contact" value="4" delta="-2" isPositive={true} icon={Phone} />
        </div>

        {/* Command Toolbar */}
        <div className="glass-panel p-2 flex flex-col md:flex-row gap-3 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search by name, code, coordinator..." 
              className="bg-slate-900/50 border-slate-700/50 pl-9 text-sm h-10 w-full focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-slate-900/50 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800">
              <Filter className="w-4 h-4 mr-2 opacity-70" />
              Status: All
            </Button>
            <Button variant="outline" className="bg-slate-900/50 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800">
              <Filter className="w-4 h-4 mr-2 opacity-70" />
              Contact: All
            </Button>
          </div>
        </div>

        {/* Bulk Action Bar (Slides in when items selected) */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden rounded-lg border border-primary/30 bg-primary/10 backdrop-blur-md ${selectedIds.size > 0 ? 'opacity-100 max-h-16 mb-6' : 'opacity-0 max-h-0'}`}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-white font-medium px-2 py-0.5 rounded-full">{selectedIds.size}</Badge>
              <span className="text-sm font-medium text-slate-200">locations selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 text-slate-300 hover:text-white">
                <MessageSquare className="w-4 h-4 mr-2" /> Message
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-slate-300 hover:text-white">
                <Send className="w-4 h-4 mr-2" /> Send Welcome
              </Button>
              <div className="w-px h-4 bg-slate-700 mx-2" />
              <Button size="sm" variant="ghost" className="h-8 text-slate-400 hover:text-white" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Region Tabs */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-slate-800 mb-6 pb-0">
              <TabsList className="bg-transparent p-0 h-auto gap-6 flex-wrap">
                {MOCK_REGIONS.map(region => {
                  const locCount = region.communities.reduce((acc, c) => acc + c.locations.length, 0);
                  const isActive = activeTab === region.id;
                  return (
                    <TabsTrigger 
                      key={region.id} 
                      value={region.id}
                      className={`
                        bg-transparent px-0 py-3 rounded-none border-b-2 font-medium text-sm transition-all
                        ${isActive ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}
                      `}
                    >
                      {region.name} <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${isActive ? 'bg-primary/20 text-primary-foreground' : 'bg-slate-800 text-slate-400'}`}>{locCount}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Content for active region */}
            <TabsContent value={activeTab} className="space-y-4 focus:outline-none">
              {activeRegion.communities.map(community => {
                const isExpanded = expandedCommunities.has(community.name);
                const allSelected = community.locations.every(l => selectedIds.has(l.id));
                const someSelected = community.locations.some(l => selectedIds.has(l.id));
                
                return (
                  <Collapsible 
                    key={community.name} 
                    open={isExpanded} 
                    onOpenChange={() => toggleCommunity(community.name)}
                    className="glass-panel overflow-hidden transition-all"
                  >
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div onClick={e => e.stopPropagation()}>
                          <Checkbox 
                            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                            onCheckedChange={(c) => toggleAllInCommunity(community, c === true)}
                            className="border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </div>
                        <CollapsibleTrigger className="flex items-center gap-2 group">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" /> : <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />}
                          <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">{community.name}</span>
                          <Badge variant="secondary" className="bg-slate-800 text-slate-400 hover:bg-slate-700 ml-2">
                            {community.locations.length}
                          </Badge>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    
                    <CollapsibleContent>
                      {/* Desktop Table */}
                      <div className="hidden lg:block w-full overflow-x-auto border-t border-slate-800/50">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-950/40 text-slate-400 text-xs uppercase border-b border-slate-800/50">
                            <tr>
                              <th className="px-4 py-3 w-12"></th>
                              <th className="px-4 py-3 font-medium">Location</th>
                              <th className="px-4 py-3 font-medium">Coordinator</th>
                              <th className="px-4 py-3 font-medium">Contact</th>
                              <th className="px-4 py-3 font-medium">PIN</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                              <th className="px-4 py-3 w-16"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/30">
                            {community.locations.map(loc => (
                              <tr key={loc.id} className={`hover:bg-slate-800/30 transition-colors ${selectedIds.has(loc.id) ? 'bg-primary/5 hover:bg-primary/10' : ''}`}>
                                <td className="px-4 py-3">
                                  <Checkbox 
                                    checked={selectedIds.has(loc.id)}
                                    onCheckedChange={() => toggleSelection(loc.id)}
                                    className="border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-200">{loc.name}</div>
                                  <div className="text-xs text-slate-500 font-mono mt-0.5">{loc.code}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-300">
                                  {loc.coordinator}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    {loc.phone ? (
                                      <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/50 px-2 py-1 rounded-md text-xs border border-slate-800/50">
                                        <Phone className="w-3 h-3 text-emerald-400" />
                                        <span>{loc.phone}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/30 px-2 py-1 rounded-md text-xs border border-rose-900/50">
                                        <Phone className="w-3 h-3" />
                                        <span>Missing</span>
                                      </div>
                                    )}
                                    
                                    {loc.email ? (
                                      <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/50 px-2 py-1 rounded-md text-xs border border-slate-800/50">
                                        <Mail className="w-3 h-3 text-emerald-400" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/30 px-2 py-1 rounded-md text-xs border border-rose-900/50">
                                        <Mail className="w-3 h-3" />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800/50 w-fit cursor-pointer hover:text-slate-200 transition-colors">
                                    <KeyRound className="w-3 h-3" />
                                    <span>••••</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-1.5 items-start">
                                    {loc.status === 'Active' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                                        Active
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                        Inactive
                                      </span>
                                    )}
                                    
                                    {loc.onboarded === 'Onboarded' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                        <Check className="w-3 h-3" /> Onboarded
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-200">
                                      <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer"><Send className="w-4 h-4 mr-2" /> Send Welcome SMS</DropdownMenuItem>
                                      <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer"><Mail className="w-4 h-4 mr-2" /> Send Restock Email</DropdownMenuItem>
                                      <div className="h-px bg-slate-800 my-1" />
                                      <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer"><Edit className="w-4 h-4 mr-2" /> Edit Details</DropdownMenuItem>
                                      <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer"><KeyRound className="w-4 h-4 mr-2" /> Change PIN</DropdownMenuItem>
                                      <div className="h-px bg-slate-800 my-1" />
                                      <DropdownMenuItem className="text-rose-400 focus:bg-rose-950/50 focus:text-rose-300 cursor-pointer"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Mobile Stacked Cards */}
                      <div className="lg:hidden flex flex-col gap-px bg-slate-800/50 border-t border-slate-800/50">
                        {community.locations.map(loc => (
                          <div key={loc.id} className={`bg-slate-900/60 p-4 flex flex-col gap-3 relative ${selectedIds.has(loc.id) ? 'bg-primary/5' : ''}`}>
                            <div className="flex gap-3">
                              <Checkbox 
                                checked={selectedIds.has(loc.id)}
                                onCheckedChange={() => toggleSelection(loc.id)}
                                className="mt-1 border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-semibold text-slate-200">{loc.name}</div>
                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{loc.code}</div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 text-slate-400">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-200">
                                      <DropdownMenuItem className="focus:bg-slate-800"><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                
                                <div className="mt-3 text-sm text-slate-300 flex items-center gap-2">
                                  <span className="font-medium">{loc.coordinator}</span>
                                </div>
                                
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {loc.phone ? (
                                    <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2 py-1 rounded-md text-xs border border-slate-800/50">
                                      <Phone className="w-3 h-3 text-emerald-400" />
                                      <span>{loc.phone}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/50 px-2 py-1 rounded-md text-xs border border-rose-900/50">
                                      <Phone className="w-3 h-3" />
                                      <span>Missing Phone</span>
                                    </div>
                                  )}
                                  
                                  {loc.email ? (
                                    <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2 py-1 rounded-md text-xs border border-slate-800/50">
                                      <Mail className="w-3 h-3 text-emerald-400" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/50 px-2 py-1 rounded-md text-xs border border-rose-900/50">
                                      <Mail className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-3 flex gap-2">
                                  {loc.status === 'Active' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                      Inactive
                                    </span>
                                  )}
                                  {loc.onboarded === 'Onboarded' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                      <Check className="w-3 h-3" /> Onboarded
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}
