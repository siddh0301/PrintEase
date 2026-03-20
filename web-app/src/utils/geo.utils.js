export const roundCoord = (value, precision = 6) => {
  if (typeof value !== 'number') return value;
  return Number(value.toFixed(precision));
};

/**
 * Search locations using OpenStreetMap Nominatim.
 * Returns an array of { displayName, lat, lng }.
 */
export async function searchLocation(query, limit = 5) {
  if (!query) return [];

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(
      query
    )}`;

  const res = await fetch(url, {
    headers: {
      // Nominatim requires a valid User-Agent; browsers normally set it.
      'Accept-Language': 'en'
    }
  });

  if (!res.ok) return [];

  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return [];

  return results
    .map((item) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
}

/**
 * Try to geocode a postal address using OpenStreetMap Nominatim.
 * Returns { lat, lng } if found, or null if not found.
 */
export async function geocodeAddress(addressOrQuery) {
  if (!addressOrQuery) return null;

  const query =
    typeof addressOrQuery === 'string'
      ? addressOrQuery
      : [
          addressOrQuery.shopNumber,
          addressOrQuery.street,
          addressOrQuery.city,
          addressOrQuery.state,
          addressOrQuery.pincode
        ]
          .filter(Boolean)
          .join(', ');

  if (!query) return null;

  const results = await searchLocation(query, 1);
  if (results.length === 0) return null;
  return { lat: results[0].lat, lng: results[0].lng };
}
