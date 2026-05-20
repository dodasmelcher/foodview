// Vercel serverless function: server-renders per-place meta tags for shareable
// links (/lugar/:id). The SPA is fully client-rendered, so social scrapers
// (WhatsApp, Twitter, Facebook) and search engines would otherwise only ever
// see the generic homepage preview. This fetches the place from Supabase,
// takes the real index.html, and injects a per-place <title>, OG/Twitter tags,
// JSON-LD and a <noscript> fallback — then the SPA boots and opens the detail.
//
// Wired up via the rewrite in vercel.json: /lugar/:id → /api/place-page?id=:id
const SUPABASE_URL = 'https://jspxkdhqhjjvtepomkir.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcHhrZGhxaGpqdnRlcG9ta2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzkxNjEsImV4cCI6MjA5MTk1NTE2MX0.tABf7mPKoC4JEvUdJsO1-pjOcIARdgg2XwLb-WE6FlY';

const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Social-friendly image: route Supabase Storage URLs through the render
// endpoint at 1200×630; pass other URLs (or the icon fallback) through.
function ogImage(url, origin) {
    if (typeof url === 'string' && url.includes('/storage/v1/object/public/')) {
        const t = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
        const sep = t.includes('?') ? '&' : '?';
        return `${t}${sep}width=1200&height=630&resize=cover&quality=80`;
    }
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) return url;
    return `${origin}/assets/icon-512.png`;
}

function setMeta(html, attr, key, value) {
    const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`, 'i');
    if (re.test(html)) return html.replace(re, `$1${esc(value)}$2`);
    return html.replace('</head>', `    <meta ${attr}="${key}" content="${esc(value)}">\n</head>`);
}

async function sbGet(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });
    if (!res.ok) throw new Error(`supabase ${res.status}`);
    return res.json();
}

export default async function handler(req, res) {
    const id = parseInt(req.query.id, 10);
    const host = req.headers.host;
    const origin = `https://${host}`;

    // Always start from the real index.html so the function never drifts from
    // the actual app shell. <base> fixes relative asset URLs under /lugar/:id.
    let html;
    try {
        const r = await fetch(`${origin}/index.html`);
        html = await r.text();
    } catch (_) {
        return res.status(502).send('Erro ao carregar a página.');
    }
    html = html.replace('<head>', '<head>\n    <base href="/">');

    if (!Number.isFinite(id)) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html); // bad id → serve generic SPA
    }

    let place = null, reviews = [];
    try {
        const rows = await sbGet(`places?id=eq.${id}&select=id,type,name,category,address,image_url,badge`);
        place = rows[0] || null;
        if (place) reviews = await sbGet(`reviews?place_id=eq.${id}&select=rating`);
    } catch (_) { /* fall through to generic shell */ }

    if (!place) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
    }

    const count = reviews.length;
    const avg = count ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / count) : 0;
    const meta = [place.category, place.address].filter(Boolean).join(' · ');
    const ratingTxt = count ? `★ ${avg.toFixed(1)} (${count} ${count === 1 ? 'avaliação' : 'avaliações'})` : '';
    const title = `${place.name}${place.badge ? ' · ' + place.badge : ''} — FoodView`;
    const description = [meta, ratingTxt].filter(Boolean).join(' · ')
        || `${place.name} no FoodView — seu diário gastronômico de São Paulo.`;
    const image = ogImage(place.image_url, origin);
    const url = `${origin}/lugar/${id}`;

    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
    html = setMeta(html, 'name', 'description', description);
    html = setMeta(html, 'property', 'og:title', title);
    html = setMeta(html, 'property', 'og:description', description);
    html = setMeta(html, 'property', 'og:url', url);
    html = setMeta(html, 'property', 'og:image', image);
    html = setMeta(html, 'property', 'og:image:width', '1200');
    html = setMeta(html, 'property', 'og:image:height', '630');
    html = setMeta(html, 'name', 'twitter:title', title);
    html = setMeta(html, 'name', 'twitter:description', description);
    html = setMeta(html, 'name', 'twitter:image', image);
    html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': place.type === 'bar' ? 'BarOrPub' : 'Restaurant',
        name: place.name,
        image,
        url,
        address: place.address || undefined,
        servesCuisine: place.category || undefined,
        ...(count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: avg.toFixed(1), reviewCount: count } } : {})
    };
    const head = `    <link rel="canonical" href="${esc(url)}">
    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
</head>`;
    html = html.replace('</head>', head);

    // Crawlers without JS still get the essentials.
    const noscript = `<noscript><div style="max-width:680px;margin:40px auto;padding:0 20px;font-family:sans-serif">
        <h1>${esc(place.name)}</h1>
        ${meta ? `<p>${esc(meta)}</p>` : ''}
        ${ratingTxt ? `<p>${esc(ratingTxt)}</p>` : ''}
        <img src="${esc(image)}" alt="${esc(place.name)}" style="max-width:100%;border-radius:12px">
    </div></noscript>`;
    html = html.replace('<main', noscript + '\n    <main');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.send(html);
}
