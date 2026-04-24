import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { safetyApi } from '../services/api';
import { Location } from '../types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AlertCircle, MapPin, Share2, Phone } from 'lucide-react';

interface SOSModuleProps {
  currentLocation: Location;
}

export default function SOSModule({ currentLocation }: SOSModuleProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isActivating && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isActivating && countdown === 0) {
      handleSOS();
    }
    return () => clearInterval(timer);
  }, [isActivating, countdown]);

  const handleSOS = async () => {
    setIsActivating(false);
    setIsActive(true);
    try {
      await safetyApi.triggerSOS('user-1', 'Nishmitha', currentLocation);
      toast.error("SOS ALERT SENT!", {
        description: "Emergency contacts and local authorities notified.",
        duration: 10000,
      });
    } catch (err) {
      toast.error("Failed to send SOS. Check connection.");
    }
  };

  const cancelSOS = () => {
    setIsActivating(false);
    setCountdown(5);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {isActivating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4"
          >
            <div className="max-w-md w-full rounded-2xl bg-slate-900 border-2 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden">
              <div className="bg-red-500 h-1.5 w-full animate-pulse" />
              <div className="p-8 text-center">
                <h2 className="text-3xl font-black text-red-500 uppercase tracking-tighter mb-2">
                  Activating SOS
                </h2>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-8">
                  Emergency contacts notified in {countdown}
                </p>
                <div className="text-9xl font-black text-white tabular-nums mb-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  {countdown}
                </div>
                <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all font-mono"
                    onClick={cancelSOS}
                >
                  Cancel Monitoring
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "rounded-2xl backdrop-blur-xl border flex flex-col overflow-hidden transition-all duration-500",
        isActive 
            ? "bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]" 
            : "bg-white/5 border-white/10"
      )}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className={cn("w-3 h-3", isActive ? "text-red-500" : "text-slate-500")} />
                Emergency Base
            </h3>
            {isActive && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
        </div>
        
        <div className="p-5 space-y-4">
          <Button 
            id="sos-trigger-button"
            className={cn(
                "w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                isActive 
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 font-bold" 
                    : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)] font-bold"
            )}
            onClick={() => setIsActivating(true)}
            disabled={isActive}
          >
            {isActive ? "SOS BROADCASTING" : "Trigger SOS"}
          </Button>

          <div className="grid grid-cols-2 gap-2">
             <Button 
                variant="outline" 
                className="text-[9px] h-9 gap-2 rounded-lg border-white/10 text-slate-400 hover:bg-white/5" 
                onClick={() => toast.success("Location shared")}
             >
               <Share2 className="w-3 h-3" /> Share Path
             </Button>
             <Button 
                variant="outline" 
                className="text-[9px] h-9 gap-2 rounded-lg border-white/10 text-slate-400 hover:bg-white/5" 
                onClick={() => (window.location.href = "tel:100")}
             >
               <Phone className="w-3 h-3" /> Call Police
             </Button>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <MapPin className="w-3 h-3 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">Active Transponder</p>
              <p className="text-[10px] font-mono text-slate-500">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </p>
            </div>
          </div>
          
          {isActive && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center gap-2 p-3 bg-red-500/20 text-red-300 rounded-xl text-[10px] font-bold justify-center border border-red-500/30"
            >
              <AlertCircle className="w-3 h-3 animate-pulse" />
              EMERGENCY BROADCAST ACTIVE
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
