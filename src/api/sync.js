import client from './client';

/**
 * Pull sync — fetches wards, polling units, and people changed since `since`.
 * @param {string|null} since - ISO date string of last sync, or null for full sync
 * @param {string|null} wardId - optional ward filter
 */
export async function syncAll(since, wardId) {
  const params = {};
  if (since) params.since = since;
  if (wardId) params.wardId = wardId;

  const response = await client.get('/sync', { params });
  const payload = response.data?.data || response.data || {};
  return {
    wards: payload.wards || [],
    pollingUnits: payload.pollingUnits || [],
    people: payload.people || [],
    syncedAt: payload.syncedAt || new Date().toISOString(),
  };
}

/**
 * Push a person record to the server.
 * @param {object} payload - person data
 */
export async function uploadPerson(payload) {
  const response = await client.post('/people', payload);
  return response.data;
}
