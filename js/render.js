// HTML rendering for grids, cards, infinite scroll, skeletons.
// Loaded after data.js (reads caches) and before app.js (which calls render()
// during init/refreshes). Cross-file calls (openDetail, toggleFavorite,
// avatarMarkup, openProfile, openAddPlace, buildFilterBar, buildPopularFilterBar,
// renderProfileMap) live in app.js and resolve at call-time.

// ===== Pagination =====
const PAGE_SIZE = 24;
const AMIGOS_PAGE = 20;
let visibleCount = {
    restaurantes: PAGE_SIZE,
    bares: PAGE_SIZE,
    popular: PAGE_SIZE,
    favoritos: PAGE_SIZE,
    amigos: AMIGOS_PAGE
};
function resetPage(...grids) {
    for (const g of grids) {
        visibleCount[g] = g === 'amigos' ? AMIGOS_PAGE : PAGE_SIZE;
    }
}
function loadMore(grid) {
    visibleCount[grid] += (grid === 'amigos' ? AMIGOS_PAGE : PAGE_SIZE);
    if (grid === 'restaurantes') renderRestaurantes();
    else if (grid === 'bares') renderBares();
    else if (grid === 'popular') renderPopular();
    else if (grid === 'favoritos') renderFavoritos();
    else if (grid === 'amigos') renderAmigos();
}
const _loadMoreIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const grid = entry.target.dataset.grid;
        _loadMoreIO.unobserve(entry.target);
        if (grid) loadMore(grid);
    }
}, { rootMargin: '300px' });
function loadMoreHTML(gridKey, total, shown, isFeed) {
    if (shown >= total) return '';
    const remaining = total - shown;
    const span = isFeed ? '' : 'grid-column:1/-1;';
    return `<div class="load-more-wrap" style="${span}text-align:center;padding:20px 0">
        <button class="btn btn-outline btn-sm" onclick="loadMore('${gridKey}')">Carregar mais (${remaining})</button>
        <div class="load-more-sentinel" data-grid="${gridKey}" style="height:1px"></div>
    </div>`;
}
function attachLoadMoreObserver(containerEl) {
    if (!containerEl) return;
    const sentinel = containerEl.querySelector('.load-more-sentinel');
    if (sentinel) _loadMoreIO.observe(sentinel);
}

// ===== Skeletons =====
function renderSkeletons() {
    const card = `
        <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton-line skeleton-line-sm"></div>
                <div class="skeleton-line skeleton-line-lg"></div>
                <div class="skeleton-line skeleton-line-md"></div>
            </div>
        </div>`;
    const html = card.repeat(8);
    ['grid-restaurantes', 'grid-bares', 'popular-grid'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.children.length) el.innerHTML = html;
    });
    const hero = document.getElementById('hero-slides');
    if (hero && !hero.children.length) hero.innerHTML = '<div class="hero-skeleton"></div>';
}

// ===== Cards & grids =====
function renderCard(r, options = {}) {
    const { avg, count } = getPlaceRating(r.id);
    const rank = options.rank;
    const name = escapeHtml(r.name);
    const img = safeUrl(r.image_url);
    return `<div class="restaurant-card ${rank ? 'popular-card' : ''}" onclick="openDetail(${r.id})">
        ${rank ? `<div class="rank-badge">#${rank}</div>` : ''}
        ${img ? `<img class="card-image" src="${escapeHtml(img)}" alt="${name}" loading="lazy" width="300" height="200">` : `<div class="card-image-placeholder">${escapeHtml(r.name.charAt(0))}</div>`}
        <div class="card-body">
            <span class="card-type-tag ${r.type === 'bar' ? 'tag-bar' : 'tag-restaurante'}">${escapeHtml(r.type)}</span>
            ${r.badge ? `<span class="card-badge">${escapeHtml(r.badge)}</span>` : ''}
            ${r.delivery_apps ? r.delivery_apps.split(',').map(a => `<span class="card-badge" style="background:#f3e5f5;color:#7b1fa2">${escapeHtml(a.trim())}</span>`).join('') : ''}
            <h3>${name}</h3>
            ${(r.category || r.address) ? `<div class="card-cuisine">${[r.category, r.address].filter(Boolean).map(escapeHtml).join(' · ')}</div>` : ''}
            <div class="card-rating">
                ${count > 0 ? `<span class="card-stars">${starsHTML(parseFloat(avg))}</span><span class="card-rating-num">${avg}</span><span class="card-reviews-count">(${count})</span>` : `<span class="card-reviews-count">Sem avaliações</span>`}
            </div>
            ${rank ? `<div class="popular-stats"><span class="popular-stat">${count} avaliações</span><span class="popular-stat">${avg} média</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
                <button class="fav-btn ${isFavorited(r.id) ? 'active' : ''}" data-place-id="${r.id}" onclick="event.stopPropagation();toggleFavorite(${r.id})" title="Curtir" aria-label="Curtir">${heartSVG}</button>
                <span style="font-size:.75rem;color:var(--metadata)" data-fav-count="${r.id}">${getFavCount(r.id)}</span>
            </div>
        </div>
    </div>`;
}

function filterByType(type) {
    let list = placesCache.filter(p => p.type === type);
    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery) || (p.category && p.category.toLowerCase().includes(searchQuery)) || (p.address && p.address.toLowerCase().includes(searchQuery)));
    const cat = categoryFilter[type];
    if (cat && cat !== 'Todas') list = list.filter(p => p.category === cat);
    if (extraFilter.michelin) list = list.filter(p => michelinStars(p) > 0);
    if (extraFilter.delivery) list = list.filter(p => p.delivery_apps);
    if (extraFilter.reservation) list = list.filter(p => p.has_reservation);
    list.sort((a, b) => michelinStars(b) - michelinStars(a) || a.name.localeCompare(b.name, 'pt-BR'));
    return list;
}

function renderRestaurantes() {
    buildFilterBar('restaurante');
    const rests = filterByType('restaurante');
    const el = document.getElementById('grid-restaurantes');
    if (!rests.length) {
        el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>${searchQuery ? 'Nenhum restaurante encontrado.' : 'Nenhum restaurante adicionado ainda.'}</p>${!searchQuery ? '<button class="btn btn-primary" onclick="openAddPlace(\'restaurante\')">Adicionar o primeiro</button>' : ''}</div>`;
        return;
    }
    const shown = Math.min(visibleCount.restaurantes, rests.length);
    el.innerHTML = rests.slice(0, shown).map(r => renderCard(r)).join('') + loadMoreHTML('restaurantes', rests.length, shown);
    attachLoadMoreObserver(el);
}

function renderBares() {
    buildFilterBar('bar');
    const bars = filterByType('bar');
    const el = document.getElementById('grid-bares');
    if (!bars.length) {
        el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>${searchQuery ? 'Nenhum bar encontrado.' : 'Nenhum bar adicionado ainda.'}</p>${!searchQuery ? '<button class="btn btn-primary" onclick="openAddPlace(\'bar\')">Adicionar o primeiro</button>' : ''}</div>`;
        return;
    }
    const shown = Math.min(visibleCount.bares, bars.length);
    el.innerHTML = bars.slice(0, shown).map(r => renderCard(r)).join('') + loadMoreHTML('bares', bars.length, shown);
    attachLoadMoreObserver(el);
}

function renderPopular() {
    buildPopularFilterBar();
    let all = searchQuery ? placesCache.filter(p => p.name.toLowerCase().includes(searchQuery) || (p.category && p.category.toLowerCase().includes(searchQuery)) || (p.address && p.address.toLowerCase().includes(searchQuery))) : placesCache;
    if (extraFilter.michelin) all = all.filter(p => michelinStars(p) > 0);
    if (extraFilter.delivery) all = all.filter(p => p.delivery_apps);
    if (extraFilter.reservation) all = all.filter(p => p.has_reservation);
    const ranked = all.map(r => ({ ...r, ...getPlaceRating(r.id) })).filter(r => r.count > 0).sort((a, b) => b.count - a.count || parseFloat(b.avg) - parseFloat(a.avg));
    const active = searchQuery || extraFilter.michelin || extraFilter.delivery || extraFilter.reservation;
    const el = document.getElementById('popular-grid');
    if (!ranked.length) {
        el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>${active ? 'Nenhum resultado com esses filtros.' : 'Ainda não há lugares com avaliações.'}</p></div>`;
        return;
    }
    const shown = Math.min(visibleCount.popular, ranked.length);
    el.innerHTML = ranked.slice(0, shown).map((r, i) => renderCard(r, { rank: i + 1 })).join('') + loadMoreHTML('popular', ranked.length, shown);
    attachLoadMoreObserver(el);
}

function renderFavoritos() {
    const el = document.getElementById('fav-grid');
    if (!currentUser) {
        el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Faça login para ver seus favoritos.</p><button class="btn btn-primary" onclick="openModal('account')">Entrar</button></div>`;
        return;
    }
    const myFavs = favoritesCache.filter(f => f.user_id === currentUser.id);
    const favPlaces = myFavs.map(f => getPlaceById(f.place_id)).filter(Boolean);
    if (!favPlaces.length) {
        el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Você ainda não curtiu nenhum lugar.</p><p style="font-size:.8125rem">Clique no coração em qualquer restaurante ou bar para salvar.</p></div>`;
        return;
    }
    const shown = Math.min(visibleCount.favoritos, favPlaces.length);
    el.innerHTML = favPlaces.slice(0, shown).map(r => renderCard(r)).join('') + loadMoreHTML('favoritos', favPlaces.length, shown);
    attachLoadMoreObserver(el);
}

function renderAmigos() {
    const amigosEl = document.getElementById('amigos-feed');
    if (!currentUser) {
        amigosEl.innerHTML = `<div class="empty-state"><p>Faça login para ver a atividade dos amigos.</p><button class="btn btn-primary" onclick="openModal('account')">Entrar</button></div>`;
        return;
    }
    const followingIds = followsCache.filter(f => f.follower_id === currentUser.id).map(f => f.following_id);
    const allFriendReviews = reviewsCache.filter(rv => followingIds.includes(rv.user_id));
    if (!allFriendReviews.length) {
        amigosEl.innerHTML = followingIds.length
            ? `<div class="empty-state"><p>As pessoas que você segue ainda não avaliaram nada.</p></div>`
            : `<div class="empty-state"><p>Você ainda não segue ninguém.</p><p style="font-size:.8125rem">Clique no nome de quem avaliou um restaurante para ver o perfil e seguir.</p></div>`;
        return;
    }
    const shown = Math.min(visibleCount.amigos, allFriendReviews.length);
    const friendReviews = allFriendReviews.slice(0, shown);
    amigosEl.innerHTML = friendReviews.map(rv => {
        const place = getPlaceById(rv.place_id);
        const profile = getProfile(rv.user_id);
        const displayName = profile?.name || rv.author_name || '';
        const authorProfile = profile || { name: displayName };
        const nameEsc = escapeHtml(displayName);
        const userIdEsc = escapeHtml(rv.user_id);
        const placeImg = safeUrl(place?.image_url);
        const text = rv.text || '';
        const textTrimmed = text.length > 120 ? text.slice(0, 120) + '...' : text;
        return `<div style="display:flex;gap:12px;padding:16px;background:var(--surface);border-radius:var(--radius-md);margin-bottom:12px;cursor:pointer" onclick="openDetail(${rv.place_id})">
            ${avatarMarkup(authorProfile, 'detail-review-avatar', `onclick="event.stopPropagation();openProfile('${userIdEsc}')" style="cursor:pointer;flex-shrink:0"`)}
            <div style="flex:1;min-width:0">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-weight:600;color:var(--heading);cursor:pointer" onclick="event.stopPropagation();openProfile('${userIdEsc}')">${nameEsc}</span>
                    <span style="font-size:.75rem;color:var(--metadata)">${formatDate(rv.created_at)}</span>
                </div>
                <div style="font-size:.8125rem;color:var(--metadata);margin:2px 0">avaliou <strong style="color:var(--heading)">${escapeHtml(place ? place.name : '?')}</strong></div>
                <div class="detail-review-stars">${starsHTML(rv.rating)}</div>
                ${text ? `<div style="font-size:.875rem;color:var(--body);margin-top:4px">${escapeHtml(textTrimmed)}</div>` : ''}
            </div>
            ${placeImg ? `<img src="${escapeHtml(placeImg)}" style="width:60px;height:60px;object-fit:cover;border-radius:var(--radius-sm);flex-shrink:0" loading="lazy">` : ''}
        </div>`;
    }).join('') + loadMoreHTML('amigos', allFriendReviews.length, shown, true);
    attachLoadMoreObserver(amigosEl);
}

function render() {
    renderRestaurantes();
    renderBares();
    renderPopular();
    renderFavoritos();
    renderAmigos();
}
