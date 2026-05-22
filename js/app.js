// Supabase client + caches (placesCache, currentUser, sb, etc.) live in js/data.js
let searchQuery = '';
let categoryFilter = { restaurante: 'Todas', bar: 'Todas' };
let bairroFilter = { restaurante: 'Todos', bar: 'Todos' };
let sortBy = 'avaliados';
let extraFilter = { michelin: false, delivery: false };
let popularType = 'restaurante'; // Populares tab: Restaurantes (default) / Bares

// Pagination (PAGE_SIZE, visibleCount, resetPage, loadMore, _loadMoreIO,
// loadMoreHTML, attachLoadMoreObserver) and rendering (renderSkeletons,
// renderCard, filterByType, renderRestaurantes, renderBares, renderPopular,
// renderFavoritos, renderAmigos, render) live in js/render.js
// Data helpers (getUser, isAdmin, getPlaceById, getPlaceRating, getProfile,
// isFavorited, getFavCount, michelinStars) live in js/data.js
// Pure helpers (escapeHtml, safeUrl, formatDate, starsHTML, heartSVG) live in js/utils.js
// withTimeout, lockSubmit, autoFocusModal, showToast live in js/utils.js
// customConfirm, closeConfirm live in js/modals.js
// loadData, isFavorited, getFavCount live in js/data.js
function updateFavUI(placeId) {
    const isFav = isFavorited(placeId);
    const count = getFavCount(placeId);
    document.querySelectorAll(`.fav-btn[data-place-id="${placeId}"]`).forEach(btn => {
        btn.classList.toggle('active', isFav);
    });
    document.querySelectorAll(`[data-fav-count="${placeId}"]`).forEach(el => {
        el.textContent = count;
    });
    document.querySelectorAll(`[data-fav-count-label="${placeId}"]`).forEach(el => {
        el.textContent = count + ' curtida' + (count !== 1 ? 's' : '');
    });
}
async function toggleFavorite(placeId, e) {
    if (e) e.stopPropagation();
    if (!currentUser) { openModal('account'); return; }
    const wasFav = isFavorited(placeId);
    // Optimistic local update + targeted DOM update
    if (wasFav) {
        favoritesCache = favoritesCache.filter(f => !(f.user_id === currentUser.id && f.place_id === placeId));
    } else {
        favoritesCache.push({ user_id: currentUser.id, place_id: placeId });
    }
    updateFavUI(placeId);
    // If user is on Favoritos tab, the set of visible cards changed — re-render that tab
    const favTab = document.getElementById('tab-favoritos');
    if (favTab && favTab.classList.contains('active')) renderFavoritos();
    // Server sync
    const { error } = wasFav
        ? await sb.from('favorites').delete().eq('user_id', currentUser.id).eq('place_id', placeId)
        : await sb.from('favorites').insert({ user_id: currentUser.id, place_id: placeId });
    if (error) {
        // Rollback
        if (wasFav) {
            favoritesCache.push({ user_id: currentUser.id, place_id: placeId });
        } else {
            favoritesCache = favoritesCache.filter(f => !(f.user_id === currentUser.id && f.place_id === placeId));
        }
        updateFavUI(placeId);
        if (favTab && favTab.classList.contains('active')) renderFavoritos();
        showToast('Não foi possível atualizar o favorito', 'error');
    }
}
// ===== Review likes (optimistic, mirrors toggleFavorite) =====
const reviewHeartSVG = `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
function reviewLikeHTML(reviewId) {
    return `<button class="rev-like-btn ${isReviewLiked(reviewId) ? 'liked' : ''}" data-review-like="${reviewId}" onclick="event.stopPropagation();toggleReviewLike(${reviewId})" aria-label="Curtir avaliação" title="Curtir avaliação">${reviewHeartSVG}<span data-review-like-count="${reviewId}">${getReviewLikeCount(reviewId)}</span></button>`;
}
function updateReviewLikeUI(reviewId) {
    const liked = isReviewLiked(reviewId), count = getReviewLikeCount(reviewId);
    document.querySelectorAll(`[data-review-like="${reviewId}"]`).forEach(b => b.classList.toggle('liked', liked));
    document.querySelectorAll(`[data-review-like-count="${reviewId}"]`).forEach(el => el.textContent = count);
}
async function toggleReviewLike(reviewId) {
    if (!currentUser) { openModal('account'); return; }
    const wasLiked = isReviewLiked(reviewId);
    if (wasLiked) reviewLikesCache = reviewLikesCache.filter(l => !(l.user_id === currentUser.id && l.review_id === reviewId));
    else reviewLikesCache.push({ user_id: currentUser.id, review_id: reviewId });
    updateReviewLikeUI(reviewId);
    const { error } = wasLiked
        ? await sb.from('review_likes').delete().eq('user_id', currentUser.id).eq('review_id', reviewId)
        : await sb.from('review_likes').insert({ user_id: currentUser.id, review_id: reviewId });
    if (error) {
        if (wasLiked) reviewLikesCache.push({ user_id: currentUser.id, review_id: reviewId });
        else reviewLikesCache = reviewLikesCache.filter(l => !(l.user_id === currentUser.id && l.review_id === reviewId));
        updateReviewLikeUI(reviewId);
        showToast('Não foi possível curtir a avaliação', 'error');
    }
}

// ===== Home launchpad: jump into a filtered tab from the Início page =====
function goExplore(opts = {}) {
    categoryFilter = { restaurante: 'Todas', bar: 'Todas' };
    bairroFilter = { restaurante: 'Todos', bar: 'Todos' };
    extraFilter = { michelin: false, delivery: false };
    const tab = opts.tab || 'restaurantes';
    const t = tab === 'bares' ? 'bar' : 'restaurante';
    if (opts.cozinha) categoryFilter[t] = opts.cozinha;
    if (opts.bairro) bairroFilter[t] = opts.bairro;
    if (opts.michelin) extraFilter.michelin = true;
    if (opts.delivery) extraFilter.delivery = true;
    sortBy = opts.sort || 'avaliados';
    const term = opts.search != null ? opts.search : '';
    searchQuery = term.toLowerCase().trim();
    const hi = document.getElementById('search-input');
    if (hi) hi.value = term;
    document.getElementById('search-clear')?.classList.toggle('visible', !!searchQuery);
    resetPage('restaurantes', 'bares', 'popular');
    switchTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function homeSearch(e) {
    if (e && e.key && e.key !== 'Enter') return;
    // Populares shows the whole catalogue, so searching there covers both
    // restaurants and bars (the old target, Restaurantes, missed bars).
    goExplore({ tab: 'popular', search: document.getElementById('home-search')?.value || '' });
}
// Re-render the home greeting once auth resolves (session may land after the
// first render, when the cache is already populated).
function refreshHomeIfActive() {
    if (placesCache.length && document.getElementById('tab-inicio')?.classList.contains('active')) renderHome();
}
function isFollowing(userId) {
    return currentUser && followsCache.some(f => f.follower_id === currentUser.id && f.following_id === userId);
}
async function toggleFollow(userId) {
    if (!currentUser) { openModal('account'); return; }
    if (currentUser.id === userId) return;
    if (isFollowing(userId)) {
        await sb.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
    } else {
        await sb.from('follows').insert({ follower_id: currentUser.id, following_id: userId });
    }
    const { data: follows } = await sb.from('follows').select('*');
    followsCache = follows || [];
    if (document.getElementById('tab-profile').classList.contains('active')) {
        openProfile(userId);
    }
}
// uploadPhoto lives in js/data.js

// Edit place info (admin only)
function openEditPlace(id) {
    const p = getPlaceById(id);
    if (!p || !isAdmin()) return;
    document.getElementById('ep-id').value = id;
    document.getElementById('ep-name').value = p.name || '';
    document.getElementById('ep-type').value = p.type || 'restaurante';
    document.getElementById('ep-category').value = p.category || '';
    document.getElementById('ep-address').value = p.address || '';
    document.getElementById('ep-badge').value = p.badge || '';
    document.getElementById('ep-website').value = p.website || '';
    document.getElementById('ep-fsq-id').value = p.fsq_id || '';
    document.getElementById('ep-lat').value = (p.lat != null) ? p.lat : '';
    document.getElementById('ep-lng').value = (p.lng != null) ? p.lng : '';
    const del = (p.delivery_apps || '').toLowerCase();
    document.getElementById('ep-delivery-rappi').checked = del.includes('rappi');
    document.getElementById('ep-delivery-ifood').checked = del.includes('ifood');
    document.getElementById('ep-fsq-results').innerHTML = '';
    updateFsqStatus(p);
    closeModal('detail');
    document.getElementById('modal-editplace').classList.add('active');
}
function updateFsqStatus(p) {
    const el = document.getElementById('ep-fsq-status');
    if (!el) return;
    const hasCoords = typeof p.lat === 'number' && typeof p.lng === 'number';
    const hasFsq = !!p.fsq_id;
    let txt = '';
    if (hasFsq && hasCoords) txt = '✓ Match com Google · coordenadas OK';
    else if (hasCoords) txt = '⚠️ Tem coordenadas mas sem match no Google';
    else txt = '✗ Sem coordenadas — busque no Google pra preencher';
    el.textContent = txt;
    el.style.color = hasFsq && hasCoords ? '#88c5a4' : (hasCoords ? 'var(--body-light)' : '#e0928a');
}
async function searchFsqMatch() {
    const name = document.getElementById('ep-name').value.trim();
    const address = document.getElementById('ep-address').value.trim();
    if (!name) { showToast('Preencha o nome primeiro', 'error'); return; }
    const resultsEl = document.getElementById('ep-fsq-results');
    resultsEl.innerHTML = '<div class="detail-empty" style="padding:8px">Buscando no Google...</div>';
    try {
        const hood = (address.split(/\s[—-]\s/)[1] || '').trim();
        const q = hood ? `${name} ${hood}` : name;
        const res = await fetch(`/api/places-search?q=${encodeURIComponent(q)}&limit=5`);
        const data = await res.json();
        if (!res.ok || data.error) {
            resultsEl.innerHTML = `<div class="detail-empty" style="padding:8px">Erro: ${escapeHtml(data.error || data.message || 'falha')}</div>`;
            return;
        }
        const places = data.places || [];
        if (!places.length) {
            resultsEl.innerHTML = '<div class="detail-empty" style="padding:8px">Nenhum match encontrado</div>';
            return;
        }
        resultsEl.innerHTML = places.map(p => {
            const pname = p.displayName?.text || '';
            const addr = p.formattedAddress || p.shortFormattedAddress || '';
            const lat = p.location?.latitude;
            const lng = p.location?.longitude;
            const placeId = p.id || '';
            const cat = p.primaryTypeDisplayName?.text || '';
            const rating = p.rating ? ` · ${p.rating.toFixed(1)}★` : '';
            return `<div class="fsq-result-row">
                <div style="flex:1;min-width:0">
                    <div style="color:var(--heading);font-weight:600;font-size:.875rem">${escapeHtml(pname)}</div>
                    <div style="color:var(--body-light);font-size:.75rem">${escapeHtml(cat)}${rating}</div>
                    <div style="color:var(--metadata);font-size:.75rem">${escapeHtml(addr)}</div>
                </div>
                <button type="button" class="btn btn-primary btn-sm" data-lat="${lat}" data-lng="${lng}" data-fsq="${escapeHtml(placeId)}" data-addr="${escapeHtml(addr)}" data-cat="${escapeHtml(cat)}" onclick="applyFsqMatch(this)">Usar</button>
            </div>`;
        }).join('');
    } catch (err) {
        resultsEl.innerHTML = `<div class="detail-empty" style="padding:8px">Erro: ${escapeHtml(err.message)}</div>`;
    }
}
async function applyFsqMatch(btn) {
    const lat = parseFloat(btn.dataset.lat);
    const lng = parseFloat(btn.dataset.lng);
    const fsq = btn.dataset.fsq;
    const addr = btn.dataset.addr;
    const cat = btn.dataset.cat;
    if (Number.isFinite(lat)) document.getElementById('ep-lat').value = lat;
    if (Number.isFinite(lng)) document.getElementById('ep-lng').value = lng;
    if (fsq) document.getElementById('ep-fsq-id').value = fsq;
    if (addr) document.getElementById('ep-address').value = addr;
    const catEl = document.getElementById('ep-category');
    if (cat && !catEl.value.trim()) catEl.value = cat;

    // Fetch + persist photos in the background so the user doesn't have to wait
    const id = parseInt(document.getElementById('ep-id').value);
    const place = getPlaceById(id);
    const resultsEl = document.getElementById('ep-fsq-results');
    resultsEl.innerHTML =
        '<div class="fsq-feedback">✓ Match aplicado. Buscando fotos no Google...</div>';
    try {
        const extras = await fetchGoogleExtras(fsq);
        const newPhotos = extras.photos;
        if (place) {
            const existing = Array.isArray(place.photos) ? place.photos : [];
            const merged = [...existing, ...newPhotos.filter(u => !existing.includes(u))];
            const update = {};
            if (merged.length > existing.length) update.photos = merged;
            if (!place.image_url && newPhotos[0]) update.image_url = newPhotos[0];
            if (extras.website && !place.website) update.website = extras.website;
            if (extras.phone && !place.phone) update.phone = extras.phone;
            if (extras.hours && !place.hours) update.hours = extras.hours;
            if (Object.keys(update).length) {
                await sb.from('places').update(update).eq('id', id);
                Object.assign(place, update);
            }
        }
        const parts = [];
        if (newPhotos.length) parts.push(`${newPhotos.length} foto${newPhotos.length > 1 ? 's' : ''}`);
        if (extras.website) parts.push('site oficial');
        const extra = parts.length ? ` · ${parts.join(' + ')}` : '';
        resultsEl.innerHTML =
            `<div class="fsq-feedback">✓ Match aplicado${extra}. Clique em <strong>Salvar</strong> pra persistir o resto.</div>`;
    } catch (_) {
        resultsEl.innerHTML =
            '<div class="fsq-feedback">✓ Match aplicado. Clique em <strong>Salvar</strong> pra persistir.</div>';
    }
}
async function submitEditPlace(e) {
    e.preventDefault();
    if (!isAdmin()) return;
    const unlock = lockSubmit(e.target, 'Salvando...');
    if (!unlock) return;
    try {
        const id = parseInt(document.getElementById('ep-id').value);
        const latStr = document.getElementById('ep-lat').value;
        const lngStr = document.getElementById('ep-lng').value;
        const lat = latStr === '' ? null : parseFloat(latStr);
        const lng = lngStr === '' ? null : parseFloat(lngStr);
        const fsqId = document.getElementById('ep-fsq-id').value.trim() || null;
        await sb.from('places').update({
            name: document.getElementById('ep-name').value,
            type: document.getElementById('ep-type').value,
            category: document.getElementById('ep-category').value.trim() || null,
            address: document.getElementById('ep-address').value,
            badge: document.getElementById('ep-badge').value,
            website: document.getElementById('ep-website').value.trim() || null,
            delivery_apps: [document.getElementById('ep-delivery-rappi').checked ? 'Rappi' : '', document.getElementById('ep-delivery-ifood').checked ? 'iFood' : ''].filter(Boolean).join(','),
            lat: Number.isFinite(lat) ? lat : null,
            lng: Number.isFinite(lng) ? lng : null,
            fsq_id: fsqId
        }).eq('id', id);
        closeModal('editplace');
        await reloadPlaces();
        openDetail(id);
    } finally { unlock(); }
}

// The header search is redundant on Início (which has its own search), so hide
// it there and show it everywhere else. Reads whichever tab is active.
function toggleHeaderSearch() {
    // Hide with visibility (not display) so the search keeps its space and the
    // nav links stay in the same position as on the other tabs.
    const w = document.querySelector('.header-search');
    if (w) w.style.visibility = document.getElementById('tab-inicio')?.classList.contains('active') ? 'hidden' : '';
}
// Tabs
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
    toggleHeaderSearch();
    renderPageHeader(tab);
    // Render the target tab so changes made from other tabs show up immediately
    if (tab === 'inicio') renderHome();
    else if (tab === 'restaurantes') renderRestaurantes();
    else if (tab === 'bares') renderBares();
    else if (tab === 'popular') renderPopular();
    else if (tab === 'favoritos') renderFavoritos();
    else if (tab === 'amigos') renderAmigos();
}

// Cheap parts run immediately (X button toggle); expensive re-render of three
// grids is debounced so big lists don't lag while the user types.
let _searchDebounce = null;
function handleSearch() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    document.getElementById('search-clear')?.classList.toggle('visible', q.length > 0);
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => {
        searchQuery = q;
        resetPage('restaurantes', 'bares', 'popular');
        renderRestaurantes();
        renderBares();
        renderPopular();
    }, 200);
}
function clearSearch() {
    const el = document.getElementById('search-input');
    el.value = '';
    // Skip debounce on explicit clear — user expects instant reset.
    clearTimeout(_searchDebounce);
    searchQuery = '';
    document.getElementById('search-clear')?.classList.remove('visible');
    resetPage('restaurantes', 'bares', 'popular');
    renderRestaurantes();
    renderBares();
    renderPopular();
    el.focus();
}

// Modal
// Path-based routing for shareable place links (/lugar/123) so social scrapers
// and the SEO function (api/place-page.js) can render per-place meta tags.
// Legacy hash links (#/lugar/123) are still honoured for old shared URLs.
function parseRoute() {
    const path = window.location.pathname.match(/^\/lugar\/(\d+)/);
    if (path) return { type: 'place', id: parseInt(path[1], 10) };
    const hash = window.location.hash.match(/^#\/lugar\/(\d+)$/);
    return hash ? { type: 'place', id: parseInt(hash[1], 10) } : null;
}
function routeToPlace(id) {
    const target = '/lugar/' + id;
    if (window.location.pathname !== target) {
        history.pushState(null, '', target);
    }
}
function clearPlaceRoute() {
    if (/^\/lugar\//.test(window.location.pathname) || /^#\/lugar\//.test(window.location.hash)) {
        history.pushState(null, '', '/' + window.location.search);
    }
}
function applyRoute() {
    const route = parseRoute();
    const modal = document.getElementById('modal-detail');
    const isOpen = modal && modal.classList.contains('active');
    if (route && route.type === 'place') {
        const p = getPlaceById(route.id);
        if (p) {
            openDetail(route.id);
        } else {
            if (isOpen) modal.classList.remove('active');
            history.replaceState(null, '', window.location.pathname + window.location.search);
            // Only toast if the cache has loaded — otherwise applyRoute on init
            // races against loadData and would warn for valid places.
            if (placesCache.length) showToast('Lugar não encontrado', 'error');
        }
    } else if (isOpen) {
        modal.classList.remove('active');
    }
}
// pushState path routing → back/forward fires popstate. Keep hashchange too so
// legacy #/lugar/ links still react.
window.addEventListener('popstate', applyRoute);
window.addEventListener('hashchange', applyRoute);

// openModal, closeModal, overlay click listener live in js/modals.js

// Account/Auth flows (showAccountTab, ensureProfile, sessionToUser,
// registerAccount, loginAccount, logout, loginWithGoogle, openForgotPassword,
// submitForgotPassword, submitResetPassword) live in js/auth.js

// Edit profile
let editProfileAvatarFile = null;
let editProfileAvatarRemove = false;
function avatarMarkup(profile, className, attrs = '') {
    const url = imgSrc(profile?.avatar_url, 128, 128);
    const extra = attrs ? ' ' + attrs : '';
    if (url) {
        return `<img class="${className}" src="${escapeHtml(url)}" alt=""${extra}>`;
    }
    const initials = escapeHtml(((profile?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()));
    return `<div class="${className}"${extra}>${initials}</div>`;
}
function openEditProfile() {
    if (!currentUser) { openModal('account'); return; }
    const profile = getProfile(currentUser.id) || { name: currentUser.name, email: currentUser.email };
    document.getElementById('ep-profile-name').value = profile.name || '';
    document.getElementById('ep-profile-bio').value = profile.bio || '';
    editProfileAvatarFile = null;
    editProfileAvatarRemove = false;
    document.getElementById('ep-avatar-input').value = '';
    document.getElementById('ep-avatar-preview').outerHTML = avatarMarkup(profile, 'profile-avatar') .replace('class="profile-avatar"', 'id="ep-avatar-preview" class="profile-avatar" style="margin:0;flex-shrink:0"');
    document.getElementById('ep-avatar-clear').style.display = profile.avatar_url ? 'inline-block' : 'none';
    document.getElementById('user-dropdown')?.classList.remove('open');
    openModal('editprofile');
}
function previewAvatar(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    editProfileAvatarFile = file;
    editProfileAvatarRemove = false;
    const url = URL.createObjectURL(file);
    document.getElementById('ep-avatar-preview').outerHTML =
        `<img id="ep-avatar-preview" class="profile-avatar" style="margin:0;flex-shrink:0" src="${url}" alt="">`;
    document.getElementById('ep-avatar-clear').style.display = 'inline-block';
}
function clearAvatarPreview() {
    editProfileAvatarFile = null;
    editProfileAvatarRemove = true;
    document.getElementById('ep-avatar-input').value = '';
    const profile = getProfile(currentUser.id) || {};
    const tmp = { ...profile, avatar_url: null };
    document.getElementById('ep-avatar-preview').outerHTML =
        avatarMarkup(tmp, 'profile-avatar').replace('class="profile-avatar"', 'id="ep-avatar-preview" class="profile-avatar" style="margin:0;flex-shrink:0"');
    document.getElementById('ep-avatar-clear').style.display = 'none';
}
async function submitEditProfile(e) {
    e.preventDefault();
    if (!currentUser) return;
    const unlock = lockSubmit(e.target, 'Salvando...');
    if (!unlock) return;
    try {
        const name = document.getElementById('ep-profile-name').value.trim();
        const bio = document.getElementById('ep-profile-bio').value.trim() || null;
        if (!name) { showToast('Nome não pode ficar vazio', 'error'); return; }

        let avatarUrl;
        if (editProfileAvatarFile) {
            const uploaded = await uploadPhoto(editProfileAvatarFile);
            if (!uploaded) { showToast('Falha ao enviar a foto', 'error'); return; }
            avatarUrl = uploaded;
        } else if (editProfileAvatarRemove) {
            avatarUrl = null;
        }

        const update = { name, bio };
        if (avatarUrl !== undefined) update.avatar_url = avatarUrl;
        const { error } = await sb.from('profiles').update(update).eq('id', currentUser.id);
        if (error) { showToast(error.message, 'error'); return; }

        // Sync auth user_metadata so the name shows correctly elsewhere
        await sb.auth.updateUser({ data: { name } });
        currentUser.name = name;

        // Refresh cache and UI
        const { data: profiles } = await sb.from('profiles').select('*');
        profilesCache = profiles || [];
        editProfileAvatarFile = null;
        editProfileAvatarRemove = false;
        closeModal('editprofile');
        updateHeader();
        // Re-render any view currently showing this profile
        if (document.getElementById('tab-profile').classList.contains('active')) {
            openProfile(currentUser.id);
        }
        showToast('Perfil atualizado.', 'success');
    } finally {
        unlock();
    }
}
function toggleDropdown() {
    document.getElementById('user-dropdown').classList.toggle('open');
}
document.addEventListener('click', e => {
    const dd = document.getElementById('user-dropdown');
    if (dd && !e.target.closest('.user-dropdown-wrap')) dd.classList.remove('open');
});

function updateHeader() {
    const user = getUser(); const el = document.getElementById('header-right');
    if (user) {
        const profile = getProfile(user.id);
        const firstName = escapeHtml(user.name.split(' ')[0]);
        const nameEsc = escapeHtml(user.name);
        const emailEsc = escapeHtml(user.email);
        const idEsc = escapeHtml(user.id);
        const avatar = avatarMarkup(profile || { name: user.name }, 'user-badge-avatar');
        el.innerHTML = `
            <div class="user-dropdown-wrap">
                <div class="user-badge" onclick="toggleDropdown()">
                    ${avatar}${firstName}
                </div>
                <div class="user-dropdown" id="user-dropdown">
                    <div class="ud-name">${nameEsc}</div>
                    <span class="ud-email">${emailEsc}</span>
                    <button class="btn btn-outline btn-sm" onclick="openProfile('${idEsc}')" style="width:100%;margin-bottom:8px">Meu perfil</button>
                    <button class="btn btn-ghost btn-sm" onclick="openEditProfile()" style="width:100%;margin-bottom:8px">Editar perfil</button>
                    ${isAdmin() ? `<button class="btn btn-ghost btn-sm" onclick="openFoursquareImport()" style="width:100%;margin-bottom:8px">Importar do Google</button>
                    <button class="btn btn-ghost btn-sm" onclick="openBulkMatch()" style="width:100%;margin-bottom:8px">Match em massa</button>
                    <button class="btn btn-ghost btn-sm" onclick="refreshGoogleExtras()" style="width:100%;margin-bottom:8px">Atualizar sites do Google</button>` : ''}
                    <button class="btn btn-ghost btn-sm" onclick="logout()" style="width:100%">Sair</button>
                </div>
            </div>`;
    } else {
        el.innerHTML = `
            <button class="btn btn-ghost btn-sm hide-on-mobile" onclick="openModal('account')">Criar conta</button>
            <button class="btn btn-outline btn-sm" onclick="openModal('account-login')">Entrar</button>`;
    }
    // Only the admin sees the "+ Restaurante / + Bar" actions.
    document.querySelectorAll('.admin-add').forEach(eln => eln.classList.toggle('is-admin', isAdmin()));
}

// Place
let placeImageFile = null;
function openAddPlace(type) {
    if (!isAdmin()) return; // only the admin can add places
    document.getElementById('p-type').value = type;
    document.getElementById('place-modal-title').textContent = type === 'bar' ? 'Novo bar' : 'Novo restaurante';
    document.getElementById('p-category').placeholder = type === 'bar' ? 'Ex: Cervejaria, Coquetelaria' : 'Ex: Italiana, Japonesa';
    openModal('place');
}
function previewPlaceImage(input) {
    const c = document.getElementById('p-image-preview'); c.innerHTML = '';
    if (input.files[0]) {
        placeImageFile = input.files[0];
        const url = URL.createObjectURL(input.files[0]);
        c.innerHTML = `<div class="image-preview"><img src="${url}"><button class="remove-img" onclick="removePlaceImage()" type="button" aria-label="Remover foto">✕</button></div>`;
    }
}
function removePlaceImage() { placeImageFile = null; document.getElementById('p-image').value = ''; document.getElementById('p-image-preview').innerHTML = ''; }
async function addPlace(e) {
    e.preventDefault();
    if (!isAdmin()) return; // only the admin can add places
    const unlock = lockSubmit(e.target, 'Salvando...');
    if (!unlock) return;
    try {
        let imageUrl = '';
        if (placeImageFile) imageUrl = await uploadPhoto(placeImageFile);
        const { error } = await sb.from('places').insert({
            type: document.getElementById('p-type').value,
            name: document.getElementById('p-name').value,
            category: document.getElementById('p-category').value.trim() || null,
            address: document.getElementById('p-address').value,
            image_url: imageUrl,
            photos: imageUrl ? [imageUrl] : [],
            user_id: currentUser.id
        });
        if (error) { showToast(error.message, 'error'); return; }
        document.getElementById('form-place').reset();
        placeImageFile = null; document.getElementById('p-image-preview').innerHTML = '';
        closeModal('place'); await reloadPlaces();
    } finally { unlock(); }
}

// Add-photo modal flow (addPhotoFiles, openAddPhotoModal, handleAddPhotoFiles,
// renderAddPhotoPreviews, removeAddPhoto, submitAddPhoto), deletePhoto and
// editPlaceImage live in js/photos.js

// Review
let reviewImageFiles = [];
let editExistingImages = []; // existing review photo URLs kept while editing
function reviewSel(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? parseInt(el.value) : null;
}
function readReviewScores() {
    const food = reviewSel('r-food'), ambiance = reviewSel('r-amb'), service = reviewSel('r-svc'), price = reviewSel('r-price');
    if (!food || !ambiance || !service || !price) return null;
    return { food, ambiance, service, price, rating: Math.round((food + ambiance + service + price) / 4) };
}
function updateReviewAvg() {
    const s = readReviewScores();
    const el = document.getElementById('rv-avg');
    if (el) el.innerHTML = s ? `Média: <b>${((s.food + s.ambiance + s.service + s.price) / 4).toFixed(1)}</b>` : 'Média: —';
}
function resetReviewForm() {
    document.getElementById('form-review').reset();
    reviewImageFiles = [];
    editExistingImages = [];
    document.getElementById('rv-image-previews').innerHTML = '';
    const fileInput = document.getElementById('rv-images');
    if (fileInput) fileInput.value = '';
    const subBtn = document.querySelector('#form-review .btn-submit');
    if (subBtn) subBtn.textContent = 'Publicar';
}
function openReviewModal(placeId) {
    if (!getUser()) { openModal('account'); return; }
    // Reset first; reset() clears the hidden fields, so set them after.
    resetReviewForm();
    document.getElementById('review-modal-title').textContent = 'Nova avaliação';
    document.getElementById('rv-place-id').value = placeId;
    document.getElementById('rv-edit-id').value = '';
    updateReviewAvg();
    closeModal('detail');
    openModal('review');
}
// Author edits their own review: pre-fill the modal and switch it to update mode.
function editReview(reviewId, placeId) {
    if (!getUser()) { openModal('account'); return; }
    const rv = reviewsCache.find(r => r.id === reviewId);
    if (!rv) return;
    resetReviewForm();
    document.getElementById('review-modal-title').textContent = 'Editar avaliação';
    document.getElementById('rv-place-id').value = placeId;
    document.getElementById('rv-edit-id').value = reviewId;
    // Pre-fill the 4 categories (old single-rating reviews seed all four from `rating`).
    const base = (v) => (typeof v === 'number' ? v : rv.rating);
    const setStar = (name, val) => { const el = val && document.querySelector(`input[name="${name}"][value="${val}"]`); if (el) el.checked = true; };
    setStar('r-food', base(rv.food)); setStar('r-amb', base(rv.ambiance)); setStar('r-svc', base(rv.service)); setStar('r-price', base(rv.price));
    document.getElementById('rv-text').value = rv.text || '';
    editExistingImages = Array.isArray(rv.images) ? [...rv.images] : [];
    renderReviewPreviews();
    const subBtn = document.querySelector('#form-review .btn-submit');
    if (subBtn) subBtn.textContent = 'Salvar';
    updateReviewAvg();
    closeModal('detail');
    openModal('review');
}
function previewReviewImages(input) {
    reviewImageFiles = reviewImageFiles.concat(Array.from(input.files));
    input.value = '';
    renderReviewPreviews();
}
function renderReviewPreviews() {
    const c = document.getElementById('rv-image-previews');
    const existing = editExistingImages.map((url, i) =>
        `<div class="image-preview"><img src="${escapeHtml(imgSrc(url, 160, 120))}"><button type="button" class="remove-img" onclick="removeExistingReviewImage(${i})" aria-label="Remover foto">&times;</button></div>`).join('');
    const news = reviewImageFiles.map((f, i) =>
        `<div class="image-preview"><img src="${URL.createObjectURL(f)}"><button type="button" class="remove-img" onclick="removeReviewImage(${i})" aria-label="Remover foto">&times;</button></div>`).join('');
    c.innerHTML = existing + news;
}
function removeExistingReviewImage(i) { editExistingImages.splice(i, 1); renderReviewPreviews(); }
function removeReviewImage(i) {
    reviewImageFiles.splice(i, 1);
    renderReviewPreviews();
}
async function addReview(e) {
    e.preventDefault();
    const unlock = lockSubmit(e.target, 'Publicando...');
    if (!unlock) return;
    try {
        const scores = readReviewScores();
        if (!scores) { showToast('Dê nota nas 4 categorias', 'error'); return; }
        const placeId = parseInt(document.getElementById('rv-place-id').value);
        const newUrls = [];
        for (const f of reviewImageFiles) {
            const url = await uploadPhoto(f);
            if (url) newUrls.push(url);
        }
        const editId = parseInt(document.getElementById('rv-edit-id').value) || null;
        const fields = {
            rating: scores.rating,
            food: scores.food, ambiance: scores.ambiance, service: scores.service, price: scores.price,
            text: document.getElementById('rv-text').value
        };
        let error;
        if (editId) {
            const images = [...editExistingImages, ...newUrls];
            ({ error } = await sb.from('reviews').update({ ...fields, images }).eq('id', editId));
        } else {
            ({ error } = await sb.from('reviews').insert({
                ...fields,
                place_id: placeId,
                user_id: currentUser.id,
                author_name: currentUser.name,
                images: newUrls
            }));
        }
        if (error) { showToast(error.message, 'error'); return; }
        resetReviewForm();
        closeModal('review');
        await reloadReviews();
        if (Number.isFinite(placeId)) openDetail(placeId); // back to the place
    } finally { unlock(); }
}

// Delete
async function deletePlace(id) {
    const ok = await customConfirm('Esta ação remove o lugar e todas as avaliações associadas. Não dá pra desfazer.', { title: 'Remover lugar?', okText: 'Remover', danger: true });
    if (!ok) return;
    await sb.from('places').delete().eq('id', id);
    closeModal('detail'); await loadData();
}
async function deleteReview(id, placeId) {
    const ok = await customConfirm('Tem certeza que quer remover esta avaliação?', { title: 'Remover avaliação?', okText: 'Remover', danger: true });
    if (!ok) return;
    await sb.from('reviews').delete().eq('id', id);
    await reloadReviews();
    openDetail(placeId);
}

// Categories
function getCategories(type) {
    const cats = new Set();
    placesCache.forEach(p => { if (p.type === type && p.category) cats.add(p.category); });
    return ['Todas', ...Array.from(cats).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
}
function populateCategoryDatalist() {
    const el = document.getElementById('category-options');
    if (!el) return;
    const all = new Set();
    placesCache.forEach(p => { if (p.category) all.add(p.category); });
    const sorted = Array.from(all).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    el.innerHTML = sorted.map(c => `<option value="${escapeHtml(c)}">`).join('');
}
function getNeighborhoods(type) {
    const set = new Set();
    placesCache.forEach(p => { if (p.type === type) { const b = extractBairro(p.address); if (b) set.add(b); } });
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
}
function rerenderType(type) {
    if (type === 'bar') { resetPage('bares'); renderBares(); }
    else { resetPage('restaurantes'); renderRestaurantes(); }
}
function setCategory(type, cat) { categoryFilter[type] = cat; rerenderType(type); }
function setBairro(type, b) { bairroFilter[type] = b; rerenderType(type); }
function setSort(v) {
    sortBy = v;
    resetPage('restaurantes', 'bares');
    renderRestaurantes(); renderBares();
}
function clearFilters(type) {
    if (type !== 'popular') { categoryFilter[type] = 'Todas'; bairroFilter[type] = 'Todos'; }
    extraFilter = { michelin: false, delivery: false };
    resetPage('restaurantes', 'bares', 'popular');
    renderRestaurantes(); renderBares(); renderPopular();
}
function setOutros(v) {
    extraFilter.michelin = (v === 'michelin');
    extraFilter.delivery = (v === 'delivery');
    resetPage('restaurantes', 'bares');
    renderRestaurantes(); renderBares();
}
function setPopularType(t) {
    popularType = t;
    resetPage('popular');
    renderPopular();
}
const SORT_OPTIONS =[['avaliados', 'Mais avaliados'], ['nota', 'Melhor nota'], ['az', 'A–Z'], ['recentes', 'Recentes']];
function fOption(v, label, selected) {
    return `<option value="${escapeHtml(v)}"${v === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
}
function fBarRight(count, active) {
    return `<div class="fbar-right"><span class="fbar-count"><b>${count}</b> ${count === 1 ? 'resultado' : 'resultados'}</span>`
        + `${active ? `<button class="fclear" data-action="clear">✕ Limpar (${active})</button>` : ''}</div>`;
}
// Michelin / Delivery as one compact dropdown (cleaner than chips on mobile).
function fOutrosSelect() {
    const v = extraFilter.michelin ? 'michelin' : (extraFilter.delivery ? 'delivery' : 'tudo');
    return `<select class="fselect" data-filter="outros">`
        + fOption('tudo', 'Outros: todos', v)
        + fOption('michelin', '★ Michelin', v)
        + fOption('delivery', '🛵 Delivery', v)
        + `</select>`;
}
function buildFilterBar(type, count = 0) {
    const el = document.getElementById('filter-' + (type === 'restaurante' ? 'restaurantes' : 'bares'));
    if (!el) return;
    el.dataset.type = type;
    const catVal = categoryFilter[type], bairroVal = bairroFilter[type];
    const cats = getCategories(type).map(c => fOption(c, c === 'Todas' ? 'Cozinha: todas' : c, catVal)).join('');
    const bairros = getNeighborhoods(type).map(b => fOption(b, b === 'Todos' ? 'Bairro: todos' : b, bairroVal)).join('');
    const sorts = SORT_OPTIONS.map(([v, l]) => fOption(v, 'Ordenar: ' + l.toLowerCase(), sortBy)).join('');
    const active = (catVal !== 'Todas') + (bairroVal !== 'Todos') + extraFilter.michelin + extraFilter.delivery;
    el.innerHTML =
        `<select class="fselect" data-filter="cozinha">${cats}</select>`
        + `<select class="fselect" data-filter="bairro">${bairros}</select>`
        + `<select class="fselect" data-filter="sort">${sorts}</select>`
        + fOutrosSelect() + fBarRight(count, active);
}
function buildPopularFilterBar(count = 0) {
    const el = document.getElementById('filter-popular');
    if (!el) return;
    el.innerHTML =
        `<div class="seg"><button class="seg-btn ${popularType === 'restaurante' ? 'active' : ''}" data-ptype="restaurante">Restaurantes</button>`
        + `<button class="seg-btn ${popularType === 'bar' ? 'active' : ''}" data-ptype="bar">Bares</button></div>`
        + fBarRight(count, 0);
}
function attachFilterHandlers() {
    ['filter-restaurantes', 'filter-bares', 'filter-popular'].forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.dataset.bound) return;
        el.dataset.bound = '1';
        const typeOf = () => el.dataset.type || 'popular';
        el.addEventListener('change', (e) => {
            const sel = e.target.closest('select');
            if (!sel) return;
            if (sel.dataset.filter === 'cozinha') setCategory(typeOf(), sel.value);
            else if (sel.dataset.filter === 'bairro') setBairro(typeOf(), sel.value);
            else if (sel.dataset.filter === 'sort') setSort(sel.value);
            else if (sel.dataset.filter === 'outros') setOutros(sel.value);
        });
        el.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            if (btn.dataset.ptype) setPopularType(btn.dataset.ptype);
            else if (btn.dataset.action === 'clear') clearFilters(typeOf());
        });
    });
}

// Share a place via the per-place URL (/lugar/123), which renders a rich preview
// (photo + rating) on WhatsApp etc. Native share sheet on mobile; copy link else.
async function sharePlace(id) {
    const p = getPlaceById(id);
    if (!p) return;
    const url = `${location.origin}/lugar/${id}`;
    const data = { title: `${p.name} — FoodView`, text: `${p.name}${p.category ? ' · ' + p.category : ''} no FoodView`, url };
    if (navigator.share) {
        try { await navigator.share(data); } catch (_) { /* user dismissed */ }
        return;
    }
    try {
        await navigator.clipboard.writeText(url);
        showToast('Link copiado!', 'success');
    } catch (_) {
        showToast(url, 'info', 6000);
    }
}

// Detail
function openDetail(id) {
    const r = getPlaceById(id); if (!r) return;
    const { avg, count } = getPlaceRating(r.id);
    const rvs = reviewsCache.filter(rv => rv.place_id === r.id);
    const user = getUser();
    const isOwner = user && r.user_id === user.id;
    const admin = isAdmin();
    const canEdit = admin || isOwner;
    const icon = r.name.charAt(0);

    const photos = r.photos || [];
    let photosHTML = '';
    if (photos.length > 0) {
        const show = photos.slice(0, 3);
        const remaining = photos.length - 3;
        photosHTML = `<div class="detail-photo-grid" onclick="openLightbox(${r.id}, 0)">
            ${show.map((p, i) => {
                const src = escapeHtml(imgSrc(p, 400, 400)); // detail photo grid is square
                if (i === 2 && remaining > 0) {
                    return `<div class="photo-more"><img src="${src}" loading="lazy" width="200" height="200"><span>+${remaining}</span></div>`;
                }
                return `<img src="${src}" loading="lazy" width="200" height="200">`;
            }).join('')}
        </div>`;
    }

    const reviewsHTML = rvs.length ? rvs.map(rv => {
        const authorName = rv.author_name || '';
        const authorProfile = getProfile(rv.user_id) || { name: authorName };
        const canDel = user && (rv.user_id === user.id || admin);
        const canEditReview = user && rv.user_id === user.id;
        return `<div class="detail-review">
            <div class="detail-review-top">${avatarMarkup(authorProfile, 'detail-review-avatar')}
                <div><span class="detail-review-author" style="cursor:pointer" onclick="event.stopPropagation();closeModal('detail');openProfile('${escapeHtml(rv.user_id)}')">${escapeHtml(authorName)}</span><span class="detail-review-date"> · ${formatDate(rv.created_at)}</span></div>
            </div>
            <div class="detail-review-stars">${starsHTML(reviewScore(rv))}</div>
            ${typeof rv.food === 'number' ? `<div class="rev-subscores">Comida ${rv.food} · Ambiente ${rv.ambiance} · Atend. ${rv.service} · Preços ${rv.price}</div>` : ''}
            <div class="detail-review-text">${escapeHtml(rv.text || '')}</div>
            ${rv.images?.length ? `<div class="detail-review-images">${rv.images.map(i => `<img class="detail-review-img" src="${escapeHtml(imgSrc(i, 200, 140))}" loading="lazy">`).join('')}</div>` : ''}
            <div class="rev-likes-row">${reviewLikeHTML(rv.id)}${canEditReview ? `<span class="rev-edit" onclick="editReview(${rv.id},${r.id})">editar</span>` : ''}${canDel ? `<span class="rev-remove" onclick="deleteReview(${rv.id},${r.id})">remover</span>` : ''}</div>
        </div>`;
    }).join('') : `<div class="detail-empty review-cta"><p>Ainda sem avaliação — seja o primeiro a avaliar <strong>${escapeHtml(r.name)}</strong>.</p><button class="btn btn-primary btn-sm" onclick="openReviewModal(${r.id})">Avaliar</button></div>`;

    const coverUrl = imgSrc(r.image_url, 1200, 520); // 21:9 hero banner
    const phone = r.phone || '';
    const wa = waLink(phone);
    const openState = isPlaceOpenNow(r.hours); // true / false / null (unknown)
    const weekHours = (r.hours && Array.isArray(r.hours.weekdayDescriptions)) ? r.hours.weekdayDescriptions : [];
    const todayIdx = spWeekdayIndex();
    const todayRaw = weekHours[todayIdx] || '';
    const todayHours = todayRaw.includes(':') ? todayRaw.slice(todayRaw.indexOf(':') + 1).trim() : todayRaw;
    const statusText = openState === null ? 'Horários' : (openState ? 'Aberto agora' : 'Fechado agora');
    const statusClass = openState === null ? '' : (openState ? 'is-open' : 'is-closed');
    // Collapsed by default: status + today's hours on one line; expand for the
    // full week.
    const hoursHTML = weekHours.length ? `
        <details class="detail-hours">
            <summary class="detail-hours-summary">
                <span class="detail-hours-status ${statusClass}">${statusText}</span>
                ${todayHours ? `<span class="detail-hours-today">· Hoje ${escapeHtml(todayHours)}</span>` : ''}
            </summary>
            <ul class="detail-hours-list">${weekHours.map((d, i) => `<li${i === todayIdx ? ' class="today"' : ''}>${escapeHtml(d)}</li>`).join('')}</ul>
        </details>` : '';
    // Per-category averages breakdown (only categories with data).
    const cats = getPlaceCategoryAverages(r.id);
    const catItems = [['Comida', 'food'], ['Ambiente', 'ambiance'], ['Atendimento', 'service'], ['Preços', 'price']]
        .filter(([, k]) => cats[k] != null)
        .map(([label, k]) => `<div class="cat-item"><span class="cat-label">${label}</span><span class="cat-bar"><i style="width:${(cats[k] / 5 * 100).toFixed(0)}%"></i></span><span class="cat-val">${cats[k].toFixed(1)}</span></div>`).join('');
    const catHTML = catItems ? `<div class="cat-breakdown">${catItems}</div>` : '';
    document.getElementById('detail-content').innerHTML = `
        <button class="detail-close" onclick="closeModal('detail')" aria-label="Fechar">&times;</button>
        <div class="detail-header">
            ${coverUrl ? `<img class="detail-image" src="${escapeHtml(coverUrl)}" alt="${escapeHtml(r.name)}" loading="lazy" width="1200" height="520">` : `<div class="detail-image-placeholder">${escapeHtml(icon)}</div>`}
            <div class="detail-info">
                <span class="card-type-tag ${r.type === 'bar' ? 'tag-bar' : 'tag-restaurante'}">${escapeHtml(r.type)}</span>
                ${r.badge ? `<span class="card-badge">${escapeHtml(r.badge)}</span>` : ''}
                <h2>${escapeHtml(r.name)}</h2>
                ${(r.category || r.address) ? `<div class="detail-cuisine">${[r.category, formatAddress(r.address)].filter(Boolean).map(escapeHtml).join(' · ')}</div>` : ''}
                ${count > 0 ? `<div class="detail-rating-row"><span class="detail-avg">${avg}</span><span class="detail-stars">${starsHTML(parseFloat(avg))}</span><span class="detail-count">(${count} ${count === 1 ? 'avaliação' : 'avaliações'})</span></div>` : `<div class="detail-count" style="margin-top:4px">Sem avaliações ainda</div>`}
                ${catHTML}
                <div class="detail-tags">
                    ${r.website && safeUrl(r.website) ? `<span class="detail-tag detail-tag-blue"><a href="${escapeHtml(safeUrl(r.website))}" target="_blank" rel="noopener noreferrer" style="color:inherit">Site oficial</a></span>` : ''}
                    ${phone ? `<span class="detail-tag detail-tag-gray"><a href="tel:${escapeHtml(phone.replace(/\s/g, ''))}" style="color:inherit">Ligar</a></span>` : ''}
                    ${wa ? `<span class="detail-tag detail-tag-green"><a href="${escapeHtml(wa)}" target="_blank" rel="noopener noreferrer" style="color:inherit">WhatsApp</a></span>` : ''}
                    ${r.delivery_apps ? r.delivery_apps.split(',').map(a => `<span class="card-badge badge-delivery">${escapeHtml(a.trim())}</span>`).join('') : ''}
                    <span class="detail-tag detail-tag-gray" data-fav-count-label="${r.id}">${getFavCount(r.id)} curtida${getFavCount(r.id) !== 1 ? 's' : ''}</span>
                </div>
                <div class="detail-actions">
                    <button class="fav-btn ${isFavorited(r.id) ? 'active' : ''}" data-place-id="${r.id}" onclick="toggleFavorite(${r.id})" title="Curtir" aria-label="Curtir">${heartSVG}</button>
                    <button class="btn btn-primary btn-sm" onclick="openReviewModal(${r.id})">Avaliar</button>
                    <button class="btn btn-outline btn-sm" onclick="openAddPhotoModal(${r.id})">Adicionar fotos</button>
                    <button class="btn btn-ghost btn-sm" onclick="sharePlace(${r.id})">Compartilhar</button>
                </div>
                ${canEdit ? `<div class="detail-actions-admin">
                    <button class="btn btn-ghost btn-sm" onclick="editPlaceImage(${r.id})">Editar capa</button>
                    ${admin ? `<button class="btn btn-ghost btn-sm" onclick="openEditPlace(${r.id})">Editar info</button>` : ''}
                    <button class="btn btn-ghost btn-sm detail-remove" onclick="deletePlace(${r.id})">Remover</button>
                </div>` : ''}
            </div>
        </div>
        ${hoursHTML}
        ${photosHTML}
        <hr class="detail-divider">
        <div class="detail-reviews-header"><span class="detail-reviews-title">Avaliações (${count})</span></div>
        ${reviewsHTML}
        ${(typeof r.lat === 'number' && typeof r.lng === 'number') ? `
            <div class="detail-map-header">Localização</div>
            <div id="detail-mini-map" class="detail-mini-map"></div>` : ''}`;
    document.getElementById('modal-detail').classList.add('active');
    routeToPlace(id);
    if (typeof r.lat === 'number' && typeof r.lng === 'number') {
        renderDetailMiniMap(r);
    } else {
        if (_detailMap) { try { _detailMap.remove(); } catch (_) {} _detailMap = null; }
    }
}

// Lazy-load Leaflet (CSS + JS) only when a map is actually opened. Saves
// ~150KB on first paint for users who never view the favorites/detail map.
let _leafletPromise = null;
function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (_leafletPromise) return _leafletPromise;
    _leafletPromise = new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Leaflet failed to load'));
        document.head.appendChild(script);
    });
    return _leafletPromise;
}

let _detailMap = null;
async function renderDetailMiniMap(r) {
    await loadLeaflet();
    const el = document.getElementById('detail-mini-map');
    if (!el) return;
    if (_detailMap) { try { _detailMap.remove(); } catch (_) {} _detailMap = null; }
    _detailMap = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([r.lat, r.lng], 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(_detailMap);
    L.circleMarker([r.lat, r.lng], { radius: 8, color: '#fff', weight: 2, fillColor: '#D4593A', fillOpacity: .95 }).addTo(_detailMap);
    keepLeafletSized(_detailMap, el);
}

// Schedule a few invalidateSize calls + observe future size changes. Without
// this, Leaflet tile-pads at the size it had on init and never asks for the
// missing tiles when the container later grows (modal scroll-in, viewport
// resize, fonts loading, etc), leaving white gaps in the map.
function keepLeafletSized(map, el) {
    const refresh = () => { try { map.invalidateSize(); } catch (_) {} };
    requestAnimationFrame(refresh);
    setTimeout(refresh, 100);
    setTimeout(refresh, 350);
    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(refresh);
        ro.observe(el);
        // Stop observing once the map is removed so we don't leak.
        const origRemove = map.remove.bind(map);
        map.remove = () => { try { ro.disconnect(); } catch (_) {} return origRemove(); };
    }
}

// Lightbox (openLightbox, closeLightbox, lightboxNav, updateLightbox,
// lightboxDelete + keydown listener) lives in js/photos.js

// Escape closes the topmost open modal (skips lightbox, which has its own handler).
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('lightbox').classList.contains('active')) return;
    // Confirm modal first (highest stacked)
    const confirmEl = document.getElementById('modal-confirm');
    if (confirmEl?.classList.contains('active')) { closeConfirm(false); return; }
    // Find any other open modal — close the highest one (last in DOM order with .active)
    const open = Array.from(document.querySelectorAll('.modal-overlay.active')).pop();
    if (!open) return;
    open.classList.remove('active');
    if (open.id === 'modal-detail') clearPlaceRoute();
});

// Profile
function openProfile(userId) {
    const profile = getProfile(userId);
    if (!profile) return;
    const userReviews = reviewsCache.filter(rv => rv.user_id === userId);
    const userFavs = favoritesCache.filter(f => f.user_id === userId);
    const followers = followsCache.filter(f => f.following_id === userId);
    const following = followsCache.filter(f => f.follower_id === userId);
    const isMe = currentUser && currentUser.id === userId;

    const reviewsHTML = userReviews.length ? userReviews.map(rv => {
        const place = getPlaceById(rv.place_id);
        return `<div class="detail-review" style="cursor:pointer" onclick="openDetail(${rv.place_id})">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <strong style="color:var(--heading)">${escapeHtml(place ? place.name : 'Desconhecido')}</strong>
                <span class="detail-review-date">${formatDate(rv.created_at)}</span>
            </div>
            <div class="detail-review-stars">${starsHTML(reviewScore(rv))}</div>
            <div class="detail-review-text">${escapeHtml(rv.text || '')}</div>
        </div>`;
    }).join('') : '<div class="detail-empty">Nenhuma avaliação ainda.</div>';

    const favPlaces = userFavs.map(f => getPlaceById(f.place_id)).filter(Boolean);
    const favsWithCoords = favPlaces.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number');
    const favsHTML = favPlaces.length
        ? `<div class="restaurant-grid" style="margin-top:16px">${favPlaces.map(p => renderCard(p)).join('')}</div>`
        : '<div class="detail-empty">Nenhum favorito ainda.</div>';
    const favMapHTML = favsWithCoords.length
        ? `<div id="profile-map" style="height:360px;border-radius:var(--radius-md);overflow:hidden;background:var(--surface-alt);margin-top:8px"></div>`
        : (favPlaces.length
            ? `<p style="color:var(--metadata);font-size:.8125rem;margin-top:8px">Nenhum favorito tem coordenadas. Use "Editar info" → "Buscar no Google" pra preencher.</p>`
            : '');

    const action = isMe
        ? `<button class="btn btn-outline btn-sm" onclick="openEditProfile()">Editar perfil</button>`
        : (currentUser ? `<button class="follow-btn ${isFollowing(userId) ? 'follow-btn-following' : 'follow-btn-follow'}" onclick="toggleFollow('${escapeHtml(userId)}')">${isFollowing(userId) ? 'Seguindo' : 'Seguir'}</button>` : '');
    const bioHTML = profile.bio ? `<p style="color:var(--body);font-size:.9375rem;margin:0 0 16px">${escapeHtml(profile.bio)}</p>` : '';
    const nameHTML = `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px"><h2 style="font-size:1.25rem;color:var(--heading)">${escapeHtml(profile.name)}</h2><span style="color:var(--metadata);font-size:.8125rem">${escapeHtml(profile.email || '')}</span></div>`;
    document.getElementById('profile-content').innerHTML = `
        <div class="profile-header">
            ${avatarMarkup(profile, 'profile-avatar')}
            <div class="profile-stats">
                <div class="profile-stat"><strong>${userReviews.length}</strong><span>avaliações</span></div>
                <div class="profile-stat"><strong>${userFavs.length}</strong><span>favoritos</span></div>
                <div class="profile-stat"><strong>${followers.length}</strong><span>seguidores</span></div>
                <div class="profile-stat"><strong>${following.length}</strong><span>seguindo</span></div>
            </div>
            ${action}
        </div>
        ${nameHTML}
        ${bioHTML}
        <h3 style="margin-bottom:12px">Favoritos</h3>
        ${favsHTML}
        <h3 style="margin:24px 0 12px">Avaliações</h3>
        ${reviewsHTML}
        <h3 style="margin:24px 0 12px">Favoritos no mapa</h3>
        ${favMapHTML}
    `;
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-profile').classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    renderPageHeader('profile'); // hides the editorial header on the profile page
    toggleHeaderSearch();
    if (favsWithCoords.length) renderProfileMap(favsWithCoords);
}

// renderCard, filterByType, renderRestaurantes/Bares/Popular/Favoritos/Amigos,
// render — moved to js/render.js

// ===== Profile map (renders user's favorites with coords on Leaflet) =====
let _profileMap = null;
let _profileMarkers = [];
async function renderProfileMap(places) {
    await loadLeaflet();
    const el = document.getElementById('profile-map');
    if (!el) return;
    if (!_profileMap || _profileMap.getContainer() !== el) {
        if (_profileMap) { try { _profileMap.remove(); } catch (_) {} }
        _profileMap = L.map(el, { scrollWheelZoom: false }).setView([-23.5613, -46.6562], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(_profileMap);
        keepLeafletSized(_profileMap, el);
    }
    _profileMarkers.forEach(m => m.remove());
    _profileMarkers = [];
    if (!places.length) return;
    places.forEach(p => {
        const marker = L.circleMarker([p.lat, p.lng], { radius: 8, color: '#fff', weight: 2, fillColor: '#D4593A', fillOpacity: .95 }).addTo(_profileMap);
        const html = `<div class="map-popup">
            <div class="map-popup-name">${escapeHtml(p.name)}</div>
            ${p.category ? `<div class="map-popup-cat">${escapeHtml(p.category)}</div>` : ''}
            <button class="btn btn-primary btn-sm" onclick="openDetail(${p.id})">Ver detalhes</button>
        </div>`;
        marker.bindPopup(html, { autoPan: true, autoPanPadding: [40, 40], offset: L.point(0, -8), closeButton: true, maxWidth: 240 });
        _profileMarkers.push(marker);
    });
    const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]));
    _profileMap.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
}
// Admin one-shot: backfill website / phone / hours (and missing photos) from
// Google for every place with an fsq_id that's still missing any of them.
async function refreshGoogleExtras() {
    if (!isAdmin()) return;
    const targets = placesCache.filter(p => p.fsq_id && (!p.website || !p.phone || !p.hours));
    if (!targets.length) { showToast('Nada pra atualizar', 'info'); return; }
    if (!await customConfirm(`Buscar site oficial no Google para ${targets.length} lugares? Demora ≈${Math.ceil(targets.length / 2)}s.`, { title: 'Atualizar sites?', okText: 'Atualizar' })) return;
    showToast(`Atualizando ${targets.length}...`, 'info', 3000);
    let ok = 0, fail = 0;
    for (const p of targets) {
        try {
            const extras = await fetchGoogleExtras(p.fsq_id);
            const update = {};
            if (extras.website) update.website = extras.website;
            if (extras.phone && !p.phone) update.phone = extras.phone;
            if (extras.hours && !p.hours) update.hours = extras.hours;
            const existing = Array.isArray(p.photos) ? p.photos : [];
            const merged = [...existing, ...extras.photos.filter(u => !existing.includes(u))];
            if (merged.length > existing.length) update.photos = merged;
            if (!p.image_url && extras.photos[0]) update.image_url = extras.photos[0];
            if (Object.keys(update).length) {
                const { error } = await sb.from('places').update(update).eq('id', p.id);
                if (error) { fail++; continue; }
                Object.assign(p, update);
                ok++;
            } else { fail++; }
        } catch (_) { fail++; }
    }
    showToast(`${ok} atualizados, ${fail} sem dados`, ok ? 'success' : 'info', 5000);
}

// ===== Foursquare bulk match (admin) =====
let _bulkQueue = [];
let _bulkIndex = 0;
let _bulkStats = { matched: 0, skipped: 0 };
function openBulkMatch() {
    if (!isAdmin()) return;
    document.getElementById('user-dropdown')?.classList.remove('open');
    _bulkQueue = placesCache.filter(p => !p.fsq_id);
    _bulkIndex = 0;
    _bulkStats = { matched: 0, skipped: 0 };
    if (!_bulkQueue.length) {
        showToast('Todos os lugares já têm match com Foursquare', 'info');
        return;
    }
    openModal('fsqBulk');
    loadBulkCurrent();
}
async function loadBulkCurrent() {
    const skipBtn = document.getElementById('bulk-skip-btn');
    if (_bulkIndex >= _bulkQueue.length) {
        renderBulkDone();
        return;
    }
    const p = _bulkQueue[_bulkIndex];
    document.getElementById('bulk-progress').textContent = `${_bulkIndex + 1} de ${_bulkQueue.length}`;
    if (skipBtn) skipBtn.style.display = '';
    document.getElementById('bulk-current').innerHTML =
        `<div style="padding:12px;background:var(--surface-alt);border-radius:var(--radius-sm);margin-bottom:12px">
            <div style="font-weight:700;color:var(--heading)">${escapeHtml(p.name)}</div>
            <div style="font-size:.8125rem;color:var(--body-light);margin-top:2px">${escapeHtml(p.type)}${p.address ? ' · ' + escapeHtml(p.address) : ''}</div>
            ${p.badge ? `<div style="font-size:.75rem;color:var(--metadata);margin-top:2px">${escapeHtml(p.badge)}</div>` : ''}
        </div>`;
    document.getElementById('bulk-results').innerHTML = '<div class="detail-empty" style="padding:8px">Buscando no Google...</div>';
    try {
        const hood = (p.address && p.address.split(/\s[—-]\s/)[1] || '').trim();
        const q = hood ? `${p.name} ${hood}` : p.name;
        const res = await fetch(`/api/places-search?q=${encodeURIComponent(q)}&limit=5`);
        const data = await res.json();
        if (!res.ok || data.error) {
            document.getElementById('bulk-results').innerHTML =
                `<div class="detail-empty" style="padding:8px">Erro: ${escapeHtml(data.error || data.message || 'falha')}</div>`;
            return;
        }
        const results = data.places || [];
        if (!results.length) {
            document.getElementById('bulk-results').innerHTML =
                '<div class="detail-empty" style="padding:8px">Nenhum match encontrado. Use "Pular".</div>';
            return;
        }
        document.getElementById('bulk-results').innerHTML = results.map(r => {
            const rname = r.displayName?.text || '';
            const addr = r.formattedAddress || r.shortFormattedAddress || '';
            const lat = r.location?.latitude;
            const lng = r.location?.longitude;
            const placeId = r.id || '';
            const cat = r.primaryTypeDisplayName?.text || '';
            const rating = r.rating ? ` · ${r.rating.toFixed(1)}★` : '';
            return `<div class="fsq-result-row">
                <div style="flex:1;min-width:0">
                    <div style="color:var(--heading);font-weight:600;font-size:.875rem">${escapeHtml(rname)}</div>
                    <div style="color:var(--body-light);font-size:.75rem">${escapeHtml(cat)}${rating}</div>
                    <div style="color:var(--metadata);font-size:.75rem">${escapeHtml(addr)}</div>
                </div>
                <button type="button" class="btn btn-primary btn-sm"
                    data-lat="${lat}" data-lng="${lng}" data-fsq="${escapeHtml(placeId)}"
                    data-addr="${escapeHtml(addr)}" data-cat="${escapeHtml(cat)}"
                    onclick="applyBulkMatch(this)">Match</button>
            </div>`;
        }).join('');
    } catch (err) {
        document.getElementById('bulk-results').innerHTML =
            `<div class="detail-empty" style="padding:8px">Erro: ${escapeHtml(err.message)}</div>`;
    }
}
// Google photo URLs (photoUri) are temporary and expire. Re-host them on
// Supabase Storage before persisting so imported places keep their images.
// Best-effort: on any failure (incl. the endpoint missing its service key)
// the originals are returned unchanged so import still succeeds.
async function rehostPhotos(urls) {
    const list = (urls || []).filter(u => typeof u === 'string' && u);
    if (!list.length) return [];
    try {
        const res = await fetch('/api/rehost-photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: list })
        });
        if (!res.ok) return list; // e.g. 501 when SUPABASE_SERVICE_KEY isn't set
        const data = await res.json();
        const out = Array.isArray(data.urls) ? data.urls : [];
        return list.map((u, i) => out[i] || u);
    } catch (_) {
        return list;
    }
}
async function fetchGoogleExtras(placeId) {
    // Returns { photos, website, phone, hours } with photos already re-hosted on
    // Supabase Storage (callers persist these directly).
    const empty = { photos: [], website: null, phone: null, hours: null };
    if (!placeId) return empty;
    try {
        const r = await fetch(`/api/places-details?id=${encodeURIComponent(placeId)}`);
        if (!r.ok) return empty;
        const data = await r.json();
        const d = data.details || {};
        return {
            photos: await rehostPhotos(Array.isArray(data.photos) ? data.photos : []),
            website: d.websiteUri || null,
            phone: d.internationalPhoneNumber || d.nationalPhoneNumber || null,
            hours: d.regularOpeningHours || null
        };
    } catch (_) { return empty; }
}
async function applyBulkMatch(btn) {
    const p = _bulkQueue[_bulkIndex];
    if (!p) return;
    const lat = parseFloat(btn.dataset.lat);
    const lng = parseFloat(btn.dataset.lng);
    const fsq = btn.dataset.fsq;
    const addr = btn.dataset.addr;
    const cat = btn.dataset.cat;
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = 'Buscando dados...';
    const extras = await fetchGoogleExtras(fsq);
    const newPhotos = extras.photos;
    btn.textContent = 'Salvando...';
    const update = {
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        fsq_id: fsq || null
    };
    if (addr) update.address = addr;
    if (cat && !p.category) update.category = cat;
    if (extras.website && !p.website) update.website = extras.website;
    if (extras.phone && !p.phone) update.phone = extras.phone;
    if (extras.hours && !p.hours) update.hours = extras.hours;
    const existingPhotos = Array.isArray(p.photos) ? p.photos : [];
    const mergedPhotos = [...existingPhotos, ...newPhotos.filter(u => !existingPhotos.includes(u))];
    if (mergedPhotos.length > existingPhotos.length) update.photos = mergedPhotos;
    if (!p.image_url && newPhotos[0]) update.image_url = newPhotos[0];
    const { error } = await sb.from('places').update(update).eq('id', p.id);
    if (error) {
        showToast(error.message, 'error');
        btn.disabled = false; btn.textContent = prev;
        return;
    }
    Object.assign(p, update);
    _bulkStats.matched++;
    _bulkIndex++;
    loadBulkCurrent();
}
function skipBulkMatch() {
    if (_bulkIndex >= _bulkQueue.length) return;
    _bulkStats.skipped++;
    _bulkIndex++;
    loadBulkCurrent();
}
function renderBulkDone() {
    document.getElementById('bulk-progress').textContent = 'Concluído';
    const skipBtn = document.getElementById('bulk-skip-btn');
    if (skipBtn) skipBtn.style.display = 'none';
    document.getElementById('bulk-current').innerHTML =
        `<div style="text-align:center;padding:24px 12px">
            <div style="font-size:1.0625rem;font-weight:700;color:var(--heading);margin-bottom:6px">✓ Concluído</div>
            <div style="color:var(--body-light);font-size:.875rem">${_bulkStats.matched} matches · ${_bulkStats.skipped} pulados</div>
        </div>`;
    document.getElementById('bulk-results').innerHTML = '';
    reloadPlaces();
}

// ===== Foursquare import (admin) =====
let fsqType = 'restaurante';
function setFsqType(t) {
    fsqType = t;
    document.getElementById('fsq-type-restaurante').classList.toggle('active', t === 'restaurante');
    document.getElementById('fsq-type-bar').classList.toggle('active', t === 'bar');
}
function openFoursquareImport() {
    if (!isAdmin()) return;
    document.getElementById('user-dropdown')?.classList.remove('open');
    document.getElementById('fsq-q').value = '';
    document.getElementById('fsq-results').innerHTML = '';
    setFsqType('restaurante');
    openModal('fsq');
}
async function searchFoursquare() {
    const q = document.getElementById('fsq-q').value.trim();
    if (!q) return;
    const resultsEl = document.getElementById('fsq-results');
    resultsEl.innerHTML = '<div class="detail-empty">Buscando no Google...</div>';
    try {
        const res = await fetch(`/api/places-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok || data.error) {
            resultsEl.innerHTML = `<div class="detail-empty">Erro: ${escapeHtml(data.error || data.message || 'falha na busca')}</div>`;
            return;
        }
        const places = data.places || [];
        if (!places.length) {
            resultsEl.innerHTML = '<div class="detail-empty">Nenhum resultado</div>';
            return;
        }
        resultsEl.innerHTML = places.map(p => {
            const name = p.displayName?.text || '';
            const addr = p.formattedAddress || p.shortFormattedAddress || '';
            const cat = p.primaryTypeDisplayName?.text || '';
            const placeId = p.id || '';
            const exists = placeId && placesCache.some(local => local.fsq_id === placeId);
            return `<div style="padding:12px;border-bottom:1px solid var(--divider);display:flex;justify-content:space-between;align-items:center;gap:12px">
                <div style="flex:1;min-width:0">
                    <div style="color:var(--heading);font-weight:700;font-size:.9375rem">${escapeHtml(name)}</div>
                    <div style="color:var(--body-light);font-size:.8125rem;margin-top:2px">${escapeHtml(cat)}</div>
                    <div style="color:var(--metadata);font-size:.75rem;margin-top:2px">${escapeHtml(addr)}</div>
                </div>
                ${exists
                    ? '<span style="color:var(--metadata);font-size:.75rem">já existe</span>'
                    : `<button class="btn btn-primary btn-sm" data-fsq-id="${escapeHtml(placeId)}" onclick="importFromFoursquare(this)">Importar</button>`}
            </div>`;
        }).join('');
    } catch (err) {
        resultsEl.innerHTML = `<div class="detail-empty">Erro: ${escapeHtml(err.message)}</div>`;
    }
}
async function importFromFoursquare(btn) {
    const placeId = btn.dataset.fsqId;
    if (!placeId) return;
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = 'Importando...';
    try {
        const res = await fetch(`/api/places-details?id=${encodeURIComponent(placeId)}`);
        const payload = await res.json();
        if (!res.ok || payload.error) {
            showToast('Google: ' + (payload.error || 'falha'), 'error');
            btn.disabled = false; btn.textContent = prev; return;
        }
        const { details, photos } = payload;
        const name = details.displayName?.text || '';
        const lat = details.location?.latitude;
        const lng = details.location?.longitude;
        const address = details.formattedAddress || details.shortFormattedAddress || '';
        const category = details.primaryTypeDisplayName?.text || null;
        // Re-host Google photos on Supabase so they don't expire (see rehostPhotos).
        const photoUrls = await rehostPhotos(Array.isArray(photos) ? photos : []);

        const { error } = await sb.from('places').insert({
            type: fsqType,
            name,
            category,
            address,
            lat: typeof lat === 'number' ? lat : null,
            lng: typeof lng === 'number' ? lng : null,
            image_url: photoUrls[0] || '',
            photos: photoUrls,
            fsq_id: details.id || placeId,
            website: details.websiteUri || null,
            phone: details.internationalPhoneNumber || details.nationalPhoneNumber || null,
            hours: details.regularOpeningHours || null,
            user_id: currentUser?.id || null
        });
        if (error) {
            showToast(error.message, 'error');
            btn.disabled = false; btn.textContent = prev; return;
        }
        btn.textContent = '✓ Importado';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-ghost');
        await reloadPlaces();
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
        btn.disabled = false; btn.textContent = prev;
    }
}

// Init — render whatever we can even if auth is slow or broken
async function init() {
    attachFilterHandlers();
    renderSkeletons();
    renderHomeSkeleton();
    // Load public data first so anonymous users always see content even if the
    // Supabase auth layer is hanging or misbehaving on the client.
    withTimeout(loadData(), 10000, 'loadData')
        .catch(err => {
            console.error('loadData failed:', err);
            showToast('Não foi possível carregar os dados. Verifique sua conexão.', 'error', 6000);
        });
    // Auth state in parallel — never blocks render
    withTimeout(sb.auth.getSession(), 5000, 'getSession')
        .then(({ data: { session } }) => {
            currentUser = sessionToUser(session);
            updateHeader();
            refreshHomeIfActive();
        })
        .catch(err => {
            console.error('getSession failed:', err);
        });
    applyRoute();

    // React to auth changes (logout in another tab, token refresh,
    // post-email-confirmation redirect, etc.)
    sb.auth.onAuthStateChange(async (event, session) => {
        if (event === 'INITIAL_SESSION') {
            currentUser = sessionToUser(session);
            updateHeader();
            refreshHomeIfActive();
            return;
        }
        if (event === 'TOKEN_REFRESHED') {
            currentUser = sessionToUser(session);
            return;
        }
        if (event === 'PASSWORD_RECOVERY') {
            openModal('reset');
            return;
        }
        if (event === 'SIGNED_IN') {
            currentUser = sessionToUser(session);
            ensureProfile().catch(() => {});
            updateHeader();
            loadData().catch(err => console.error('loadData failed:', err));
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateHeader();
            loadData().catch(err => console.error('loadData failed:', err));
        } else if (event === 'USER_UPDATED') {
            currentUser = sessionToUser(session);
            updateHeader();
        }
    });
}
init();

function toggleMobileSidebar() {
    const open = document.getElementById('mobile-sidebar').classList.toggle('open');
    document.getElementById('mobile-sidebar-overlay').classList.toggle('open');
    document.querySelector('.hamburger')?.setAttribute('aria-expanded', String(open));
}
function sidebarNav(tab) {
    toggleMobileSidebar();
    switchTab(tab);
    document.querySelectorAll('.mobile-sidebar a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
}
