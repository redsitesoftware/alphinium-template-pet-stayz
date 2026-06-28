import { STRAPI_URL } from '../config';

const POPULATE = 'profile_photo,home_photo,gallery_photos,reviews,pricing_overrides';

/**
 * Map raw Strapi host attributes to store shape.
 * Shared by getHosts() and getHost().
 */
export function mapHost(item) {
  const a = item.attributes ?? item;
  return {
    id: item.id ? `api-${item.id}` : a.id,
    name: a.name ?? '',
    emoji: a.emoji ?? '',
    suburb: a.suburb ?? '',
    distance: a.distance ?? 0,
    rating: a.rating ?? 0,
    reviewCount: a.review_count ?? a.reviewCount ?? 0,
    hostingSince: a.hosting_since ?? a.hostingSince ?? '',
    pricePerNight: a.price_per_night ?? a.pricePerNight ?? 0,
    priceDaycare: a.price_daycare ?? a.priceDaycare ?? 0,
    type: a.type ?? [],
    petTypes: a.pet_types ?? a.petTypes ?? [],
    maxDogs: a.max_dogs ?? a.maxDogs ?? 1,
    maxSize: a.max_size ?? a.maxSize ?? 'Any size',
    badge: a.badge ?? null,
    badgeColor: a.badge_color ?? a.badgeColor ?? null,
    homeType: a.home_type ?? a.homeType ?? '',
    bio: a.bio ?? '',
    amenities: a.amenities ?? [],
    availableFrom: a.availableFrom ?? '',
    saved: a.saved ?? false,
    reviews: a.reviews ?? [],
    profilePhotoUrl: a.profile_photo?.data?.attributes?.url ?? null,
    homePhotoUrl: a.home_photo?.data?.attributes?.url ?? null,
    galleryPhotos: (a.gallery_photos?.data ?? []).map(p => p.attributes?.url ?? p.url).filter(Boolean),
    pricingOverrides: (a.pricing_overrides ?? []).map(o => ({
      label: o.label,
      dateFrom: o.date_from,
      dateTo: o.date_to,
      pricePerNight: o.price_per_night,
    })),
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    verified: a.verified ?? false,
  };
}

/**
 * GET /api/hosts — fetch all host listings (populate photos, reviews, pricing overrides)
 */
export async function getHosts() {
  const response = await fetch(`${STRAPI_URL}/api/hosts?populate=${POPULATE}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch hosts: HTTP ${response.status}`);
  }

  const json = await response.json();
  return json?.data ?? [];
}

/**
 * GET /api/hosts/:id — fetch a single host by Strapi numeric ID
 */
export async function getHost(id) {
  const response = await fetch(`${STRAPI_URL}/api/hosts/${id}?populate=${POPULATE}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch host ${id}: HTTP ${response.status}`);
  }

  const json = await response.json();
  const item = json?.data;
  if (!item) return null;
  return mapHost(item);
}

/**
 * POST /api/hosts — create a host listing (requires auth token)
 */
export async function createHost(hostData, authToken) {
  const response = await fetch(`${STRAPI_URL}/api/hosts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ data: hostData }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create host: HTTP ${response.status}`);
  }

  const json = await response.json();
  return json?.data ?? null;
}

