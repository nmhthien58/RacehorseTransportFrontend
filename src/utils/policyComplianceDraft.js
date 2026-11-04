/**
 * @file policyComplianceDraft.js
 * @deprecated Standalone client-side policy evaluation draft is deprecated in favor of unified
 * backend policy validation and reactive usePolicy hook. Slated for cleanup.
 *
 * Legal Framework References:
 * 1. Convention on the Contract for the International Carriage of Goods by Road (CMR).
 * 2. FEI Veterinary Regulations Chapter V: Equine Transport & Biosecurity.
 * 3. Racehorse Transport Service Terms & Conditions (CHINH_SACH_DICH_VU.md).
 *    - Section 1: Deposit, billing milestones, and payment schedule.
 *    - Section 3: Booking cancellation window & refund brackets.
 *    - Section 6: Operational delivery delay compensation penalties.
 *    - Section 8: Transit insurance coverage limits and agreed value riders.
 */

export const POLICY_CLAUSE_CATEGORIES = Object.freeze({
  DEPOSIT_AND_PAYMENT: 'DEPOSIT_AND_PAYMENT',
  CANCELLATION_REFUND: 'CANCELLATION_REFUND',
  DELAY_COMPENSATION: 'DELAY_COMPENSATION',
  TRANSIT_INSURANCE: 'TRANSIT_INSURANCE',
  EQUINE_WELFARE_MINIMUMS: 'EQUINE_WELFARE_MINIMUMS',
  FORCE_MAJEURE: 'FORCE_MAJEURE',
});

export const CANCELLATION_WINDOW_TIERS = Object.freeze({
  EARLY_CANCEL_DAYS: 7,
  MEDIUM_CANCEL_DAYS: 3,
  LATE_CANCEL_HOURS: 24,
});

export const DELAY_COMPENSATION_RULES = Object.freeze({
  GRACE_PERIOD_HOURS: 6,
  PENALTY_PCT_PER_12H: 5,
  MAX_PENALTY_PCT: 25,
});


/**
 * Calculates deposit refund percentage based on days remaining before scheduled pickup.
 * @param {number} daysBeforePickup - Calendar days remaining before pickupWindowStart
 * @param {boolean} isCompanyFault - Whether cancellation was initiated due to company operational failure
 * @returns {{ refundPct: number, reason: string }}
 */
export function calculateCancellationRefundPct(daysBeforePickup, isCompanyFault = false) {
  if (isCompanyFault) {
    return { refundPct: 100, reason: 'Full refund guaranteed under company operational failure clause.' };
  }

  if (daysBeforePickup >= CANCELLATION_WINDOW_TIERS.EARLY_CANCEL_DAYS) {
    return { refundPct: 100, reason: 'Full deposit refund for cancellation >= 7 days notice.' };
  }

  if (daysBeforePickup >= CANCELLATION_WINDOW_TIERS.MEDIUM_CANCEL_DAYS) {
    return { refundPct: 50, reason: '50% deposit forfeiture applies for cancellation between 3 and 7 days.' };
  }

  return { refundPct: 0, reason: 'Deposit is non-refundable for cancellation under 3 days before pickup.' };
}


/**
 * Calculates delivery delay compensation for customer according to Section 6 of Terms of Service.
 * Formula: 5% of base freight per full 12 hours of delay exceeding 6h grace period, capped at 25%.
 * @param {number} delayHours - Actual delivery delay in decimal hours
 * @param {number} baseFreightAmount - Total base freight cost in USD
 * @param {boolean} isForceMajeure - Weather, border closure, or force majeure event
 * @returns {{ compensationAmount: number, penaltyPct: number, isEligible: boolean }}
 */
export function calculateDelayCompensationAmount(delayHours, baseFreightAmount = 0, isForceMajeure = false) {
  if (isForceMajeure || delayHours <= DELAY_COMPENSATION_RULES.GRACE_PERIOD_HOURS) {
    return { compensationAmount: 0, penaltyPct: 0, isEligible: false };
  }

  const billableDelayHours = delayHours - DELAY_COMPENSATION_RULES.GRACE_PERIOD_HOURS;
  const twelveHourBlocks = Math.floor(billableDelayHours / 12);
  const calculatedPenaltyPct = twelveHourBlocks * DELAY_COMPENSATION_RULES.PENALTY_PCT_PER_12H;
  const effectivePenaltyPct = Math.min(calculatedPenaltyPct, DELAY_COMPENSATION_RULES.MAX_PENALTY_PCT);

  const compensationAmount = Number(((baseFreightAmount * effectivePenaltyPct) / 100).toFixed(2));
  return {
    compensationAmount,
    penaltyPct: effectivePenaltyPct,
    isEligible: effectivePenaltyPct > 0,
  };
}


/**
 * Evaluates transit insurance liability coverage according to agreed valuation.
 * @param {number} agreedValueUsd - Agreed value per horse in USD
 * @param {boolean} optFullValueInsurance - Whether customer opted for full-value rider (1% premium)
 * @returns {{ planName: string, maxLiabilityDeath: number, maxInjuryVetCost: number, requiresAppraisalProof: boolean }}
 */
export function evaluateInsuranceCoverageTier(agreedValueUsd = 0, optFullValueInsurance = false) {
  const requiresAppraisalProof = agreedValueUsd >= 50000;

  if (!optFullValueInsurance) {
    return {
      planName: 'STANDARD_LIMITED_LIABILITY',
      maxLiabilityDeath: Math.min(agreedValueUsd, 5000),
      maxInjuryVetCost: 1000,
      requiresAppraisalProof,
    };
  }

  return {
    planName: 'COMPREHENSIVE_FULL_VALUE',
    maxLiabilityDeath: agreedValueUsd,
    maxInjuryVetCost: Number((agreedValueUsd * 0.2).toFixed(2)),
    requiresAppraisalProof,
  };
}


/**
 * Validates that customer consent matches the current active policy version.
 * @param {string} userAgreedVersion - Version string stored at booking creation
 * @param {string} activeSystemVersion - Current policy version published by Admin
 * @returns {{ isCurrent: boolean, requiresReconsent: boolean }}
 */
export function verifyPolicyVersionMatch(userAgreedVersion, activeSystemVersion) {
  if (!userAgreedVersion || !activeSystemVersion) {
    return { isCurrent: false, requiresReconsent: true };
  }

  const isCurrent = userAgreedVersion.trim() === activeSystemVersion.trim();
  return {
    isCurrent,
    requiresReconsent: !isCurrent,
  };
}


/**
 * Calculates prorated refund when transport is terminated mid-route due to force majeure (e.g. border closure).
 * Customer is refunded base freight proportional to remaining uncompleted distance. Clearance and insurance are non-refundable.
 * @param {number} baseFreightUsd - Total freight charge for the leg
 * @param {number} totalDistanceKm - Planned route length in km
 * @param {number} completedDistanceKm - Distance already covered before force majeure stop
 * @returns {{ refundAmount: number, uncompletedDistanceKm: number, refundRatio: number }}
 */
export function calculateForceMajeureProratedRefund(baseFreightUsd = 0, totalDistanceKm = 1, completedDistanceKm = 0) {
  const safeTotalKm = Math.max(1, totalDistanceKm);
  const safeCompletedKm = Math.min(Math.max(0, completedDistanceKm), safeTotalKm);
  const uncompletedDistanceKm = safeTotalKm - safeCompletedKm;

  const refundRatio = Number((uncompletedDistanceKm / safeTotalKm).toFixed(4));
  const refundAmount = Number((baseFreightUsd * refundRatio).toFixed(2));

  return {
    refundAmount,
    uncompletedDistanceKm,
    refundRatio,
  };
}


/**
 * Compares two policy configuration snapshots and highlights adjusted numerical terms.
 * @param {Record<string, unknown>} oldSnap - Previous policy configuration
 * @param {Record<string, unknown>} newSnap - Current policy configuration
 * @returns {Array<{ key: string, oldValue: unknown, newValue: unknown, isChanged: boolean }>}
 */
export function diffPolicySnapshots(oldSnap = {}, newSnap = {}) {
  const allKeys = Array.from(new Set([...Object.keys(oldSnap), ...Object.keys(newSnap)]));
  const diffs = [];

  for (const k of allKeys) {
    const oldValue = oldSnap[k];
    const newValue = newSnap[k];
    const isChanged = oldValue !== newValue;
    if (isChanged) {
      diffs.push({ key: k, oldValue, newValue, isChanged: true });
    }
  }

  return diffs;
}


/**
 * Performs a comprehensive pre-submission policy compliance audit for a booking payload.
 * @param {Record<string, unknown>} bookingContext - Booking details including deposit, agreed version, horses
 * @returns {{ compliant: boolean, warnings: string[], errors: string[] }}
 */
export function auditBookingPolicyCompliance(bookingContext = {}) {
  const errors = [];
  const warnings = [];

  if (!bookingContext?.policyAgreed) {
    errors.push('Customer has not accepted the active terms of service.');
  }

  if (!bookingContext?.policyVersion) {
    errors.push('Policy version tag is missing from consent metadata.');
  }

  const horses = Array.isArray(bookingContext?.horses) ? bookingContext.horses : [];
  for (const horse of horses) {
    if (horse?.declaredValueUsd >= 50000 && !horse?.hasAppraisalDocument) {
      warnings.push(`Horse ${horse?.name || horse?.horseId} exceeds $50k valuation without attached appraisal document.`);
    }
  }

  return {
    compliant: errors.length === 0,
    warnings,
    errors,
  };
}
