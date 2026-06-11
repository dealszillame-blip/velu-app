export const SW_SYDNEY_CENTER: [number, number] = [150.8139, -34.0669];
export const DEFAULT_ZOOM = 11;

export const SW_SYDNEY_BOUNDS: [[number, number], [number, number]] = [
  [150.4, -34.45],
  [151.1, -33.65],
];

export const SW_SYDNEY_SUBURBS = [
  "Campbelltown",
  "Ingleburn",
  "Liverpool",
  "Camden",
  "Leumeah",
  "Minto",
  "Gregory Hills",
  "Oran Park",
  "Narellan",
] as const;

export const ZONING_OPTIONS = ["R2", "R3", "R4", "R5", "RU4", "RU5"] as const;

/** Free vector style — no API key required (OpenFreeMap) */
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
