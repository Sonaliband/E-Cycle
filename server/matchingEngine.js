/**
 * E-CYCLE Intelligent Collector & Repair Partner Matching Engine (Module 5)
 * Filters strictly by eligibility and ranks eligible partners using transparent, explainable factors.
 */

import { getDb } from './db.js';

export function matchEligiblePartners({
  category = 'Other electronic devices',
  action = 'recycle', // 'repair' | 'donate' | 'recycle'
  locality = '',
  pincode = '',
  unsafe = false,
}) {
  const db = getDb();
  const allPartners = db.partners || [];

  // Safety Gate: If device is hazardous (e.g. swollen battery), block automated assignment
  if (unsafe) {
    return {
      eligiblePartners: [],
      ineligibleCount: allPartners.length,
      safetyBlocked: true,
      reason: 'Safety restriction: Device flagged with hazardous risk (e.g. swollen battery). Automated matching is blocked until specialist review.',
    };
  }

  const eligible = [];
  const ineligible = [];

  for (const partner of allPartners) {
    const checks = {
      serviceTypeMatch: partner.type === action,
      categoryCompatible: Array.isArray(partner.categories) && partner.categories.includes(category),
      isAvailable: partner.available === true,
      hasCapacity: (partner.capacity - (partner.active || 0)) > 0,
    };

    const isEligible =
      checks.serviceTypeMatch &&
      checks.categoryCompatible &&
      checks.isAvailable &&
      checks.hasCapacity;

    if (!isEligible) {
      ineligible.push({
        id: partner.id,
        name: partner.name,
        reasons: [
          !checks.serviceTypeMatch && `Does not handle ${action} services`,
          !checks.categoryCompatible && `Does not support ${category}`,
          !checks.isAvailable && 'Currently marked unavailable',
          !checks.hasCapacity && 'Capacity full (0 slots remaining)',
        ].filter(Boolean),
      });
      continue;
    }

    // Rank Eligible Partners
    // 1. Category Compatibility (Base 35 pts)
    let score = 35;
    const reasons = [`Compatible with ${category}`];

    // 2. Location / Pincode Proximity (Up to 25 pts)
    const normUserPin = (pincode || '').trim();
    const normPartnerPin = (partner.pincode || '').trim();
    const normUserLoc = (locality || '').toLowerCase().trim();
    const normPartnerLoc = (partner.locality || '').toLowerCase().trim();

    let locationPts = 10;
    if (normUserPin && normPartnerPin && normUserPin === normPartnerPin) {
      locationPts = 25;
      reasons.push(`Exact PIN code match (${normUserPin})`);
    } else if (normUserLoc && normPartnerLoc && (normUserLoc.includes(normPartnerLoc) || normPartnerLoc.includes(normUserLoc))) {
      locationPts = 20;
      reasons.push(`Local neighborhood service area (${partner.locality})`);
    } else {
      reasons.push(`Regional coverage (${partner.locality})`);
    }
    score += locationPts;

    // 3. Remaining Capacity (Up to 20 pts)
    const remainingSlots = Math.max(0, partner.capacity - (partner.active || 0));
    const capacityRatio = remainingSlots / Math.max(1, partner.capacity);
    const capacityPts = Math.round(capacityRatio * 20);
    score += capacityPts;
    reasons.push(`${remainingSlots} of ${partner.capacity} capacity slots open`);

    // 4. Specialization Match (Up to 15 pts)
    let specPts = 10;
    if (action === 'repair' && partner.specialization?.toLowerCase().includes('board') || partner.specialization?.toLowerCase().includes('repair')) {
      specPts = 15;
      reasons.push(`Specialized in ${partner.specialization}`);
    } else if (action === 'donate' && partner.specialization?.toLowerCase().includes('learning')) {
      specPts = 15;
      reasons.push(`Targeted reuse community: ${partner.specialization}`);
    } else if (partner.specialization) {
      reasons.push(partner.specialization);
    }
    score += specPts;

    // 5. Verification status (5 pts)
    if (partner.verified) {
      score += 5;
      reasons.push(partner.isRealProvider ? 'Authorized Service Provider' : 'Verified E-Cycle Partner');
    }

    eligible.push({
      partner,
      matchScore: Math.min(100, score),
      reasons,
      remainingSlots,
      breakdown: {
        categoryCompatibility: 35,
        locationProximity: locationPts,
        capacityAvailability: capacityPts,
        specializationAlignment: specPts,
        verificationStatus: partner.verified ? 5 : 0,
      },
      isRealProvider: Boolean(partner.isRealProvider),
    });
  }

  // Sort ranked by score descending
  eligible.sort((a, b) => b.matchScore - a.matchScore);

  return {
    safetyBlocked: false,
    eligiblePartners: eligible,
    ineligibleCount: ineligible.length,
    ineligibleSample: ineligible.slice(0, 3),
    totalMatches: eligible.length,
  };
}
