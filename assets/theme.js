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


(() => {
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  let deferredInstallPrompt = null;

  const installButtons = () => Array.from(document.querySelectorAll('[data-pwa-install]'));
  const helpDialog = () => document.querySelector('[data-pwa-help]');

  const isIos = () =>
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

  const isSafari = () =>
    /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(window.navigator.userAgent);

  const setInstallVisibility = (visible) => {
    installButtons().forEach((button) => {
      button.hidden = !visible || isStandalone();
    });
  };

  const showHelp = () => {
    const dialog = helpDialog();
    if (!dialog) return;
    const copy = dialog.querySelector('[data-pwa-help-copy]');
    if (copy) {
      if (isIos()) {
        copy.textContent = 'In Safari, tap Share, then choose “Add to Home Screen,” then confirm Add.';
      } else {
        copy.textContent = 'Open your browser menu and choose “Install app” or “Add to Home Screen.”';
      }
    }
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallVisibility(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    setInstallVisibility(false);
    document.documentElement.classList.add('is-standalone');
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (isStandalone()) {
      document.documentElement.classList.add('is-standalone');
      setInstallVisibility(false);
    } else if (isIos() && isSafari()) {
      setInstallVisibility(true);
    }

    installButtons().forEach((button) => {
      button.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          await deferredInstallPrompt.userChoice;
          deferredInstallPrompt = null;
          setInstallVisibility(false);
          return;
        }
        showHelp();
      });
    });

    document.querySelectorAll('[data-pwa-help-close]').forEach((button) => {
      button.addEventListener('click', () => {
        const dialog = helpDialog();
        if (!dialog) return;
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      });
    });
  });
})();
