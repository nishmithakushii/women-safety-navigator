
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'motion/react';
import { RouteOption } from '../types';
import { Shield, Clock, Users, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteSelectorProps {
  routes: RouteOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function RouteSelector({ routes, selectedId, onSelect }: RouteSelectorProps) {
  const getScoreColor = (score: number, isSelected: boolean) => {
    if (score >= 8) return isSelected ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' : 'text-emerald-500/80 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 6) return isSelected ? 'text-amber-400 bg-amber-500/20 border-amber-500/40' : 'text-amber-400/80 bg-amber-500/10 border-amber-500/20';
    return isSelected ? 'text-red-400 bg-red-500/20 border-red-500/40' : 'text-red-400/80 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="space-y-3">
      {routes.length === 0 && (
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 border-dashed text-center flex flex-col items-center justify-center">
           <Info className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
           <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
             Awaiting Destination Input<br/>To Calculate Safe Paths
           </p>
        </div>
      )}
      {routes.map((route, idx) => {
        const isSelected = selectedId === route.id;
        const isSafest = idx === 0;
        
        return (
          <div 
            key={route.id} 
            className={cn(
              "group p-4 rounded-xl transition-all cursor-pointer border backdrop-blur-sm",
              isSelected 
                ? "bg-white/10 border-white/30 shadow-xl" 
                : "bg-white/5 border-white/5 hover:border-white/20"
            )}
            onClick={() => onSelect(route.id)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                 {isSafest ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[9px] font-bold uppercase py-0 px-2 rounded-full">
                       Safest Route
                    </Badge>
                 ) : (
                    <Badge variant="outline" className="text-slate-400 border-white/10 text-[9px] font-bold uppercase py-0 px-2 rounded-full">
                       Alternate
                    </Badge>
                 )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {Math.floor(route.duration / 60)}m • {(route.distance / 1000).toFixed(1)}km
              </span>
            </div>

            <div className={cn(
                "text-sm font-semibold mb-3 transition-colors",
                isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-200"
            )}>
                {route.name}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${route.safetyScore * 10}%` }}
                   className={cn(
                     "h-full rounded-full transition-all duration-500",
                     route.safetyScore >= 8 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                     route.safetyScore >= 6 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : 
                     "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                   )}
                />
              </div>
              <div className={cn(
                "text-[10px] font-mono font-bold w-12 text-right",
                route.safetyScore >= 8 ? "text-emerald-400" : 
                route.safetyScore >= 6 ? "text-amber-400" : 
                "text-red-400"
              )}>
                {route.safetyScore.toFixed(1)} <span className="opacity-40 text-[8px]">SCR</span>
              </div>
            </div>
            
            {route.riskZones.length > 0 && isSelected && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/30 flex items-start gap-2"
              >
                <Info className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                <p className="text-[9px] text-red-300 leading-tight italic">
                  {route.riskZones[0].description}
                </p>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
