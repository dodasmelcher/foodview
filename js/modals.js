// Generic modal primitives: openModal, closeModal, customConfirm.
// Loaded after utils.js (uses autoFocusModal) and before app.js.
// closeModal references _detailMap and clearPlaceRoute from app.js — those
// resolve at call-time (not at script load).

function openModal(type) {
    let modal;
    if (type === 'account-login') {
        modal = document.getElementById('modal-account');
        modal.classList.add('active');
        showAccountTab('login', document.querySelectorAll('.tabs-toggle button')[1]);
    } else {
        modal = document.getElementById('modal-' + type);
        modal.classList.add('active');
    }
    autoFocusModal(modal);
}

function closeModal(type) {
    document.getElementById('modal-' + type).classList.remove('active');
    if (type === 'detail') {
        clearPlaceRoute();
        if (_detailMap) { try { _detailMap.remove(); } catch (_) {} _detailMap = null; }
    }
}

document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => {
        if (e.target !== o) return;
        o.classList.remove('active');
        if (o.id === 'modal-detail') {
            clearPlaceRoute();
            if (_detailMap) { try { _detailMap.remove(); } catch (_) {} _detailMap = null; }
        }
    });
});

let _confirmResolve = null;
function customConfirm(message, options = {}) {
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-title').textContent = options.title || 'Confirmar';
    const okBtn = document.getElementById('confirm-ok');
    okBtn.textContent = options.okText || 'Confirmar';
    okBtn.classList.toggle('btn-danger', !!options.danger);
    document.getElementById('modal-confirm').classList.add('active');
    requestAnimationFrame(() => okBtn.focus());
    return new Promise(resolve => { _confirmResolve = resolve; });
}
function closeConfirm(result) {
    document.getElementById('modal-confirm').classList.remove('active');
    const r = _confirmResolve;
    _confirmResolve = null;
    if (r) r(result);
}

// ===== A11y: dialogs + focus trap =====
// Mark every modal as a dialog so screen readers announce it as such.
document.querySelectorAll('.modal-overlay .modal').forEach(m => {
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
});
// Trap Tab focus inside the topmost open modal (by z-index, since stacking
// order ≠ DOM order — e.g. the confirm dialog sits above the detail modal).
// The lightbox uses its own overlay/keys and is intentionally excluded.
document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const overlays = Array.from(document.querySelectorAll('.modal-overlay.active'));
    if (!overlays.length) return;
    const top = overlays.reduce((a, b) =>
        (parseInt(getComputedStyle(b).zIndex) || 0) >= (parseInt(getComputedStyle(a).zIndex) || 0) ? b : a);
    const sel = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const list = Array.from(top.querySelectorAll(sel)).filter(el => el.offsetParent !== null);
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (!top.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
