/**
 * Generate bounding boxes for all processed countries
 * Used for dynamic data loading when map is focused on a country
 */

const fs = require('fs');
const path = require('path');

const VILLAGES_DIR = path.join(__dirname, '..', 'public', 'data', 'villages');
const OUTPUT_FILE = path.join(VILLAGES_DIR, '_bboxes.json');

async function main() {
    console.log('Generating country bounding boxes...');

    const files = fs.readdirSync(VILLAGES_DIR).filter(f => f.endsWith('.json') && f.length === 7); // e.g. "bg.json"
    const bboxes = {};

    for (const file of files) {
        const countryCode = file.replace('.json', '').toUpperCase();
        const content = JSON.parse(fs.readFileSync(path.join(VILLAGES_DIR, file), 'utf8'));

        if (content.length === 0) continue;

        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

        content.forEach(place => {
            if (place.lat < minLat) minLat = place.lat;
            if (place.lat > maxLat) maxLat = place.lat;
            if (place.lng < minLng) minLng = place.lng;
            if (place.lng > maxLng) maxLng = place.lng;
        });

        // Add padding
        minLat -= 0.1; maxLat += 0.1;
        minLng -= 0.1; maxLng += 0.1;

        bboxes[countryCode] = [minLat, minLng, maxLat, maxLng];
        console.log(`  ${countryCode}: [${minLat.toFixed(2)}, ${minLng.toFixed(2)}, ${maxLat.toFixed(2)}, ${maxLng.toFixed(2)}]`);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bboxes));
    console.log(`\n✅ Saved bounding boxes for ${Object.keys(bboxes).length} countries to _bboxes.json`);
}

main();
