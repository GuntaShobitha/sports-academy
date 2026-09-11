/**
 * STACKLY SPORTS ACADEMY - MAIN JAVASCRIPT
 * Pure Vanilla JavaScript, Zero Frameworks, No Emojis
 */

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initScrollProgress();
  initShoeLaceAnimation();
  initStickyNavbar();
  initMobileNav();
  initScrollReveal();
  initReplayAnimations();
  initStatCounters();
  initAccordions();
  initSlotSearch();
  initTiltCards();
  initCarousel3D();
  initLiftOnScroll();
  initMagneticButtons();
  initParallaxSections();
  initEnergyParticles();
  initCinematicScroll();
});

/* ==========================================================================
   CINEMATIC SHOE LACING SCROLL ANIMATION
   Uses the same browser-frame + sticky-track architecture as the
   experience section. Scroll down = laces loosen, scroll up = laces tighten.
   The section is large (420vh track) and the lace animation is driven by
   the same per-frame progress system.
   ========================================================================== */
function initShoeLaceAnimation() {
  const section = document.getElementById('shoeLaceSection');
  if (!section) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    section.style.height = '100vh';
    return;
  }

  const track = section.querySelector('.exp-track');
  const scene = section.querySelector('.scene-lace');
  const shoeContainer = document.getElementById('shoeContainer');
  const laceParticles = document.getElementById('laceParticles');
  const scrollHint = document.getElementById('scrollHint');
  const tightnessFill = document.getElementById('tightnessFill');
  const tightnessLabel = document.getElementById('tightnessLabel');
  const stage = section.querySelector('.exp-stage');

  // Lace SVG paths
  const laceLines = document.querySelectorAll('.lace-line');
  const laceCrosses = document.querySelectorAll('.lace-cross');
  const laceBowLeft = document.querySelector('.lace-bow-left');
  const laceBowRight = document.querySelector('.lace-bow-right');
  const laceKnot = document.querySelector('.lace-knot');

  if (!laceLines.length || !track || !scene) return;

  // Loose vs tight path definitions for each lace line
  const loosePaths = [
    'M145,80 C170,105 230,105 255,80',
    'M145,120 C170,140 230,140 255,120',
    'M145,160 C170,175 230,175 255,160',
    'M145,200 C170,212 230,212 255,200',
    'M145,240 C170,248 230,248 255,240'
  ];

  const tightPaths = [
    'M145,80 C180,82 220,82 255,80',
    'M145,120 C180,121 220,121 255,120',
    'M145,160 C180,160 220,160 255,160',
    'M145,200 C180,200 220,200 255,200',
    'M145,240 C180,240 220,240 255,240'
  ];

  const crossLoosePaths = [
    'M145,80 C175,120 225,120 255,120',
    'M145,120 C175,160 225,160 255,160',
    'M145,160 C175,200 225,200 255,200',
    'M145,200 C175,240 225,240 255,240'
  ];

  const crossTightPaths = [
    'M145,80 C185,95 215,105 255,120',
    'M145,120 C185,135 215,145 255,160',
    'M145,160 C185,175 215,185 255,200',
    'M145,200 C185,215 215,225 255,240'
  ];

  let lastProgress = 0;
  let particleTimer = null;
  let trackTop = 0;
  let trackH = 1;
  let vh = window.innerHeight;
  let pageProgress = 0;
  let loopRunning = false;
  let sectionOnScreen = true;

  const EASE_INOUT = t => t * t * (3 - 2 * t);
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function measure() {
    vh = window.innerHeight;
    const rect = track.getBoundingClientRect();
    trackTop = rect.top + window.scrollY;
    trackH = Math.max(1, rect.height - vh);
  }

  function getScrollProgress() {
    const raw = (window.scrollY - trackTop) / trackH;
    return clamp01(raw);
  }

  function sceneProgress() {
    return EASE_INOUT(clamp01(pageProgress));
  }

  function parsePath(d) {
    const nums = d.match(/-?\d+\.?\d*/g).map(Number);
    return nums;
  }

  function interpolatePath(pathA, pathB, t) {
    const numsA = parsePath(pathA);
    const numsB = parsePath(pathB);
    const template = pathA;
    let idx = 0;
    return template.replace(/-?\d+\.?\d*/g, () => {
      const val = lerp(numsA[idx], numsB[idx], t);
      idx++;
      return val.toFixed(1);
    });
  }

  function spawnTightenParticles() {
    if (!laceParticles) return;
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      p.className = 'lace-particle';
      p.style.left = `${35 + Math.random() * 30}%`;
      p.style.top = `${20 + Math.random() * 50}%`;
      laceParticles.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 40;
      p.animate([
        { opacity: 0.8, transform: 'translate(0,0) scale(1)' },
        { opacity: 0, transform: `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(0)` }
      ], {
        duration: 500 + Math.random() * 300,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards'
      });
      setTimeout(() => p.remove(), 900);
    }
  }

  function updateLaces(eased) {
    // Update horizontal lace lines
    laceLines.forEach((line, i) => {
      const d = interpolatePath(loosePaths[i], tightPaths[i], eased);
      line.setAttribute('d', d);
    });

    // Update cross laces
    laceCrosses.forEach((cross, i) => {
      const d = interpolatePath(crossLoosePaths[i], crossTightPaths[i], eased);
      cross.setAttribute('d', d);
      cross.classList.toggle('visible', eased > 0.15);
      cross.style.opacity = Math.min(1, (eased - 0.15) * 2);
    });

    // Bow appears when mostly tight
    if (laceBowLeft && laceBowRight) {
      const bowVisible = eased > 0.7;
      laceBowLeft.classList.toggle('visible', bowVisible);
      laceBowRight.classList.toggle('visible', bowVisible);
      if (bowVisible) {
        const bowScale = 0.5 + (eased - 0.7) * 1.67;
        laceBowLeft.style.transform = `scale(${Math.min(1, bowScale)})`;
        laceBowRight.style.transform = `scale(${Math.min(1, bowScale)})`;
      }
    }

    // Knot appears at the end
    if (laceKnot) {
      const knotVisible = eased > 0.85;
      laceKnot.classList.toggle('visible', knotVisible);
      if (knotVisible) {
        const r = 4 + (eased - 0.85) * 12;
        laceKnot.setAttribute('r', Math.min(6, r));
      }
    }

    // Shoe visual feedback
    if (shoeContainer) {
      shoeContainer.classList.toggle('tightening', eased > 0.5);
    }

    // Tightness bar
    if (tightnessFill) tightnessFill.style.width = `${eased * 100}%`;
    if (tightnessLabel) {
      if (eased > 0.8) {
        tightnessLabel.textContent = 'TIGHT';
        tightnessLabel.classList.add('tight');
      } else if (eased > 0.3) {
        tightnessLabel.textContent = 'TIGHTENING...';
        tightnessLabel.classList.remove('tight');
      } else {
        tightnessLabel.textContent = 'LOOSE';
        tightnessLabel.classList.remove('tight');
      }
    }

    // Scroll hint hides after first scroll
    if (scrollHint && eased > 0.05) {
      scrollHint.classList.add('hidden');
    } else if (scrollHint && eased <= 0.05) {
      scrollHint.classList.remove('hidden');
    }

    // Spawn particles on tightening
    if (eased > lastProgress && eased > 0.1 && eased < 0.95) {
      clearTimeout(particleTimer);
      particleTimer = setTimeout(spawnTightenParticles, 50);
    }
    lastProgress = eased;
  }

  function updateScene() {
    pageProgress = getScrollProgress();
    const p = sceneProgress();
    scene.style.setProperty('--p', p.toFixed(4));

    const visible = pageProgress > -0.08 && pageProgress < 1.08;
    scene.classList.toggle('is-visible', visible);

    // Invert: scroll down = loose (0), scroll up = tight (1)
    const laceProgress = 1 - p;
    const eased = laceProgress < 0.5
      ? 2 * laceProgress * laceProgress
      : 1 - Math.pow(-2 * laceProgress + 2, 2) / 2;
    updateLaces(eased);
  }

  function tick() {
    if (!sectionOnScreen) { loopRunning = false; return; }
    updateScene();
    requestAnimationFrame(tick);
  }

  function wake() {
    const rect = section.getBoundingClientRect();
    sectionOnScreen = rect.bottom > -vh && rect.top < vh * 2;
    if (sectionOnScreen && !loopRunning) {
      measure();
      loopRunning = true;
      requestAnimationFrame(tick);
    }
  }

  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
  wake();
}

/* --- Preloader --- */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('fade-out');
      setTimeout(() => preloader.remove(), 500);
    }, 300);
  });

  // Fallback timeout in case load event delays
  setTimeout(() => {
    if (preloader && !preloader.classList.contains('fade-out')) {
      preloader.classList.add('fade-out');
    }
  }, 2000);
}

/* --- Scroll Progress Bar --- */
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  });
}

/* --- Sticky Header & Active Nav --- */
function initStickyNavbar() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll();

  // Active Link Highlighting
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link, .mobile-drawer-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* --- Mobile Navigation Drawer --- */
function initMobileNav() {
  const hamburger = document.querySelector('.mobile-hamburger');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const closeBtn = document.querySelector('.mobile-drawer-close');

  if (!hamburger || !drawer || !overlay) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('menu-open');
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('menu-open');
  };

  hamburger.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

/* --- Scroll Reveal Animations & Image Pop --- */
function initScrollReveal() {
  // Automatically equip images with pop class
  document.querySelectorAll('.arena-card img, .service-card img, .blog-card img, .coach-card img, .hero-visual-img').forEach(img => {
    img.classList.add('img-pop');
  });

  const revealElements = document.querySelectorAll('.reveal-init, .reveal-pop, .scroll-reveal-up, .scroll-reveal-down');
  if (!revealElements.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Re-trigger on EVERY appearance: add the active classes when the
        // element enters the viewport and remove them when it leaves, so the
        // entrance animation replays each time (not only once at page load).
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
          entry.target.classList.add('scroll-reveal-active');
        } else {
          entry.target.classList.remove('reveal-active');
          entry.target.classList.remove('scroll-reveal-active');
        }
      });
    }, { threshold: 0.12 });

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => {
      el.classList.add('reveal-active');
      el.classList.add('scroll-reveal-active');
    });
  }

  // Directional Scroll Listener (Scrolling Up & Scrolling Down)
  let lastScrollTop = window.scrollY || 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY || 0;
    if (currentScroll > lastScrollTop + 10) {
      document.body.classList.add('scrolling-down');
      document.body.classList.remove('scrolling-up');
    } else if (currentScroll < lastScrollTop - 10) {
      document.body.classList.add('scrolling-up');
      document.body.classList.remove('scrolling-down');
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;

    // Subtle parallax shift for fixed background sections
    const parallaxSections = document.querySelectorAll('.parallax-fixed-section');
    parallaxSections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const offset = (window.innerHeight - rect.top) * 0.06;
        sec.style.backgroundPositionY = `calc(50% + ${offset}px)`;
      }
    });
  }, { passive: true });
}

/* ==========================================================================
   REPLAYABLE SECTION ENTRANCE ANIMATIONS (data-anim system)
   Every element marked with data-anim="..." plays its own unique entrance
   animation every single time it scrolls into view. The .anim-in class is
   added on intersect and removed on exit, so the CSS animation replays on
   each appearance and never depends on the page load.
   ========================================================================== */
function initReplayAnimations() {
  const animated = document.querySelectorAll('[data-anim]');
  if (!animated.length) return;

  const showAll = () => animated.forEach(el => el.classList.add('anim-in'));

  // Respect reduced-motion preferences and legacy browsers
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim-in');
      } else {
        entry.target.classList.remove('anim-in');
      }
    });
  }, { threshold: 0.12 });

  animated.forEach(el => observer.observe(el));
}

/* --- Animated Stat Counters --- */
function initStatCounters() {
  const counters = document.querySelectorAll('.counter-val');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1800;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        el.textContent = target.toLocaleString();
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current).toLocaleString();
      }
    }, stepTime);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  } else {
    counters.forEach(c => animateCounter(c));
  }
}

/* --- Accordions --- */
// function initAccordions() {
//   const accordionHeaders = document.querySelectorAll('.accordion-header');
//   accordionHeaders.forEach(header => {
//     header.addEventListener('click', () => {
//       const item = header.parentElement;
//       const isOpen = item.classList.contains('active');

//       // Close other accordions in the same group
//       const parentGroup = item.parentElement;
//       if (parentGroup) {
//         parentGroup.querySelectorAll('.accordion-item').forEach(other => {
//           other.classList.remove('active');
//           const icon = other.querySelector('.accordion-icon');
//           if (icon) icon.textContent = 'expand_more';
//         });
//       }

//       if (!isOpen) {
//         item.classList.add('active');
//         const icon = header.querySelector('.accordion-icon');
//         if (icon) icon.textContent = 'expand_less';
//       }
//     });
//   });
// }

/* --- Training Slot Search --- */
function initSlotSearch() {
  const form = document.getElementById('slotSearchForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const sport = form.querySelector('[name="sport"]')?.value || 'All Sports';
    const age = form.querySelector('[name="age"]')?.value || 'All Ages';
    const level = form.querySelector('[name="level"]')?.value || 'All Levels';

    showToast(`Found 14 available training sessions for ${sport} (${age}, ${level})!`, 'success');
  });
}

/* --- 3D Tilt Effect on Cards --- */
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
}

/* --- Global Toast Notifications --- */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check_circle';
  if (type === 'error') iconName = 'error';

  toast.innerHTML = `
    <span class="material-symbols-outlined">${iconName}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

window.showToast = showToast;

/* --- 3D Carousel for Training Disciplines (services page) --- */
function initCarousel3D() {
  const wrapper = document.getElementById('servicesCarousel');
  if (!wrapper) return;

  const stage = wrapper.querySelector('.carousel-3d-stage');
  const track = wrapper.querySelector('.carousel-3d-track');
  const cards = Array.from(track.querySelectorAll('.carousel-3d-card'));
  const dotsWrap = wrapper.querySelector('.carousel-3d-dots');
  const prevBtn = wrapper.querySelector('.carousel-3d-nav-btn.prev');
  const nextBtn = wrapper.querySelector('.carousel-3d-nav-btn.next');
  const toggleBtns = wrapper.querySelectorAll('.carousel-toggle-btn');

  if (!stage || !track || cards.length === 0) return;

  const AUTOPLAY_DELAY = 4500;
  const SWIPE_THRESHOLD = 55;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = 0;
  let autoplayTimer = null;
  let isGridMode = false;
  let isPointerDown = false;
  let dragStartX = 0;

  /* Build pagination dots (one per card) */
  const dots = cards.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-3d-dot';
    dot.setAttribute('aria-label', 'Go to discipline ' + (i + 1));
    dot.addEventListener('click', () => {
      goTo(i);
      restartAutoplay();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });

  /* Spread the cards along the 3D arc: center, left/right 1, left/right 2, rest hidden */
  function applyPositions() {
    const total = cards.length;
    cards.forEach((card, i) => {
      const offset = (i - current + total) % total;
      let posClass;
      if (offset === 0) posClass = 'pos-center';
      else if (offset === 1) posClass = 'pos-right-1';
      else if (offset === total - 1) posClass = 'pos-left-1';
      else if (offset === 2) posClass = 'pos-right-2';
      else if (offset === total - 2) posClass = 'pos-left-2';
      else posClass = 'pos-hidden';

      card.classList.remove('pos-center', 'pos-left-1', 'pos-right-1', 'pos-left-2', 'pos-right-2', 'pos-hidden');
      card.classList.add(posClass);
      card.setAttribute('aria-hidden', offset === 0 ? 'false' : 'true');
    });

    dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  function goTo(index) {
    current = (index + cards.length) % cards.length;
    applyPositions();
  }

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  function startAutoplay() {
    stopAutoplay();
    if (prefersReducedMotion || isGridMode) return;
    autoplayTimer = setInterval(() => {
      if (!document.hidden) next();
    }, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function restartAutoplay() {
    startAutoplay();
  }

  /* Navigation buttons */
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });

  /* Keyboard navigation when the stage is focused */
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prev(); restartAutoplay(); }
    if (e.key === 'ArrowRight') { next(); restartAutoplay(); }
  });

  /* Click a side card to rotate it into the center */
  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (isGridMode || i === current) return;
      e.preventDefault();
      goTo(i);
      restartAutoplay();
    });
  });

  /* Drag / swipe support (mouse + touch) */
  stage.addEventListener('pointerdown', (e) => {
    if (isGridMode || e.target.closest('a, button')) return;
    isPointerDown = true;
    dragStartX = e.clientX;
  });

  window.addEventListener('pointerup', (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    const deltaX = e.clientX - dragStartX;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) next(); else prev();
      restartAutoplay();
    }
  });

  window.addEventListener('pointercancel', () => {
    isPointerDown = false;
  });

  /* Pause autoplay while hovering the stage */
  stage.addEventListener('mouseenter', stopAutoplay);
  stage.addEventListener('mouseleave', restartAutoplay);

  /* Carousel / Grid view toggle */
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      toggleBtns.forEach(b => b.classList.toggle('active', b === btn));
      isGridMode = view === 'grid';
      stage.classList.toggle('grid-mode', isGridMode);
      if (isGridMode) {
        stopAutoplay();
      } else {
        restartAutoplay();
      }
    });
  });

  applyPositions();
  startAutoplay();
}

/* ==========================================================================
   LINE SPLIT TEXT ANIMATIONS
   Splits titles into lines and animates them on scroll
   ========================================================================== */
function initLineSplits() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Split section titles into lines
  const titles = document.querySelectorAll('.section-title, .hero-title, .cta-title');
  titles.forEach(title => {
    const text = title.innerHTML;
    // Split by <br> or wrap words
    if (text.includes('<br>')) {
      const lines = text.split('<br>');
      title.innerHTML = lines.map(line => 
        `<span class="split-line"><span class="split-line-inner">${line}</span></span>`
      ).join('');
    } else {
      // Wrap each word
      const words = title.textContent.split(/\s+/);
      title.innerHTML = words.map(word => 
        `<span class="split-word"><span class="split-word-inner">${word}</span></span>`
      ).join(' ');
    }
  });

  // Split section subtitles and descriptions
  const descriptions = document.querySelectorAll('.section-subtitle, .hero-desc, .cta-desc');
  descriptions.forEach(desc => {
    desc.classList.add('slide-reveal');
  });

  // Split section tags
  const tags = document.querySelectorAll('.section-tag');
  tags.forEach(tag => {
    tag.classList.add('clip-reveal');
  });

  // Observe all split elements
  const splitObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Activate lines within this element
        entry.target.querySelectorAll('.split-line, .split-word, .slide-reveal, .clip-reveal').forEach((el, i) => {
          setTimeout(() => el.classList.add('active'), i * 80);
        });
        // Also activate the element itself if it has the class
        if (entry.target.classList.contains('split-line') || 
            entry.target.classList.contains('split-word') ||
            entry.target.classList.contains('slide-reveal') ||
            entry.target.classList.contains('clip-reveal')) {
          entry.target.classList.add('active');
        }
        splitObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

  // Observe all animated elements
  document.querySelectorAll('.split-line, .split-word, .slide-reveal, .clip-reveal').forEach(el => {
    splitObserver.observe(el);
  });

  // Also observe parent containers to activate children
  document.querySelectorAll('.section-header, .hero-text-content, .cta-banner').forEach(container => {
    splitObserver.observe(container);
  });
}

/* ==========================================================================
   CINEMATIC SCROLL ANIMATIONS
   Inspired by premium 3D fitness sites: parallax, text reveals,
   3D card effects, cursor glow, smooth section transitions
   ========================================================================== */
function initCinematicScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* --- Hero Parallax on Scroll --- */
  const heroSection = document.querySelector('.hero-section');
  const heroVisual = document.querySelector('.hero-visual-card');
  const heroText = document.querySelector('.hero-text-content');
  const heroGrid = document.querySelector('.hero-bg-grid');

  if (heroSection) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (y > vh) return; // Only animate while hero is visible

      const progress = y / vh; // 0 to 1 as user scrolls past hero

      // Hero text slides up and fades
      if (heroText) {
        heroText.style.transform = `translateY(${progress * -60}px)`;
        heroText.style.opacity = 1 - progress * 1.2;
      }

      // Hero visual card scales and shifts
      if (heroVisual) {
        heroVisual.style.transform = `translateY(${progress * -30}px) scale(${1 + progress * 0.05})`;
      }

      // Background grid parallax
      if (heroGrid) {
        heroGrid.style.transform = `translateY(${progress * 40}px)`;
      }
    }, { passive: true });
  }





  /* --- Bento Gallery Scroll Scrub --- */
  const bentoCards = document.querySelectorAll('.bento-card');
  if (bentoCards.length) {
    const bentoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scrub-active');
          bentoObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    bentoCards.forEach(card => bentoObserver.observe(card));

    // Parallax scroll effect on individual cards
    window.addEventListener('scroll', () => {
      bentoCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const speed = parseFloat(card.dataset.speed) || 1;
          const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
          const yOffset = (progress - 0.5) * 40 * speed;
          const isActive = card.classList.contains('scrub-active');
          if (isActive) {
            card.style.transform = `translateY(${yOffset}px) scale(1)`;
          }
        }
      });
    }, { passive: true });
  }

  /* --- Line Split Text Animations (GSAP-style) --- */
  initLineSplits();

  /* --- Smooth Image Zoom on Scroll (continuous) --- */
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.arena-card, .service-card, .testimonial-card').forEach(card => {
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const img = card.querySelector('img');
        if (img && !img.classList.contains('hero-visual-img')) {
          const scale = 1 + (progress - 0.5) * 0.08;
          img.style.transform = `scale(${Math.max(1, Math.min(1.08, scale))})`;
        }
      }
    });
  }, { passive: true });

  /* --- Text Stagger Reveal --- */
  const staggerGroups = document.querySelectorAll('.grid-3, .grid-4, .hero-highlights, .dash-stats-grid');
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const children = entry.target.children;
        Array.from(children).forEach((child, i) => {
          child.style.transitionDelay = `${i * 0.1}s`;
          child.classList.add('stagger-reveal-active');
        });
        staggerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  staggerGroups.forEach(group => {
    Array.from(group.children).forEach(child => {
      child.classList.add('stagger-reveal-item');
    });
    staggerObserver.observe(group);
  });

  /* --- Cursor Glow Effect (desktop only) --- */
  if (window.matchMedia('(pointer: fine)').matches) {
    const cursorGlow = document.createElement('div');
    cursorGlow.className = 'cursor-glow';
    document.body.appendChild(cursorGlow);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateGlow() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      cursorGlow.style.transform = `translate(${glowX - 150}px, ${glowY - 150}px)`;
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }

  /* --- Smooth Number Counter Animation on Scroll --- */
  const counterElements = document.querySelectorAll('.counter-val, .stat-counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('counter-active');
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counterElements.forEach(el => counterObserver.observe(el));

  /* --- Hero Badge Float Enhancement --- */
  const badges = document.querySelectorAll('.hero-badge, .floating-trophy-badge');
  badges.forEach((badge, i) => {
    badge.style.animation = `floatBadge ${3.5 + i * 0.5}s ease-in-out infinite`;
    badge.style.animationDelay = `${i * 0.3}s`;
  });

  /* --- Smooth Section Background Gradient Shift --- */
  window.addEventListener('scroll', () => {
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    document.documentElement.style.setProperty('--scroll-progress', scrollPercent);
  }, { passive: true });
}

/* --- Scroll-Driven Lifting Athlete Animation (index hero widget) ---
   The real-photo athlete rises while the user scrolls and settles back
   down; continuous scrolling keeps counting reps and spiking velocity. */
function initLiftOnScroll() {
  const widget = document.getElementById('liftingWidget');
  const stage = document.getElementById('liftingAvatarBox');
  const repCount = document.getElementById('liftRepCount');
  const velocity = document.getElementById('liftVelocity');
  const repBar = document.getElementById('liftRepBar');
  if (!widget || !stage) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const REP_SCROLL_COST = 90;
  let lastY = window.scrollY;
  let lift = 0;
  let accumulated = 0;
  let reps = 0;
  let rafId = null;
  let burstTimer = null;

  function settle() {
    lift *= 0.88;
    if (lift < 0.4) {
      lift = 0;
      stage.style.transform = 'translateY(0px)';
      rafId = null;
      return;
    }
    stage.style.transform = `translateY(${-lift.toFixed(1)}px)`;
    rafId = requestAnimationFrame(settle);
  }

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const delta = Math.abs(y - lastY);
    lastY = y;
    if (delta < 2) return;

    lift = Math.min(30, lift + delta * 0.12);
    if (!rafId) rafId = requestAnimationFrame(settle);

    accumulated += delta;
    if (accumulated >= REP_SCROLL_COST) {
      accumulated = 0;
      reps = (reps + 1) % 1000;
      if (repCount) repCount.textContent = reps;
      if (velocity) velocity.textContent = (0.9 + Math.random() * 1.3).toFixed(1);
      if (repBar) repBar.style.width = `${35 + Math.floor(Math.random() * 60)}%`;
    }

    widget.classList.add('is-lifting');
    clearTimeout(burstTimer);
    burstTimer = setTimeout(() => widget.classList.remove('is-lifting'), 650);
  }, { passive: true });
}

/* ==========================================================================
   MAGNETIC BUTTON HOVER EFFECT
   Buttons subtly follow the cursor on hover
   ========================================================================== */
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-outline, .btn-gold');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });

    // Ripple effect on click
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/* ==========================================================================
   PARALLAX SECTIONS ON SCROLL
   Subtle depth movement for visual richness
   ========================================================================== */
function initParallaxSections() {
  const sections = document.querySelectorAll('.section-padding');
  if (!sections.length) return;

  window.addEventListener('scroll', () => {
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const offset = (progress - 0.5) * 30;
        const headers = section.querySelectorAll('.section-header');
        headers.forEach(h => {
          h.style.transform = `translateY(${offset * 0.5}px)`;
        });
      }
    });
  }, { passive: true });
}

/* ==========================================================================
   ENERGY PARTICLES (ambient floating particles in hero)
   ========================================================================== */
function initEnergyParticles() {
  const heroSection = document.querySelector('.hero-section');
  if (!heroSection) return;

  const particleContainer = document.createElement('div');
  particleContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden;';
  heroSection.appendChild(particleContainer);

  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position:absolute;
      width:${2 + Math.random() * 4}px;
      height:${2 + Math.random() * 4}px;
      background:var(--accent-volt);
      border-radius:50%;
      opacity:${0.15 + Math.random() * 0.3};
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation:particleFloat ${3 + Math.random() * 5}s ease-in-out infinite alternate;
      animation-delay:${Math.random() * 3}s;
      box-shadow:0 0 8px rgba(198,255,0,0.3);
    `;
    particleContainer.appendChild(p);
  }

  // Inject keyframes if not already present
  if (!document.getElementById('particle-keyframes')) {
    const style = document.createElement('style');
    style.id = 'particle-keyframes';
    style.textContent = `
      @keyframes particleFloat {
        0% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(${10 + Math.random() * 20}px, ${-15 - Math.random() * 20}px) scale(1.3); }
        100% { transform: translate(${-10 - Math.random() * 15}px, ${10 + Math.random() * 15}px) scale(0.8); }
      }
    `;
    document.head.appendChild(style);
  }
}
