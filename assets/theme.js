document.documentElement.classList.remove('no-js');

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-site-header]').forEach((header) => {
    const toggle = header.querySelector('[data-menu-toggle]');
    const menu = header.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) return;
    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('is-open', !open);
    });
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        close();
        toggle.focus();
      }
    });
  });

  document.querySelectorAll('[data-product-section]').forEach((section) => {
    const select = section.querySelector('[data-variant-select]');
    if (!select) return;
    const price = section.querySelector('[data-product-price]');
    const status = section.querySelector('[data-inventory-status]');
    const submit = section.querySelector('[data-product-submit]');
    const label = section.querySelector('[data-product-submit-label]');
    const threshold = Number(section.dataset.lowStock || 4);

    const syncVariant = () => {
      const option = select.options[select.selectedIndex];
      const available = option.dataset.available === 'true';
      const tracked = option.dataset.tracked === 'true';
      const inventory = Number(option.dataset.inventory || 0);
      if (price) price.textContent = option.dataset.price || '';
      if (submit) submit.disabled = !available;
      if (label) label.textContent = available ? 'Add to cart' : 'Sold out';
      if (status) {
        if (!available) status.innerHTML = '<span class="inventory inventory--out">Sold out</span>';
        else if (tracked && inventory > 0 && inventory <= threshold) status.innerHTML = `<span class="inventory inventory--low">Only ${inventory} left</span>`;
        else status.innerHTML = '<span class="inventory inventory--in">In stock</span>';
      }
    };
    select.addEventListener('change', syncVariant);
  });
});
