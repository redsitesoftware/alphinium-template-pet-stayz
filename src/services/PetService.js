import { STRAPI_URL } from '../config';

/**
 * POST /api/pets — create a pet profile (requires auth token)
 */
export async function createPet(petData, authToken) {
  const response = await fetch(`${STRAPI_URL}/api/pets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ data: petData }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create pet: HTTP ${response.status}`);
  }

  const json = await response.json();
  return json?.data ?? null;
}

/**
 * GET /api/pets/me — fetch all pets belonging to the authenticated user
 * Falls back to filter query if /me endpoint is unavailable.
 */
export async function getMyPets(authToken) {
  const response = await fetch(
    `${STRAPI_URL}/api/pets?filters[owner][id][$eq]=me&populate=photos`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch pets: HTTP ${response.status}`);
  }

  const json = await response.json();
  return json?.data ?? [];
}
