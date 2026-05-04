// Supabase Auth flows: account tabs, register/login/logout, OAuth, password
// reset. Loaded after data.js (uses sb, currentUser) and modals.js (closeModal,
// openModal). Cross-file refs (showToast, lockSubmit, closeModal, openModal)
// resolve at call-time.

function showAccountTab(tab, btn) {
    document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
    document.querySelectorAll('.tabs-toggle button').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

async function ensureProfile() {
    if (!currentUser) return;
    // Insert a profile row only if missing — avoid overwriting fields the user
    // has customized (name, avatar_url, bio).
    const { data } = await sb.from('profiles').select('id').eq('id', currentUser.id).maybeSingle();
    if (data) return;
    const { data: { session } } = await sb.auth.getSession();
    const meta = session?.user?.user_metadata || {};
    await sb.from('profiles').insert({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar_url: meta.avatar_url || meta.picture || null
    });
}

function sessionToUser(session) {
    if (!session) return null;
    const u = session.user;
    const meta = u.user_metadata || {};
    return {
        id: u.id,
        name: meta.name || meta.full_name || u.email.split('@')[0],
        email: u.email
    };
}

async function registerAccount(e) {
    e.preventDefault();
    const unlock = lockSubmit(e.target, 'Criando...');
    if (!unlock) return;
    try {
        const name = document.getElementById('acc-name').value;
        const email = document.getElementById('acc-email').value;
        const pass = document.getElementById('acc-pass').value;
        const { data, error } = await sb.auth.signUp({
            email, password: pass,
            options: { data: { name } }
        });
        if (error) { showToast(error.message, 'error'); return; }
        document.getElementById('form-register').reset();
        if (!data.session) {
            showToast('Enviamos um email de confirmação para ' + email + '.', 'success', 6000);
            closeModal('account');
            return;
        }
        closeModal('account');
    } finally { unlock(); }
}

async function loginAccount(e) {
    e.preventDefault();
    const unlock = lockSubmit(e.target, 'Entrando...');
    if (!unlock) return;
    try {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        const { error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) { showToast(error.message, 'error'); return; }
        document.getElementById('form-login').reset();
        closeModal('account');
    } finally { unlock(); }
}

async function logout() {
    await sb.auth.signOut();
    // onAuthStateChange clears currentUser and re-renders
}

async function loginWithGoogle() {
    const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) showToast(error.message, 'error');
}

function openForgotPassword() {
    closeModal('account');
    document.getElementById('forgot-email').value = document.getElementById('login-email').value || '';
    openModal('forgot');
}

async function submitForgotPassword(e) {
    e.preventDefault();
    const unlock = lockSubmit(e.target, 'Enviando...');
    if (!unlock) return;
    try {
        const email = document.getElementById('forgot-email').value;
        const { error } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
        });
        if (error) { showToast(error.message, 'error'); return; }
        document.getElementById('form-forgot').reset();
        closeModal('forgot');
        showToast('Se existe uma conta com esse email, enviamos um link de redefinição.', 'success', 6000);
    } finally { unlock(); }
}

async function submitResetPassword(e) {
    e.preventDefault();
    const unlock = lockSubmit(e.target, 'Salvando...');
    if (!unlock) return;
    try {
        const p1 = document.getElementById('reset-pass').value;
        const p2 = document.getElementById('reset-pass2').value;
        if (p1 !== p2) { showToast('As senhas não coincidem', 'error'); return; }
        const { error } = await sb.auth.updateUser({ password: p1 });
        if (error) { showToast(error.message, 'error'); return; }
        document.getElementById('form-reset').reset();
        closeModal('reset');
        showToast('Senha atualizada com sucesso.', 'success');
    } finally { unlock(); }
}
