// Pure helpers used across the app. Loaded before app.js so all definitions
// are available as globals (no ESM yet — matches existing inline onclick=""
// call sites in index.html).

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Escape a string for use inside a single-quoted JS string in an inline onclick.
function escapeJs(s) {
    return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function safeUrl(u) {
    if (!u) return '';
    const s = String(u).trim();
    return /^https?:\/\//i.test(s) ? s : '';
}

// Returns a safe URL routed through Supabase's image-transform endpoint when
// the source is a Supabase Storage public URL — significantly smaller bytes.
// Width/height are the *intended pixel dimensions* including DPR; pass ~2× the
// CSS pixels. Both must be given (Supabase keeps the original height when
// width alone is passed, which produces vertical-strip thumbnails).
// Non-Supabase URLs (Google photos, external) pass through untouched.
function imgSrc(u, width, height) {
    const s = safeUrl(u);
    if (!s) return '';
    if (s.includes('/storage/v1/object/public/')) {
        const t = s.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
        const sep = t.includes('?') ? '&' : '?';
        const h = height || width; // square default when caller doesn't say
        return `${t}${sep}width=${width}&height=${h}&resize=cover&quality=75`;
    }
    return s;
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Trim a Google formatted address down to street + neighborhood, dropping the
// "City - UF" segment and the CEP. Comma-separated segments that are clearly a
// CEP (12345-678) or end in a state abbreviation (" - SP") are removed; manual
// addresses like "R. Augusta, 1200 — Consolação" pass through unchanged.
function formatAddress(addr) {
    if (!addr) return '';
    return String(addr).split(',')
        .map(s => s.trim())
        .filter(s => s && !/^\d{5}-?\d{3}$/.test(s) && !/\s-\s[A-Z]{2}$/.test(s))
        .join(', ');
}

// Neighborhood = the segment after the last " - " / " — " of the trimmed
// address (e.g. "R. Augusta, 1200 - Consolação" → "Consolação"). '' if none.
function extractBairro(addr) {
    const parts = formatAddress(addr).split(/\s[—-]\s/);
    return parts.length > 1 ? parts[parts.length - 1].trim() : '';
}

function starsHTML(n) {
    const filled = '★'.repeat(Math.floor(n));
    const half = (n % 1 >= 0.5 ? '½' : '');
    const empty = '☆'.repeat(5 - Math.ceil(n));
    const label = `${Number(n).toFixed(1)} de 5`;
    return `<span role="img" aria-label="${label} estrelas">${filled}${half}${empty}</span>`;
}

const heartSVG = `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

// Current weekday/time in São Paulo (where every place is), regardless of the
// visitor's timezone. Returns { day: 0=Sun..6, min: minutes since midnight }.
function spNow() {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
}

// Google Places (New) regularOpeningHours → is it open right now? periods[] hold
// { open, close } with { day:0=Sun..6, hour, minute }; a period with no `close`
// means open 24h. Returns true / false, or null when hours are unknown.
function isPlaceOpenNow(hours) {
    const periods = hours && Array.isArray(hours.periods) ? hours.periods : null;
    if (!periods || !periods.length) return null;
    const { day, min } = spNow();
    const now = day * 1440 + min;
    const WEEK = 7 * 1440;
    for (const p of periods) {
        if (!p.open) continue;
        if (!p.close) return true; // open 24h
        const open = p.open.day * 1440 + (p.open.hour || 0) * 60 + (p.open.minute || 0);
        let close = p.close.day * 1440 + (p.close.hour || 0) * 60 + (p.close.minute || 0);
        if (close <= open) close += WEEK; // overnight / past Saturday→Sunday
        if ((now >= open && now < close) || (now + WEEK >= open && now + WEEK < close)) return true;
    }
    return false;
}

// weekdayDescriptions is ordered Monday..Sunday; map São Paulo's weekday to it.
function spWeekdayIndex() {
    return (spNow().day + 6) % 7; // JS 0=Sun → array 0=Mon
}

// Phone (any format, ideally international) → wa.me link, or '' if too short.
function waLink(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 10 ? `https://wa.me/${digits}` : '';
}

function withTimeout(promise, ms, label = 'operation') {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        )
    ]);
}

function lockSubmit(form, label = 'Aguarde...') {
    const btn = form.querySelector('button[type="submit"], .btn-submit');
    if (!btn) return () => {};
    if (btn.disabled) return null;
    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = label;
    return () => { btn.disabled = false; btn.textContent = prev; };
}

function autoFocusModal(modal) {
    if (!modal) return;
    requestAnimationFrame(() => {
        const candidates = modal.querySelectorAll('input:not([type="hidden"]), textarea, select');
        for (const el of candidates) {
            if (el.offsetParent !== null && !el.disabled) { el.focus(); return; }
        }
    });
}

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = message;
    const dismiss = () => {
        if (el.classList.contains('leaving')) return;
        el.classList.add('leaving');
        setTimeout(() => el.remove(), 200);
    };
    el.addEventListener('click', dismiss);
    container.appendChild(el);
    setTimeout(dismiss, duration);
}
