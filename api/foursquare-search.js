// Vercel serverless function: proxies Foursquare Places /search.
// Uses the Foursquare Places API platform (places-api.foursquare.com).
// API key stays on the server.
const FSQ_API_VERSION = '2025-06-17';

export default async function handler(req, res) {
    const { q, ll = '-23.5613,-46.6562', radius = '40000', limit = '10' } = req.query;
    if (!q) return res.status(400).json({ error: 'q required' });
    if (!process.env.FOURSQUARE_API_KEY) {
        return res.status(500).json({ error: 'FOURSQUARE_API_KEY not configured' });
    }

    const params = new URLSearchParams({ query: q, ll, radius, limit });

    try {
        const fsqRes = await fetch(`https://places-api.foursquare.com/places/search?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${process.env.FOURSQUARE_API_KEY.trim()}`,
                Accept: 'application/json',
                'X-Places-Api-Version': FSQ_API_VERSION,
                'User-Agent': 'FoodView/1.0'
            }
        });
        const text = await fsqRes.text();
        res.status(fsqRes.status)
            .setHeader('Content-Type', 'application/json')
            .send(text);
    } catch (err) {
        res.status(500).json({ error: String(err && err.message || err) });
    }
}
