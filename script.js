/* =========================================================
   Adrien Scazzola — motion / interactions
   - Reveal on scroll (IntersectionObserver)
   - Animated KPI counters
   - Sticky nav hide on scroll-down
   - Magnetic cursor light on cards
   ========================================================= */

(() => {
  'use strict';

  /* ---------- Year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Hero video: play once, freeze on last frame ---------- */
  const heroVid = document.getElementById('heroVideo');
  if (heroVid) {
    // Try to autoplay (muted). Some browsers block until user interaction.
    const tryPlay = () => heroVid.play().catch(() => { /* ignored */ });
    tryPlay();
    // Freeze on last frame: pause exactly at the final frame so it doesn't
    // flash to black or rewind on some browsers.
    heroVid.addEventListener('ended', () => {
      heroVid.pause();
      // Nudge slightly back from the very end to keep the picture rendered.
      try {
        if (Number.isFinite(heroVid.duration)) {
          heroVid.currentTime = Math.max(0, heroVid.duration - 0.05);
        }
      } catch (_) { /* noop */ }
    });
    // If autoplay was blocked, start on first user interaction.
    const resume = () => {
      if (heroVid.paused && heroVid.currentTime === 0) tryPlay();
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
      window.removeEventListener('scroll', resume);
    };
    window.addEventListener('pointerdown', resume, { passive: true });
    window.addEventListener('keydown', resume);
    window.addEventListener('scroll', resume, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // small stagger for siblings
            const el = entry.target;
            const delay = el.dataset.delay || (el.parentElement
              ? Array.from(el.parentElement.children).indexOf(el) * 60
              : 0);
            el.style.transitionDelay = `${Math.min(delay, 320)}ms`;
            el.classList.add('is-visible');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- KPI counters ---------- */
  const counters = document.querySelectorAll('.kpi-num[data-count]');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) return;
    const duration = 1400;
    const start = performance.now();
    const isInt = Number.isInteger(target);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const v = target * eased;
      el.textContent = isInt ? Math.round(v) : v.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = isInt ? target : target.toFixed(1);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCount(e.target);
            cio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- Nav hide-on-scroll-down / show-on-up ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 24) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');

      if (y > lastY && y > 200) nav.classList.add('hidden');
      else nav.classList.remove('hidden');

      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  }

  /* ---------- Cursor-tracked light on cards ---------- */
  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top)  / r.height) * 100;
      const bg = card.querySelector('.card-bg');
      if (bg) {
        bg.style.setProperty('--mx', `${mx}%`);
        bg.style.setProperty('--my', `${my}%`);
      }
    });
    card.addEventListener('pointerleave', () => {
      const bg = card.querySelector('.card-bg');
      if (bg) {
        bg.style.removeProperty('--mx');
        bg.style.removeProperty('--my');
      }
    });
  });

  /* ---------- Project cards: tap-to-toggle on touch devices ---------- */
  const projectCards = document.querySelectorAll('.project-card');
  const isTouch = matchMedia('(hover: none)').matches;
  projectCards.forEach((card) => {
    // Touch: tap toggles details. Tap outside closes.
    if (isTouch) {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasActive = card.classList.contains('is-active');
        // Close any other open card first
        projectCards.forEach((c) => c.classList.remove('is-active'));
        if (!wasActive) card.classList.add('is-active');
      });
    }
    // Keyboard: Enter / Space toggles
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('is-active');
      }
    });
  });
  if (isTouch) {
    document.addEventListener('click', () => {
      projectCards.forEach((c) => c.classList.remove('is-active'));
    });
  }

  /* ---------- Subtle parallax on aurora ---------- */
  const blobs = document.querySelectorAll('.aurora .blob');
  if (blobs.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener('pointermove', (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });
    const loop = () => {
      cx += (mx - cx) * 0.04;
      cy += (my - cy) * 0.04;
      blobs.forEach((b, i) => {
        const f = (i + 1) * 12;
        b.style.translate = `${cx * f}px ${cy * f}px`;
      });
      requestAnimationFrame(loop);
    };
    loop();
  }
})();
