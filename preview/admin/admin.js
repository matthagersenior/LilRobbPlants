const config = window.LIL_ROBB_API || {};
const baseUrl = String(config.baseUrl || '').replace(/\/$/, '');
const configured = /^https?:\/\//.test(baseUrl);
const TOKEN_KEY = 'lilRobbAdminToken';

const els = Object.fromEntries([...document.querySelectorAll('[id]')].map((el) => [el.id, el]));
let token = sessionStorage.getItem(TOKEN_KEY) || '';
let products = [];
let settings = null;
let editingId = null;

const show = (el, visible = true) => { el.hidden = !visible; };
const status = (message = '', type = '') => { els.globalStatus.textContent = message; els.globalStatus.className = `status ${type}`.trim(); };
const normalizeError = (error) => error?.message || String(error || 'Unexpected error');
const slugify = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function api(path, { method = 'GET', body, admin = false } = {}) {
  if (!configured) throw new Error('Cloudflare Worker API URL is not configured yet.');
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (admin && token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && admin) {
    token = '';
    sessionStorage.removeItem(TOKEN_KEY);
    routeAuth();
  }
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

function routeAuth() {
  show(els.configMissing, !configured);
  show(els.authPanel, configured && !token);
  show(els.dashboard, configured && Boolean(token));
  show(els.signOutButton, configured && Boolean(token));
}

async function init() {
  routeAuth();
  if (!configured) {
    status('Storefront remains available with its embedded catalog. Add the Worker URL after Cloudflare deployment.');
    return;
  }
  if (token) {
    try { await loadDashboard(); }
    catch (error) {
      if (token) status(normalizeError(error), 'error');
    }
  }
}

els.authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  status('Signing in…');
  try {
    const data = await api('/api/admin/login', { method: 'POST', body: { password: els.passwordInput.value } });
    token = data.token;
    sessionStorage.setItem(TOKEN_KEY, token);
    els.passwordInput.value = '';
    routeAuth();
    await loadDashboard();
  } catch (error) { status(normalizeError(error), 'error'); }
});

els.signOutButton.addEventListener('click', async () => {
  try { if (token) await api('/api/admin/logout', { method: 'POST', admin: true }); } catch {}
  token = '';
  products = [];
  settings = null;
  sessionStorage.removeItem(TOKEN_KEY);
  routeAuth();
  status('Signed out.', 'success');
});

async function loadDashboard() {
  status('Loading store data…');
  const [productData, settingsData] = await Promise.all([
    api('/api/admin/products', { admin: true }),
    api('/api/admin/settings', { admin: true })
  ]);
  products = productData;
  settings = settingsData;
  renderStats();
  renderProducts();
  renderSettings();
  routeAuth();
  status('Store data loaded.', 'success');
}

function renderStats() {
  els.publishedStat.textContent = String(products.filter((p) => p.is_published).length);
  els.inventoryStat.textContent = String(products.reduce((sum, p) => sum + Number(p.inventory || 0), 0));
  els.soldOutStat.textContent = String(products.filter((p) => p.is_published && Number(p.inventory) === 0).length);
}

function renderProducts() {
  els.productList.innerHTML = products.length ? products.map((p) => `
    <article class="product-row">
      <div><strong>${escapeHtml(p.title)}</strong><small>${escapeHtml(p.species || '')}</small></div>
      <span class="price">$${Number(p.price).toFixed(2)} · ${Number(p.inventory)} units</span>
      <span class="pill ${p.is_published ? '' : 'off'}">${p.is_published ? 'Published' : 'Archived'}</span>
      <button class="edit" type="button" data-edit="${escapeHtml(p.id)}">Edit</button>
    </article>`).join('') : '<p>No plants yet. Add the first plant.</p>';
}

function renderSettings() {
  els.announcementInput.value = settings.announcement || '';
  els.shippingInput.value = Number(settings.standard_shipping ?? 10).toFixed(2);
  els.freeShippingInput.value = Number(settings.free_shipping_threshold ?? 75).toFixed(2);
  els.pickupInput.checked = Boolean(settings.local_pickup_enabled);
  els.comingSoonInput.checked = settings.coming_soon !== false;
}

els.settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    announcement: els.announcementInput.value.trim(),
    standard_shipping: Number(els.shippingInput.value || 0),
    free_shipping_threshold: Number(els.freeShippingInput.value || 0),
    local_pickup_enabled: els.pickupInput.checked,
    coming_soon: els.comingSoonInput.checked
  };
  status('Saving store settings…');
  try {
    settings = await api('/api/admin/settings', { method: 'PUT', body: payload, admin: true });
    renderSettings();
    status('Store settings saved.', 'success');
  } catch (error) { status(normalizeError(error), 'error'); }
});

els.newPlantButton.addEventListener('click', () => openEditor());
els.cancelEditButton.addEventListener('click', closeEditor);
els.productList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit]');
  if (button) openEditor(products.find((p) => p.id === button.dataset.edit));
});

function openEditor(product = null) {
  editingId = product?.id || null;
  els.productForm.reset();
  els.productForm.elements.art_variant.value = product?.art_variant ?? 0;
  els.productForm.elements.is_published.checked = product ? Boolean(product.is_published) : true;
  if (product) {
    for (const [key, value] of Object.entries(product)) {
      const field = els.productForm.elements.namedItem(key);
      if (!field || key === 'is_published') continue;
      field.value = value ?? '';
    }
  }
  els.productId.readOnly = Boolean(product);
  els.editorTitle.textContent = product ? `Edit ${product.title}` : 'Add plant';
  show(els.duplicateButton, Boolean(product));
  show(els.archiveButton, Boolean(product));
  show(els.deleteButton, Boolean(product));
  els.archiveButton.textContent = product?.is_published ? 'Archive' : 'Publish';
  show(els.editorPanel);
  els.editorPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeEditor() { show(els.editorPanel, false); editingId = null; }

els.productForm.elements.title.addEventListener('input', (event) => {
  if (!editingId && !els.productId.value) els.productId.value = slugify(event.target.value);
});

function formProduct() {
  const form = new FormData(els.productForm);
  const payload = Object.fromEntries(form.entries());
  payload.price = Number(payload.price || 0);
  payload.inventory = Number(payload.inventory || 0);
  payload.art_variant = Number(payload.art_variant || 0);
  payload.is_published = els.productForm.elements.is_published.checked;
  return payload;
}

els.productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = formProduct();
  status('Saving plant…');
  try {
    if (editingId) await api(`/api/admin/products/${encodeURIComponent(editingId)}`, { method: 'PUT', body: payload, admin: true });
    else await api('/api/admin/products', { method: 'POST', body: payload, admin: true });
    status('Plant saved.', 'success');
    closeEditor();
    await loadDashboard();
  } catch (error) { status(normalizeError(error), 'error'); }
});

els.duplicateButton.addEventListener('click', async () => {
  const source = products.find((p) => p.id === editingId);
  if (!source) return;
  const copy = { ...source, id: uniqueCopyId(source.id), title: `${source.title} copy`, is_published: false };
  delete copy.created_at; delete copy.updated_at;
  status('Duplicating plant…');
  try {
    await api('/api/admin/products', { method: 'POST', body: copy, admin: true });
    closeEditor(); await loadDashboard();
  } catch (error) { status(normalizeError(error), 'error'); }
});

els.archiveButton.addEventListener('click', async () => {
  const source = products.find((p) => p.id === editingId);
  if (!source) return;
  status(source.is_published ? 'Archiving plant…' : 'Publishing plant…');
  try {
    await api(`/api/admin/products/${encodeURIComponent(source.id)}`, { method: 'PUT', body: { ...source, is_published: !source.is_published }, admin: true });
    closeEditor(); await loadDashboard();
  } catch (error) { status(normalizeError(error), 'error'); }
});

els.deleteButton.addEventListener('click', async () => {
  const source = products.find((p) => p.id === editingId);
  if (!source || !confirm(`Delete ${source.title}? This cannot be undone.`)) return;
  status('Deleting plant…');
  try {
    await api(`/api/admin/products/${encodeURIComponent(source.id)}`, { method: 'DELETE', admin: true });
    closeEditor(); await loadDashboard();
  } catch (error) { status(normalizeError(error), 'error'); }
});

function uniqueCopyId(id) {
  let candidate = `${id}-copy`;
  let index = 2;
  while (products.some((p) => p.id === candidate)) candidate = `${id}-copy-${index++}`;
  return candidate;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

init().catch((error) => status(normalizeError(error), 'error'));
