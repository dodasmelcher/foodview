// Vercel serverless function: fetches full place details from Google Places
// API (New) plus resolves up to 5 photo references to direct photoUri URLs
// using skipHttpRedirect=true (so the browser can <img src> without exposing
// the API key).
export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    if (!process.env.GOOGLE_PLACES_API_KEY) {
        return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY not configured' });
    }
    const apiKey = process.env.GOOGLE_PLACES_API_KEY.trim();

    const fieldMask = [
        'id',
        'displayName',
        'formattedAddress',
        'shortFormattedAddress',
        'location',
        'types',
        'primaryType',
        'primaryTypeDisplayName',
        'priceLevel',
        'rating',
        'userRatingCount',
        'internationalPhoneNumber',
        'nationalPhoneNumber',
        'websiteUri',
        'regularOpeningHours',
        'photos'
    ].join(',');

    try {
        const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=pt-BR&regionCode=BR`, {
            headers: {
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask
            }
        });
        const details = await r.json();
        if (!r.ok) {
            return res.status(r.status).json({ error: details?.error?.message || 'failed', details });
        }

        // Resolve up to 5 photos to direct CDN URLs
        const photos = [];
        const photoRefs = (details.photos || []).slice(0, 5);
        for (const ph of photoRefs) {
            try {
                const pr = await fetch(`https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=1600&skipHttpRedirect=true`, {
                    headers: { 'X-Goog-Api-Key': apiKey }
                });
                if (pr.ok) {
                    const pdata = await pr.json();
                    if (pdata.photoUri) photos.push(pdata.photoUri);
                }
            } catch (_) { /* swallow individual photo failures */ }
        }

        res.json({ details, photos });
    } catch (err) {
        res.status(500).json({ error: String(err && err.message || err) });
    }
}
