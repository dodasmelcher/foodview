// Vercel serverless function: proxies Google Places API (New) Text Search.
// Keeps the API key on the server. Returns the raw Google response so the
// client can map the new shape (places[].displayName.text, etc).
export default async function handler(req, res) {
    const { q, limit = '10' } = req.query;
    if (!q) return res.status(400).json({ error: 'q required' });
    if (!process.env.GOOGLE_PLACES_API_KEY) {
        return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY not configured' });
    }

    const body = {
        textQuery: q,
        pageSize: Math.min(parseInt(limit, 10) || 10, 20),
        languageCode: 'pt-BR',
        regionCode: 'BR',
        locationBias: {
            circle: {
                center: { latitude: -23.5613, longitude: -46.6562 },
                radius: 50000
            }
        }
    };

    const fieldMask = [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.shortFormattedAddress',
        'places.location',
        'places.types',
        'places.primaryType',
        'places.primaryTypeDisplayName',
        'places.priceLevel',
        'places.rating',
        'places.userRatingCount'
    ].join(',');

    try {
        const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY.trim(),
                'X-Goog-FieldMask': fieldMask
            },
            body: JSON.stringify(body)
        });
        const text = await r.text();
        res.status(r.status).setHeader('Content-Type', 'application/json').send(text);
    } catch (err) {
        res.status(500).json({ error: String(err && err.message || err) });
    }
}
