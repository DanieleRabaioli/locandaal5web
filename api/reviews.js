module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return res.status(200).json({
      reviews: [],
      note: 'Configure GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID to enable live Google reviews.'
    });
  }

  const endpoint =
    'https://maps.googleapis.com/maps/api/place/details/json' +
    `?place_id=${encodeURIComponent(placeId)}` +
    '&fields=name,rating,reviews' +
    '&reviews_sort=newest' +
    '&language=it' +
    `&key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      return res.status(502).json({ reviews: [], error: 'Google API unavailable' });
    }

    const data = await response.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.status(502).json({
        reviews: [],
        error: 'Google API error',
        status: data.status
      });
    }

    const reviews = data && data.result && data.result.reviews ? data.result.reviews : [];
    return res.status(200).json({ reviews: reviews.slice(0, 6) });
  } catch (error) {
    return res.status(500).json({
      reviews: [],
      error: 'Unable to fetch reviews',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
