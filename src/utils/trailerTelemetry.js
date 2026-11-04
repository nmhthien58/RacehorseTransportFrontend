/**
 * @file trailerTelemetry.js
 * @description Trailer cabin environmental telemetry utilities based on IATA Live Animals Regulations (LAR).
 * Monitors cabin climate, thermal heat index, and structural acceleration thresholds during equine transit.
 */

export const IATA_TEMP_THRESHOLDS = Object.freeze({
  MIN_SAFE_C: 10,
  OPTIMAL_MIN_C: 15,
  OPTIMAL_MAX_C: 24,
  WARNING_HIGH_C: 28,
  CRITICAL_HIGH_C: 32,
});

export const IATA_HUMIDITY_THRESHOLDS = Object.freeze({
  MIN_SAFE_PCT: 30,
  OPTIMAL_MIN_PCT: 45,
  OPTIMAL_MAX_PCT: 65,
  WARNING_HIGH_PCT: 75,
  CRITICAL_HIGH_PCT: 85,
});

export const TRAILER_SENSOR_TYPES = Object.freeze({
  TEMPERATURE: 'CABIN_TEMPERATURE',
  HUMIDITY: 'CABIN_HUMIDITY',
  AIRFLOW_VELOCITY: 'AIRFLOW_VELOCITY',
  ACCELEROMETER: '3AXIS_ACCELEROMETER',
});

export const CABIN_ZONES = Object.freeze({
  ZONE_A_FRONT: 'ZONE_A_FRONT',
  ZONE_B_MIDDLE: 'ZONE_B_MIDDLE',
  ZONE_C_REAR: 'ZONE_C_REAR',
});

/**
 * Calculates Heat Index (HI) in Celsius using Rothfusz regression equation for equine thermal comfort.
 * @param {number} tempC - Ambient cabin temperature in Celsius
 * @param {number} rhPct - Relative humidity percentage (0-100)
 * @returns {number} Apparent temperature (Heat Index) in Celsius
 */
export function calculateHeatIndex(tempC, rhPct) {
  if (tempC == null || rhPct == null || Number.isNaN(tempC) || Number.isNaN(rhPct)) {
    return tempC ?? 20;
  }

  // Convert Celsius to Fahrenheit for standard NWS formula
  const tempF = (tempC * 9) / 5 + 32;
  if (tempF < 80) {
    return tempC;
  }

  const c1 = -42.379;
  const c2 = 2.04901523;
  const c3 = 10.14333127;
  const c4 = -0.22475541;
  const c5 = -0.00683783;
  const c6 = -0.05481717;
  const c7 = 0.00122874;
  const c8 = 0.00085282;
  const c9 = -0.00000199;

  const hiF =
    c1 +
    c2 * tempF +
    c3 * rhPct +
    c4 * tempF * rhPct +
    c5 * tempF * tempF +
    c6 * rhPct * rhPct +
    c7 * tempF * tempF * rhPct +
    c8 * tempF * rhPct * rhPct +
    c9 * tempF * tempF * rhPct * rhPct;

  // Convert back to Celsius
  return Number((((hiF - 32) * 5) / 9).toFixed(1));
}

/**
 * Evaluates thermal safety category for transported horses.
 * @param {number} tempC - Cabin temperature in Celsius
 * @param {number} rhPct - Cabin relative humidity
 * @returns {'SAFE'|'MODERATE'|'ELEVATED'|'DANGER'}
 */
export function assessThermalComfort(tempC, rhPct) {
  const hi = calculateHeatIndex(tempC, rhPct);
  if (hi < IATA_TEMP_THRESHOLDS.OPTIMAL_MAX_C) {
    return 'SAFE';
  }
  if (hi < IATA_TEMP_THRESHOLDS.WARNING_HIGH_C) {
    return 'MODERATE';
  }
  if (hi < IATA_TEMP_THRESHOLDS.CRITICAL_HIGH_C) {
    return 'ELEVATED';
  }
  return 'DANGER';
}


/**
 * Calculates Root Mean Square (RMS) acceleration vector magnitude across 3 axes (X, Y, Z).
 * @param {{ x: number, y: number, z: number }} accel - Accelerometer vector in g units
 * @returns {number} Vector magnitude in g
 */
export function calculateVectorMagnitude(accel) {
  if (!accel) return 1.0;
  const { x = 0, y = 0, z = 1.0 } = accel;
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Analyzes sudden road shock events exceeding safety thresholds for equine balance.
 * Normal transport limit: < 0.4g lateral, < 0.6g vertical.
 * @param {Array<{ x: number, y: number, z: number, timestamp: string }>} readings - Accel logs
 * @returns {{ spikeCount: number, maxG: number, status: 'SMOOTH'|'BUMPY'|'HAZARDOUS' }}
 */
export function detectRoadShockSpikes(readings = []) {
  if (!Array.isArray(readings) || readings.length === 0) {
    return { spikeCount: 0, maxG: 1.0, status: 'SMOOTH' };
  }

  let spikeCount = 0;
  let maxG = 1.0;

  for (const r of readings) {
    const mag = calculateVectorMagnitude(r);
    if (mag > maxG) maxG = mag;
    // Shock event threshold > 1.5g total force (including Earth gravity)
    if (mag > 1.5) {
      spikeCount += 1;
    }
  }

  let status = 'SMOOTH';
  if (spikeCount > 10 || maxG > 2.2) {
    status = 'HAZARDOUS';
  } else if (spikeCount > 2 || maxG > 1.6) {
    status = 'BUMPY';
  }

  return { spikeCount, maxG: Number(maxG.toFixed(2)), status };
}


/**
 * Evaluates air exchange rates and airflow sufficiency inside the horse trailer cabin.
 * Compliance baseline: Minimum 20 air changes per hour (ACH) for live equine transport.
 * @param {number} fanRpm - Active extractor fan speed in RPM
 * @param {number} cabinVolumeM3 - Total interior cabin air volume in cubic meters
 * @param {boolean} ventsOpen - Status of passive roof vents
 * @returns {{ ach: number, compliant: boolean, recommendation: string }}
 */
export function evaluateAirExchangeCycles(fanRpm = 0, cabinVolumeM3 = 35, ventsOpen = true) {
  // Approximate airflow yield: 0.8 m3/h per RPM per fan unit
  const baseAirflowM3H = fanRpm * 0.8 * 2;
  const passiveAirflowM3H = ventsOpen ? 150 : 20;
  const totalFlowM3H = baseAirflowM3H + passiveAirflowM3H;

  const ach = Number((totalFlowM3H / Math.max(cabinVolumeM3, 10)).toFixed(1));
  const compliant = ach >= 20;

  let recommendation = 'Airflow optimal.';
  if (!compliant) {
    recommendation = ventsOpen
      ? 'Increase mechanical fan speed to level 3 immediately.'
      : 'Open roof ventilation hatches and activate auxiliary blowers.';
  }

  return { ach, compliant, recommendation };
}
