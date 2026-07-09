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
    const html = '<div class="skeleton-card"></div>'.repeat(8);
    ['grid-restaurantes', 'grid-bares', 'popular-grid'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.children.length) el.innerHTML = html;
    });
}
// Placeholder for the Início tab (the default landing) while data loads, so it
// doesn't flash blank. Replaced wholesale by renderHome() once data arrives.
function renderHomeSkeleton() {
    const el = document.getElementById('tab-inicio');
    if (!el || el.children.length) return;
    el.innerHTML =
        '<div class="skel" style="height:32px;width:55%;max-width:480px;border-radius:8px;margin:6px 0 16px"></div>'
        + '<div class="skel" style="height:50px;max-width:620px;border-radius:50px"></div>'
        + '<div class="skel" style="height:34px;width:240px;border-radius:50px;margin-top:14px"></div>'
        + '<div class="skel" style="height:300px;margin-top:40px"></div>'
        + `<div class="coll-grid" style="margin-top:24px">${'<div class="skel"></div>'.repeat(6)}</div>`;
}

// ===== Cards & grids =====
function renderCard(r, options = {}) {
    const { avg, count } = getPlaceRating(r.id);
    const rank = options.rank;
    const name = highlightTerms(r.name, searchQuery);
    const img = imgSrc(r.image_url, 600, 600); // square crop; covers both ratios
    // showType: prefix the sub with "Restaurante"/"Bar" — used by Populares when
    // searching, so the user can tell a bar apart from a restaurant in a grid
    // that mixes both. The type label is NOT highlighted (it's not the match).
    const typeLabel = options.showType ? (r.type === 'bar' ? 'Bar' : 'Restaurante') : null;
    const subParts = [r.category, extractBairro(r.address)].filter(Boolean)
        .map(s => highlightTerms(s, searchQuery));
    if (typeLabel) subParts.unshift(escapeHtml(typeLabel));
    const sub = subParts.join(' · ');
    const badges = [];
    if (rank) badges.push(`<span class="pcard-rank">#${rank}</span>`);
    if (r.badge) badges.push(`<span class="pcard-badge">${escapeHtml(r.badge)}</span>`);
    if (r.delivery_apps) badges.push(`<span class="pcard-badge pcard-delivery">${escapeHtml(r.delivery_apps.split(',')[0].trim())}</span>`);
    const ariaLabel = escapeHtml(`${r.name} — ${count > 0 ? `nota ${avg}` : 'sem avaliações'}`);
    return `<div class="pcard" onclick="openDetail(${r.id})" tabindex="0" role="button" aria-label="${ariaLabel}" onkeydown="if((event.key==='Enter'||event.key===' ')&&event.target===this){event.preventDefault();openDetail(${r.id})}">
        ${img ? `<img class="pcard-img" src="${escapeHtml(img)}" alt="" loading="lazy">` : `<div class="pcard-placeholder">${escapeHtml(r.name.charAt(0))}</div>`}
        <div class="pcard-top">
            <span class="pcard-badges">${badges.join('')}</span>
            <button class="pcard-fav fav-btn ${isFavorited(r.id) ? 'active' : ''}" data-place-id="${r.id}" onclick="event.stopPropagation();toggleFavorite(${r.id})" aria-label="Curtir ${escapeHtml(r.name)}" title="Curtir">${heartSVG}</button>
        </div>
        <div class="pcard-info">
            <div class="pcard-name">${name}</div>
            ${sub ? `<div class="pcard-sub">${sub}</div>` : ''}
        </div>
        <span class="pcard-rate ${count > 0 ? '' : 'novo'}">${count > 0 ? `<span class="star">★</span>${avg}` : 'novo'}</span>
    </div>`;
}

// Synonyms so e.g. "sushi" finds Japonesa, "drink" finds Coquetelaria. Keys are
// normalized tokens; values are normalized terms expected in name/category.
const SEARCH_SYNONYMS = {
    // Japonesa
    sushi: ['japonesa'], sashimi: ['japonesa'], omakase: ['japonesa'], temaki: ['japonesa'], uramaki: ['japonesa'],
    nigiri: ['japonesa'], ramen: ['japonesa'], izakaya: ['japonesa'], tonkotsu: ['japonesa'], yakisoba: ['japonesa'],
    teppanyaki: ['japonesa'], tartare: ['japonesa'],
    // Bar / drinks
    drink: ['coquetelaria', 'bar'], drinks: ['coquetelaria', 'bar'], cocktail: ['coquetelaria'],
    coquetel: ['coquetelaria'], coqueteis: ['coquetelaria'], taca: ['bar'],
    // Cerveja
    cerveja: ['cervejaria'], cervejas: ['cervejaria'], chopp: ['cervejaria'], chope: ['cervejaria'],
    breja: ['cervejaria'], ipa: ['cervejaria'],
    // Vinho
    vinho: ['enoteca', 'italiana', 'bar'], vinhos: ['enoteca', 'italiana'], enoteca: ['italiana', 'bar'],
    // Italiana
    pizza: ['italiana', 'pizzaria'], pizzas: ['italiana', 'pizzaria'], pizzaria: ['italiana'],
    massa: ['italiana'], massas: ['italiana'], nhoque: ['italiana'], gnocchi: ['italiana'],
    risoto: ['italiana'], ravioli: ['italiana'], lasanha: ['italiana'], gelato: ['italiana'],
    trattoria: ['italiana'], cantina: ['italiana'],
    // Hambúrguer / lanche
    hamburguer: ['hamburgueria'], burger: ['hamburgueria'], lanche: ['hamburgueria'],
    // Carnes / churrasco
    churrasco: ['carnes', 'brasileira'], parrilla: ['carnes'], picanha: ['carnes', 'brasileira'],
    bife: ['carnes'], steak: ['carnes'],
    // Brasileira regional
    moqueca: ['brasileira'], feijoada: ['brasileira'], baiana: ['brasileira'], mineira: ['brasileira'],
    // Vegana / vegetariana
    vegano: ['vegetariana'], vegana: ['vegetariana'], veggie: ['vegetariana'], plant: ['vegetariana'],
    // Peruana / mexicana
    ceviche: ['peruana'], tiradito: ['peruana'], taco: ['mexicana'], tacos: ['mexicana'],
    burrito: ['mexicana'], guacamole: ['mexicana'],
    // Asian outros
    pad: ['tailandesa'], thai: ['tailandesa'], dimsum: ['chinesa'], dim: ['chinesa'],
    pho: ['vietnamita'], bibimbap: ['coreana'], kimchi: ['coreana'],
    // Árabe / mediterrânea
    kebab: ['arabe'], shawarma: ['arabe'], falafel: ['arabe'], hummus: ['arabe'], esfiha: ['arabe'],
    // Francesa / padaria / doces
    croissant: ['padaria', 'francesa'], brioche: ['padaria', 'francesa'], baguete: ['padaria', 'francesa'],
    bistro: ['francesa'], brasserie: ['francesa'],
    doce: ['patisserie', 'sobremesa', 'confeitaria'], sobremesa: ['patisserie', 'confeitaria'],
    sorvete: ['gelato', 'sorveteria'],
    // Café
    cafe: ['cafeteria', 'padaria'], cafeteria: ['cafe'], cappuccino: ['cafe'], espresso: ['cafe'],
    // Delivery — buscar "delivery"/"entrega" bate nos lugares com iFood ou Rappi
    // (o próprio "ifood" e "rappi" batem direto porque delivery_apps entra no hay).
    delivery: ['ifood', 'rappi'], entrega: ['ifood', 'rappi'],
};
// Accent-insensitive, multi-word search across name/category/address/badge, with
// synonyms. Every word in the query must match (so "japonesa pinheiros" narrows).
function matchesSearch(p, query) {
    const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;
    const hay = normalizeText([p.name, p.category, p.address, p.badge, p.delivery_apps].filter(Boolean).join(' '));
    return tokens.every(t => hay.includes(t) || (SEARCH_SYNONYMS[t] || []).some(s => hay.includes(s)));
}
// Wraps the parts of `text` that match the active search (and its synonyms)
// in <mark class="hl">. Returns safe HTML — non-matched chunks are escaped.
// Position mapping works because normalizeText preserves character count for
// the Portuguese set we use (NFD-strip-marks is 1:1 per visible char).
function highlightTerms(text, query) {
    if (!text) return '';
    if (!query) return escapeHtml(text);
    const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return escapeHtml(text);
    const needles = new Set();
    for (const t of tokens) {
        if (t) needles.add(t);
        for (const s of (SEARCH_SYNONYMS[t] || [])) needles.add(s);
    }
    const norm = normalizeText(text);
    const ranges = [];
    for (const n of needles) {
        if (!n) continue;
        let i = 0;
        while ((i = norm.indexOf(n, i)) !== -1) {
            ranges.push([i, i + n.length]);
            i += n.length;
        }
    }
    if (!ranges.length) return escapeHtml(text);
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0].slice()];
    for (let k = 1; k < ranges.length; k++) {
        const last = merged[merged.length - 1];
        if (ranges[k][0] <= last[1]) last[1] = Math.max(last[1], ranges[k][1]);
        else merged.push(ranges[k].slice());
    }
    let out = '', pos = 0;
    for (const [s, e] of merged) {
        out += escapeHtml(text.slice(pos, s));
        out += '<mark class="hl">' + escapeHtml(text.slice(s, e)) + '</mark>';
        pos = e;
    }
    out += escapeHtml(text.slice(pos));
    return out;
}
function filterByType(type) {
    let list = placesCache.filter(p => p.type === type);
    if (searchQuery) list = list.filter(p => matchesSearch(p, searchQuery));
    const cat = categoryFilter[type];
    if (cat && cat !== 'Todas') list = list.filter(p => p.category === cat);
    const bairro = bairroFilter[type];
    if (bairro && bairro !== 'Todos') list = list.filter(p => extractBairro(p.address) === bairro);
    if (extraFilter.michelin) list = list.filter(p => michelinStars(p) > 0);
    if (extraFilter.delivery) list = list.filter(p => p.delivery_apps);
    return sortPlaces(list);
}
// Apply the active "Ordenar" choice. The default ("avaliados") keeps the curated
// feel — most reviewed, then Michelin, then name — so a mostly-unreviewed catalog
// still looks intentional rather than random.
function sortPlaces(list) {
    if (sortBy === 'nota') {
        list.sort((a, b) => parseFloat(getPlaceRating(b.id).avg) - parseFloat(getPlaceRating(a.id).avg) || a.name.localeCompare(b.name, 'pt-BR'));
    } else if (sortBy === 'az') {
        list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else if (sortBy === 'recentes') {
        list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } else {
        list.sort((a, b) => getPlaceRating(b.id).count - getPlaceRating(a.id).count || michelinStars(b) - michelinStars(a) || a.name.localeCompare(b.name, 'pt-BR'));
    }
    return list;
}

function renderRestaurantes() {
    const rests = filterByType('restaurante');
    buildFilterBar('restaurante', rests.length);
    const el = document.getElementById('grid-restaurantes');
    if (!rests.length) {
        el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>${searchQuery ? 'Nenhum restaurante encontrado.' : 'Nenhum restaurante adicionado ainda.'}</p>${!searchQuery && isAdmin() ? '<button class="btn btn-primary" onclick="openAddPlace(\'restaurante\')">Adicionar o primeiro</button>' : ''}</div>`;
        return;
    }
    const shown = Math.min(visibleCount.restaurantes, rests.length);
    el.innerHTML = rests.slice(0, shown).map(r => renderCard(r, { hideType: true })).join('') + loadMoreHTML('restaurantes', rests.length, shown);
    attachLoadMoreObserver(el);
}

function renderBares() {
    const bars = filterByType('bar');
    buildFilterBar('bar', bars.length);
    const el = document.getElementById('grid-bares');
    if (!bars.length) {
        el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>${searchQuery ? 'Nenhum bar encontrado.' : 'Nenhum bar adicionado ainda.'}</p>${!searchQuery && isAdmin() ? '<button class="btn btn-primary" onclick="openAddPlace(\'bar\')">Adicionar o primeiro</button>' : ''}</div>`;
        return;
    }
    const shown = Math.min(visibleCount.bares, bars.length);
    el.innerHTML = bars.slice(0, shown).map(r => renderCard(r, { hideType: true })).join('') + loadMoreHTML('bares', bars.length, shown);
    attachLoadMoreObserver(el);
}

function renderPopular() {
    // Searching spans both types; browsing uses the Restaurante/Bar toggle.
    // Ranked reviewed/most-popular first; rank badges only on reviewed places.
    const all = searchQuery
        ? placesCache.filter(p => matchesSearch(p, searchQuery))
        : placesCache.filter(p => p.type === popularType);
    const ranked = all.map(r => ({ ...r, ...getPlaceRating(r.id) }))
        .sort((a, b) => b.count - a.count || parseFloat(b.avg) - parseFloat(a.avg) || michelinStars(b) - michelinStars(a) || a.name.localeCompare(b.name, 'pt-BR'));
    buildPopularFilterBar(ranked.length);
    const el = document.getElementById('popular-grid');
    if (!ranked.length) {
        el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>${searchQuery ? 'Nenhum resultado.' : 'Nenhum lugar ainda.'}</p></div>`;
        return;
    }
    const shown = Math.min(visibleCount.popular, ranked.length);
    el.innerHTML = ranked.slice(0, shown).map((r, i) => renderCard(r, {
        rank: r.count > 0 ? i + 1 : null,
        showType: !!searchQuery,
    })).join('') + loadMoreHTML('popular', ranked.length, shown);
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
        const placeImg = imgSrc(place?.image_url, 200, 200); // 60×60 square thumb
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
                <div class="detail-review-stars">${starsHTML(reviewScore(rv))}</div>
                ${text ? `<div style="font-size:.875rem;color:var(--body);margin-top:4px">${escapeHtml(textTrimmed)}</div>` : ''}
                <div class="rev-likes-row">${reviewLikeHTML(rv.id)}</div>
            </div>
            ${placeImg ? `<img src="${escapeHtml(placeImg)}" style="width:60px;height:60px;object-fit:cover;border-radius:var(--radius-sm);flex-shrink:0" loading="lazy">` : ''}
        </div>`;
    }).join('') + loadMoreHTML('amigos', allFriendReviews.length, shown, true);
    attachLoadMoreObserver(amigosEl);
}

// Repaint only the visible tab — switchTab re-renders whichever tab the user
// opens next, so the hidden grids don't need to be rebuilt on every refresh.
// The profile tab is rendered by openProfile, not here.
function render() {
    const active = document.querySelector('.tab-content.active')?.id?.replace('tab-', '') || 'inicio';
    renderPageHeader(active);
    if (typeof toggleHeaderSearch === 'function') toggleHeaderSearch();
    if (active === 'inicio') renderHome();
    else if (active === 'restaurantes') renderRestaurantes();
    else if (active === 'bares') renderBares();
    else if (active === 'popular') renderPopular();
    else if (active === 'favoritos') renderFavoritos();
    else if (active === 'amigos') renderAmigos();
}

// ===== Início (home) =====
function reviewsLastDays(days) {
    const cutoff = Date.now() - days * 86400000;
    return reviewsCache.filter(r => r.created_at && new Date(r.created_at).getTime() >= cutoff);
}
function topBy(keyFn, n) {
    const count = {};
    placesCache.forEach(p => { const k = keyFn(p); if (k) count[k] = (count[k] || 0) + 1; });
    return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}
function renderHome() {
    const el = document.getElementById('tab-inicio');
    if (!el) return;
    const withImg = (pred) => placesCache.filter(p => p.image_url && pred(p));

    // --- launchpad: greeting + segmented + search + chips ---
    const first = currentUser ? (currentUser.name || '').split(' ')[0] : '';
    const greeting = first
        ? `Olá de novo, <span>${escapeHtml(first)}</span>. O que você quer comer hoje?`
        : `Bem-vindo ao <span>FoodView</span>. O que você quer comer hoje?`;
    const topCats = topBy(p => p.category, 3);
    const topHoods = topBy(p => extractBairro(p.address), 2);
    // Search first, then the Tudo/Restaurantes/Bares toggle beneath it.
    const launchpad = `<div class="home-greeting">${greeting}</div>
        <div class="hsearch">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" id="home-search" placeholder="Buscar restaurante, cozinha ou bairro…" onkeydown="homeSearch(event)">
        </div>
        <div class="seg">
            <button class="seg-btn active" onclick="goExplore({tab:'popular'})">Tudo</button>
            <button class="seg-btn" onclick="goExplore({tab:'restaurantes'})">Restaurantes</button>
            <button class="seg-btn" onclick="goExplore({tab:'bares'})">Bares</button>
        </div>`;

    // --- destaque da semana: most-liked place reviewed in the last 7 days ---
    const recent = reviewsLastDays(7);
    const likeByPlace = {};
    recent.forEach(r => { likeByPlace[r.place_id] = (likeByPlace[r.place_id] || 0) + getReviewLikeCount(r.id); });
    const reviewedRecently = [...new Set(recent.map(r => r.place_id))].map(getPlaceById).filter(p => p && p.image_url);
    reviewedRecently.sort((a, b) => (likeByPlace[b.id] || 0) - (likeByPlace[a.id] || 0)
        || getPlaceRating(b.id).count - getPlaceRating(a.id).count);
    const featured = reviewedRecently[0] || pickPopularThumbs(() => true, 1)[0];
    let featHTML = '';
    if (featured) {
        const { avg, count } = getPlaceRating(featured.id);
        const meta = [count > 0 ? `★ ${avg}` : null, featured.category, extractBairro(featured.address)].filter(Boolean).join(' · ');
        featHTML = `<div class="home-section"><div class="home-section-head"><h2>Destaque da semana</h2></div>
            <div class="feat-hero" onclick="openDetail(${featured.id})" style="background-image:url('${escapeHtml(imgSrc(featured.image_url, 1200, 480))}')">
                <div class="feat-inner">
                    <span class="feat-eyebrow">Destaque da semana</span>
                    <h2 class="feat-title">${escapeHtml(featured.name)}</h2>
                    ${meta ? `<div class="feat-meta">${escapeHtml(meta)}</div>` : ''}
                    <button class="btn btn-primary btn-sm">Ver detalhes</button>
                </div>
            </div></div>`;
    }

    // --- coleções ---
    const michelin = withImg(p => michelinStars(p) > 0);
    const featColl = michelin.length
        ? { name: 'Estrelas Michelin', sub: `${michelin.length} lugares premiados`, cover: michelin[0], feat: true, go: 'goExplore({michelin:true})' }
        : null;
    const normals = [];
    topCats.forEach(c => {
        const list = withImg(p => p.category === c);
        if (list.length >= 3) normals.push({ name: c, sub: `${list.length} lugares`, cover: list[0], go: `goExplore({cozinha:'${escapeJs(c)}'})` });
    });
    if (topHoods[0]) {
        const list = withImg(p => extractBairro(p.address) === topHoods[0]);
        if (list.length) normals.push({ name: 'Em ' + topHoods[0], sub: `${list.length} lugares`, cover: list[0], go: `goExplore({bairro:'${escapeJs(topHoods[0])}'})` });
    }
    const novos = placesCache.filter(p => p.image_url).slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    if (novos.length) normals.push({ name: 'Novos no FoodView', sub: `${novos.length} lugares`, cover: novos[0], go: `goExplore({sort:'recentes'})` });
    // The featured spans 2×2 of a 3-col grid; gap-free counts of normal cards are
    // then 2 or 5, so cap to whichever fits (no featured → just up to 6 uniform).
    const ordered = featColl
        ? [featColl, ...normals.slice(0, normals.length >= 5 ? 5 : 2)]
        : normals.slice(0, 6);
    const collCards = ordered.map(c =>
        `<div class="coll ${c.feat ? 'feat' : ''}" onclick="${c.go}" style="background-image:url('${escapeHtml(imgSrc(c.cover.image_url, c.feat ? 900 : 500, c.feat ? 450 : 334))}')">
            <div class="coll-inner"><div class="coll-name">${escapeHtml(c.name)}</div><div class="coll-count">${escapeHtml(c.sub)}</div></div>
        </div>`).join('');
    const collHTML = collCards
        ? `<div class="home-section"><div class="home-section-head"><h2>Coleções</h2></div><div class="coll-grid">${collCards}</div></div>`
        : '';

    // --- avaliações da semana ---
    let week = reviewsLastDays(7).slice();
    week.sort((a, b) => getReviewLikeCount(b.id) - getReviewLikeCount(a.id) || (b.created_at || '').localeCompare(a.created_at || ''));
    if (week.length < 2) week = reviewsCache.slice(0, 6); // fallback when there's little recent activity
    week = week.slice(0, 6);
    const weekCards = week.map(rv => {
        const place = getPlaceById(rv.place_id);
        const prof = getProfile(rv.user_id) || { name: rv.author_name || '' };
        const thumb = imgSrc(place?.image_url, 128, 168);
        const text = (rv.text || '').length > 150 ? rv.text.slice(0, 150) + '…' : (rv.text || '');
        return `<div class="rev-card" onclick="openDetail(${rv.place_id})">
            ${thumb ? `<img class="rev-thumb" src="${escapeHtml(thumb)}" alt="" loading="lazy">` : ''}
            <div class="rev-body">
                <div class="rev-place">${escapeHtml(place ? place.name : '?')}</div>
                <div class="rev-stars">${starsHTML(reviewScore(rv))}</div>
                <div class="rev-by">${avatarMarkup(prof, 'rev-mini')}${escapeHtml(prof.name || '')} · ${formatDate(rv.created_at)}</div>
                ${text ? `<div class="rev-text">${escapeHtml(text)}</div>` : ''}
                <div class="rev-likes-row">${reviewLikeHTML(rv.id)}</div>
            </div>
        </div>`;
    }).join('');
    const weekHTML = weekCards
        ? `<div class="home-section"><div class="home-section-head"><h2>Avaliações da semana</h2></div><div class="rev-week">${weekCards}</div></div>`
        : '';

    el.innerHTML = launchpad + featHTML + collHTML + weekHTML;
}

// ===== Editorial page header =====
// Picks the N most-reviewed places matching `predicate` that have an image —
// the "em alta" strip (Michelin then name as tiebreakers so it's never random).
function pickPopularThumbs(predicate, n = 4) {
    return placesCache
        .filter(p => p.image_url && predicate(p))
        .sort((a, b) => getPlaceRating(b.id).count - getPlaceRating(a.id).count
            || michelinStars(b) - michelinStars(a)
            || a.name.localeCompare(b.name, 'pt-BR'))
        .slice(0, n);
}
function thumbsHtml(label, thumbs) {
    if (!thumbs.length) return '';
    // First thumb is the LCP candidate now that the hero is gone — load it
    // eagerly with high priority. Rest are below-the-fold-ish, lazy-load.
    const cards = thumbs.map((p, i) => {
        const fetchAttr = i === 0 ? 'fetchpriority="high"' : 'loading="lazy"';
        return `<div class="page-header-thumb-card" onclick="openDetail(${p.id})" title="${escapeHtml(p.name)}">
            <img class="page-header-thumb" src="${escapeHtml(imgSrc(p.image_url, 192, 192))}" alt="${escapeHtml(p.name)}" ${fetchAttr} width="124" height="124">
            <div class="page-header-thumb-name">${escapeHtml(p.name)}</div>
        </div>`;
    }).join('');
    return `<div class="page-header-thumbs">
        <div class="page-header-thumbs-label">${label}</div>
        <div class="page-header-thumbs-row">${cards}</div>
    </div>`;
}
function renderPageHeader(tab) {
    const target = document.getElementById('page-header');
    if (!target) return;
    target.dataset.tab = tab; // drives the per-tab side-bar color via CSS
    const restaurantes = placesCache.filter(p => p.type === 'restaurante');
    const bares = placesCache.filter(p => p.type === 'bar');

    const emAlta = (predicate) => thumbsHtml('em<br>alta', pickPopularThumbs(predicate));
    let eyebrow = '', title = '', subtitle = '', thumbs = '';
    if (tab === 'restaurantes') {
        eyebrow = 'São Paulo';
        title = 'Restaurantes';
        subtitle = `<b>${restaurantes.length}</b> lugares selecionados`;
        thumbs = emAlta(p => p.type === 'restaurante');
    } else if (tab === 'bares') {
        const cervejarias = bares.filter(p => /cervej/i.test(p.category || '')).length;
        const coquetel = bares.filter(p => /coquetel/i.test(p.category || '')).length;
        eyebrow = 'São Paulo';
        title = 'Bares';
        subtitle = `<b>${bares.length}</b> bares · <b>${coquetel}</b> coquetelaria · <b>${cervejarias}</b> cervejarias`;
        thumbs = emAlta(p => p.type === 'bar');
    } else if (tab === 'popular') {
        const reviewedIds = new Set(reviewsCache.map(r => r.place_id));
        const reviewedCount = placesCache.filter(p => reviewedIds.has(p.id)).length;
        eyebrow = 'Mais avaliados';
        title = 'Populares';
        subtitle = `<b>${reviewedCount}</b> lugares avaliados · <b>${reviewsCache.length}</b> avaliações no total`;
        thumbs = emAlta(() => true);
    } else if (tab === 'favoritos') {
        if (currentUser) {
            const myFavs = favoritesCache.filter(f => f.user_id === currentUser.id);
            const favPlaces = myFavs.map(f => getPlaceById(f.place_id)).filter(Boolean);
            const favImgs = favPlaces.filter(p => p.image_url);
            eyebrow = (currentUser.name || '').split(' ')[0] || 'Você';
            title = 'Meus Favoritos';
            subtitle = favPlaces.length
                ? `<b>${favPlaces.length}</b> lugar${favPlaces.length === 1 ? '' : 'es'} curtido${favPlaces.length === 1 ? '' : 's'}`
                : 'Você ainda não curtiu nenhum lugar.';
            thumbs = favImgs.length ? thumbsHtml('seus<br>favoritos', favImgs.slice(0, 4)) : emAlta(() => true);
        } else {
            eyebrow = 'Sua coleção';
            title = 'Meus Favoritos';
            subtitle = 'Faça login pra ver os lugares que você curtiu.';
            thumbs = emAlta(() => true);
        }
    } else if (tab === 'amigos') {
        if (currentUser) {
            const followingIds = followsCache.filter(f => f.follower_id === currentUser.id).map(f => f.following_id);
            const friendReviews = reviewsCache.filter(rv => followingIds.includes(rv.user_id));
            eyebrow = 'Rede';
            title = 'Atividade dos Amigos';
            subtitle = followingIds.length
                ? `Seguindo <b>${followingIds.length}</b> ${followingIds.length === 1 ? 'pessoa' : 'pessoas'} · <b>${friendReviews.length}</b> avaliações`
                : 'Você ainda não segue ninguém.';
            const seen = new Set();
            const friendPlaces = friendReviews.map(rv => getPlaceById(rv.place_id)).filter(p => p && p.image_url && !seen.has(p.id) && seen.add(p.id));
            thumbs = friendPlaces.length ? thumbsHtml('amigos<br>curtiram', friendPlaces.slice(0, 4)) : emAlta(() => true);
        } else {
            eyebrow = 'Rede';
            title = 'Atividade dos Amigos';
            subtitle = 'Faça login pra acompanhar quem você segue.';
            thumbs = emAlta(() => true);
        }
    } else {
        target.innerHTML = '';
        return;
    }
    target.innerHTML = `<div class="page-header-text">
        <span class="page-header-eyebrow">${eyebrow}</span>
        <h1 class="page-header-title">${title}</h1>
        <p class="page-header-subtitle">${subtitle}</p>
    </div>${thumbs}`;
}
