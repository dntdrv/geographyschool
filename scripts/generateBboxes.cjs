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

    const indexPath = path.join(VILLAGES_DIR, '_index.json');
    if (!fs.existsSync(indexPath)) {
        console.error('Error: _index.json not found. Run processAllCountries.cjs first.');
        process.exit(1);
    }

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const bboxes = {};

    console.log(`Found ${index.countries.length} countries in index.`);

    for (const country of index.countries) {
        const { code, chunks } = country;
        const countryCode = code.toUpperCase();

        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        let hasData = false;

        // Helper to process a file
        const processFile = (filename) => {
            const filePath = path.join(VILLAGES_DIR, filename);
            if (!fs.existsSync(filePath)) {
                console.warn(`  ⚠ Missing file: ${filename}`);
                return;
            }
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (content.length > 0) hasData = true;

            content.forEach(place => {
                if (place.lat < minLat) minLat = place.lat;
                if (place.lat > maxLat) maxLat = place.lat;
                if (place.lng < minLng) minLng = place.lng;
                if (place.lng > maxLng) maxLng = place.lng;
            });
        };

        if (chunks && chunks > 1) {
            for (let i = 1; i <= chunks; i++) {
                processFile(`${code.toLowerCase()}-${i}.json`);
            }
        } else {
            processFile(`${code.toLowerCase()}.json`);
        }

        if (hasData) {
            // Add padding
            minLat -= 0.1; maxLat += 0.1;
            minLng -= 0.1; maxLng += 0.1;

            // Store [minLat, minLng, maxLat, maxLng, chunks]
            // If chunks is 1 or undefined, we can optionally omit it, but for consistency let's include if > 1
            const entry = [
                Math.round(minLat * 1000) / 1000,
                Math.round(minLng * 1000) / 1000,
                Math.round(maxLat * 1000) / 1000,
                Math.round(maxLng * 1000) / 1000
            ];

            if (chunks && chunks > 1) {
                entry.push(chunks);
            }

            bboxes[countryCode] = entry;
            console.log(`  ${countryCode}: [${entry.join(', ')}]`);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bboxes));
    console.log(`\n✅ Saved bounding boxes for ${Object.keys(bboxes).length} countries to _bboxes.json`);
}

main();
