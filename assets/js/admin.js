/* ============================================================
   ADMIN PANEL — JS
   Handles: login, products (sale price, image OR video cover,
   multi-file), promo codes, and banners.
   ============================================================ */

(function () {
  const loginScreen = document.querySelector('.admin-login');
  const shell = document.querySelector('.admin-shell');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const loginError = document.querySelector('.admin-login__error');
  const logoutBtn = document.querySelector('[data-admin-logout]');

  const sectionTabs = document.querySelectorAll('.admin-tab[data-section]');
  const sectionPanels = document.querySelectorAll('[data-section-panel]');

  const productForm = document.querySelector('[data-product-form]');
  const productList = document.querySelector('[data-product-list]');
  const formMsg = document.querySelector('[data-form-msg]');
  const cancelEditBtn = document.querySelector('[data-cancel-edit]');

  const promoForm = document.querySelector('[data-promo-form]');
  const promoList = document.querySelector('[data-promo-list]');
  const promoMsg = document.querySelector('[data-promo-msg]');

  const bannerForm = document.querySelector('[data-banner-form]');
  const bannerList = document.querySelector('[data-banner-list]');
  const bannerMsg = document.querySelector('[data-banner-msg]');

  let editingId = null;

  function showApp() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (shell) shell.style.display = 'block';
    loadProducts();
    loadPromoCodes();
    loadBanners();
  }
  function showLogin() {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (shell) shell.style.display = 'none';
  }

  async function checkSession() {
    if (!window.supabaseClient) return showLogin();
    const { data } = await window.supabaseClient.auth.getSession();
    if (data && data.session) showApp();
    else showLogin();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.supabaseClient) {
        loginError.textContent = 'Supabase is not configured yet — fill in assets/js/supabase-config.js.';
        loginError.style.display = 'block';
        return;
      }
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;
      const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        loginError.textContent = error.message;
        loginError.style.display = 'block';
      } else {
        loginError.style.display = 'none';
        showApp();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (window.supabaseClient) await window.supabaseClient.auth.signOut();
      showLogin();
    });
  }

  sectionTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      sectionTabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const target = tab.dataset.section;
      sectionPanels.forEach((panel) => {
        panel.style.display = panel.dataset.sectionPanel === target ? 'grid' : 'none';
      });
    });
  });

  function setMsg(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.className = 'admin-msg ' + (isError ? 'is-error' : 'is-success');
  }

  async function uploadToBucket(file, bucket, folder) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await window.supabaseClient.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    if (bucket === 'product-files') {
      return { path, name: file.name };
    }
    const { data } = window.supabaseClient.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, name: file.name };
  }

  /* ============================================================
     PRODUCTS
     ============================================================ */
  function resetProductForm() {
    if (!productForm) return;
    productForm.reset();
    productForm.is_active.checked = true;
    editingId = null;
    productForm.querySelector('[data-submit-label]').textContent = 'Add product';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
  }

  if (cancelEditBtn) cancelEditBtn.addEventListener('click', resetProductForm);

  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.supabaseClient) {
        setMsg(formMsg, 'Supabase is not configured yet.', true);
        return;
      }
      const submitBtn = productForm.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      setMsg(formMsg, 'Saving…', false);

      try {
        const fd = new FormData(productForm);
        const coverFile = document.getElementById('p-image').files[0];
        const previewFiles = Array.from(document.getElementById('p-preview').files || []);
        const downloadFiles = Array.from(document.getElementById('p-files').files || []);
        const salePriceRaw = fd.get('sale_price');

        const payload = {
          brand: 'darkness-creations',
          title: fd.get('title'),
          category: fd.get('category'),
          description: fd.get('description'),
          price: parseFloat(fd.get('price')) || 0,
          sale_price: salePriceRaw ? parseFloat(salePriceRaw) : null,
          tags: (fd.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean),
          is_active: fd.get('is_active') === 'on',
          is_featured: fd.get('is_featured') === 'on',
        };

        // Cover accepts either an image or a short video — the marketplace
        // grid checks cover_type to know whether to render <img> or <video>.
        if (coverFile) {
          const uploaded = await uploadToBucket(coverFile, 'product-media', 'covers');
          payload.cover_image_url = uploaded.url;
          payload.cover_type = coverFile.type.startsWith('video/') ? 'video' : 'image';
        } else if (!editingId) {
          throw new Error('Please choose a cover image or video.');
        }

        if (previewFiles.length) {
          const uploaded = await Promise.all(previewFiles.map((f) => uploadToBucket(f, 'product-media', 'previews')));
          payload.preview_media = uploaded;
        }

        if (downloadFiles.length) {
          const uploaded = await Promise.all(downloadFiles.map((f) => uploadToBucket(f, 'product-files', 'files')));
          payload.files = uploaded;
        }

        let result;
        if (editingId) {
          result = await window.supabaseClient.from('products').update(payload).eq('id', editingId);
        } else {
          result = await window.supabaseClient.from('products').insert(payload);
        }
        if (result.error) throw result.error;

        setMsg(formMsg, editingId ? 'Product updated.' : 'Product added.', false);
        resetProductForm();
        loadProducts();
      } catch (err) {
        setMsg(formMsg, err.message || 'Something went wrong.', true);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  async function loadProducts() {
    if (!productList || !window.supabaseClient) return;
    productList.innerHTML = '<p class="admin-empty">Loading…</p>';
    const { data, error } = await window.supabaseClient
      .from('products')
      .select('*')
      .eq('brand', 'darkness-creations')
      .order('created_at', { ascending: false });

    if (error) {
      productList.innerHTML = `<p class="admin-empty">Error: ${error.message}</p>`;
      return;
    }
    if (!data || data.length === 0) {
      productList.innerHTML = '<p class="admin-empty">No products yet. Add your first one on the left.</p>';
      return;
    }

    productList.innerHTML = '';
    data.forEach((product) => {
      const priceLabel = product.sale_price
        ? `<span style="text-decoration:line-through;opacity:.5;">$${product.price}</span> $${product.sale_price}`
        : (product.price ? `$${product.price}` : 'Free');
      const statusLabel = product.is_active ? 'Published' : 'Unpublished';
      const featuredLabel = product.is_featured ? ' · Featured' : '';
      const isVideoCover = product.cover_type === 'video';

      const row = document.createElement('div');
      row.className = 'admin-item';
      row.innerHTML = `
        <div class="admin-item__thumb" ${isVideoCover ? '' : `style="background-image:url('${product.cover_image_url || ''}')"`}>
          ${isVideoCover ? `<video src="${product.cover_image_url || ''}" muted loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>` : ''}
        </div>
        <div class="admin-item__body">
          <h4>${product.title}</h4>
          <div class="admin-item__meta">${product.category} · ${priceLabel} · ${statusLabel}${featuredLabel}${isVideoCover ? ' · Video cover' : ''}</div>
        </div>
        <div class="admin-item__actions">
          <button data-edit>Edit</button>
          <button data-toggle>${product.is_active ? 'Unpublish' : 'Publish'}</button>
          <button data-delete class="danger">Delete</button>
        </div>
      `;
      row.querySelector('[data-edit]').addEventListener('click', () => fillFormForEdit(product));
      row.querySelector('[data-toggle]').addEventListener('click', () => togglePublish(product));
      row.querySelector('[data-delete]').addEventListener('click', () => deleteProduct(product.id));
      productList.appendChild(row);
    });
  }

  function fillFormForEdit(product) {
    editingId = product.id;
    productForm.title.value = product.title || '';
    productForm.category.value = product.category || '';
    productForm.description.value = product.description || '';
    productForm.price.value = product.price || 0;
    productForm.sale_price.value = product.sale_price || '';
    productForm.tags.value = (product.tags || []).join(', ');
    productForm.is_active.checked = !!product.is_active;
    productForm.is_featured.checked = !!product.is_featured;
    productForm.querySelector('[data-submit-label]').textContent = 'Update product';
    if (cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function togglePublish(product) {
    const { error } = await window.supabaseClient.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    if (error) { alert('Error: ' + error.message); return; }
    loadProducts();
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product permanently? This cannot be undone — anyone who already bought it keeps their receipt, but the listing itself is gone. Consider "Unpublish" instead if unsure.')) return;
    const { error } = await window.supabaseClient.from('products').delete().eq('id', id);
    if (error) { alert('Error deleting: ' + error.message); return; }
    loadProducts();
  }

  /* ============================================================
     PROMO CODES
     ============================================================ */
  if (promoForm) {
    promoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = promoForm.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      setMsg(promoMsg, 'Saving…', false);
      try {
        const fd = new FormData(promoForm);
        const payload = {
          code: (fd.get('code') || '').trim().toUpperCase(),
          discount_type: fd.get('discount_type'),
          discount_value: parseFloat(fd.get('discount_value')) || 0,
          max_uses: fd.get('max_uses') ? parseInt(fd.get('max_uses'), 10) : null,
          expires_at: fd.get('expires_at') || null,
          is_active: fd.get('is_active') === 'on',
        };
        const { error } = await window.supabaseClient.from('promo_codes').insert(payload);
        if (error) throw error;
        setMsg(promoMsg, 'Promo code created.', false);
        promoForm.reset();
        promoForm.is_active.checked = true;
        loadPromoCodes();
      } catch (err) {
        setMsg(promoMsg, err.message || 'Something went wrong.', true);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  async function loadPromoCodes() {
    if (!promoList || !window.supabaseClient) return;
    promoList.innerHTML = '<p class="admin-empty">Loading…</p>';
    const { data, error } = await window.supabaseClient.from('promo_codes').select('*').order('created_at', { ascending: false });

    if (error) { promoList.innerHTML = `<p class="admin-empty">Error: ${error.message}</p>`; return; }
    if (!data || data.length === 0) { promoList.innerHTML = '<p class="admin-empty">No promo codes yet.</p>'; return; }

    promoList.innerHTML = '';
    data.forEach((code) => {
      const discountLabel = code.discount_type === 'percent' ? `${code.discount_value}% off` : `$${code.discount_value} off`;
      const usesLabel = code.max_uses ? `${code.used_count || 0}/${code.max_uses} uses` : `${code.used_count || 0} uses (unlimited)`;
      const row = document.createElement('div');
      row.className = 'admin-item';
      row.innerHTML = `
        <div class="admin-item__body">
          <h4>${code.code}</h4>
          <div class="admin-item__meta">${discountLabel} · ${usesLabel} · ${code.is_active ? 'Active' : 'Inactive'}${code.expires_at ? ' · Expires ' + new Date(code.expires_at).toLocaleDateString() : ''}</div>
        </div>
        <div class="admin-item__actions">
          <button data-toggle>${code.is_active ? 'Deactivate' : 'Activate'}</button>
          <button data-delete class="danger">Delete</button>
        </div>
      `;
      row.querySelector('[data-toggle]').addEventListener('click', async () => {
        const { error } = await window.supabaseClient.from('promo_codes').update({ is_active: !code.is_active }).eq('id', code.id);
        if (error) { alert('Error: ' + error.message); return; }
        loadPromoCodes();
      });
      row.querySelector('[data-delete]').addEventListener('click', async () => {
        if (!confirm('Delete this promo code?')) return;
        const { error } = await window.supabaseClient.from('promo_codes').delete().eq('id', code.id);
        if (error) { alert('Error: ' + error.message); return; }
        loadPromoCodes();
      });
      promoList.appendChild(row);
    });
  }

  /* ============================================================
     BANNERS
     ============================================================ */
  if (bannerForm) {
    bannerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = bannerForm.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      setMsg(bannerMsg, 'Saving…', false);
      try {
        const fd = new FormData(bannerForm);
        const imageFile = document.getElementById('b-image').files[0];
        if (!imageFile) throw new Error('Please choose a banner image.');
        const uploaded = await uploadToBucket(imageFile, 'banners', 'images');

        const payload = {
          title: fd.get('title'),
          subtitle: fd.get('subtitle') || null,
          link_url: fd.get('link_url') || null,
          sort_order: parseInt(fd.get('sort_order'), 10) || 0,
          is_active: fd.get('is_active') === 'on',
          image_url: uploaded.url,
        };
        const { error } = await window.supabaseClient.from('banners').insert(payload);
        if (error) throw error;
        setMsg(bannerMsg, 'Banner added.', false);
        bannerForm.reset();
        bannerForm.is_active.checked = true;
        loadBanners();
      } catch (err) {
        setMsg(bannerMsg, err.message || 'Something went wrong.', true);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  async function loadBanners() {
    if (!bannerList || !window.supabaseClient) return;
    bannerList.innerHTML = '<p class="admin-empty">Loading…</p>';
    const { data, error } = await window.supabaseClient.from('banners').select('*').order('sort_order', { ascending: true });

    if (error) { bannerList.innerHTML = `<p class="admin-empty">Error: ${error.message}</p>`; return; }
    if (!data || data.length === 0) { bannerList.innerHTML = '<p class="admin-empty">No banners yet.</p>'; return; }

    bannerList.innerHTML = '';
    data.forEach((banner) => {
      const row = document.createElement('div');
      row.className = 'admin-item';
      row.innerHTML = `
        <div class="admin-item__thumb" style="background-image:url('${banner.image_url || ''}')"></div>
        <div class="admin-item__body">
          <h4>${banner.title}</h4>
          <div class="admin-item__meta">Order ${banner.sort_order} · ${banner.is_active ? 'Active' : 'Inactive'}</div>
        </div>
        <div class="admin-item__actions">
          <button data-toggle>${banner.is_active ? 'Deactivate' : 'Activate'}</button>
          <button data-delete class="danger">Delete</button>
        </div>
      `;
      row.querySelector('[data-toggle]').addEventListener('click', async () => {
        const { error } = await window.supabaseClient.from('banners').update({ is_active: !banner.is_active }).eq('id', banner.id);
        if (error) { alert('Error: ' + error.message); return; }
        loadBanners();
      });
      row.querySelector('[data-delete]').addEventListener('click', async () => {
        if (!confirm('Delete this banner?')) return;
        const { error } = await window.supabaseClient.from('banners').delete().eq('id', banner.id);
        if (error) { alert('Error: ' + error.message); return; }
        loadBanners();
      });
      bannerList.appendChild(row);
    });
  }

  checkSession();
})();
