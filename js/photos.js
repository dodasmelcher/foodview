// Photo flows: add-photo modal, delete photo, edit cover, lightbox.
// Depends on data.js (uploadPhoto, sb, placesCache, getPlaceById, isAdmin,
// currentUser), utils.js (showToast, lockSubmit), modals.js (openModal,
// closeModal, customConfirm). Cross-file refs (loadData, openDetail) resolve
// at call-time.

// ===== Add photos modal =====
let addPhotoFiles = [];
let addPhotoPlaceId = null;

function openAddPhotoModal(placeId) {
    if (!getUser()) { openModal('account'); return; }
    addPhotoPlaceId = placeId;
    addPhotoFiles = [];
    document.getElementById('ap-preview').innerHTML = '';
    document.getElementById('ap-place-id').value = placeId;
    const fi = document.getElementById('ap-file-hidden');
    fi.value = '';
    fi.click();
}

function handleAddPhotoFiles(input) {
    if (!input.files.length) return;
    if (!document.getElementById('modal-addphoto').classList.contains('active')) {
        closeModal('detail');
    }
    addPhotoFiles = addPhotoFiles.concat(Array.from(input.files));
    input.value = '';
    renderAddPhotoPreviews();
    if (!document.getElementById('modal-addphoto').classList.contains('active')) {
        openModal('addphoto');
    }
}

function renderAddPhotoPreviews() {
    const c = document.getElementById('ap-preview');
    c.innerHTML = addPhotoFiles.map((f, i) =>
        `<div class="image-preview"><img src="${URL.createObjectURL(f)}"><button type="button" class="remove-img" onclick="removeAddPhoto(${i})" aria-label="Remover foto">&times;</button></div>`
    ).join('');
}

function removeAddPhoto(i) {
    addPhotoFiles.splice(i, 1);
    renderAddPhotoPreviews();
}

async function submitAddPhoto(e) {
    e.preventDefault();
    const unlock = lockSubmit(e.target, 'Enviando...');
    if (!unlock) return;
    try {
        if (!addPhotoFiles.length) { showToast('Selecione ao menos uma foto', 'error'); return; }
        const id = parseInt(document.getElementById('ap-place-id').value);
        const p = placesCache.find(r => r.id === id);
        if (!p) return;
        const urls = [];
        for (const f of addPhotoFiles) {
            const url = await uploadPhoto(f);
            if (url) urls.push(url);
        }
        const newPhotos = [...(p.photos || []), ...urls];
        await sb.from('places').update({
            photos: newPhotos,
            image_url: p.image_url || urls[0] || ''
        }).eq('id', id);
        addPhotoFiles = [];
        closeModal('addphoto');
        await loadData();
        openDetail(id);
    } finally { unlock(); }
}

// ===== Delete photo =====
async function deletePhoto(placeId, photoIndex) {
    const p = placesCache.find(r => r.id === placeId);
    if (!p || !p.photos) return;
    const removed = p.photos[photoIndex];
    const newPhotos = [...p.photos];
    newPhotos.splice(photoIndex, 1);
    const update = { photos: newPhotos };
    // Only reset cover if the removed photo was the cover; otherwise leave the
    // user's chosen cover alone.
    if (p.image_url && p.image_url === removed) {
        update.image_url = newPhotos[0] || '';
    }
    await sb.from('places').update(update).eq('id', placeId);
    await loadData();
    openDetail(placeId);
}

// ===== Edit cover =====
function editPlaceImage(placeId) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const url = await uploadPhoto(file);
        if (!url) return;
        const p = placesCache.find(r => r.id === placeId);
        const newPhotos = [url, ...(p.photos || [])];
        await sb.from('places').update({ image_url: url, photos: newPhotos }).eq('id', placeId);
        await loadData();
        openDetail(placeId);
    };
    input.click();
}

// ===== Lightbox =====
let lbPhotos = [], lbIndex = 0, lbPlaceId = null;

function openLightbox(placeId, index) {
    const p = getPlaceById(placeId);
    if (!p || !p.photos || !p.photos.length) return;
    lbPhotos = p.photos; lbIndex = index || 0; lbPlaceId = placeId;
    updateLightbox();
    document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() { document.getElementById('lightbox').classList.remove('active'); }

function lightboxNav(dir) {
    lbIndex = (lbIndex + dir + lbPhotos.length) % lbPhotos.length;
    updateLightbox();
}

function updateLightbox() {
    document.getElementById('lightbox-img').src = lbPhotos[lbIndex];
    document.getElementById('lightbox-counter').textContent = `${lbIndex + 1} / ${lbPhotos.length}`;
    const canDel = isAdmin() || (currentUser && getPlaceById(lbPlaceId)?.user_id === currentUser.id);
    document.getElementById('lightbox-delete').style.display = canDel ? 'block' : 'none';
}

async function lightboxDelete() {
    const ok = await customConfirm('Tem certeza que quer remover esta foto?', { title: 'Remover foto?', okText: 'Remover', danger: true });
    if (!ok) return;
    await deletePhoto(lbPlaceId, lbIndex);
    const p = getPlaceById(lbPlaceId);
    if (!p || !p.photos || !p.photos.length) { closeLightbox(); return; }
    lbPhotos = p.photos;
    lbIndex = Math.min(lbIndex, lbPhotos.length - 1);
    updateLightbox();
}

document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxNav(-1);
    if (e.key === 'ArrowRight') lightboxNav(1);
});
