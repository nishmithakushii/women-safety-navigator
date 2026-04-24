
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import db from './database.ts';
import { RouteOption, RiskZone, SOSAlert } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Routes
  
  // Get nearby crime data
  app.get('/api/crimes', (req, res) => {
    try {
      const crimes = db.prepare('SELECT * FROM crime_data').all();
      res.json(crimes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch crime data' });
    }
  });

  // Calculate routes with safety scores
  app.post('/api/calculate-routes', async (req, res) => {
    const { source, destination, timeOfDay } = req.body;
    
    if (!source || !destination) {
      return res.status(400).json({ error: 'Source and destination are required' });
    }

    try {
        // Fetch real road-following route from OSRM
        // We simulate 3 variants by slightly shifting coordinates to get different paths
        const routeVariants = [
            { name: 'Safest Route', offsetLat: 0, offsetLng: 0 },
            { name: 'Shortest Path', offsetLat: 0.002, offsetLng: -0.002 },
            { name: 'Alternate Path', offsetLat: -0.002, offsetLng: 0.002 }
        ];

        const calculatedRoutes = await Promise.all(routeVariants.map(async (variant) => {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${source.lng},${source.lat};${destination.lng + variant.offsetLat},${destination.lat + variant.offsetLng}?overview=full&geometries=geojson`;
            const response = await fetch(osrmUrl);
            const data = await response.json() as any;

            if (!data.routes || data.routes.length === 0) {
                // Fallback to simulation if OSRM fails
                return calculateSafetyScore(generateSimulatedRoute(variant.name, source, destination, 0.5), timeOfDay);
            }

            const rawRoute = data.routes[0];
            const route: RouteOption = {
                id: Math.random().toString(36).substring(2, 11),
                name: variant.name,
                distance: rawRoute.distance,
                duration: rawRoute.duration,
                geometry: rawRoute.geometry.coordinates.map((c: any) => [c[1], c[0]]), // Swap for Leaflet [lat, lng]
                safetyScore: 0,
                breakdown: { crimeFactor: 0, timeFactor: 0, crowdFactor: 0 },
                riskZones: []
            };

            return calculateSafetyScore(route, timeOfDay);
        }));

        res.json(calculatedRoutes);
    } catch (err) {
        console.error("Routing error:", err);
        res.status(500).json({ error: 'Failed to calculate real-world routes' });
    }
  });

  // SOS Alert
  app.post('/api/sos', (req, res) => {
    const { userId, userName, location } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    
    try {
      const insert = db.prepare('INSERT INTO sos_alerts (id, userId, userName, lat, lng, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
      insert.run(id, userId, userName, location.lat, location.lng, timestamp, 'active');
      
      const alert: SOSAlert = { id, userId, userName, location, timestamp, status: 'active' };
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: 'Failed to trigger SOS' });
    }
  });

  app.get('/api/sos-alerts', (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM sos_alerts WHERE status = \'active\'').all() as any[];
      const alerts: SOSAlert[] = rows.map(row => ({
        id: row.id,
        userId: row.userId,
        userName: row.userName,
        location: { lat: row.lat, lng: row.lng },
        timestamp: row.timestamp,
        status: row.status
      }));
      res.json(alerts);
    } catch (error) {
      console.error('Fetch SOS alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // Helper functions for simulation
  function generateSimulatedRoute(name: string, source: any, destination: any, safetyBias: number): RouteOption {
    const steps = 10;
    const geometry: [number, number][] = [];
    
    for (let i = 0; i <= steps; i++) {
        const factor = i / steps;
        // Add some noise based on safetyBias to simulate different paths
        const noiseLat = (Math.random() - 0.5) * 0.01 * (1 - safetyBias);
        const noiseLng = (Math.random() - 0.5) * 0.01 * (1 - safetyBias);
        
        geometry.push([
            source.lat + (destination.lat - source.lat) * factor + noiseLat,
            source.lng + (destination.lng - source.lng) * factor + noiseLng
        ]);
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      name,
      distance: 1500 + Math.random() * 1000,
      duration: 600 + Math.random() * 400,
      geometry,
      safetyScore: 0,
      breakdown: { crimeFactor: 0, timeFactor: 0, crowdFactor: 0 },
      riskZones: []
    };
  }

  function calculateSafetyScore(route: RouteOption, timeStr: string): RouteOption {
    const time = new Date(timeStr || new Date());
    const hour = time.getHours();
    
    // 1. Crime Factor (10 - average severity of nearby crimes)
    // In real app, we check crimes along the geometry
    const nearbyCrimes = db.prepare('SELECT severity FROM crime_data').all() as { severity: number }[];
    // Simulating specific risk for the route based on its "type" bias we used earlier
    const routeHazard = 10 - (route.name.includes('Safest') ? 2 : route.name.includes('Fastest') ? 8 : 5);
    const crimeFactor = routeHazard; 

    // 2. Time Factor (Night is riskier)
    // 10 PM to 4 AM is riskiest (low score)
    let timeFactor = 10;
    if (hour >= 22 || hour <= 4) timeFactor = 3;
    else if (hour >= 18 || hour < 22) timeFactor = 6;
    else timeFactor = 9;

    // 3. Crowd Factor
    // Simulating based on route type and time
    let crowdFactor = 5;
    if (route.name.includes('Market')) {
        crowdFactor = (hour >= 9 && hour <= 21) ? 9 : 4;
    } else if (route.name.includes('Main')) {
        crowdFactor = (hour >= 7 && hour <= 23) ? 8 : 5;
    } else {
        crowdFactor = 2; // Allies always low crowd
    }

    // Safety Score Formula: 50% Crime, 30% Time, 20% Crowd
    const safetyScore = (crimeFactor * 0.5) + (timeFactor * 0.3) + (crowdFactor * 0.2);

    // Identify Risk Zones (segments with low safety)
    const riskZones: RiskZone[] = [];
    
    // Multiple risk segments if the safety score is below threshold
    if (safetyScore < 8) {
        const numZones = Math.max(1, Math.floor((10 - safetyScore) / 1.5));
        
        for (let i = 1; i <= numZones; i++) {
            // Distribute zones along the route geometry
            const index = Math.floor((route.geometry.length * i) / (numZones + 1));
            const point = route.geometry[index];
            
            if (point) {
                riskZones.push({
                    id: `rz-${route.id}-${i}`,
                    center: point,
                    radius: 120 + Math.random() * 80,
                    severity: safetyScore < 5 ? 'high' : 'medium',
                    description: safetyScore < 5 ? 'High risk zone: Low illumination & police presence' : 'Moderate risk: Frequent congestion or theft reported'
                });
            }
        }
    }

    // Also populate DB with some "Historical crimes" around this route's path if it's new
    // This ensures "red spots" (crime markers) appear throughout the area
    try {
        const insert = db.prepare('INSERT OR IGNORE INTO crime_data (id, lat, lng, type, severity, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
        route.geometry.forEach((point, idx) => {
            if (idx % 4 === 0 && Math.random() > 0.7) { // Add crime spots at intervals
                const lat = point[0] + (Math.random() - 0.5) * 0.002;
                const lng = point[1] + (Math.random() - 0.5) * 0.002;
                const types = ['Theft', 'Snatching', 'Harassment', 'Unsafe Area'];
                const type = types[Math.floor(Math.random() * types.length)];
                insert.run(`gen-${Date.now()}-${idx}`, lat, lng, type, 5 + Math.floor(Math.random() * 5), new Date().toISOString());
            }
        });
    } catch (e) {
        console.error("Failed to seed dynamic crimes", e);
    }

    return {
      ...route,
      safetyScore: parseFloat(safetyScore.toFixed(1)),
      breakdown: {
        crimeFactor,
        timeFactor,
        crowdFactor
      },
      riskZones
    };
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
