// Vercel serverless function: re-hosts external image URLs onto Supabase
// Storage so imported places keep working long-term. Google Places photo URLs
// (photoUri) are temporary and expire — storing them directly leaves places
// with broken images after a while. This mirrors scripts/migrate-photos.js but
// runs at import time.
//
// Requires SUPABASE_SERVICE_KEY (Supabase Dashboard → Settings → API →
// service_role) as a Vercel env var. Without it the endpoint returns 501 and
// the client falls back to the original (expiring) URLs so import still works.
//
// Security: only re-hosts Google-hosted image URLs (host allowlist) and caps
// count + size, so it can't be abused as an open uploader or SSRF vector.
const SUPABASE_URL = 'https://jspxkdhqhjjvtepomkir.supabase.co';
const BUCKET = 'photos';
const MAX_URLS = 10;
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_HOST = /(^|\.)googleusercontent\.com$|(^|\.)googleapis\.com$/i;

function isAllowed(u) {
    try {
        const url = new URL(u);
        return url.protocol === 'https:' && ALLOWED_HOST.test(url.hostname);
    } catch (_) {
        return false;
    }
}

async function rehostOne(srcUrl, serviceKey) {
    const dl = await fetch(srcUrl, { redirect: 'follow' });
    if (!dl.ok) throw new Error(`download ${dl.status}`);
    const buf = Buffer.from(await dl.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error(`too large (${buf.length} bytes)`);
    const contentType = dl.headers.get('content-type') || 'image/jpeg';
    const ext = (contentType.match(/image\/(jpeg|jpg|png|webp)/i)?.[1] || 'jpg').replace('jpeg', 'jpg');
    const path = `imported/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
        method: 'POST',
        headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': contentType,
            'x-upsert': 'true'
        },
        body: buf
    });
    if (!up.ok) throw new Error(`upload ${up.status}: ${await up.text()}`);
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!serviceKey) return res.status(501).json({ error: 'SUPABASE_SERVICE_KEY not configured' });

    const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
    if (!urls.length) return res.status(400).json({ error: 'urls[] required' });

    // Best-effort, position-preserving: each output is the permanent Supabase
    // URL, or the original on failure / when it's already hosted / not allowed,
    // so the caller can map back 1:1 and never loses a photo.
    const out = [];
    for (const u of urls.slice(0, MAX_URLS)) {
        if (typeof u !== 'string') { out.push(null); continue; }
        if (u.includes(SUPABASE_URL)) { out.push(u); continue; } // already migrated
        if (!isAllowed(u)) { out.push(u); continue; }
        try {
            out.push(await rehostOne(u, serviceKey));
        } catch (err) {
            console.error('rehost failed', u, err.message);
            out.push(u); // keep the original so the import still has a photo
        }
    }
    res.json({ urls: out });
}
