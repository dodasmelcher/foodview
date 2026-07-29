// Vercel Cron target: keeps the Supabase project from auto-pausing.
//
// Supabase's Free tier pauses any project after 7 days without activity, which
// takes the whole FoodView backend (auth, data, storage) offline until it's
// manually restored from the dashboard. This function runs a tiny, cheap query
// against the `places` table so the project registers activity. It's wired to a
// daily Vercel Cron in vercel.json — well inside the 7-day window.
const SUPABASE_URL = 'https://jspxkdhqhjjvtepomkir.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcHhrZGhxaGpqdnRlcG9ta2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzkxNjEsImV4cCI6MjA5MTk1NTE2MX0.tABf7mPKoC4JEvUdJsO1-pjOcIARdgg2XwLb-WE6FlY';

export default async function handler(req, res) {
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/places?select=id&limit=1`, {
            headers: {
                apikey: SUPABASE_ANON,
                Authorization: `Bearer ${SUPABASE_ANON}`,
            },
        });
        const ok = r.ok;
        res.status(ok ? 200 : 502).json({
            ok,
            status: r.status,
            pingedAt: new Date().toISOString(),
        });
    } catch (err) {
        res.status(502).json({ ok: false, error: String(err && err.message || err) });
    }
}
