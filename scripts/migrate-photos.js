#!/usr/bin/env node
// One-off migration: download every Google Places photo referenced from
// places.image_url / places.photos[] and re-host on Supabase Storage so they
// pass through our /render/image transform endpoint and stop setting the
// COMPASS third-party cookie.
//
// Usage:
//   SUPABASE_SERVICE_KEY=eyJ... node scripts/migrate-photos.js            # dry-run
//   SUPABASE_SERVICE_KEY=eyJ... node scripts/migrate-photos.js --limit 3  # 3 places only
//   SUPABASE_SERVICE_KEY=eyJ... node scripts/migrate-photos.js --apply    # for real
//
// Idempotent: skips photos already on supabase.co. Resumable: per-place state
// is persisted to scripts/.migrate-state.json — kill the script and re-run
// to pick up where it left off.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://jspxkdhqhjjvtepomkir.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'photos';
const STATE_FILE = join(__dirname, '.migrate-state.json');
const CONCURRENCY = 3;            // photos in flight at once
const RETRIES = 2;
const RETRY_DELAY_MS = 1500;

const args = process.argv.slice(2);
const DRY = !args.includes('--apply');
const LIMIT = (() => {
    const i = args.indexOf('--limit');
    return i >= 0 ? parseInt(args[i + 1], 10) : Infinity;
})();

if (!SERVICE_KEY) {
    console.error('ERROR: set SUPABASE_SERVICE_KEY env var (Supabase Dashboard → Settings → API → service_role).');
    process.exit(1);
}

const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
};

const isGoogleUrl = (u) => typeof u === 'string' && u.includes('googleusercontent.com');
const isSupabaseUrl = (u) => typeof u === 'string' && u.includes(SUPABASE_URL);

const state = existsSync(STATE_FILE)
    ? JSON.parse(readFileSync(STATE_FILE, 'utf8'))
    : { done: {}, failed: {} };
const saveState = () => writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

async function listPlacesToMigrate() {
    const url = `${SUPABASE_URL}/rest/v1/places?select=id,name,image_url,photos&or=(image_url.like.*googleusercontent*,photos.cs.{})&order=id.asc`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`list places ${res.status}: ${await res.text()}`);
    const all = await res.json();
    return all.filter(p => isGoogleUrl(p.image_url) || (Array.isArray(p.photos) && p.photos.some(isGoogleUrl)));
}

async function withRetry(fn, label) {
    let lastErr;
    for (let i = 0; i <= RETRIES; i++) {
        try { return await fn(); } catch (e) {
            lastErr = e;
            if (i < RETRIES) await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
        }
    }
    throw new Error(`${label} failed after ${RETRIES + 1} tries: ${lastErr?.message || lastErr}`);
}

async function downloadPhoto(googleUrl) {
    const res = await fetch(googleUrl, { redirect: 'follow' });
    if (!res.ok) throw new Error(`download ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || 'image/jpeg';
    return { buf, contentType: ct };
}

async function uploadPhoto(buf, contentType, storagePath) {
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': contentType,
            'x-upsert': 'true',
        },
        body: buf,
    });
    if (!res.ok) throw new Error(`upload ${res.status}: ${await res.text()}`);
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

async function migrateOnePhoto(googleUrl, placeId, idx) {
    if (!isGoogleUrl(googleUrl)) return googleUrl; // already migrated or non-Google
    const ext = (googleUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg').toLowerCase();
    const storagePath = `migrated/${placeId}/${idx}.${ext}`;
    const { buf, contentType } = await withRetry(() => downloadPhoto(googleUrl), `download p${placeId} #${idx}`);
    if (DRY) return `[DRY] would upload ${buf.length} bytes → ${storagePath}`;
    return await withRetry(() => uploadPhoto(buf, contentType, storagePath), `upload p${placeId} #${idx}`);
}

async function updatePlace(placeId, image_url, photos) {
    const url = `${SUPABASE_URL}/rest/v1/places?id=eq.${placeId}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ image_url, photos }),
    });
    if (!res.ok) throw new Error(`patch place ${placeId}: ${res.status} ${await res.text()}`);
}

async function processPlace(p) {
    const photos = Array.isArray(p.photos) ? [...p.photos] : [];
    const tasks = [];

    if (isGoogleUrl(p.image_url)) {
        tasks.push({ kind: 'cover', oldUrl: p.image_url });
    }
    for (let i = 0; i < photos.length; i++) {
        if (isGoogleUrl(photos[i])) tasks.push({ kind: 'photo', idx: i, oldUrl: photos[i] });
    }
    if (!tasks.length) return { skipped: true };

    let nextIdx = (photos.length); // start unique storage indices after existing positions
    for (const t of tasks) {
        const idx = t.kind === 'cover' ? 'cover' : t.idx;
        try {
            const newUrl = await migrateOnePhoto(t.oldUrl, p.id, idx);
            if (t.kind === 'cover') p.image_url = newUrl;
            else photos[t.idx] = newUrl;
        } catch (e) {
            console.error(`  ✗ ${t.kind} #${t.idx ?? ''} ${e.message}`);
            state.failed[p.id] = (state.failed[p.id] || []).concat({ kind: t.kind, idx: t.idx, err: e.message });
        }
    }

    if (DRY) return { dry: true, photos, image_url: p.image_url };
    await withRetry(() => updatePlace(p.id, p.image_url, photos), `update place ${p.id}`);
    state.done[p.id] = { at: new Date().toISOString() };
    saveState();
    return { ok: true };
}

async function main() {
    console.log(`Mode: ${DRY ? 'DRY-RUN (no writes)' : 'APPLY (will mutate DB + Storage)'}`);
    console.log(`Limit: ${LIMIT === Infinity ? 'no limit' : LIMIT}`);

    const places = await listPlacesToMigrate();
    const pending = places
        .filter(p => !state.done[p.id])
        .slice(0, LIMIT);
    console.log(`Found ${places.length} places needing migration; ${pending.length} pending after state filter.\n`);

    let i = 0;
    for (const p of pending) {
        i++;
        const photoCount = (isGoogleUrl(p.image_url) ? 1 : 0) +
                          (Array.isArray(p.photos) ? p.photos.filter(isGoogleUrl).length : 0);
        console.log(`[${i}/${pending.length}] place ${p.id} "${p.name}" — ${photoCount} photos`);
        const result = await processPlace(p);
        if (result.skipped) console.log('  (already clean)');
        else if (result.dry) console.log('  (dry-run, no writes)');
        else console.log('  ✓ migrated');
    }

    const failedCount = Object.keys(state.failed).length;
    console.log(`\nDone. ${pending.length} processed, ${failedCount} with at least one failed photo.`);
    if (DRY) console.log('Re-run with --apply to commit changes.');
}

main().catch(e => { console.error(e); process.exit(1); });
