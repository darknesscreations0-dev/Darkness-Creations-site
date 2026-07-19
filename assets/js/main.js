/* ============================================================
   DARKNESS CREATIONS — MAIN JS
   Lenis smooth scroll + GSAP ScrollTrigger interactions.
   ============================================================ */

(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Lenis smooth scroll ---------- */
  let lenis;
  if (!prefersReducedMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------- Nav background on scroll ---------- */
  const nav = document.querySelector('.nav');
  const setNavState = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', setNavState, { passive: true });
  setNavState();

  /* ---------- Cursor glow ---------- */
  const glow = document.querySelector('.cursor-glow');
  if (glow && !prefersReducedMotion && matchMedia('(hover:hover)').matches) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let gx = mx, gy = my;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      glow.classList.add('is-visible');
    });
    window.addEventListener('mouseleave', () => glow.classList.remove('is-visible'));
    const animateGlow = () => {
      gx += (mx - gx) * 0.12;
      gy += (my - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%,-50%)`;
      requestAnimationFrame(animateGlow);
    };
    animateGlow();
  }

  /* ---------- Magnetic buttons ---------- */
  if (!prefersReducedMotion && matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0,0)';
        btn.style.transition = 'transform .4s cubic-bezier(.16,.8,.24,1)';
        setTimeout(() => (btn.style.transition = ''), 400);
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.reveal').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => el.classList.add('is-visible'),
        once: true,
      });
    });

    /* ---------- Staggered card grid entrances ---------- */
    ScrollTrigger.batch('.stagger-item', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        batch.forEach((el, i) => {
          setTimeout(() => el.classList.add('is-visible'), i * 90);
        });
      },
    });

    /* ---------- Cinematic pinned statement (Apple-style scale-lock) ---------- */
    const cinematicPin = document.querySelector('.cinematic__pin');
    const cinematicText = document.querySelector('.cinematic__text');
    const cinematicBg = document.querySelector('.cinematic__bg');
    const cinematicSection = document.querySelector('.cinematic');

    if (cinematicPin && cinematicText && cinematicSection) {
      gsap.timeline({
        scrollTrigger: {
          trigger: cinematicSection,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      })
        .to(cinematicText, { scale: 1, opacity: 1, ease: 'none', duration: 0.35 })
        .to(cinematicBg, { opacity: 1, ease: 'none', duration: 0.35 }, '<')
        .to({}, { duration: 0.3 }) // hold at full scale/readable
        .to(cinematicText, { scale: 1.08, opacity: 0, filter: 'blur(6px)', ease: 'none', duration: 0.35 })
        .to(cinematicBg, { opacity: 0, ease: 'none', duration: 0.35 }, '<');
    }

    /* ---------- Pipeline horizontal scrub (signature element) ---------- */
    const rail = document.querySelector('.pipeline__rail');
    const trackWrap = document.querySelector('.pipeline__track-wrap');
    const progressBar = document.querySelector('.pipeline__progress-bar');

    if (rail && trackWrap) {
      const getScrollDistance = () => Math.max(rail.scrollWidth - window.innerWidth + 96, 0);

      const tween = gsap.to(rail, {
        x: () => -getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: trackWrap,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            if (progressBar) progressBar.style.width = `${self.progress * 100}%`;
          },
          invalidateOnRefresh: true,
        },
      });
    }
  } else {
    // Fallback: no GSAP — just show all reveal/stagger elements
    document.querySelectorAll('.reveal, .stagger-item').forEach((el) => el.classList.add('is-visible'));
    const cinematicText = document.querySelector('.cinematic__text');
    if (cinematicText) { cinematicText.style.opacity = 1; cinematicText.style.transform = 'scale(1)'; }
  }

  /* ---------- Newsletter form (static demo) ---------- */
  const form = document.querySelector('.newsletter__form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const input = form.querySelector('input');
      if (input && input.value) {
        btn.textContent = 'Subscribed';
        input.value = '';
        setTimeout(() => (btn.textContent = 'Subscribe'), 2400);
      }
    });
  }
})();

/* ============================================================
   WORK SECTION — video previews + lightbox player
   Wires up the marquee__card data-video attributes (previously
   unused), plus the "Watch showreel" and "View all work" buttons.
   ============================================================ */
(function () {
  const cards = Array.from(document.querySelectorAll('.marquee__card'));
  const lightbox = document.getElementById('workLightbox');
  if (!lightbox) return;

  const lbVideo = document.getElementById('workLightboxVideo');
  const lbLabel = document.getElementById('workLightboxLabel');
  const lbClose = document.getElementById('workLightboxClose');
  const lbBackdrop = document.getElementById('workLightboxBackdrop');
  const lbPrev = document.getElementById('workLightboxPrev');
  const lbNext = document.getElementById('workLightboxNext');
  const showreelBtn = document.getElementById('watchShowreelBtn');
  const viewAllBtn = document.getElementById('viewAllWorkBtn');

  /* ---------- 1. Hover-preview video on each marquee card ---------- */
  /* If a video file is missing/unreachable, we quietly fall back to
     the icon glyph that was already there — nothing breaks. */
  cards.forEach((card) => {
    const video = card.querySelector('.marquee__video');
    if (!video || !video.getAttribute('src')) return;

    video.addEventListener('loadeddata', () => video.classList.add('is-ready'));
    video.addEventListener('error', () => video.remove());

    card.addEventListener('mouseenter', () => {
      if (video.isConnected) video.play().catch(() => {});
    });
    card.addEventListener('mouseleave', () => {
      if (video.isConnected) { video.pause(); video.currentTime = 0; }
    });
  });

  /* ---------- 2. Build a de-duplicated playlist from real cards ---------- */
  const seen = new Set();
  const playlist = [];
  cards.forEach((card) => {
    const src = card.dataset.video;
    const label = card.querySelector('.marquee__tag')?.textContent || '';
    if (src && !seen.has(src)) {
      seen.add(src);
      playlist.push({ src, label });
    }
  });

  let playlistIndex = 0;

  function openLightbox(src, label) {
    lbVideo.src = src;
    lbVideo.currentTime = 0;
    lbLabel.textContent = label || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lbVideo.play().catch(() => {});
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbVideo.pause();
    lbVideo.removeAttribute('src');
    lbVideo.load();
  }

  function showPlaylistItem(index) {
    if (!playlist.length) return;
    playlistIndex = (index + playlist.length) % playlist.length;
    const item = playlist[playlistIndex];
    openLightbox(item.src, item.label);
  }

  /* ---------- 3. Click a card -> open that video in the lightbox ---------- */
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const src = card.dataset.video;
      if (!src) return;
      const idx = playlist.findIndex((p) => p.src === src);
      showPlaylistItem(idx >= 0 ? idx : 0);
    });
  });

  /* ---------- 4. "Watch showreel" -> plays the hero showreel ---------- */
  if (showreelBtn) {
    showreelBtn.addEventListener('click', () => {
      openLightbox('assets/video/showreel.mp4?v=5', 'Showreel');
    });
  }

  /* ---------- 5. "View all work" -> opens the playlist from the start ---------- */
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => showPlaylistItem(0));
  }

  lbPrev.addEventListener('click', () => showPlaylistItem(playlistIndex - 1));
  lbNext.addEventListener('click', () => showPlaylistItem(playlistIndex + 1));
  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showPlaylistItem(playlistIndex + 1);
    if (e.key === 'ArrowLeft') showPlaylistItem(playlistIndex - 1);
  });
})();
