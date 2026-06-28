/**
 * geo.js — Geospatial utilities for host distance calculations.
 */

/**
 * Haversine formula — great-circle distance in kilometres.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in km
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Sort hosts by distance from a given point.
 * Hosts without lat/lng are pushed to the end.
 * @param {Array} hosts
 * @param {number} userLat
 * @param {number} userLng
 * @returns {Array} sorted copy of hosts
 */
export function sortByDistance(hosts, userLat, userLng) {
  return [...hosts].sort((a, b) => {
    const dA = a.latitude != null ? haversineKm(userLat, userLng, a.latitude, a.longitude) : Infinity;
    const dB = b.latitude != null ? haversineKm(userLat, userLng, b.latitude, b.longitude) : Infinity;
    return dA - dB;
  });
}
