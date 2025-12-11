/**
 * Download and process ALL countries' full GeoNames data
 * Includes alternate names for multi-language search
 * 
 * Run with: node scripts/processAllCountries.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'villages');
const TEMP_DIR = path.join(__dirname, '..', 'temp', 'countries');

// Priority countries to process (can add more later)
const COUNTRIES = [
    'BG', 'IT', 'DE', 'FR', 'GB', 'ES', 'GR', 'RO', 'RS', 'MK', 'TR',
    'AT', 'CH', 'NL', 'BE', 'PL', 'CZ', 'SK', 'HU', 'HR', 'SI', 'AL',
    'PT', 'IE', 'DK', 'SE', 'NO', 'FI', 'RU', 'UA', 'BY', 'MD',
    'US', 'CA', 'MX', 'BR', 'AR', 'AU', 'NZ', 'JP', 'KR', 'CN', 'IN'
];

const COLS = {
    geonameid: 0,
    name: 1,
    asciiname: 2,
    alternatenames: 3,
    latitude: 4,
    longitude: 5,
    featureClass: 6,
    featureCode: 7,
    countryCode: 8,
    population: 14,
};

async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, (res) => {
                    res.pipe(file);
                    file.on('finish', () => { file.close(); resolve(); });
                }).on('error', reject);
            } else if (response.statusCode === 404) {
                file.close();
                fs.unlinkSync(destPath);
                reject(new Error('File not found'));
            } else {
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            }
        }).on('error', reject);
    });
}

async function extractZip(zipPath, destDir) {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(destDir, true);
}

function parseGeoNamesLine(line) {
    const fields = line.split('\t');
    if (fields.length < 18) return null;

    const featureClass = fields[COLS.featureClass];
    if (featureClass !== 'P' && featureClass !== 'A') return null;

    const lat = parseFloat(fields[COLS.latitude]);
    const lng = parseFloat(fields[COLS.longitude]);
    if (isNaN(lat) || isNaN(lng)) return null;

    const pop = parseInt(fields[COLS.population]) || 0;
    const name = fields[COLS.name];
    const asciiname = fields[COLS.asciiname];
    const alternatenames = fields[COLS.alternatenames];

    // Extract useful alternate names (limit to avoid bloat)
    let altNames = [];
    if (alternatenames) {
        altNames = alternatenames.split(',')
            .filter(n => n && n !== name && n !== asciiname)
            .slice(0, 5);  // Max 5 alternate names
    }

    const entry = {
        id: fields[COLS.geonameid],
        n: name,
        lat: Math.round(lat * 100000) / 100000,
        lng: Math.round(lng * 100000) / 100000,
        p: pop,
    };

    // Only add optional fields if they have value
    if (asciiname && asciiname !== name) entry.a = asciiname;
    if (altNames.length > 0) entry.alt = altNames;

    return entry;
}

async function processCountry(countryCode) {
    const zipPath = path.join(TEMP_DIR, `${countryCode}.zip`);
    const txtPath = path.join(TEMP_DIR, `${countryCode}.txt`);
    const url = `https://download.geonames.org/export/dump/${countryCode}.zip`;

    // Download if needed
    if (!fs.existsSync(txtPath)) {
        if (!fs.existsSync(zipPath)) {
            console.log(`  Downloading ${countryCode}...`);
            try {
                await downloadFile(url, zipPath);
            } catch (e) {
                console.log(`  ⚠ Could not download ${countryCode}: ${e.message}`);
                return null;
            }
        }
        await extractZip(zipPath, TEMP_DIR);
    }

    // Process file
    const entries = [];
    const fileStream = fs.createReadStream(txtPath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        const entry = parseGeoNamesLine(line);
        if (entry) entries.push(entry);
    }

    // Sort by population
    entries.sort((a, b) => b.p - a.p);

    return entries;
}

async function main() {
    console.log('Processing all countries for village data...\n');

    fs.mkdirSync(TEMP_DIR, { recursive: true });
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const index = { countries: [], totalEntries: 0 };

    for (const cc of COUNTRIES) {
        process.stdout.write(`Processing ${cc}... `);

        const entries = await processCountry(cc);
        if (!entries) continue;

        // Write country file
        const outputPath = path.join(OUTPUT_DIR, `${cc.toLowerCase()}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(entries));

        const sizeKB = Math.round(fs.statSync(outputPath).size / 1024);
        console.log(`${entries.length} places (${sizeKB} KB)`);

        index.countries.push({
            code: cc,
            count: entries.length,
            sizeKB
        });
        index.totalEntries += entries.length;
    }

    // Write index
    const indexPath = path.join(OUTPUT_DIR, '_index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

    console.log(`\n✅ Processed ${index.countries.length} countries`);
    console.log(`   Total: ${index.totalEntries} places`);
    console.log(`   Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
