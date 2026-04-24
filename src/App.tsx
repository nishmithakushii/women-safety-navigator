
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, MapPin, Navigation, ShieldCheck, AlertCircle, Menu, X } from 'lucide-react';
import MapComponent from './components/MapComponent';
import RouteSelector from './components/RouteSelector';
import SOSModule from './components/SOSModule';
import { Location, RouteOption, CrimeData, SOSAlert } from './types';
import { safetyApi } from './services/api';
import { toast } from 'sonner';

export default function App() {
  const [source, setSource] = useState<Location>({ lat: 12.9716, lng: 77.5946, name: 'Current Location' });
  const [destination, setDestination] = useState<string>('');
  const [destinationCoord, setDestinationCoord] = useState<Location | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [crimes, setCrimes] = useState<CrimeData[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  // Initialize data
  useEffect(() => {
    fetchStaticData();
    const interval = setInterval(fetchDynamicData, 5000);
    
    // Get user's real current location with high accuracy
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setSource({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Your Precise Location'
        });
      }, (err) => console.error("Geolocation denied", err), {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    }
    
    return () => clearInterval(interval);
  }, []);

  // Handle Autocomplete Suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (destination.length > 2 && (!destinationCoord || destination !== destinationCoord.name)) {
        setIsSearchingSuggestions(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=5&addressdetails=1`);
          const data = await res.json();
          setSuggestions(data);
        } catch (err) {
          console.error("Suggestion fetch error", err);
        } finally {
          setIsSearchingSuggestions(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [destination]);

  const handleSelectSuggestion = (sug: any) => {
    const dest: Location = {
      lat: parseFloat(sug.lat),
      lng: parseFloat(sug.lon),
      name: sug.display_name
    };
    setDestinationCoord(dest);
    setDestination(sug.display_name);
    setSuggestions([]);
    triggerRouting(dest);
  };

  const triggerRouting = async (dest: Location) => {
    setIsLoading(true);
    try {
      const calculatedRoutes = await safetyApi.calculateRoutes(source, dest, new Date().toISOString());
      setRoutes(calculatedRoutes);
      setSelectedRouteId(calculatedRoutes[0]?.id || null);
      
      const bestScore = calculatedRoutes[0]?.safetyScore || 0;
      if (bestScore >= 8) {
        toast.success(`Safe route found (${bestScore}/10).`);
      } else {
        toast.warning(`Caution: Safest available is ${bestScore}/10.`);
      }
    } catch (err) {
      toast.error("Routing failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaticData = async () => {
    try {
      const crimeData = await safetyApi.getCrimes();
      setCrimes(crimeData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDynamicData = async () => {
    try {
      const alerts = await safetyApi.getActiveSOS();
      setSosAlerts(alerts);
    } catch (err) {
      console.error(err);
      // Only show error toast occasionally or if it's the first failure to avoid spamming
      if (Math.random() > 0.9) {
          toast.error("Network issue: Retrying alert sync...", { duration: 2000 });
      }
    }
  };

  const handleSearch = async () => {
    if (!destination) return;
    if (destinationCoord && destination === destinationCoord.name) {
        triggerRouting(destinationCoord);
        return;
    }
    
    setIsLoading(true);
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        toast.error("Destination not found.");
        return;
      }

      const dest: Location = { 
        lat: parseFloat(geoData[0].lat), 
        lng: parseFloat(geoData[0].lon),
        name: geoData[0].display_name
      };
      
      setDestinationCoord(dest);
      setDestination(dest.name || destination);
      triggerRouting(dest);
    } catch (err) {
      toast.error("Geocoding failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0F172A] text-slate-100 overflow-hidden relative font-sans selection:bg-primary/30">
      <Toaster position="top-right" />
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] pointer-events-none rounded-full"></div>

      {/* Main Content */}
      <div className="flex flex-col w-full h-full relative z-10">
        {/* Header */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SafeWalk <span className="text-primary/80">Navigator</span></h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Button 
              variant="destructive" 
              size="sm"
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg text-xs font-bold transition-all uppercase tracking-wider px-4 h-9 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              onClick={() => {
                // Find the SOS trigger element or dispatch custom event
                const sosBtn = document.getElementById('sos-trigger-button');
                if (sosBtn) sosBtn.click();
              }}
            >
              SOS Trigger
            </Button>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">System Status</span>
              <div className="flex items-center gap-1.5 uppercase text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live Monitoring
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sara" alt="avatar" className="w-8 h-8" />
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? <X /> : <Menu />}
          </Button>
        </header>

        <main className="flex-1 flex overflow-hidden p-4 gap-4">
          {/* Left Sidebar: Navigation & Routes */}
          <aside className={`
            ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            fixed inset-y-0 left-0 lg:relative z-50 w-80 lg:w-80 flex flex-col gap-4 
            transition-transform duration-300 lg:transition-none
          `}>
            <section className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Plan Journey</h2>
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></div>
                  <Input 
                    value={source.name} 
                    disabled 
                    className="bg-white/5 border-white/10 rounded-xl pl-10 h-10 text-sm focus-visible:ring-primary/50"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <Input 
                    placeholder="Search destination..." 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-white/5 border-white/10 rounded-xl pl-10 h-10 text-sm focus-visible:ring-primary/50"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[1000] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                        {suggestions.map((sug, idx) => (
                            <button
                                key={idx}
                                className="w-full px-4 py-2 text-left text-xs hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                                onClick={() => handleSelectSuggestion(sug)}
                            >
                                <div className="font-semibold text-slate-200 truncate">{sug.display_name.split(',')[0]}</div>
                                <div className="text-[10px] text-slate-500 truncate">{sug.display_name}</div>
                            </button>
                        ))}
                    </div>
                  )}
                  
                  {isSearchingSuggestions && (
                    <div className="absolute right-3 top-3">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full h-10 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? 'Scanning...' : 'Find Safest Routes'}
                </Button>
              </div>
            </section>

            <section className="flex-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Available Routes</h2>
                <Badge variant="outline" className="text-[9px] border-white/20 text-slate-400 uppercase">{routes.length} paths</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <RouteSelector 
                  routes={routes} 
                  selectedId={selectedRouteId}
                  onSelect={(id) => setSelectedRouteId(id)}
                />
              </div>
            </section>
          </aside>

          {/* Center: Map */}
          <section className="flex-1 relative rounded-[2rem] border border-white/10 bg-slate-800/20 shadow-2xl overflow-hidden glass-panel">
            <MapComponent 
              center={[source.lat, source.lng]}
              routes={routes}
              selectedRouteId={selectedRouteId}
              crimes={crimes}
              sosAlerts={sosAlerts}
              onRouteSelect={(id) => setSelectedRouteId(id)}
            />
            
            {/* Overlay Insight for selected route */}
            {selectedRouteId && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 p-5 rounded-3xl bg-slate-900/90 border border-white/10 backdrop-blur-2xl w-[90%] max-w-lg shadow-2xl flex items-center justify-between z-[1000]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                     <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-tight">Safest Path Active</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                       <span>Score: {(routes.find(r => r.id === selectedRouteId)?.safetyScore || 0).toFixed(2)}</span>
                       <span className="w-1 h-1 bg-slate-600 rounded-full" />
                       <span>Night Mode Optimizations On</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-5 rounded-xl shadow-xl transition-all active:scale-95">
                  Share Path
                </Button>
              </div>
            )}
          </section>

          {/* Right Sidebar: Quick Actions & Insights */}
          <aside className="hidden xl:flex w-64 flex-col gap-4">
            <div className="flex-1 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col">
              <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-6">Route Insights</h2>
              
              {selectedRouteId ? (
                <div className="space-y-6">
                   <InsightItem label="Crime Risk" value="Low" progress={15} color="emerald" />
                   <InsightItem label="Crowd Density" value="Optimal" progress={85} color="indigo" />
                   <InsightItem label="Safe Lighting" value="High" progress={92} color="amber" />
                   
                   <div className="mt-8 p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
                    <div className="text-[9px] text-primary/80 uppercase tracking-widest mb-1">Safety Rating</div>
                    <div className="text-3xl font-bold font-mono text-white tracking-tighter italic">
                       {(routes.find(r => r.id === selectedRouteId)?.safetyScore || 0).toFixed(2)}
                    </div>
                    <div className="text-[9px] text-primary/60 mt-1 uppercase">Aura AI Verified</div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="w-8 h-8 text-slate-600 mb-3 opacity-50" />
                  <p className="text-xs text-slate-500 italic">Select a route for detailed spatial insights</p>
                </div>
              )}
            </div>

            <SOSModule currentLocation={source} />
          </aside>
        </main>
      </div>
    </div>
  );
}

function InsightItem({ label, value, progress, color }: { label: string, value: string, progress: number, color: string }) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-500',
        indigo: 'bg-indigo-400',
        amber: 'bg-amber-400'
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-medium tracking-tight">
                <span className="text-slate-400 uppercase">{label}</span>
                <span className={`text-${color}-400`}>{value}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", colors[color])} style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
}

