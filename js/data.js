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

// Upload file to Supabase Storage, return public URL.
// Rejects files over 5MB up-front to avoid hung uploads from full-res phone
// photos. showToast lives in utils.js (loaded earlier).
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
async function uploadPhoto(file) {
    if (file.size > MAX_PHOTO_BYTES) {
        const mb = (file.size / 1024 / 1024).toFixed(1);
        showToast(`"${file.name}" tem ${mb}MB — limite é 5MB`, 'error', 6000);
        return null;
    }
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await sb.storage.from('photos').upload(path, file);
    if (error) { console.error(error); showToast('Falha no upload da foto', 'error'); return null; }
    const { data } = sb.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
}
