/* ============================================================
   DARKNESS CREATIONS — SHARED AUTH (front-end only demo)
   ------------------------------------------------------------
   There is no real backend/password check here. This simulates
   a logged-in session using localStorage so that logging in on
   the Darkness Creations home page also shows as "logged in"
   on Crispy Pizza and the Marketplace, since they share the
   same origin on GitHub Pages.

   Swap this out for real auth (Supabase, Firebase, Clerk, your
   own backend, etc.) when you're ready to launch for real.
   ============================================================ */

const DCAuth = (() => {
  const KEY_NAME  = 'dc_user_name';
  const KEY_COINS = 'dc_user_coins';
  const DEFAULT_COINS = 120;

  function getUser() {
    const name = localStorage.getItem(KEY_NAME);
    return name ? { name, coins: getCoins() } : null;
  }

  function getCoins() {
    const raw = localStorage.getItem(KEY_COINS);
    return raw ? parseInt(raw, 10) : DEFAULT_COINS;
  }

  function login(name) {
    localStorage.setItem(KEY_NAME, name);
    if (!localStorage.getItem(KEY_COINS)) {
      localStorage.setItem(KEY_COINS, String(DEFAULT_COINS));
    }
    document.dispatchEvent(new CustomEvent('dc-auth-change'));
  }

  function logout() {
    localStorage.removeItem(KEY_NAME);
    document.dispatchEvent(new CustomEvent('dc-auth-change'));
  }

  /* ---------- Modal (built once, reused everywhere) ---------- */
  function buildModal() {
    if (document.querySelector('.dc-auth-modal')) return;

    const wrap = document.createElement('div');
    wrap.className = 'dc-auth-modal';
    wrap.innerHTML = `
      <div class="dc-auth-modal__backdrop" data-close></div>
      <div class="dc-auth-modal__box">
        <button class="dc-auth-modal__x" data-close aria-label="Close">&times;</button>
        <span class="dc-auth-modal__eyebrow">Darkness Creations</span>
        <h3>Sign in</h3>
        <p>One account works across the studio site, the marketplace and Crispy Pizza.</p>
        <form data-dc-login-form>
          <input type="text" name="name" placeholder="Your name" required autocomplete="name">
          <button type="submit" class="btn btn--primary" style="width:100%; justify-content:center; margin-top:.9rem;">
            <span>Continue</span>
          </button>
        </form>
        <p class="dc-auth-modal__note">Demo only — no password needed yet.</p>
      </div>
    `;
    document.body.appendChild(wrap);

    wrap.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', () => wrap.classList.remove('is-open'))
    );
    wrap.querySelector('[data-dc-login-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = new FormData(e.target).get('name').toString().trim();
      if (!name) return;
      login(name);
      wrap.classList.remove('is-open');
    });
  }

  function openModal() {
    buildModal();
    document.querySelector('.dc-auth-modal').classList.add('is-open');
  }

  /* ---------- Wire up any [data-dc-account] element ---------- */
  function renderAccountSlots() {
    const user = getUser();
    document.querySelectorAll('[data-dc-account]').forEach((slot) => {
      if (user) {
        slot.innerHTML = `
          <span class="dc-coin-badge" title="Coins">🪙 ${user.coins}</span>
          <span class="dc-account-name">${user.name}</span>
          <button class="dc-account-logout" data-dc-logout>Log out</button>
        `;
      } else {
        slot.innerHTML = `<button class="btn btn--ghost dc-login-trigger" data-dc-login><span>Log in</span></button>`;
      }
    });
    document.querySelectorAll('[data-dc-login]').forEach((btn) =>
      btn.addEventListener('click', openModal)
    );
    document.querySelectorAll('[data-dc-logout]').forEach((btn) =>
      btn.addEventListener('click', logout)
    );
  }

  document.addEventListener('DOMContentLoaded', renderAccountSlots);
  document.addEventListener('dc-auth-change', renderAccountSlots);

  return { getUser, getCoins, login, logout, openModal };
})();
