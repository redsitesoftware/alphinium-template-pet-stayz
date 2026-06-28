/**
 * Haversine distance between two lat/lng points, in kilometres.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Sort an array of hosts by distance from (userLat, userLng).
 * If a host has latitude/longitude coordinates they are used for accurate calculation;
 * otherwise the existing host.distance value is used as a fallback.
 */
export function sortByDistance(hosts, userLat, userLng) {
  return [...hosts].sort((a, b) => {
    const distA =
      a.latitude != null && a.longitude != null
        ? haversineKm(userLat, userLng, a.latitude, a.longitude)
        : (a.distance ?? 0);
    const distB =
      b.latitude != null && b.longitude != null
        ? haversineKm(userLat, userLng, b.latitude, b.longitude)
        : (b.distance ?? 0);
    return distA - distB;
  });
}
