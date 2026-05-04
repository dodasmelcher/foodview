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
