/* ============================================================
   ADMIN PANEL — JS
   Handles login, and product create/edit/delete against Supabase.
   ============================================================ */

(function () {
  const loginScreen = document.querySelector('.admin-login');
  const shell = document.querySelector('.admin-shell');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const loginError = document.querySelector('.admin-login__error');
  const logoutBtn = document.querySelector('[data-admin-logout]');
  const productForm = document.querySelector('[data-product-form]');
  const productList = document.querySelector('[data-product-list]');
  const formMsg = document.querySelector('[data-form-msg]');
  const brandTabs = document.querySelectorAll('.admin-tab');

  let currentBrand = 'darkness-creations';
  let editingId = null;

  function showApp() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (shell) shell.style.display = 'block';
    loadProducts();
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

  brandTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      brandTabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      currentBrand = tab.dataset.brand;
      resetForm();
      loadProducts();
    });
  });

  function resetForm() {
    if (!productForm) return;
    productForm.reset();
    editingId = null;
    productForm.querySelector('[data-submit-label]').textContent = 'Add product';
  }

  async function uploadFile(file, folder) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await window.supabaseClient.storage
      .from('product-media')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = window.supabaseClient.storage.from('product-media').getPublicUrl(path);
    return data.publicUrl;
  }

  function setMsg(text, isError) {
    if (!formMsg) return;
    formMsg.textContent = text;
    formMsg.className = 'admin-msg ' + (isError ? 'is-error' : 'is-success');
  }

  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.supabaseClient) {
        setMsg('Supabase is not configured yet.', true);
        return;
      }
      const submitBtn = productForm.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      setMsg('Saving…', false);

      try {
        const fd = new FormData(productForm);
        const isFree = fd.get('is_free') === 'on';
        const imageFile = productForm.querySelector('#p-image').files[0];
        const videoFile = productForm.querySelector('#p-video').files[0];
        const fileFile = productForm.querySelector('#p-file').files[0];

        const payload = {
          brand: currentBrand,
          name: fd.get('name'),
          category: fd.get('category'),
          description: fd.get('description'),
          price: isFree ? null : parseFloat(fd.get('price')) || 0,
          is_free: isFree,
          badge: fd.get('badge') || null,
          tags: (fd.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean),
          is_published: true,
        };

        if (imageFile) payload.image_url = await uploadFile(imageFile, 'images');
        if (videoFile) payload.video_url = await uploadFile(videoFile, 'videos');
        if (fileFile)  payload.file_url  = await uploadFile(fileFile, 'files');

        let result;
        if (editingId) {
          result = await window.supabaseClient.from('products').update(payload).eq('id', editingId);
        } else {
          result = await window.supabaseClient.from('products').insert(payload);
        }
        if (result.error) throw result.error;

        setMsg(editingId ? 'Product updated.' : 'Product added.', false);
        resetForm();
        loadProducts();
      } catch (err) {
        setMsg(err.message || 'Something went wrong.', true);
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
      .eq('brand', currentBrand)
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
      const row = document.createElement('div');
      row.className = 'admin-item';
      row.innerHTML = `
        <div class="admin-item__thumb" style="background-image:url('${product.image_url || ''}')"></div>
        <div class="admin-item__body">
          <h4>${product.name}</h4>
          <div class="admin-item__meta">${product.category} · ${product.is_free ? 'Free' : '$' + product.price}</div>
        </div>
        <div class="admin-item__actions">
          <button data-edit>Edit</button>
          <button data-delete class="danger">Delete</button>
        </div>
      `;
      row.querySelector('[data-edit]').addEventListener('click', () => fillFormForEdit(product));
      row.querySelector('[data-delete]').addEventListener('click', () => deleteProduct(product.id));
      productList.appendChild(row);
    });
  }

  function fillFormForEdit(product) {
    editingId = product.id;
    productForm.name.value = product.name || '';
    productForm.category.value = product.category || '';
    productForm.description.value = product.description || '';
    productForm.price.value = product.price || '';
    productForm.is_free.checked = !!product.is_free;
    productForm.badge.value = product.badge || '';
    productForm.tags.value = (product.tags || []).join(', ');
    productForm.querySelector('[data-submit-label]').textContent = 'Update product';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const { error } = await window.supabaseClient.from('products').delete().eq('id', id);
    if (error) {
      alert('Error deleting: ' + error.message);
      return;
    }
    loadProducts();
  }

  checkSession();
})();
