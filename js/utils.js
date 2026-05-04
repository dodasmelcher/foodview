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

function safeUrl(u) {
    if (!u) return '';
    const s = String(u).trim();
    return /^https?:\/\//i.test(s) ? s : '';
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function starsHTML(n) {
    return '★'.repeat(Math.floor(n)) + (n % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(n));
}

const heartSVG = `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

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
