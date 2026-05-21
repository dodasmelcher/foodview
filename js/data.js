// Supabase client + in-memory cache + read-only data helpers.
// Loaded after utils.js, before app.js. All identifiers remain global.

const SUPABASE_URL = 'https://jspxkdhqhjjvtepomkir.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcHhrZGhxaGpqdnRlcG9ta2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzkxNjEsImV4cCI6MjA5MTk1NTE2MX0.tABf7mPKoC4JEvUdJsO1-pjOcIARdgg2XwLb-WE6FlY';
const ADMIN_EMAIL = 'diogo.melcher@gmail.com';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let placesCache = [];
let reviewsCache = [];
let favoritesCache = [];
let followsCache = [];
let profilesCache = [];
let reviewLikesCache = [];
let currentUser = null;

async function loadData() {
    const [{ data: places }, { data: reviews }, { data: favs }, { data: follows }, { data: profiles }, { data: revLikes }] = await Promise.all([
        sb.from('places').select('*').order('created_at', { ascending: true }),
        sb.from('reviews').select('*').order('created_at', { ascending: false }),
        sb.from('favorites').select('*'),
        sb.from('follows').select('*'),
        sb.from('profiles').select('*'),
        sb.from('review_likes').select('*') // tolerant: null until the table exists
    ]);
    placesCache = places || [];
    reviewsCache = reviews || [];
    favoritesCache = favs || [];
    followsCache = follows || [];
    profilesCache = profiles || [];
    reviewLikesCache = revLikes || [];
    populateCategoryDatalist();
    render();
    // Open a deep-linked place (/lugar/123) once the cache is populated — at
    // init time applyRoute runs with an empty cache and can't find it yet.
    if (typeof applyRoute === 'function') applyRoute();
}

// Targeted refreshes: most mutations touch a single table, so refetch just that
// one instead of reloading all five (full loadData stays for deletes that
// cascade and for auth changes). render() only repaints the active tab.
async function reloadPlaces() {
    const { data } = await sb.from('places').select('*').order('created_at', { ascending: true });
    placesCache = data || [];
    populateCategoryDatalist();
    render();
}
async function reloadReviews() {
    const { data } = await sb.from('reviews').select('*').order('created_at', { ascending: false });
    reviewsCache = data || [];
    render();
}

function getUser() { return currentUser; }
function isAdmin() { return currentUser && currentUser.email === ADMIN_EMAIL; }
function getPlaceById(id) { return placesCache.find(r => r.id === id); }
// A review's overall score = average of its 4 category scores, or its legacy
// integer `rating` for reviews made before the 4-category system.
function reviewScore(rv) {
    const subs = [rv.food, rv.ambiance, rv.service, rv.price].filter(v => typeof v === 'number');
    return subs.length ? subs.reduce((a, b) => a + b, 0) / subs.length : (rv.rating || 0);
}
function getPlaceRating(placeId) {
    const rvs = reviewsCache.filter(r => r.place_id === placeId);
    if (!rvs.length) return { avg: 0, count: 0 };
    return { avg: (rvs.reduce((a, r) => a + reviewScore(r), 0) / rvs.length).toFixed(1), count: rvs.length };
}
// Per-category averages across a place's reviews; each is null when no review
// scored that category.
function getPlaceCategoryAverages(placeId) {
    const rvs = reviewsCache.filter(r => r.place_id === placeId);
    const avgOf = (key) => {
        const vals = rvs.map(r => r[key]).filter(v => typeof v === 'number');
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return { food: avgOf('food'), ambiance: avgOf('ambiance'), service: avgOf('service'), price: avgOf('price') };
}
function getProfile(userId) { return profilesCache.find(p => p.id === userId); }
function isFavorited(placeId) {
    return currentUser && favoritesCache.some(f => f.user_id === currentUser.id && f.place_id === placeId);
}
function getFavCount(placeId) { return favoritesCache.filter(f => f.place_id === placeId).length; }
function getReviewLikeCount(reviewId) { return reviewLikesCache.filter(l => l.review_id === reviewId).length; }
function isReviewLiked(reviewId) {
    return currentUser && reviewLikesCache.some(l => l.user_id === currentUser.id && l.review_id === reviewId);
}
function michelinStars(p) { if (!p.badge) return 0; const m = p.badge.match(/★/g); return m ? m.length : 0; }

// Resize+compress an image client-side via canvas before upload. Outputs WebP
// when smaller; falls back to the original file if the encoder didn't help
// (tiny inputs, non-images, browser without WebP encode).
async function compressImage(file, maxDim = 1600, quality = 0.82) {
    if (!file.type.startsWith('image/')) return file;
    if (file.size < 300 * 1024) return file; // already small enough
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('image decode failed'));
            img.src = url;
        });
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const blob = await new Promise(res => canvas.toBlob(res, 'image/webp', quality));
        if (!blob || blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });
    } catch (_) {
        return file;
    } finally {
        URL.revokeObjectURL(url);
    }
}

// Upload file to Supabase Storage, return public URL. Compresses first so
// full-res phone photos (~10MB) end up around 200-500KB.
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
async function uploadPhoto(file) {
    if (file.size > MAX_PHOTO_BYTES) {
        const mb = (file.size / 1024 / 1024).toFixed(1);
        showToast(`"${file.name}" tem ${mb}MB — limite é 15MB`, 'error', 6000);
        return null;
    }
    const compressed = await compressImage(file);
    const ext = compressed.name.split('.').pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await sb.storage.from('photos').upload(path, compressed);
    if (error) { console.error(error); showToast('Falha no upload da foto', 'error'); return null; }
    const { data } = sb.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
}
