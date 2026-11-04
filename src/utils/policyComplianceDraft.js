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
