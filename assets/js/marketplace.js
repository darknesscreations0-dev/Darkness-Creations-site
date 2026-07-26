/* ============================================================
   MARKETPLACE — pulls live products from Supabase and renders
   the grid + a click-through product detail lightbox.
   ============================================================ */
(function () {
  const grid = document.querySelector('[data-mkt-grid]');
  const countEl = document.querySelector('[data-mkt-count]');
  if (!grid) return;

  const lightbox = document.getElementById('mktLightbox');
  const lbMedia = document.getElementById('mktLightboxMedia');
  const lbCat = document.getElementById('mktLightboxCat');
  const lbTitle = document.getElementById('mktLightboxTitle');
  const lbDesc = document.getElementById('mktLightboxDesc');
  const lbTags = document.getElementById('mktLightboxTags');
  const lbPrice = document.getElementById('mktLightboxPrice');
  const lbBuy = document.getElementById('mktLightboxBuy');
  const lbMsg = document.getElementById('mktLightboxMsg');
  const lbClose = document.getElementById('mktLightboxClose');
  const lbBackdrop = document.getElementById('mktLightboxBackdrop');

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
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.category = product.category || '';
      card.dataset.name = product.title || '';
      card.innerHTML = `
        <div class="product-card__media">
          ${product.is_featured ? '<span class="product-card__badge">Featured</span>' : ''}
          ${coverHtml(product)}
          <div class="product-card__preview">Quick preview</div>
        </div>
        <div class="product-card__body">
          <span class="product-card__cat">${product.category || ''}</span>
          <h3>${product.title}</h3>
          <div class="product-card__tags">${tagsHtml}</div>
          <div class="product-card__price-row">${priceHtml(product)}</div>
          <div class="product-card__actions">
            <a href="javascript:void(0)" class="btn btn--buy" style="width:100%;" data-open-product><span>View</span></a>
          </div>
        </div>
      `;
      card.querySelector('[data-open-product]').addEventListener('click', () => openProduct(product));
      card.querySelector('.product-card__media').addEventListener('click', () => openProduct(product));
      grid.appendChild(card);
    });
  }

  function openProduct(product) {
    lbCat.textContent = product.category || '';
    lbTitle.textContent = product.title || '';
    lbDesc.textContent = product.description || '';
    lbTags.innerHTML = (product.tags || []).map((t) => `<span class="product-card__tag">${t}</span>`).join('');
    lbPrice.innerHTML = priceHtml(product);
    lbMsg.textContent = '';

    let mediaHtml = coverHtml(product);
    if (product.preview_media && product.preview_media.length) {
      mediaHtml += product.preview_media.map((m) => {
        const url = m.url || '';
        const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
        return isVideo
          ? `<video src="${url}" controls playsinline style="width:100%;border-radius:8px;margin-top:.5rem;"></video>`
          : `<img src="${url}" alt="" style="width:100%;border-radius:8px;margin-top:.5rem;">`;
      }).join('');
    }
    lbMedia.innerHTML = mediaHtml;

    lbBuy.onclick = () => {
      lbMsg.textContent = 'Checkout isn\'t set up yet — coming soon.';
    };

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbMedia.innerHTML = '';
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbBackdrop) lbBackdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });

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
