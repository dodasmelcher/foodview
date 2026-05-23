// Vercel serverless function: permanently deletes the signed-in user's account
// and personal data. The browser can't remove an auth user, so this does it with
// the service_role key — but only after verifying the caller's own access token,
// so a user can delete *only* their own account.
//
// Flow:
//   1. Read `Authorization: Bearer <access_token>` (the caller's session token).
//   2. Verify it via GET /auth/v1/user → trustworthy user id (can't be spoofed:
//      a forged token fails verification against Supabase Auth).
//   3. With the service key: delete the user's reviews (reviews.user_id is
//      ON DELETE SET NULL, so they'd otherwise survive as orphaned rows), then
//      delete the auth user — which cascades favorites/follows/review_likes/
//      profiles (those FKs are ON DELETE CASCADE).
//
// Requires SUPABASE_SERVICE_KEY as a Vercel env var. Without it → 501.
const SUPABASE_URL = 'https://jspxkdhqhjjvtepomkir.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcHhrZGhxaGpqdnRlcG9ta2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzkxNjEsImV4cCI6MjA5MTk1NTE2MX0.tABf7mPKoC4JEvUdJsO1-pjOcIARdgg2XwLb-WE6FlY';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!serviceKey) return res.status(501).json({ error: 'SUPABASE_SERVICE_KEY not configured' });

    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'missing token' });

    // Verify the caller's token and resolve their id from Supabase Auth itself.
    let userId;
    try {
        const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` }
        });
        if (!who.ok) return res.status(401).json({ error: 'invalid session' });
        userId = (await who.json())?.id;
        if (!userId) return res.status(401).json({ error: 'invalid session' });
    } catch (err) {
        console.error('verify failed', err.message);
        return res.status(502).json({ error: 'could not verify session' });
    }

    const svc = {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
    };

    try {
        // Reviews are ON DELETE SET NULL, so remove them explicitly first.
        const delReviews = await fetch(
            `${SUPABASE_URL}/rest/v1/reviews?user_id=eq.${userId}`,
            { method: 'DELETE', headers: svc }
        );
        if (!delReviews.ok) throw new Error(`reviews ${delReviews.status}: ${await delReviews.text()}`);

        // Delete the auth user — cascades favorites/follows/review_likes/profiles.
        const delUser = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
            method: 'DELETE', headers: svc
        });
        if (!delUser.ok) throw new Error(`auth user ${delUser.status}: ${await delUser.text()}`);

        res.json({ ok: true });
    } catch (err) {
        console.error('delete-account failed', err.message);
        res.status(500).json({ error: 'could not delete account' });
    }
}
