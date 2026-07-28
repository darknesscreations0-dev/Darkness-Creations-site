/* ============================================================
   DARKNESS CREATIONS — SHARED AUTH (real Supabase auth)
   ------------------------------------------------------------
   Replaces the old localStorage demo. Uses Supabase Auth for
   real accounts (email/password + Google), shared across every
   page on the site via window.supabaseClient.
   ============================================================ */

const DCAuth = (() => {
  function client() {
    return window.supabaseClient || null;
  }

  /* ---------- Core actions ---------- */

  async function getUser() {
    const c = client();
    if (!c) return null;
    const { data: { session } } = await c.auth.getSession();
    return session ? session.user : null;
  }

  async function signUp(email, password) {
    const c = client();
    if (!c) return { error: { message: 'Store is not configured yet.' } };
    return c.auth.signUp({ email, password });
  }

  async function signIn(email, password) {
    const c = client();
    if (!c) return { error: { message: 'Store is not configured yet.' } };
    return c.auth.signInWithPassword({ email, password });
  }

  async function signInWithGoogle() {
    const c = client();
    if (!c) return { error: { message: 'Store is not configured yet.' } };
    // Build the redirect from the current folder so it works inside a
    // GitHub Pages subfolder (e.g. /Darkness-Creations-site/), not just the domain root.
    const basePath = window.location.pathname.replace(/[^/]*$/, '');
    return c.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + basePath + 'account.html' }
    });
  }

  async function signOut() {
    const c = client();
    if (!c) return;
    await c.auth.signOut();
    document.dispatchEvent(new CustomEvent('dc-auth-change'));
  }

  /* ---------- Wire up any [data-dc-account] nav slot ---------- */

  async function renderAccountSlots() {
    const user = await getUser();
    document.querySelectorAll('[data-dc-account]').forEach((slot) => {
      if (user) {
        const label = user.email || 'Account';
        slot.innerHTML = `
          <a class="dc-account-name" href="account.html" style="margin-right:.7rem; color:inherit; text-decoration:none;">${label}</a>
          <button class="dc-account-logout" data-dc-logout>Log out</button>
        `;
      } else {
        slot.innerHTML = `<a class="btn btn--ghost dc-login-trigger" href="login.html"><span>Log in</span></a>`;
      }
    });
    document.querySelectorAll('[data-dc-logout]').forEach((btn) =>
      btn.addEventListener('click', signOut)
    );
  }

  document.addEventListener('DOMContentLoaded', renderAccountSlots);
  document.addEventListener('dc-auth-change', renderAccountSlots);

  const c = client();
  if (c) {
    c.auth.onAuthStateChange(() => {
      document.dispatchEvent(new CustomEvent('dc-auth-change'));
    });
  }

  return { getUser, signUp, signIn, signInWithGoogle, signOut, renderAccountSlots };
})();