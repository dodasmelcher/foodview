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
let currentUser = null;

async function loadData() {
    const [{ data: places }, { data: reviews }, { data: favs }, { data: follows }, { data: profiles }] = await Promise.all([
        sb.from('places').select('*').order('created_at', { ascending: true }),
        sb.from('reviews').select('*').order('created_at', { ascending: false }),
        sb.from('favorites').select('*'),
        sb.from('follows').select('*'),
        sb.from('profiles').select('*')
    ]);
    placesCache = places || [];
    reviewsCache = reviews || [];
    favoritesCache = favs || [];
    followsCache = follows || [];
    profilesCache = profiles || [];
    populateCategoryDatalist();
    render();
    buildHeroSlides();
}

function getUser() { return currentUser; }
function isAdmin() { return currentUser && currentUser.email === ADMIN_EMAIL; }
function getPlaceById(id) { return placesCache.find(r => r.id === id); }
function getPlaceRating(placeId) {
    const rvs = reviewsCache.filter(r => r.place_id === placeId);
    if (!rvs.length) return { avg: 0, count: 0 };
    return { avg: (rvs.reduce((a, r) => a + r.rating, 0) / rvs.length).toFixed(1), count: rvs.length };
}
function getProfile(userId) { return profilesCache.find(p => p.id === userId); }
function isFavorited(placeId) {
    return currentUser && favoritesCache.some(f => f.user_id === currentUser.id && f.place_id === placeId);
}
function getFavCount(placeId) { return favoritesCache.filter(f => f.place_id === placeId).length; }
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
