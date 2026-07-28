/* ============================================================
   WORK / VIDEO REEL — pulls from Supabase `work_items` table.
   Used on BOTH:
   - index.html   (homepage preview, only show_on_home = true, limited count)
   - work.html    (full "View all work" page, everything published)

   Container needs: <div data-work-grid></div>
   Optional attributes on that same div:
     data-work-limit="6"        -> cap how many show (omit = no limit)
     data-work-home-only="true" -> only items flagged show_on_home
   ============================================================ */
(function () {
  const grid = document.querySelector('[data-work-grid]');
  if (!grid || !window.supabaseClient) return;

  const limit = grid.dataset.workLimit ? parseInt(grid.dataset.workLimit, 10) : null;
  const homeOnly = grid.dataset.workHomeOnly === 'true';

  function cardHtml(item) {
    return `
      <article class="work-card">
        <video autoplay muted loop playsinline preload="auto" ${item.poster_url ? `poster="${item.poster_url}"` : ''}>
          <source src="${item.video_url}" type="video/mp4">
        </video>
        <div class="work-overlay">${item.title}</div>
      </article>
    `;
  }

  async function load() {
    let query = window.supabaseClient
      .from('work_items')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (homeOnly) query = query.eq('show_on_home', true);

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return; // leave whatever was already in the container alone
    }
    if (!data || data.length === 0) return;

    const items = limit ? data.slice(0, limit) : data;
    grid.innerHTML = items.map(cardHtml).join('');
  }

  load();
})();
