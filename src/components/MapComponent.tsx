
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { RouteOption, CrimeData, RiskZone, SOSAlert } from '../types';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  center: [number, number];
  routes: RouteOption[];
  selectedRouteId: string | null;
  crimes: CrimeData[];
  sosAlerts: SOSAlert[];
  onRouteSelect?: (id: string) => void;
}

export default function MapComponent({ 
  center, 
  routes, 
  selectedRouteId, 
  crimes, 
  sosAlerts,
  onRouteSelect 
}: MapComponentProps) {
  
  const getRouteColor = (score: number) => {
    if (score >= 8) return '#22c55e'; // green-500
    if (score >= 6) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border shadow-inner">
      <MapContainer 
        center={center} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Crime Markers */}
        {crimes.map(crime => (
          <Circle 
            key={crime.id}
            center={[crime.lat, crime.lng]}
            radius={80}
            pathOptions={{ 
              color: '#ef4444', 
              fillColor: '#ef4444', 
              fillOpacity: 0.4,
              weight: 2,
              dashArray: '2, 4'
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-red-500 uppercase tracking-tighter">High Risk Incident</p>
                <p className="font-medium">{crime.type}</p>
                <p>Severity: {crime.severity}/10</p>
                <p className="text-muted-foreground">{new Date(crime.timestamp).toLocaleDateString()}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* SOS Alerts */}
        {sosAlerts.map(alert => (
          <Marker 
            key={alert.id}
            position={[alert.location.lat, alert.location.lng]}
            icon={new L.Icon({
               iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
               shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
               iconSize: [25, 41],
               iconAnchor: [12, 41],
               popupAnchor: [1, -34],
               shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div className="text-xs p-1">
                <p className="font-bold text-red-600">SOS ACTIVE</p>
                <p>{alert.userName}</p>
                <p className="text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Routes */}
        {routes.map(route => (
          <Polyline
            key={route.id}
            positions={route.geometry}
            pathOptions={{ 
              color: selectedRouteId === route.id ? getRouteColor(route.safetyScore) : '#94a3b8',
              weight: selectedRouteId === route.id ? 6 : 4,
              opacity: selectedRouteId === route.id ? 1 : 0.4,
              dashArray: selectedRouteId === route.id ? undefined : '5, 10'
            }}
            eventHandlers={{
              click: () => onRouteSelect?.(route.id)
            }}
          >
            <Popup>
               <div className="text-xs">
                 <p className="font-bold">{route.name}</p>
                 <p>Safety Score: <span className={route.safetyScore >= 7 ? 'text-green-600' : 'text-red-600'}>{route.safetyScore}/10</span></p>
               </div>
            </Popup>
          </Polyline>
        ))}

        {/* Risk Zones for selected route */}
        {routes.find(r => r.id === selectedRouteId)?.riskZones.map(zone => (
          <Circle
            key={zone.id}
            center={zone.center}
            radius={zone.radius}
            pathOptions={{ 
              color: '#f97316', 
              fillColor: '#ef4444', 
              fillOpacity: 0.25,
              dashArray: '5, 5'
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-orange-500 uppercase tracking-widest">Active Risk Segment</p>
                <p className="font-medium">{zone.description}</p>
                <div className="mt-2 flex items-center gap-1.5 p-1.5 bg-orange-500/10 rounded border border-orange-500/20">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-[9px] text-orange-400 font-bold uppercase">Caution Advised</span>
                </div>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
}
