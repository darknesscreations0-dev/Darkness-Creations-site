/* ============================================================
   DARKNESS CREATIONS — MARKETPLACE JS
   Front-end only: filtering, wishlist toggle, cart counter.
   No backend/payment wired up yet.
   ============================================================ */

(function () {
  const grid = document.querySelector('.mkt-grid');
  const chips = document.querySelectorAll('.mkt-chip');
  const countEl = document.querySelector('.mkt-count');
  const cartCountEl = document.querySelector('.nav__cart-count');
  const searchInput = document.querySelector('.mkt-search input');

  let cartCount = 0;
  const updateCartBadge = () => {
    if (cartCountEl) cartCountEl.textContent = cartCount;
  };

  const updateVisibleCount = () => {
    if (!grid || !countEl) return;
    const visible = Array.from(grid.querySelectorAll('.product-card'))
      .filter((card) => card.style.display !== 'none').length;
    countEl.textContent = `${visible} item${visible === 1 ? '' : 's'}`;
  };

  const applyFilters = () => {
    if (!grid) return;
    const activeChip = document.querySelector('.mkt-chip.is-active');
    const category = activeChip ? activeChip.dataset.category : 'all';
    const query = (searchInput && searchInput.value.trim().toLowerCase()) || '';

    grid.querySelectorAll('.product-card').forEach((card) => {
      const matchesCategory = category === 'all' || card.dataset.category === category;
      const matchesQuery = !query || card.dataset.name.toLowerCase().includes(query);
      card.style.display = matchesCategory && matchesQuery ? '' : 'none';
    });
    updateVisibleCount();
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  document.querySelectorAll('.product-card__wishlist').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.classList.toggle('is-active');
    });
  });

  document.querySelectorAll('.btn--cart').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      cartCount += 1;
      updateCartBadge();
      const original = btn.textContent;
      btn.textContent = 'Added';
      setTimeout(() => (btn.textContent = original), 1200);
    });
  });

  updateVisibleCount();
  updateCartBadge();
})();
