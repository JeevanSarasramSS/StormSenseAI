// =====================================================================
// StormSense AI — simulated runoff model
// Baseline: R = C x I
//   R = estimated runoff intensity (mm/h)
//   C = composite runoff coefficient (share of rain that runs off)
//   I = rainfall intensity (mm/h)
// At 40% soil moisture the composite coefficients equal the project's assumed
// values: 0.35 (existing), 0.75 (proposed), 0.55 (proposed + all mitigation).
// All values are illustrative assumptions, not measurements.
// =====================================================================

export const AREA_HA = 250; // assumed study area
const AREA_M2 = AREA_HA * 10000;
export const POOL_M3 = 2500; // Olympic swimming pool

export const SCENARIOS = {
  existing: { key: 'existing', label: 'Today', long: 'Existing land cover', base: 0.35, color: '#34d399', icon: '🌳' },
  proposed: { key: 'proposed', label: 'Smart City', long: 'Proposed development', base: 0.75, color: '#f87171', icon: '🏙️' },
};
export const MITIGATED_COLOR = '#38bdf8';

export const MEASURES = [
  { key: 'pave', label: 'Permeable Pavements', icon: '🧱', cut: 0.08, d: 'Paved surfaces that allow water to infiltrate', where: 'Parking lots, footpaths, walkways' },
  { key: 'garden', label: 'Rain Gardens', icon: '🌿', cut: 0.05, d: 'Planted depressions that capture and absorb runoff', where: 'Beside roads, roofs and car parks' },
  { key: 'green', label: 'Additional Green Spaces', icon: '🌳', cut: 0.07, d: 'More permeable land cover in the layout', where: 'Parks, lawns, road medians' },
];
export const FULL_CUT = 0.2; // all three measures: 0.75 -> 0.55

export const RAIN_PRESETS = [
  { label: 'Light', v: 10, icon: '🌦️' },
  { label: 'Moderate', v: 25, icon: '🌧️' },
  { label: 'Heavy', v: 50, icon: '⛈️' },
  { label: 'Extreme', v: 90, icon: '🌀' },
];
export const SOIL_PRESETS = [
  { label: 'Dry spell', v: 0.15, d: 'No rain for weeks' },
  { label: 'Normal', v: 0.4, d: 'Typical conditions' },
  { label: 'Already wet', v: 0.75, d: 'Rained the last 3 days' },
];
export const DURATIONS = [0.5, 1, 2, 3];

export const PPT_DEFAULTS = { rain: 50, moist: 0.4, duration: 1 };

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const coeff = (base, moist, cut = 0) => clamp(base + 0.25 * (moist - 0.4) - cut, 0.05, 0.95);
export const mitCut = (mit) => MEASURES.reduce((t, m) => t + (mit[m.key] ? m.cut : 0), 0);
export const r1 = (x) => Math.round(x * 10) / 10;
export const pct = (a, b) => Math.round(((a - b) / b) * 100);

// Relative runoff categories (not flood probabilities or depths)
export const LEVELS = {
  LOW: { key: 'LOW', label: 'Low', color: '#22c55e', msg: 'Most of the rain soaks into the ground' },
  MEDIUM: { key: 'MEDIUM', label: 'Medium', color: '#fbbf24', msg: 'Noticeable runoff — some water pooling likely' },
  HIGH: { key: 'HIGH', label: 'High', color: '#ef4444', msg: 'Heavy runoff — needs further investigation' },
};
export const levelOf = (depth) => (depth < 15 ? LEVELS.LOW : depth < 30 ? LEVELS.MEDIUM : LEVELS.HIGH);

export const volumeM3 = (depth, hours) => (depth / 1000) * AREA_M2 * hours;
export const fmtInt = (n) => Math.round(n).toLocaleString('en-IN');

export function assess({ rain, moist, scen, mit, duration }) {
  const cut = mitCut(mit);
  const cE = coeff(SCENARIOS.existing.base, moist);
  const cP = coeff(SCENARIOS.proposed.base, moist);
  const cM = coeff(SCENARIOS.proposed.base, moist, FULL_CUT);
  const cS = coeff(SCENARIOS.proposed.base, moist, cut);
  const cur = scen === 'existing' ? cE : cS;
  const depth = cur * rain;
  const vol = volumeM3(depth, duration);
  return {
    cut, cE, cP, cM, cS, cur,
    E: cE * rain, P: cP * rain, M: cM * rain, S: cS * rain,
    depth, soak: rain - depth, level: levelOf(depth),
    vol, pools: vol / POOL_M3,
    mitigated: scen === 'proposed' && cut > 0,
  };
}

// ---------------- Spatial grid (6 x 6 zones) ----------------
export const SURF = {
  buildings: { label: 'Buildings', c: 0.9, color: '#cbd5e1' },
  roads: { label: 'Roads', c: 0.85, color: '#64748b' },
  parking: { label: 'Parking', c: 0.9, color: '#a78bfa' },
  green: { label: 'Green space', c: 0.15, color: '#22c55e' },
  soil: { label: 'Open soil', c: 0.3, color: '#b45309' },
};
const IMPERV = ['buildings', 'roads', 'parking'];

const TYPES = {
  existing: [
    { p: 0.4, name: 'Farmland', icon: '🌾', mix: { buildings: [0.02, 0.06], roads: [0.03, 0.06], parking: [0, 0.01], green: [0.55, 0.7] } },
    { p: 0.7, name: 'Grassland', icon: '🌿', mix: { buildings: [0, 0.03], roads: [0.02, 0.05], parking: [0, 0.01], green: [0.6, 0.8] } },
    { p: 0.85, name: 'Scrub land', icon: '🌵', mix: { buildings: [0, 0.03], roads: [0.02, 0.05], parking: [0, 0], green: [0.3, 0.45] } },
    { p: 1, name: 'Village', icon: '🏡', mix: { buildings: [0.2, 0.3], roads: [0.1, 0.15], parking: [0.02, 0.05], green: [0.25, 0.35] } },
  ],
  proposed: [
    { p: 0.34, name: 'Residential', icon: '🏢', mix: { buildings: [0.36, 0.48], roads: [0.16, 0.24], parking: [0.06, 0.12], green: [0.05, 0.14] } },
    { p: 0.56, name: 'Commercial', icon: '🏬', mix: { buildings: [0.5, 0.58], roads: [0.2, 0.25], parking: [0.14, 0.18], green: [0, 0.03] } },
    { p: 0.7, name: 'Transit hub', icon: '🚉', mix: { buildings: [0.28, 0.34], roads: [0.42, 0.48], parking: [0.14, 0.18], green: [0, 0.02] } },
    { p: 0.86, name: 'Mixed use', icon: '🏘️', mix: { buildings: [0.25, 0.32], roads: [0.12, 0.18], parking: [0.04, 0.08], green: [0.25, 0.35] } },
    { p: 1, name: 'City park', icon: '🌳', mix: { buildings: [0.02, 0.05], roads: [0.05, 0.1], parking: [0, 0.03], green: [0.6, 0.75] } },
  ],
};
// terrain does not change between scenarios
const LOW_LYING = new Set([7, 14, 20, 21, 27, 33]);

function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function buildZones(key, seed) {
  const rand = rng(seed);
  const zones = Array.from({ length: 36 }, (_, i) => {
    const r = rand();
    const t = TYPES[key].find((x) => r <= x.p);
    const mix = {};
    let sum = 0;
    for (const k of Object.keys(t.mix)) {
      const [a, b] = t.mix[k];
      mix[k] = a + rand() * (b - a);
      sum += mix[k];
    }
    mix.soil = Math.max(0, 1 - sum);
    const total = sum + mix.soil;
    Object.keys(mix).forEach((k) => (mix[k] /= total));
    const imperv = IMPERV.reduce((a, k) => a + mix[k], 0);
    const rawC = Object.keys(mix).reduce((a, k) => a + mix[k] * SURF[k].c, 0);
    return { id: i, row: Math.floor(i / 6), col: i % 6, name: t.name, icon: t.icon, mix, imperv, rawC, low: LOW_LYING.has(i) };
  });
  // calibrate so the site-wide composite C equals the scenario's assumed value
  const meanC = zones.reduce((a, z) => a + z.rawC, 0) / zones.length;
  const off = SCENARIOS[key].base - meanC;
  zones.forEach((z) => (z.baseC = clamp(z.rawC + off, 0.05, 0.95)));
  return zones;
}

export const ZONES = { existing: buildZones('existing', 7), proposed: buildZones('proposed', 11) };
const meanImperv = (k) => ZONES[k].reduce((a, z) => a + z.imperv, 0) / 36;
export const IMPERV_MEAN = { existing: meanImperv('existing'), proposed: meanImperv('proposed') };

export function zoneResult(z, scenKey, { rain, moist, mit }) {
  const cut = scenKey === 'proposed' ? mitCut(mit) : 0;
  // mitigation helps most where there is more concrete
  const c = clamp(z.baseC + 0.25 * (moist - 0.4) - cut * (z.imperv / IMPERV_MEAN.proposed), 0.05, 0.95);
  const depth = c * rain;
  const score = depth * (z.low ? 1.2 : 1);
  return { c, depth, score, level: levelOf(score) };
}

// continuous heat colour for map cells (green -> yellow -> orange -> red -> dark red)
const STOPS = [[0, [34, 197, 94]], [15, [250, 204, 21]], [30, [249, 115, 22]], [45, [239, 68, 68]], [60, [153, 27, 27]]];
export function heatColor(v) {
  const x = clamp(v, 0, 60);
  for (let i = 1; i < STOPS.length; i++) {
    const [b, cb] = STOPS[i], [a, ca] = STOPS[i - 1];
    if (x <= b) {
      const t = (x - a) / (b - a);
      const c = ca.map((q, k) => Math.round(q + (cb[k] - q) * t));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return 'rgb(153,27,27)';
}

export function zoneStats(scenKey, state) {
  const out = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  ZONES[scenKey].forEach((z) => (out[zoneResult(z, scenKey, state).level.key] += 1));
  return out;
}

// ---------------- Illustrative rainfall records ----------------
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHLY_RAIN = [25, 8, 5, 15, 50, 55, 90, 120, 125, 280, 370, 160];
export const HEAVY_DAYS = [0, 0, 0, 0, 1, 0, 1, 1, 1, 3, 5, 2];

// illustrative 3-hour storm, 15-minute steps (mm/h)
export const STORM_PROFILE = [4, 10, 22, 38, 60, 78, 64, 46, 32, 20, 12, 6, 3];

export const STEPS = [
  { t: 'Define study scenarios', icon: '🗺️' },
  { t: 'Prepare input data', icon: '📥' },
  { t: 'Process and integrate data', icon: '🧹' },
  { t: 'Analyze rainfall and runoff factors', icon: '🔍' },
  { t: 'Estimate stormwater runoff', icon: '💧' },
  { t: 'Map relative vulnerability', icon: '🧭' },
  { t: 'Compare development and mitigation', icon: '⚖️' },
  { t: 'Validate and report results', icon: '📄' },
];

export const TEAM = [
  'Jissa Aan Juby', 'Devanshi Karaulia', 'Vedika Kapoor', 'Pola Gautam Sai', 'Priyanshu',
  'Uppala Manjusha', 'Zeeshan Ahmed', 'Sanjana Jaiswal', 'Jeevan Sarasram S S',
];

export const GLOSSARY = [
  ['Stormwater', 'Rainwater that flows over land after rainfall'],
  ['Runoff', 'Rain that flows over the surface instead of soaking in'],
  ['Infiltration', 'Water entering the soil'],
  ['Impervious surface', 'A surface that blocks water, e.g. concrete, roofs, asphalt'],
  ['Soil moisture', 'How much water is already in the soil'],
  ['Antecedent rainfall', 'Rain that fell before the current storm'],
  ['Rainfall intensity (I)', 'How much rain falls per hour, in mm/h'],
  ['Runoff coefficient (C)', 'Share of rain that becomes runoff (0 to 1)'],
  ['Vulnerability', 'How likely an area is to have a runoff problem, relative to others'],
  ['Mitigation', 'Actions that reduce a negative impact'],
  ['Validation', 'Checking estimates against real reference data'],
  ['EIA', 'Environmental Impact Assessment — studying impacts before a project is built'],
];

// ---------------- Smart recommendations (rule-based) ----------------
export const zoneLabel = (z) => `${String.fromCharCode(65 + z.row)}${z.col + 1}`;
export function insights(scenKey, state) {
  const ranked = ZONES[scenKey]
    .map((z) => ({ z, r: zoneResult(z, scenKey, state) }))
    .sort((a, b) => b.r.score - a.r.score);
  return ranked.slice(0, 3).map(({ z, r }) => {
    const tips = [];
    const P = (x) => Math.round(x * 100);
    if (z.mix.parking > 0.1) tips.push({ icon: '🧱', k: 'tip.pave', p: P(z.mix.parking) });
    if (z.mix.roads > 0.2) tips.push({ icon: '🌿', k: 'tip.garden', p: P(z.mix.roads) });
    if (z.mix.green < 0.1) tips.push({ icon: '🌳', k: 'tip.green', p: P(z.mix.green) });
    if (z.low) tips.push({ icon: '⬇', k: 'tip.low' });
    if (!tips.length) tips.push({ icon: '🔍', k: 'tip.monitor' });
    return { z, r, tips: tips.slice(0, 3) };
  });
}
