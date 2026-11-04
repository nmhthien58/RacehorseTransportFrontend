/**
 * @file trailerTelemetry.js
 * @deprecated Real-time IoT sensor telemetry simulation is unfeasible for the current project phase
 * due to the absence of physical OBD-II / BLE environmental sensors on fleet haulers.
 * This experimental module is deprecated and will be removed in favor of manual driver checklist logs.
 *
 * Mathematical Reference Models:
 * 1. Rothfusz Heat Index Regression: HI = c1 + c2*T + c3*RH + c4*T*RH + ...
 *    Reference: National Weather Service (NWS) Technical Attachment (SR 90-23).
 * 2. Equine Bioclimatic Transport Index (EBTI):
 *    Combines ambient cabin temperature (Celsius) with relative humidity (RH).
 *    Safe baseline: Sum of Temp (F) + RH (%) <= 130. High risk: Sum >= 150.
 * 3. 3-Axis RMS Vibration Standard:
 *    ISO 2631-1: Mechanical vibration and shock — Evaluation of human and animal exposure.
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


/**
 * Applies a simple sliding window moving average to filter out high-frequency sensor noise.
 * @param {number[]} readings - Chronological numeric sensor samples
 * @param {number} windowSize - Number of historical periods to include (default: 5)
 * @returns {number[]} Smoothed sensor values
 */
export function smoothSensorReadingsMovingAverage(readings = [], windowSize = 5) {
  if (!Array.isArray(readings) || readings.length === 0) return [];
  if (windowSize <= 1) return [...readings];

  const smoothed = [];
  for (let i = 0; i < readings.length; i += 1) {
    const startIdx = Math.max(0, i - windowSize + 1);
    const window = readings.slice(startIdx, i + 1);
    const sum = window.reduce((acc, val) => acc + (Number(val) || 0), 0);
    smoothed.push(Number((sum / window.length).toFixed(2)));
  }

  return smoothed;
}

/**
 * Detects rapid temperature drift inside trailer (e.g. air conditioning failure or open doors).
 * Threshold: > 2.5 degrees Celsius jump within a 15-minute interval.
 * @param {Array<{ timestamp: string, tempC: number }>} history - Time series data
 * @returns {{ driftDetected: boolean, deltaC: number, ratePerMinute: number }}
 */
export function detectRapidTemperatureDrift(history = []) {
  if (!Array.isArray(history) || history.length < 2) {
    return { driftDetected: false, deltaC: 0, ratePerMinute: 0 };
  }

  const first = history[0];
  const last = history[history.length - 1];
  const deltaC = Number((last.tempC - first.tempC).toFixed(2));

  const t1 = new Date(first.timestamp).getTime();
  const t2 = new Date(last.timestamp).getTime();
  const elapsedMinutes = Math.max(1, (t2 - t1) / 60000);

  const ratePerMinute = Number((deltaC / elapsedMinutes).toFixed(3));
  const driftDetected = Math.abs(deltaC) >= 2.5;

  return { driftDetected, deltaC, ratePerMinute };
}


/**
 * Validates and sanitizes raw IoT sensor packets from CAN bus / BLE gateway.
 * Flags disconnected sensors, physical wiring faults, or out-of-range sensor telemetries.
 * @param {Record<string, unknown>} rawSample - Raw packet payload
 * @returns {{ sanitized: { tempC: number, rhPct: number }, isHealthy: boolean, faults: string[] }}
 */
export function sanitizeSensorInput(rawSample = {}) {
  const faults = [];
  let tempC = Number(rawSample?.temperatureC);
  let rhPct = Number(rawSample?.humidityPct);

  if (rawSample == null || typeof rawSample !== 'object') {
    return {
      sanitized: { tempC: 20, rhPct: 50 },
      isHealthy: false,
      faults: ['NULL_OR_INVALID_PACKET'],
    };
  }

  // Check temperature bounds (-20C to +60C physical limit)
  if (Number.isNaN(tempC) || tempC < -20 || tempC > 60) {
    faults.push('TEMPERATURE_SENSOR_FAULT');
    tempC = 20; // Safe neutral fallback
  }

  // Check humidity bounds (0 to 100%)
  if (Number.isNaN(rhPct) || rhPct < 0 || rhPct > 100) {
    faults.push('HUMIDITY_SENSOR_FAULT');
    rhPct = 50;
  }

  return {
    sanitized: { tempC, rhPct },
    isHealthy: faults.length === 0,
    faults,
  };
}
