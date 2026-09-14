import { json, withUser } from '../lib/auth.js';

/**
 * Looks an address up and returns candidate coordinates, so a farmer can fill
 * in latitude and longitude without knowing them.
 *
 * Proxied rather than called from the browser: Nominatim's usage policy
 * requires a User-Agent identifying the application, and going through the
 * function also keeps the endpoint behind a session instead of leaving an
 * open geocoder pointed at a shared community service.
 *
 * GET /.netlify/functions/geocode?q=…&country=…  ->  { results: [{ label, lat, lng }] }
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const UA = 'isibaya-farm (https://isibaya.smartpick.co.za)';

export default withUser(async (req) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const country = (url.searchParams.get('country') || '').trim();

  if (q.length < 3) return json({ error: 'Enter an address to search for.' }, 400);

  // The country from the farm profile narrows results — "Wellington" alone
  // matches South Africa, New Zealand and England.
  const query = country && !q.toLowerCase().includes(country.toLowerCase())
    ? `${q}, ${country}`
    : q;

  const search = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '5',
    addressdetails: '1',
  });

  try {
    const res = await fetch(`${NOMINATIM}?${search}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
    });
    if (!res.ok) {
      console.error('Nominatim responded', res.status);
      return json({ error: 'The address lookup service is unavailable right now.' }, 502);
    }
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) return json({ results: [] });

    const results = data
      .filter(r => r?.lat && r?.lon)
      .map(r => ({
        label: r.display_name,
        lat: Number(Number(r.lat).toFixed(6)),
        lng: Number(Number(r.lon).toFixed(6)),
      }));

    return json({ results });
  } catch (err) {
    console.error('geocode failed', err);
    return json({ error: 'Could not reach the address lookup service.' }, 502);
  }
});
