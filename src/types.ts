
export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteOption {
  id: string;
  name: string;
  distance: number; // in meters
  duration: number; // in seconds
  geometry: [number, number][]; // lat, lng pairs
  safetyScore: number; // 0 to 10
  breakdown: {
    crimeFactor: number;
    timeFactor: number;
    crowdFactor: number;
  };
  riskZones: RiskZone[];
}

export interface RiskZone {
  id: string;
  center: [number, number];
  radius: number; // in meters
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  location: Location;
  timestamp: string;
  status: 'active' | 'resolved';
}

export interface CrimeData {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity: number; // 1 to 10
  timestamp: string;
}
