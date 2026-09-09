const config = window.LIL_ROBB_SUPABASE || {};
const configured = Boolean(config.url && config.publishableKey && window.supabase?.createClient);
const client = configured ? window.supabase.createClient(config.url, config.publishableKey) : null;

const els = Object.fromEntries([...document.querySelectorAll('[id]')].map((el) => [el.id, el]));
let products = [];
let settings = null;
let editingId = null;

function status(message, type = '') {
  els.globalStatus.textContent = message || '';
  els.globalStatus.className = `status ${type}`.trim();
}

function show(el, visible = true) { el.hidden = !visible; }
function slugify(value) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); }
function normalizeError(error) { return error?.message || String(error || 'Unexpected error'); }

async function init() {
  if (!configured) {
    show(els.configMissing);
    show(els.authPanel, false);
    status('The secure backend has not been connected yet.');
    return;
  }
  const { data, error } = await client.auth.getSession();
  if (error) status(normalizeError(error), 'error');
  await routeSession(data?.session || null);
  client.auth.onAuthStateChange((_event, session) => { setTimeout(() => routeSession(session), 0); });
}

async function routeSession(session) {
  show(els.authPanel, !session);
  show(els.signOutButton, Boolean(session));
  show(els.claimPanel, false);
  show(els.dashboard, false);
  if (!session) { status(''); return; }

  const { data, error } = await client.from('lil_robb_admin_users').select('role').eq('user_id', session.user.id).maybeSingle();
  if (error) { status(`Owner check failed: ${normalizeError(error)}`, 'error'); return; }
  if (!data) {
    show(els.claimPanel);
    status('Signed in. Claim owner access to open the console.');
    return;
  }
  show(els.dashboard);
  await loadDashboard();
}

els.authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  status('Signing in…');
  const { error } = await client.auth.signInWithPassword({ email: els.emailInput.value.trim(), password: els.passwordInput.value });
  if (error) status(normalizeError(error), 'error');
});

els.signUpButton.addEventListener('click', async () => {
  const email = els.emailInput.value.trim();
  const password = els.passwordInput.value;
  if (!email || password.length < 8) { status('Enter an email and a password with at least 8 characters.', 'error'); return; }
  status('Creating account…');
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) { status(normalizeError(error), 'error'); return; }
  status(data.session ? 'Account created and signed in.' : 'Account created. Check your email if confirmation is required, then sign in.', 'success');
});

els.signOutButton.addEventListener('click', async () => {
  await client.auth.signOut();
  products = [];
  settings = null;
});

els.claimForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  status('Checking bootstrap code…');
  const { data, error } = await client.rpc('claim_lil_robb_owner', { p_code: els.bootstrapInput.value });
  if (error) { status(normalizeError(error), 'error'); return; }
  if (!data) { status('That bootstrap code is invalid, already used, or an owner already exists.', 'error'); return; }
  els.bootstrapInput.value = '';
  status('Owner access claimed.', 'success');
  const { data: sessionData } = await client.auth.getSession();
  await routeSession(sessionData.session);
});

async function loadDashboard() {
  status('Loading store data…');
  const [productResult, settingsResult] = await Promise.all([
    client.from('lil_robb_products').select('*').order('title'),
    client.from('lil_robb_store_settings').select('*').eq('id', true).maybeSingle()
  ]);
  if (productResult.error) { status(normalizeError(productResult.error), 'error'); return; }
  if (settingsResult.error) { status(normalizeError(settingsResult.error), 'error'); return; }
  products = productResult.data || [];
  settings = settingsResult.data || {};
  renderStats();
  renderProducts();
  renderSettings();
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
    coming_soon: els.comingSoonInput.checked,
    updated_at: new Date().toISOString()
  };
  status('Saving store settings…');
  const { data, error } = await client.from('lil_robb_store_settings').update(payload).eq('id', true).select().single();
  if (error) { status(normalizeError(error), 'error'); return; }
  settings = data;
  renderSettings();
  status('Store settings saved.', 'success');
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
      if (!field || ['is_published'].includes(key)) continue;
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

els.productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(els.productForm);
  const payload = Object.fromEntries(form.entries());
  payload.price = Number(payload.price || 0);
  payload.inventory = Number(payload.inventory || 0);
  payload.art_variant = Number(payload.art_variant || 0);
  payload.is_published = els.productForm.elements.is_published.checked;
  payload.updated_at = new Date().toISOString();
  status('Saving plant…');
  const query = editingId
    ? client.from('lil_robb_products').update(payload).eq('id', editingId)
    : client.from('lil_robb_products').insert(payload);
  const { error } = await query;
  if (error) { status(normalizeError(error), 'error'); return; }
  status('Plant saved.', 'success');
  closeEditor();
  await loadDashboard();
});

els.duplicateButton.addEventListener('click', async () => {
  const source = products.find((p) => p.id === editingId);
  if (!source) return;
  const { created_at, updated_at, ...copy } = source;
  copy.id = uniqueCopyId(source.id);
  copy.title = `${source.title} copy`;
  copy.is_published = false;
  status('Duplicating plant…');
  const { error } = await client.from('lil_robb_products').insert(copy);
  if (error) { status(normalizeError(error), 'error'); return; }
  closeEditor();
  await loadDashboard();
});

els.archiveButton.addEventListener('click', async () => {
  const source = products.find((p) => p.id === editingId);
  if (!source) return;
  const { error } = await client.from('lil_robb_products').update({ is_published: !source.is_published, updated_at: new Date().toISOString() }).eq('id', source.id);
  if (error) { status(normalizeError(error), 'error'); return; }
  closeEditor();
  await loadDashboard();
});

els.deleteButton.addEventListener('click', async () => {
  const source = products.find((p) => p.id === editingId);
  if (!source || !confirm(`Delete ${source.title}? This cannot be undone.`)) return;
  const { error } = await client.from('lil_robb_products').delete().eq('id', source.id);
  if (error) { status(normalizeError(error), 'error'); return; }
  closeEditor();
  await loadDashboard();
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
