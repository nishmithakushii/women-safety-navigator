
import Database from 'better-sqlite3';
import { CrimeData } from './src/types';

const db = new Database('safety.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS crime_data (
    id TEXT PRIMARY KEY,
    lat REAL,
    lng REAL,
    type TEXT,
    severity INTEGER,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS sos_alerts (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    lat REAL,
    lng REAL,
    timestamp TEXT,
    status TEXT
  );
`);

// Seed with some sample data if empty
const count = db.prepare('SELECT count(*) as count FROM crime_data').get() as { count: number };

if (count.count === 0) {
  const insert = db.prepare('INSERT INTO crime_data (id, lat, lng, type, severity, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
  
  // Sample data around a central point (simulate a city area)
  // Let's use 12.9716, 77.5946 (Bangalore)
  const crimes = [
    { id: '1', lat: 12.975, lng: 77.590, type: 'Theft', severity: 4, timestamp: '2026-04-20 22:00:00' },
    { id: '2', lat: 12.980, lng: 77.595, type: 'Harassment', severity: 7, timestamp: '2026-04-21 23:30:00' },
    { id: '3', lat: 12.970, lng: 77.600, type: 'Burglary', severity: 5, timestamp: '2026-04-19 02:00:00' },
    { id: '4', lat: 12.965, lng: 77.585, type: 'Snatching', severity: 6, timestamp: '2026-04-22 01:00:00' },
    { id: '5', lat: 12.985, lng: 77.610, type: 'Assault', severity: 8, timestamp: '2026-04-21 21:00:00' },
    { id: '6', lat: 12.955, lng: 77.595, type: 'Theft', severity: 3, timestamp: '2026-04-22 03:00:00' },
  ];

  for (const crime of crimes) {
    insert.run(crime.id, crime.lat, crime.lng, crime.type, crime.severity, crime.timestamp);
  }
}

export default db;
