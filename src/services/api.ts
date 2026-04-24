
import { Location, RouteOption, SOSAlert, CrimeData } from '../types';

const API_BASE = '/api';

export const safetyApi = {
  getCrimes: async (): Promise<CrimeData[]> => {
    const res = await fetch(`${API_BASE}/crimes`);
    if (!res.ok) throw new Error('Failed to fetch crimes');
    return res.json();
  },

  calculateRoutes: async (source: Location, destination: Location, timeOfDay: string): Promise<RouteOption[]> => {
    const res = await fetch(`${API_BASE}/calculate-routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination, timeOfDay }),
    });
    if (!res.ok) throw new Error('Failed to calculate routes');
    return res.json();
  },

  triggerSOS: async (userId: string, userName: string, location: Location): Promise<SOSAlert> => {
    const res = await fetch(`${API_BASE}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, location }),
    });
    if (!res.ok) throw new Error('Failed to trigger SOS');
    return res.json();
  },

  getActiveSOS: async (): Promise<SOSAlert[]> => {
    const res = await fetch(`${API_BASE}/sos-alerts`);
    if (!res.ok) throw new Error('Failed to fetch SOS alerts');
    return res.json();
  }
};
