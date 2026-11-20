/**
 * E-CYCLE AI-Assisted Price Estimation Engine (Module 6)
 * Generates transparent, non-binding valuation ranges based on
 * structured electronics refurbishment and material recovery indices.
 */

// Baseline Market Depreciation Models (INR ₹)
const BASELINE_VALUES = {
  Smartphone: { base: 18000, depRate: 0.22, minResale: 1200, scrapKg: 85, weightEst: 0.19 },
  Laptop: { base: 45000, depRate: 0.18, minResale: 3500, scrapKg: 75, weightEst: 2.1 },
  Tablet: { base: 22000, depRate: 0.20, minResale: 1500, scrapKg: 80, weightEst: 0.45 },
  Monitor: { base: 12000, depRate: 0.15, minResale: 800, scrapKg: 40, weightEst: 4.2 },
  Television: { base: 26000, depRate: 0.16, minResale: 1500, scrapKg: 35, weightEst: 9.5 },
  Keyboard: { base: 1200, depRate: 0.25, minResale: 150, scrapKg: 30, weightEst: 0.65 },
  Mouse: { base: 600, depRate: 0.25, minResale: 50, scrapKg: 30, weightEst: 0.12 },
  Printer: { base: 11000, depRate: 0.20, minResale: 1000, scrapKg: 35, weightEst: 5.5 },
  Headphones: { base: 3500, depRate: 0.25, minResale: 300, scrapKg: 40, weightEst: 0.25 },
  Camera: { base: 28000, depRate: 0.15, minResale: 2500, scrapKg: 60, weightEst: 0.8 },
  'Cables & Chargers': { base: 700, depRate: 0.30, minResale: 50, scrapKg: 95, weightEst: 0.2 },
  'Extension Boards & Power Strips': { base: 900, depRate: 0.25, minResale: 100, scrapKg: 50, weightEst: 0.5 },
  Batteries: { base: 1500, depRate: 0.35, minResale: 0, scrapKg: 120, weightEst: 0.3 },
  'Small Appliance': { base: 3000, depRate: 0.20, minResale: 300, scrapKg: 45, weightEst: 2.0 },
  'Other electronic devices': { base: 2500, depRate: 0.20, minResale: 200, scrapKg: 45, weightEst: 1.5 },
};

const CONDITION_MULTIPLIERS = {
  'Like New': 0.85,
  Good: 0.70,
  Fair: 0.48,
  Poor: 0.25,
  'Non-working': 0.08,
};

const BRAND_TIER_MULTIPLIERS = {
  // Premium
  apple: 1.35,
  sony: 1.15,
  samsung: 1.10,
  dell: 1.05,
  lenovo: 1.05,
  hp: 1.0,
  asus: 1.0,
  lg: 1.0,
  // Budget / Generic
  generic: 0.85,
};

export function estimateDevicePrice({
  category = '',
  brand = '',
  model = '',
  age = 2,
  condition = 'Fair',
  working = true,
  powersOn = true,
  damage = '',
}) {
  const normCategory = category.trim();
  const baseInfo = BASELINE_VALUES[normCategory];

  // If no pricing data exists for this item
  if (!baseInfo) {
    return {
      sufficientData: false,
      message: 'Insufficient data for a reliable estimate.',
      resaleRange: null,
      repairRange: null,
      scrapValueRange: null,
      assumptions: ['Category not cataloged in current pricing reference index.'],
      disclaimer: 'All estimates are non-binding reference figures.',
      pricingDate: new Date().toISOString().slice(0, 10),
    };
  }

  const numAge = Math.max(0, Number(age) || 0);
  const condMult = CONDITION_MULTIPLIERS[condition] || 0.48;

  // Brand multiplier
  const normBrand = (brand || '').toLowerCase().trim();
  let brandMult = 1.0;
  for (const [k, v] of Object.entries(BRAND_TIER_MULTIPLIERS)) {
    if (normBrand.includes(k)) {
      brandMult = v;
      break;
    }
  }

  // Calculate depreciated base
  // formula: base * (1 - depRate)^age * brandMult * condMult
  const depreciated = baseInfo.base * Math.pow(1 - baseInfo.depRate, Math.min(numAge, 8)) * brandMult;
  const isFunctional = working && powersOn;

  let resaleMin = 0;
  let resaleMax = 0;

  if (isFunctional && condition !== 'Non-working') {
    const rawEst = depreciated * condMult;
    resaleMin = Math.max(baseInfo.minResale, Math.round((rawEst * 0.85) / 100) * 100);
    resaleMax = Math.max(resaleMin + 200, Math.round((rawEst * 1.15) / 100) * 100);
  } else {
    resaleMin = 0;
    resaleMax = Math.round((depreciated * 0.12) / 100) * 100;
  }

  // Estimated Repair Range
  let repairMin = 0;
  let repairMax = 0;
  if (!isFunctional || condition === 'Poor' || damage) {
    const repairBase = baseInfo.base * 0.22;
    repairMin = Math.round((repairBase * 0.7) / 100) * 100;
    repairMax = Math.round((repairBase * 1.4) / 100) * 100;
  }

  // Scrap / Raw Material Recovery Range
  const weight = baseInfo.weightEst;
  const scrapRaw = weight * baseInfo.scrapKg;
  const scrapMin = Math.max(30, Math.round(scrapRaw * 0.8));
  const scrapMax = Math.max(scrapMin + 20, Math.round(scrapRaw * 1.3));

  const assumptions = [
    `Depreciation curve calculated for ${numAge} year(s) using ${Math.round(baseInfo.depRate * 100)}% annual amortization.`,
    `Condition factor applied: ${condition} (${Math.round(condMult * 100)}% operational factor).`,
    brand ? `Brand tier weighting applied: ${brand} (${brandMult}x factor).` : 'Standard generic brand index applied.',
    isFunctional ? 'Assumes functional logic board and core display components.' : 'Non-working device factored as component harvest or scrap.',
  ];

  return {
    sufficientData: true,
    resaleRange: {
      min: resaleMin,
      max: resaleMax,
      currency: 'INR (₹)',
    },
    repairRange: repairMax > 0 ? {
      min: repairMin,
      max: repairMax,
      currency: 'INR (₹)',
    } : null,
    scrapValueRange: {
      min: scrapMin,
      max: scrapMax,
      currency: 'INR (₹)',
    },
    assumptions,
    disclaimer:
      'NON-BINDING VALUATION: All figures are algorithmic reference estimations based on Indian secondary electronics market benchmarks (FY 2025-26). Final trade-in values, repair quotes, or recycling buybacks are established solely upon physical inspection and diagnostic verification by the assigned partner.',
    pricingDate: new Date().toISOString().slice(0, 10),
    source: 'E-Cycle Secondary Electronics & Material Recovery Index (v2.4)',
  };
}
