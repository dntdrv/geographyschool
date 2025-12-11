export interface Country {
    name: string;
    code: string; // ISO 3166-1 alpha-3
    flag: string; // Emoji flag if needed, or we can just use name
}

// Major countries list for the dropdown
// We can expand this list later
export const COUNTRIES: Country[] = [
    { name: 'Bulgaria', code: 'BGR', flag: '🇧🇬' },
    { name: 'Turkey', code: 'TUR', flag: '🇹🇷' },
    { name: 'United States', code: 'USA', flag: '🇺🇸' },
    { name: 'United Kingdom', code: 'GBR', flag: '🇬🇧' },
    { name: 'France', code: 'FRA', flag: '🇫🇷' },
    { name: 'Germany', code: 'DEU', flag: '🇩🇪' },
    { name: 'Italy', code: 'ITA', flag: '🇮🇹' },
    { name: 'Spain', code: 'ESP', flag: '🇪🇸' },
    { name: 'Russia', code: 'RUS', flag: '🇷🇺' },
    { name: 'China', code: 'CHN', flag: '🇨🇳' },
    { name: 'Japan', code: 'JPN', flag: '🇯🇵' },
    { name: 'India', code: 'IND', flag: '🇮🇳' },
    { name: 'Brazil', code: 'BRA', flag: '🇧🇷' },
    { name: 'Canada', code: 'CAN', flag: '🇨🇦' },
    { name: 'Australia', code: 'AUS', flag: '🇦🇺' },
    { name: 'Greece', code: 'GRC', flag: '🇬🇷' },
    { name: 'Romania', code: 'ROU', flag: '🇷🇴' },
    { name: 'Serbia', code: 'SRB', flag: '🇷🇸' },
    { name: 'North Macedonia', code: 'MKD', flag: '🇲🇰' },
];
