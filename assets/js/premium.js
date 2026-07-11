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

  /* ---------- 3. 3D tilt-on-hover for preview cards ---------- */
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
    });
  }

  /* ---------- 4. Showcase video play/pause ---------- */
  document.querySelectorAll('.showcase__visual').forEach(function (box) {
    var video = box.querySelector('.showcase__media');
    var playBtn = box.querySelector('.work-card__play');
    if (!video || !playBtn) return;
    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (video.paused) {
        video.play().then(function () {
          box.classList.add('is-playing');
        }).catch(function () {
          /* no source uploaded yet — ignore */
        });
      } else {
        video.pause();
        box.classList.remove('is-playing');
      }
    });
  });
})();
