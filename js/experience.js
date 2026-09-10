/**
 * STACKLY — CINEMATIC SCROLL EXPERIENCE ENGINE
 * Vanilla JS. No libraries.
 *
 * Architecture:
 *   - One <section class="experience"> contains a tall .exp-track with a
 *     sticky .browser-frame. Inside the frame, 4 absolutely-stacked .scene
 *     layers are driven by a per-scene progress variable (--p, 0 → 1).
 *   - A single requestAnimationFrame loop reads scroll position (never in
 *     the scroll event), computes each scene's progress and writes CSS
 *     custom properties only — CSS performs all transforms/opacity math.
 *   - State flow: hero → properties → services → active-project → finale.
 *
 * Segment map (share of total track scroll):
 *   0.00–0.05  hold on hero (static beat)
 *   0.05–0.27  scene 1  hero          (image push-in, type splits out)
 *   0.27–0.50  scene 2  properties    (clip wipe in, words rise, cards fly)
 *   0.50–0.73  scene 3  services      (door clip open, rows stagger in)
 *   0.73–1.00  scene 4  finale        (image settles, floating cards pop)
 */
(function () {
  'use strict';

  /* ----------------------------- configuration ---------------------------- */

  const SEGMENTS = [
    { key: 'hero',       el: null, selector: '.scene-hero',       a: 0.05, b: 0.27 },
    { key: 'properties', el: null, selector: '.scene-properties', a: 0.27, b: 0.50 },
    { key: 'services',   el: null, selector: '.scene-services',   a: 0.50, b: 0.73 },
    { key: 'finale',     el: null, selector: '.scene-finale',     a: 0.73, b: 1.00 }
  ];

  const VISIBILITY_PAD = 0.08;   // keep a scene alive slightly beyond its segment
  const EASE_INOUT     = t => t * t * (3 - 2 * t);            // smoothstep
  const clamp01        = v => Math.min(1, Math.max(0, v));
  const lerp           = (a, b, t) => a + (b - a) * t;

  /* --------------------------------- state -------------------------------- */

  let section, track, stage, rowsWrap;
  let rows = [];
  let trackTop = 0;
  let trackH = 1;
  let vh = window.innerHeight;

  let pageProgress = 0;              // 0 → 1 through the whole track
  let activeProject = -1;
  let isReducedMotion = false;
  let isFinePointer = false;
  let loopRunning = false;
  let sectionOnScreen = true;

  // smoothed values (lerped every frame to avoid scroll-jerk)
  const sceneCurrent = [0, 0, 0, 0];
  const pointer = { tx: 0, ty: 0, x: 0, y: 0 };       // -1 → 1 (stage parallax)
  const preview  = { tx: 0, ty: 0, x: 0, y: 0, init: false }; // px (row preview)

  /* ------------------------------- utilities ------------------------------ */

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

  /* Local progress of a scene segment, eased with smoothstep. */
  function sceneProgress(seg) {
    return EASE_INOUT(clamp01((pageProgress - seg.a) / (seg.b - seg.a)));
  }

  /* ------------------------- scene progress engine ------------------------ */

  /** Compute + write --p per scene, toggle .is-visible windows. */
  function updateSceneProgress() {
    for (let i = 0; i < SEGMENTS.length; i++) {
      const seg = SEGMENTS[i];
      const target = sceneProgress(seg);

      // critical damping toward the target keeps motion buttery on fast scrolls
      sceneCurrent[i] = Math.abs(target - sceneCurrent[i]) < 0.0005
        ? target
        : lerp(sceneCurrent[i], target, 0.16);

      seg.el.style.setProperty('--p', sceneCurrent[i].toFixed(4));

      const visible = pageProgress > seg.a - VISIBILITY_PAD && pageProgress < seg.b + VISIBILITY_PAD;
      seg.el.classList.toggle('is-visible', visible);
    }
  }

  /* --------------------------- services hover UI -------------------------- */

  /** Mark one project row active; others recede via CSS (.has-active). */
  function setActiveProject(index) {
    if (index === activeProject) return;
    activeProject = index;
    rows.forEach((row, i) => row.classList.toggle('is-active', i === index));
    if (rowsWrap) {
      rowsWrap.classList.toggle('has-active', index >= 0);
      // pan the preview image inside its mask, one step per project
      rowsWrap.style.setProperty('--mi', String(index * -10));
    }
  }

  function initProjectHover() {
    if (!rowsWrap || !rows.length) return;

    rows.forEach((row, i) => {
      row.addEventListener('pointerenter', () => setActiveProject(i));
      row.addEventListener('focus', () => setActiveProject(i));
    });
    rowsWrap.addEventListener('pointerleave', () => setActiveProject(-1));

    // preview image follows the pointer — targets are lerped in the rAF loop
    if (isFinePointer) {
      rowsWrap.addEventListener('pointermove', (e) => {
        const r = rowsWrap.getBoundingClientRect();
        preview.tx = e.clientX - r.left;
        preview.ty = e.clientY - r.top;
        preview.init = true;
      });
    }
  }

  /* --------------------------- pointer parallax --------------------------- */

  /** Writes smoothed --px/--py on the stage; CSS applies depth by --depth. */
  function updateFloatingCards() {
    pointer.x = lerp(pointer.x, pointer.tx, 0.06);
    pointer.y = lerp(pointer.y, pointer.ty, 0.06);
    stage.style.setProperty('--px', pointer.x.toFixed(4));
    stage.style.setProperty('--py', pointer.y.toFixed(4));

    if (preview.init) {
      preview.x = lerp(preview.x, preview.tx, 0.14);
      preview.y = lerp(preview.y, preview.ty, 0.14);
      rowsWrap.style.setProperty('--mx', preview.x.toFixed(1));
      rowsWrap.style.setProperty('--my', preview.y.toFixed(1));
    }
  }

  function initPointerParallax() {
    if (!isFinePointer) return;
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    stage.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });
  }

  /* ------------------------------ scroll loop ----------------------------- */

  /** Main per-frame handler: progress, scenes, parallax. */
  function handleScroll() {
    pageProgress = getScrollProgress();
    updateSceneProgress();
    updateFloatingCards();
  }

  function tick() {
    if (!sectionOnScreen) { loopRunning = false; return; }  // sleep off-screen
    handleScroll();
    requestAnimationFrame(tick);
  }

  function wake() {
    const rect = section.getBoundingClientRect();
    sectionOnScreen = rect.bottom > -vh && rect.top < vh * 2;
    if (sectionOnScreen && !loopRunning && !isReducedMotion) {
      loopRunning = true;
      requestAnimationFrame(tick);
    }
  }

  /* --------------------------- responsive layout -------------------------- */

  /** Re-measure on breakpoint changes; drop decorative parallax on touch. */
  function handleResponsiveLayout() {
    isFinePointer = window.matchMedia('(pointer: fine)').matches;
    isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    measure();

    if (isReducedMotion) {
      // Static experience: pin the frame, hold the hero, kill the loop.
      track.style.height = '100vh';
      pageProgress = 0;
      sceneCurrent.fill(0);
      SEGMENTS[0].el.style.setProperty('--p', '0.15');
      SEGMENTS[0].el.classList.add('is-visible');
      for (let i = 1; i < SEGMENTS.length; i++) SEGMENTS[i].el.classList.remove('is-visible');
      loopRunning = false;
    } else {
      track.style.height = '';
      handleScroll();
      wake();
    }
  }

  /* --------------------------------- init --------------------------------- */

  function initScenes() {
    section = document.querySelector('.experience');
    if (!section) return;

    track = section.querySelector('.exp-track');
    stage = section.querySelector('.exp-stage');
    rowsWrap = section.querySelector('.exp-rows');
    rows = Array.from(section.querySelectorAll('.exp-row'));

    SEGMENTS.forEach(s => { s.el = section.querySelector(s.selector); });
    if (!track || !stage || SEGMENTS.some(s => !s.el)) return;

    initProjectHover();
    initPointerParallax();

    // wake/sleep the rAF loop only while the experience is near the viewport
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', handleResponsiveLayout);
    window.addEventListener('load', measure);

    // Deep-link support: index.html#exp-progress=0.6 jumps straight to a
    // point in the experience (also used for automated visual testing).
    const jumpToHash = () => {
      const hash = window.location.hash.match(/^#exp-progress=(0?(?:\.\d+)?|1(?:\.0+)?)$/);
      if (!hash) return;
      const p = parseFloat(hash[1]);
      requestAnimationFrame(() => {
        window.scrollTo(0, trackTop + p * trackH);
        handleScroll();
      });
    };
    jumpToHash();
    window.addEventListener('hashchange', jumpToHash);

    handleResponsiveLayout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScenes);
  } else {
    initScenes();
  }
})();
