/**
 * Haversine distance between two lat/lng points, in kilometres.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
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
 * If a host has lat/lng coordinates they are used for an accurate calculation;
 * otherwise the existing host.distance value is used as a fallback.
 */
export function sortByDistance(hosts, userLat, userLng) {
  return [...hosts].sort((a, b) => {
    const distA =
      a.lat != null && a.lng != null
        ? haversineKm(userLat, userLng, a.lat, a.lng)
        : (a.distance ?? 0);
    const distB =
      b.lat != null && b.lng != null
        ? haversineKm(userLat, userLng, b.lat, b.lng)
        : (b.distance ?? 0);
    return distA - distB;
  });
}
