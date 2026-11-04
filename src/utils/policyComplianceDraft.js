/**
 * @file policyComplianceDraft.js
 * @description Experimental policy clause taxonomy and service policy evaluation helpers.
 * References: CHINH_SACH_DICH_VU.md, Terms of Service v1.1.
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
