/* ============================================================
   DARKNESS CREATIONS — premium interaction layer
   Count-up stats · 3D tilt cards · real-photo hooks · video play
   Additive only — does not touch main.js behavior.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. Count-up stats ---------- */
  function animateCount(el) {
    var raw = el.dataset.countTo;
    var target = parseFloat(raw);
    if (isNaN(target)) return;
    var decimals = (raw.split('.')[1] || '').length;
    var suffix = el.dataset.suffix || '';
    var duration = 1500;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US')) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    if (reduceMotion) {
      el.textContent = (decimals ? target.toFixed(decimals) : target.toLocaleString('en-US')) + suffix;
    } else {
      requestAnimationFrame(step);
    }
  }

  var counters = document.querySelectorAll('[data-count-to]');
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (c) { countObserver.observe(c); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---------- 2. Real-photo background hooks ---------- */
  document.querySelectorAll('[data-bg]').forEach(function (el) {
    el.style.setProperty('--card-photo', 'url("' + el.dataset.bg + '")');
  });

  /* ---------- 3. 3D tilt-on-hover + hover video preview for cards ---------- */
  if (canHover && !reduceMotion) {
    document.querySelectorAll('.marquee__card, .card-stack__item').forEach(function (card) {
      var inner = document.createElement('div');
      inner.className = 'card-tilt';
      while (card.firstChild) inner.appendChild(card.firstChild);
      card.appendChild(inner);

      var maxTilt = 9;
      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        inner.style.transform =
          'rotateX(' + (-y * maxTilt).toFixed(2) + 'deg) rotateY(' + (x * maxTilt).toFixed(2) + 'deg) scale(1.03)';
      });
      card.addEventListener('pointerleave', function () {
        inner.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      });

      /* Hover video preview — only builds the <video> once a real file exists;
         a missing file just fails silently and the static photo/gradient stays. */
      var videoSrc = card.dataset.video;
      if (videoSrc) {
        var preview = document.createElement('video');
        preview.className = 'card-video';
        preview.src = videoSrc;
        preview.muted = true;
        preview.loop = true;
        preview.playsInline = true;
        preview.preload = 'none';
        card.insertBefore(preview, inner);

        card.addEventListener('pointerenter', function () {
          preview.currentTime = 0;
          preview.play().then(function () {
            card.classList.add('is-previewing');
          }).catch(function () {
            /* no video for this card yet — silently stay on the static photo */
          });
        });
        card.addEventListener('pointerleave', function () {
          preview.pause();
          card.classList.remove('is-previewing');
        });
      }
    });
  }

  /* ---------- 4. Showcase video play/pause + real scrubber sync ---------- */
  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  document.querySelectorAll('.showcase__visual').forEach(function (box) {
    var video = box.querySelector('.showcase__media');
    var playBtn = box.querySelector('.work-card__play');
    var fill = box.querySelector('.showcase__scrub-fill');
    var times = box.querySelectorAll('.showcase__scrub-time');
    var currentLabel = times[0];
    var durationLabel = times[1];
    var track = box.querySelector('.showcase__scrub-track');
    if (!video || !playBtn) return;

    function togglePlay() {
      if (video.paused) {
        video.play().catch(function () {
          /* no source uploaded yet — ignore */
        });
      } else {
        video.pause();
      }
    }

    box.addEventListener('click', togglePlay);

    /* Keep UI state (play button, waveform, scrubber) in sync with the
       video's real playback state — covers autoplay as well as manual clicks. */
    video.addEventListener('play', function () { box.classList.add('is-playing'); });
    video.addEventListener('pause', function () { box.classList.remove('is-playing'); });

    /* Once real video metadata is available, switch the scrubber from
       decorative CSS animation to the video's actual duration/position. */
    video.addEventListener('loadedmetadata', function () {
      if (!isFinite(video.duration)) return;
      box.classList.add('has-real-time');
      if (durationLabel) durationLabel.textContent = formatTime(video.duration);
      if (currentLabel) currentLabel.textContent = formatTime(video.currentTime);
      if (fill) fill.style.width = '0%';
    });

    video.addEventListener('timeupdate', function () {
      if (!video.duration || !isFinite(video.duration)) return;
      var pct = (video.currentTime / video.duration) * 100;
      if (fill) fill.style.width = pct + '%';
      if (currentLabel) currentLabel.textContent = formatTime(video.currentTime);
    });

    video.addEventListener('ended', function () {
      box.classList.remove('is-playing');
    });

    /* Let people scrub by clicking/dragging the track once real time is active. */
    if (track) {
      track.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!video.duration || !isFinite(video.duration)) return;
        var rect = track.getBoundingClientRect();
        var ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        video.currentTime = ratio * video.duration;
      });
    }
  });
  /* ---------- 5. Compact nav on scroll (safe no-op if main.js already does this) ---------- */
  var navEl = document.querySelector('.nav');
  if (navEl) {
    var setNavState = function () {
      if (window.scrollY > 24) {
        navEl.classList.add('is-scrolled');
      } else {
        navEl.classList.remove('is-scrolled');
      }
    };
    setNavState();
    window.addEventListener('scroll', setNavState, { passive: true });
  }
})();
