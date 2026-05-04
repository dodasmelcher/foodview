// Vercel serverless function: fetches place details from Foursquare's new
// Places API. Photos are a Premium endpoint and may fail on free accounts —
// in that case we still return details so the import can proceed without
// photos.
const FSQ_API_VERSION = '2025-06-17';

export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    if (!process.env.FOURSQUARE_API_KEY) {
        return res.status(500).json({ error: 'FOURSQUARE_API_KEY not configured' });
    }

    const headers = {
        Authorization: `Bearer ${process.env.FOURSQUARE_API_KEY.trim()}`,
        Accept: 'application/json',
        'X-Places-Api-Version': FSQ_API_VERSION,
        'User-Agent': 'FoodView/1.0'
    };

    try {
        const detailsRes = await fetch(`https://places-api.foursquare.com/places/${encodeURIComponent(id)}`, { headers });
        const details = await detailsRes.json();
        if (!detailsRes.ok) {
            return res.status(detailsRes.status).json({ error: details?.message || 'details failed', details });
        }

        // Photos are Premium — try but don't fail the whole call
        let photos = [];
        try {
            const photosRes = await fetch(`https://places-api.foursquare.com/places/${encodeURIComponent(id)}/photos?limit=8`, { headers });
            if (photosRes.ok) {
                const data = await photosRes.json();
                photos = Array.isArray(data) ? data : (data.results || []);
            }
        } catch (_) { /* swallow — photos are optional */ }

        res.json({ details, photos });
    } catch (err) {
        res.status(500).json({ error: String(err && err.message || err) });
    }
}
