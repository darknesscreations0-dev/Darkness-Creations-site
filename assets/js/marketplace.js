/* ============================================================
   DARKNESS CREATIONS — MARKETPLACE JS
   Filtering / wishlist / cart (front-end only) + dynamic
   product loading from Supabase, when configured.
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

  function wireCardInteractions(scope) {
    scope.querySelectorAll('.product-card__wishlist').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        btn.classList.toggle('is-active');
      });
    });
    scope.querySelectorAll('.btn--cart').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        cartCount += 1;
        updateCartBadge();
        const original = btn.textContent;
        btn.textContent = 'Added';
        setTimeout(() => (btn.textContent = original), 1200);
      });
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      applyFilters();
    });
  });
  if (searchInput) searchInput.addEventListener('input', applyFilters);

  /* ---------- Dynamic products from Supabase ---------- */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function renderProductCard(p) {
    const priceHtml = p.is_free
      ? '<span class="product-card__price is-free">Free</span>'
      : `<span class="product-card__price">$${Number(p.price).toFixed(2)}</span>`;
    const tagsHtml = (p.tags || [])
      .map((t) => `<span class="product-card__tag">${escapeHtml(t)}</span>`)
      .join('');
    const badgeHtml = p.badge ? `<span class="product-card__badge">${escapeHtml(p.badge)}</span>` : '';
    const mediaStyle = p.image_url
      ? `style="background-image:url('${p.image_url}'); background-size:cover; background-position:center;"`
      : '';
    const actionsHtml = p.is_free
      ? `<a href="${p.file_url || '#'}" class="btn btn--buy" style="width:100%;" target="_blank" rel="noopener"><span>Download</span></a>`
      : `<a href="#" class="btn btn--ghost btn--cart"><span>Add to cart</span></a>
         <a href="${p.file_url || '#'}" class="btn btn--buy" target="_blank" rel="noopener"><span>Buy now</span></a>`;

    const article = document.createElement('article');
    article.className = 'product-card';
    article.dataset.category = p.category;
    article.dataset.name = p.name;
    article.innerHTML = `
      <div class="product-card__media" ${mediaStyle}>
        ${badgeHtml}
        <button class="product-card__wishlist" aria-label="Add to wishlist"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></button>
        ${p.video_url ? '<div class="product-card__preview">▶ Preview available</div>' : '<div class="product-card__preview">Quick preview</div>'}
      </div>
      <div class="product-card__body">
        <span class="product-card__cat">${escapeHtml(p.category)}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="product-card__tags">${tagsHtml}</div>
        <div class="product-card__price-row">${priceHtml}</div>
        <div class="product-card__actions">${actionsHtml}</div>
      </div>
    `;
    return article;
  }

  async function loadDynamicProducts() {
    if (!grid || !window.supabaseClient) {
      // No Supabase configured yet — keep the static sample cards,
      // just wire up their buttons.
      wireCardInteractions(document);
      updateVisibleCount();
      updateCartBadge();
      return;
    }

    const { data, error } = await window.supabaseClient
      .from('products')
      .select('*')
      .eq('brand', 'darkness-creations')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      wireCardInteractions(document);
      updateVisibleCount();
      updateCartBadge();
      return;
    }

    grid.innerHTML = '';
    if (data.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-faint); padding:2rem 0;">No products yet — add some from the admin panel.</p>';
    } else {
      data.forEach((p) => grid.appendChild(renderProductCard(p)));
      wireCardInteractions(grid);
    }
    applyFilters();
    updateCartBadge();
  }

  /* ---------- Newsletter-style demo submit not needed here ---------- */

  document.addEventListener('DOMContentLoaded', loadDynamicProducts);
})();
