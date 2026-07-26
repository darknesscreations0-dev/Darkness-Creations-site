/* ============================================================
   MARKETPLACE — pulls live products from Supabase and renders
   the grid. Clicking a product goes to product.html?id=... —
   a real dedicated page rather than a modal.
   ============================================================ */
(function () {
  const grid = document.querySelector('[data-mkt-grid]');
  const countEl = document.querySelector('[data-mkt-count]');
  if (!grid) return;

  function priceHtml(product) {
    if (product.sale_price != null && product.sale_price !== '') {
      return `<span class="product-card__price" style="text-decoration:line-through;opacity:.5;font-size:.85em;">$${product.price}</span> <span class="product-card__price">$${product.sale_price}</span>`;
    }
    if (!product.price || product.price == 0) return `<span class="product-card__price is-free">Free</span>`;
    return `<span class="product-card__price">$${product.price}</span>`;
  }

  function coverHtml(product) {
    if (product.cover_type === 'video' && product.cover_image_url) {
      return `<video class="product-card__cover-video" src="${product.cover_image_url}" muted loop playsinline autoplay style="width:100%;height:100%;object-fit:cover;"></video>`;
    }
    if (product.cover_image_url) {
      return `<img src="${product.cover_image_url}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
    }
    return '';
  }

  function renderProducts(products) {
    if (!products.length) {
      grid.innerHTML = '<p class="admin-empty">No products yet — check back soon.</p>';
      if (countEl) countEl.textContent = '0 items';
      return;
    }
    if (countEl) countEl.textContent = `${products.length} item${products.length === 1 ? '' : 's'}`;

    grid.innerHTML = '';
    products.forEach((product) => {
      const tagsHtml = (product.tags || []).map((t) => `<span class="product-card__tag">${t}</span>`).join('');
      const href = `product.html?id=${encodeURIComponent(product.id)}`;
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.category = product.category || '';
      card.dataset.name = product.title || '';
      card.innerHTML = `
        <a href="${href}" style="display:block; color:inherit; text-decoration:none;">
          <div class="product-card__media">
            ${product.is_featured ? '<span class="product-card__badge">Featured</span>' : ''}
            ${coverHtml(product)}
            <div class="product-card__preview">View product</div>
          </div>
          <div class="product-card__body">
            <span class="product-card__cat">${product.category || ''}</span>
            <h3>${product.title}</h3>
            <div class="product-card__tags">${tagsHtml}</div>
            <div class="product-card__price-row">${priceHtml(product)}</div>
          </div>
        </a>
      `;
      grid.appendChild(card);
    });
  }

  async function loadProducts() {
    if (!window.supabaseClient) {
      grid.innerHTML = '<p class="admin-empty">Store is not configured yet.</p>';
      return;
    }
    const { data, error } = await window.supabaseClient
      .from('products')
      .select('*')
      .eq('brand', 'darkness-creations')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      grid.innerHTML = `<p class="admin-empty">Couldn't load products: ${error.message}</p>`;
      return;
    }
    renderProducts(data || []);
  }

  loadProducts();
})();
