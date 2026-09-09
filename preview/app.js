const state = {
  products: [],
  filter: 'all',
  query: '',
  cart: JSON.parse(localStorage.getItem('lilRobbPreviewCart') || '{}')
};

const grid = document.querySelector('#productGrid');
const emptyState = document.querySelector('#emptyState');
const cartPanel = document.querySelector('#cartPanel');
const cartButton = document.querySelector('#cartButton');
const closeCartButton = document.querySelector('#closeCart');
const scrim = document.querySelector('#scrim');
const cartItems = document.querySelector('#cartItems');
const cartCount = document.querySelector('#cartCount');
const cartSubtotal = document.querySelector('#cartSubtotal');
const dialog = document.querySelector('#productDialog');
const dialogContent = document.querySelector('#dialogContent');

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

function inventoryLabel(product) {
  if (product.inventory <= 0) return ['Sold out', 'out'];
  if (product.inventory <= 4) return [`Only ${product.inventory} left`, 'low'];
  return ['In stock', ''];
}

function matchesFilter(product) {
  if (state.filter === 'easy') return /easy/i.test(product.difficulty);
  if (state.filter === 'low-light') return /low/i.test(product.light);
  if (state.filter === 'pet-friendly') return /non.?toxic|pet.?friendly|safe/i.test(product.petSafety);
  return true;
}

function renderProducts() {
  const q = state.query.trim().toLowerCase();
  const shown = state.products.filter((product) => {
    const haystack = [product.title, product.species, product.description, product.light, product.difficulty, product.petSafety].join(' ').toLowerCase();
    return matchesFilter(product) && (!q || haystack.includes(q));
  });

  grid.innerHTML = shown.map((product) => {
    const [label, inventoryClass] = inventoryLabel(product);
    const disabled = product.inventory <= 0 ? 'disabled' : '';
    return `
      <article class="product-card">
        <div class="product-art" data-art="${product.artVariant}" role="img" aria-label="Decorative botanical illustration for ${esc(product.title)}">
          <span class="inventory ${inventoryClass}">${esc(label)}</span>
        </div>
        <div class="card-body">
          <div class="card-title-row"><h3>${esc(product.title)}</h3><span class="price">${money(product.price)}</span></div>
          <p class="species">${esc(product.species)}</p>
          <p class="description">${esc(product.description)}</p>
          <div class="care-mini">
            <span>☀️ ${esc(product.light)}</span>
            <span>💧 ${esc(product.watering)}</span>
          </div>
          <div class="card-actions">
            <button class="button primary" type="button" data-add="${esc(product.id)}" ${disabled}>${disabled ? 'Sold out' : 'Add to cart'}</button>
            <button class="link-button" type="button" data-details="${esc(product.id)}">Care details</button>
          </div>
        </div>
      </article>`;
  }).join('');

  emptyState.hidden = shown.length > 0;
}

function saveCart() {
  localStorage.setItem('lilRobbPreviewCart', JSON.stringify(state.cart));
}

function renderCart() {
  const entries = Object.entries(state.cart).map(([id, quantity]) => ({ product: state.products.find((item) => item.id === id), quantity })).filter((entry) => entry.product && entry.quantity > 0);
  const totalCount = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const subtotal = entries.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  cartCount.textContent = String(totalCount);
  cartCount.setAttribute('aria-label', `${totalCount} item${totalCount === 1 ? '' : 's'}`);
  cartSubtotal.textContent = money(subtotal);

  cartItems.innerHTML = entries.length ? entries.map(({ product, quantity }) => `
    <div class="cart-item">
      <strong>${esc(product.title)} × ${quantity}</strong>
      <small>${money(product.price * quantity)}</small>
      <button type="button" data-remove="${esc(product.id)}" aria-label="Remove ${esc(product.title)} from cart">Remove</button>
    </div>`).join('') : '<p class="fine-print">Your cart is empty. Add a plant to save it for launch.</p>';
}

function addToCart(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product || product.inventory <= 0) return;
  const next = Math.min((state.cart[id] || 0) + 1, product.inventory);
  state.cart[id] = next;
  saveCart();
  renderCart();
  openCart();
}

function removeFromCart(id) {
  delete state.cart[id];
  saveCart();
  renderCart();
}

function openCart() {
  cartPanel.hidden = false;
  scrim.hidden = false;
  cartButton.setAttribute('aria-expanded', 'true');
  closeCartButton.focus();
}

function closeCart() {
  cartPanel.hidden = true;
  scrim.hidden = true;
  cartButton.setAttribute('aria-expanded', 'false');
  cartButton.focus();
}

function showDetails(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product) return;
  const facts = [
    ['Light', product.light], ['Water', product.watering], ['Soil', product.soil],
    ['Growing conditions', product.growingConditions], ['Difficulty', product.difficulty], ['Humidity', product.humidity],
    ['Mature size', product.matureSize], ['Pet safety', product.petSafety], ['Care notes', product.careNotes]
  ];
  dialogContent.innerHTML = `
    <p class="eyebrow">Plant care</p>
    <h2>${esc(product.title)}</h2>
    <p class="dialog-species">${esc(product.species)}</p>
    <p class="dialog-price">${money(product.price)}</p>
    <p>${esc(product.description)}</p>
    <div class="care-grid">${facts.map(([label, value]) => `<div class="care-fact"><strong>${esc(label)}</strong><span>${esc(value)}</span></div>`).join('')}</div>`;
  dialog.showModal();
}

function setFilter(value, button) {
  state.filter = value;
  document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button));
  renderProducts();
}

document.addEventListener('click', (event) => {
  const add = event.target.closest('[data-add]');
  const details = event.target.closest('[data-details]');
  const remove = event.target.closest('[data-remove]');
  const filter = event.target.closest('[data-filter]');
  if (add) addToCart(add.dataset.add);
  if (details) showDetails(details.dataset.details);
  if (remove) removeFromCart(remove.dataset.remove);
  if (filter) setFilter(filter.dataset.filter, filter);
});

document.querySelector('#searchInput').addEventListener('input', (event) => { state.query = event.target.value; renderProducts(); });
cartButton.addEventListener('click', openCart);
closeCartButton.addEventListener('click', closeCart);
scrim.addEventListener('click', closeCart);
document.querySelector('#closeDialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

loadProducts();
async function loadProducts() {
  try {
    if (Array.isArray(window.__LIL_ROBB_PRODUCTS__)) {
      state.products = window.__LIL_ROBB_PRODUCTS__;
    } else {
      const response = await fetch('./products.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.products = await response.json();
    }
    renderProducts();
    renderCart();
  } catch (error) {
    grid.innerHTML = '<p class="empty-state">The plant catalog could not load. Refresh the page to try again.</p>';
    console.error(error);
  }
}
