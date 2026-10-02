const { getDatabaseConnection, initializeDatabaseConnections } = require('../server/config/turso');

// Base coordinates for Kolkata
const BASE_LAT = 22.5726;
const BASE_LON = 88.3639;

// Approximate mapping for major areas (can add more if needed)
const AREA_MAP = {
  'Kolkata GPO': { lat: 22.5736, lon: 88.3486 },
  'Dumdum': { lat: 22.6224, lon: 88.4239 },
  'Park Street': { lat: 22.5539, lon: 88.3524 },
  'Shyambazar': { lat: 22.6022, lon: 88.3732 },
  'Bhawanipur': { lat: 22.5348, lon: 88.3481 }
};

function generateApproximateCoordinates(area) {
  // Check if we have a hardcoded match
  for (const [key, coords] of Object.entries(AREA_MAP)) {
    if (area.includes(key)) {
      return coords;
    }
  }

  // Otherwise generate a random coordinate within a ~10km radius of Kolkata center
  // 1 degree lat is ~111km, so 0.1 degree is ~11km
  const latOffset = (Math.random() - 0.5) * 0.15;
  const lonOffset = (Math.random() - 0.5) * 0.15;

  return {
    lat: +(BASE_LAT + latOffset).toFixed(6),
    lon: +(BASE_LON + lonOffset).toFixed(6)
  };
}

async function run() {
  let db;

  try {
    console.log('Initializing database connections...');
    await initializeDatabaseConnections();

    console.log('Connecting to Turso database for available pincodes...');
    db = await getDatabaseConnection('availablePincodes');
    
    // Get all pincodes that don't have coordinates
    const result = await db.execute({
      sql: 'SELECT pincode, area FROM available_pincodes WHERE latitude IS NULL OR longitude IS NULL',
      args: []
    });

    const locations = result.rows;
    console.log(`Found ${locations.length} locations needing coordinates.`);

    let updatedCount = 0;

    for (const loc of locations) {
      const coords = generateApproximateCoordinates(loc.area);
      
      await db.execute({
        sql: 'UPDATE available_pincodes SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP WHERE pincode = ?',
        args: [coords.lat, coords.lon, loc.pincode]
      });
      
      updatedCount++;
    }

    console.log(`\nFinished! Successfully updated ${updatedCount}/${locations.length} locations with local Kolkata coordinates.`);

  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

run();
