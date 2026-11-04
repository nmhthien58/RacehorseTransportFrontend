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
