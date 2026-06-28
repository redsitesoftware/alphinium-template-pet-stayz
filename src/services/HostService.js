import { STRAPI_URL } from '../config';

/**
 * GET /api/hosts — fetch all host listings (populate photos, reviews)
 */
export async function getHosts() {
  const response = await fetch(`${STRAPI_URL}/api/hosts?populate=profile_photo,home_photo,gallery_photos,reviews`);

  if (!response.ok) {
    throw new Error(`Failed to fetch hosts: HTTP ${response.status}`);
  }

  const json = await response.json();
  return json?.data ?? [];
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
