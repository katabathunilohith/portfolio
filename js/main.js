/* =========================================================
   Lohith Katabathuni — Portfolio
   Smooth scroll (Lenis) + GSAP ScrollTrigger choreography.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var debounce = function (fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; };

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  var glitch = window.HeroGlitch
    ? window.HeroGlitch.create($('#heroGlitch'), { stage: $('#heroStage'), interactive: finePointer && !reduceMotion })
    : null;

  /* ---------- fallback: libraries failed to load ---------- */
  if (!hasGSAP) {
    root.classList.add('no-motion');
    document.body.classList.remove('is-loading');
    var ready = document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      if (glitch) glitch.layout();
      if (window.Visuals) window.Visuals.drawAll();
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.clearScrollMemory('manual');
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'expo.out' });

  /* =======================================================
     Smooth scroll
     ======================================================= */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.3 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.lenis = lenis;
  }

  function scrollToTarget(target, opts) {
    opts = opts || {};
    if (lenis) {
      lenis.scrollTo(target, {
        duration: opts.duration || 1.7,
        easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
        force: true
      });
    } else {
      var y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* =======================================================
     Loader
     ======================================================= */
  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = img.onerror = function () { resolve(); };
      img.src = src;
    });
  }

  function runLoader() {
    var countEl = $('#loaderCount');
    var bar = $('#loaderBar');
    var fonts = document.fonts;
    var tasks = [
      fonts ? fonts.load('400 100px "Anton"') : Promise.resolve(),
      fonts ? fonts.load('300 40px "Inter Tight"') : Promise.resolve(),
      fonts ? fonts.load('500 10px "JetBrains Mono"') : Promise.resolve(),
      fonts ? fonts.load('400 40px "Grand Hotel"') : Promise.resolve(),
      loadImage('assets/img/hero-silhouette.webp'),
      loadImage('assets/img/hero-mono.webp')
    ];
    var done = 0;
    tasks.forEach(function (p) { p.then(function () { done++; }, function () { done++; }); });
    var start = performance.now();
    var MIN = reduceMotion ? 0.3 : 1.8;
    var shown = 0;

    return new Promise(function (resolve) {
      var failsafe = setTimeout(function () { done = tasks.length; }, 7000);
      function tick() {
        var t = (performance.now() - start) / 1000;
        var target = Math.min(done / tasks.length, clamp(t / MIN, 0, 1)) * 100;
        shown += (target - shown) * 0.085;
        if (target >= 100 && shown > 99.4) shown = 100;
        countEl.textContent = String(Math.floor(shown)).padStart(3, '0');
        bar.style.transform = 'scaleX(' + (shown / 100).toFixed(4) + ')';
        if (shown >= 100) {
          gsap.ticker.remove(tick);
          clearTimeout(failsafe);
          resolve();
        }
      }
      gsap.ticker.add(tick);
    });
  }

  /* =======================================================
     Hero
     ======================================================= */
  var caps = $$('.cap');

  function capParts(cap) {
    return {
      label: $('.cap__label', cap),
      lines: $$('.line > span', cap),
      rule: $('.cap__rule', cap),
      sub: $('.cap__sub', cap)
    };
  }

  function heroPrepare() {
    var p = capParts(caps[0]);
    gsap.set(p.label, { autoAlpha: 0, y: 8 });
    gsap.set(p.lines, { yPercent: 110 });
    gsap.set(p.rule, { scaleX: 0 });
    gsap.set(p.sub, { autoAlpha: 0 });
    gsap.set('.hero__textwrap', { autoAlpha: 0 });
    gsap.set('.hero__person-inner', { autoAlpha: 0 });
    gsap.set('.h-item', { autoAlpha: 0 });
    gsap.set('.h-meta', { autoAlpha: 0 });
  }

  function heroScroll() {
    var stepEl = $('#heroStep');
    var lastStep = 0;

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * (window.innerWidth / window.innerHeight <= 0.8 ? 1.8 : 2.3)); },
        pin: true,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var step = clamp(Math.floor(self.progress * 4 + 0.08), 0, 3);
          if (step !== lastStep) {
            lastStep = step;
            stepEl.textContent = '0' + (step + 1);
            if (glitch) glitch.pulse(0.18, 0.45);
          }
        }
      }
    });

    // "the camera moves": subject and type drift in opposite directions
    tl.fromTo('.hero__person',
      { x: function () { return -window.innerWidth * 0.018; }, scale: 1 },
      { x: function () { return window.innerWidth * 0.018; }, scale: 1.075, duration: 1 }, 0)
      .fromTo('.hero__textwrap',
        { x: function () { return window.innerWidth * 0.012; }, scale: 1 },
        { x: function () { return -window.innerWidth * 0.012; }, scale: 0.965, duration: 1 }, 0)
      // silhouette → presence
      .fromTo('.hero__img--sil', { opacity: 1 }, { opacity: 0, duration: 0.34, ease: 'power1.inOut' }, 0.44)
      .fromTo('.hero__shade', { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.inOut' }, 0.46);

    caps.forEach(function (cap, i) {
      var p = capParts(cap);
      var tIn = i * 0.25 - 0.03;
      var tOut = (i + 1) * 0.25 - 0.07;
      if (i > 0) {
        tl.fromTo(p.label, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: 'power2.out' }, tIn)
          .fromTo(p.lines, { yPercent: 110 }, { yPercent: 0, duration: 0.075, stagger: 0.014, ease: 'power3.out' }, tIn)
          .fromTo(p.rule, { scaleX: 0 }, { scaleX: 1, duration: 0.08, ease: 'power2.out' }, tIn + 0.02)
          .fromTo(p.sub, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, tIn + 0.045);
      }
      if (i < caps.length - 1) {
        tl.to(cap, { autoAlpha: 0, y: -26, duration: 0.06, ease: 'power2.in' }, tOut);
      }
    });
    tl.to({}, { duration: 0.1 });
    return tl.scrollTrigger;
  }

  function heroPointer() {
    if (!finePointer || reduceMotion) return;
    var px = gsap.quickTo('.hero__person-inner', 'x', { duration: 1.4, ease: 'power3' });
    var py = gsap.quickTo('.hero__person-inner', 'y', { duration: 1.4, ease: 'power3' });
    var tx = gsap.quickTo('#heroGlitch', 'x', { duration: 1.7, ease: 'power3' });
    var ty = gsap.quickTo('#heroGlitch', 'y', { duration: 1.7, ease: 'power3' });
    window.addEventListener('pointermove', function (e) {
      var nx = e.clientX / window.innerWidth - 0.5;
      var ny = e.clientY / window.innerHeight - 0.5;
      px(nx * 24); py(ny * 12);
      tx(nx * -12); ty(ny * -6);
    }, { passive: true });
  }

  function intro() {
    var c0 = capParts(caps[0]);
    var tl = gsap.timeline();
    tl.to('.loader__mask > span', { yPercent: -120, duration: 0.7, ease: 'power3.in', stagger: 0.05 })
      .to('.loader__line', { scaleX: 0, duration: 0.8, ease: 'power3.inOut', transformOrigin: '50% 50%' }, '<0.1')
      .to('#loader', { autoAlpha: 0, duration: 1.0, ease: 'power2.inOut' }, '-=0.4')
      .add(function () { if (glitch) glitch.pulse(0.5, 1.3); }, '<')
      .fromTo('.hero__textwrap', { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 2 }, '<')
      .fromTo('.hero__person-inner', { autoAlpha: 0, scale: 1.16, yPercent: 3 }, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 2.2 }, '<0.05')
      .fromTo('.h-item', { autoAlpha: 0, yPercent: -120 }, { autoAlpha: 1, yPercent: 0, duration: 1.2, stagger: 0.05 }, '<0.5')
      .to(c0.label, { autoAlpha: 1, y: 0, duration: 1 }, '<0.1')
      .to(c0.lines, { yPercent: 0, duration: 1.3, stagger: 0.09 }, '<0.05')
      .to(c0.rule, { scaleX: 1, duration: 1.4, ease: 'expo.inOut' }, '<0.2')
      .to(c0.sub, { autoAlpha: 1, duration: 1 }, '<0.3')
      .fromTo('.h-meta', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 }, '<')
      .add(function () {
        document.body.classList.remove('is-loading');
        if (lenis) lenis.start();
      }, '<-0.4');
    return tl;
  }

  /* =======================================================
     Generic reveals
     ======================================================= */
  function reveals(scope) {
    $$('[data-lines]', scope).forEach(function (el) {
      var spans = $$('.line > span', el);
      gsap.set(spans, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () { gsap.to(spans, { yPercent: 0, duration: 1.4, stagger: 0.09 }); }
      });
    });
    var fades = $$('[data-fade]', scope);
    if (fades.length) {
      gsap.set(fades, { autoAlpha: 0, y: 24 });
      ScrollTrigger.batch(fades, {
        start: 'top 92%', once: true,
        onEnter: function (els) { gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.08, overwrite: true }); }
      });
    }
  }

  /* =======================================================
     Work
     ======================================================= */
  function projects() {
    $$('.project').forEach(function (p) {
      var mask = $('.project__mask', p);
      var inner = $('.project__mask-inner', p);
      var par = $('.project__parallax', p);
      var capEls = $$('.project__caption h3, .project__tags', p);
      var rule = $('.project__rule', p);

      gsap.set(mask, { yPercent: 100 });
      gsap.set(inner, { yPercent: -100 });
      gsap.set(par, { scale: 1.2 });
      gsap.set(capEls, { autoAlpha: 0, y: 14 });
      gsap.set(rule, { scaleX: 0 });

      ScrollTrigger.create({
        trigger: p, start: 'top 90%', once: true,
        onEnter: function () {
          gsap.to([mask, inner], { yPercent: 0, duration: 1.6, ease: 'expo.inOut' });
          gsap.to(par, { scale: 1.05, duration: 2.4, delay: 0.15 });
          gsap.to(capEls, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08, delay: 0.55 });
          gsap.to(rule, { scaleX: 1, duration: 1.6, ease: 'expo.inOut', delay: 0.4 });
          p.classList.add('is-inview');
        }
      });

      gsap.fromTo(par, { yPercent: -2.2 }, {
        yPercent: 2.2, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    if (window.matchMedia('(min-width: 821px)').matches) {
      $$('.project--offset').forEach(function (p) {
        gsap.fromTo(p, { y: 70 }, {
          y: -70, ease: 'none',
          scrollTrigger: { trigger: p.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }

    // tally counter ticks while hovered
    var digits = $('[data-tally]');
    if (digits) {
      var media = digits.closest('.project__media');
      var plus = $('.tally__key--plus');
      var n = 42, iv = null;
      media.addEventListener('pointerenter', function () {
        clearInterval(iv);
        iv = setInterval(function () {
          n = (n + 1) % 10000;
          digits.textContent = String(n).padStart(4, '0');
          plus.classList.add('is-press');
          setTimeout(function () { plus.classList.remove('is-press'); }, 90);
        }, 170);
      });
      media.addEventListener('pointerleave', function () { clearInterval(iv); });
    }
  }

  /* =======================================================
     Stack deck (fan of cards)
     ======================================================= */
  function deck() {
    var cards = $$('.dcard');
    var tabs = $$('.deck__tab');
    var detail = $('#deckDetail');
    var n = cards.length;
    var active = 0, hovered = -1, entered = false;

    gsap.set(cards, { xPercent: -50, yPercent: -50, transformOrigin: '50% 100%', x: 0, y: 170, rotation: 0, scale: 0.92 });

    function pose(i) {
      var w = cards[0].offsetWidth;
      var rel = i - active;
      var x, y, rotation, scale = 1;
      if (window.innerWidth < 821) {
        // phones: the fan opens around the selected card so nothing leaves the screen
        var ar = Math.abs(rel);
        x = ar === 0 ? 0 : Math.sign(rel) * (w * 0.3 + (ar - 1) * w * 0.12);
        y = Math.pow(ar, 1.3) * w * 0.05;
        rotation = clamp(rel * 6, -20, 20);
        if (ar === 0) { y = -w * 0.1; scale = 1.06; }
        return { x: x, y: y, rotation: rotation, scale: scale };
      }
      var c = (n - 1) / 2;
      var k = i - c;
      x = k * w * 0.36 + Math.sign(rel) * w * 0.17;
      y = Math.pow(Math.abs(k), 1.6) * w * 0.045;
      rotation = k * 5.5;
      if (i === active) { x = k * w * 0.36; y = -w * 0.15; rotation = 0; scale = 1.1; }
      else if (i === hovered) { y -= w * 0.09; }
      return { x: x, y: y, rotation: rotation, scale: scale };
    }

    function layout(o) {
      o = o || {};
      cards.forEach(function (card, i) {
        var p = pose(i);
        card.style.zIndex = i === active ? 50 : 40 - Math.abs(i - active);
        gsap.to(card, {
          x: p.x, y: p.y, rotation: p.rotation, scale: p.scale,
          duration: o.duration != null ? o.duration : 1.1,
          delay: o.stagger ? i * o.stagger : 0,
          ease: 'expo.out', overwrite: 'auto'
        });
        card.classList.toggle('is-active', i === active);
      });
      tabs.forEach(function (t, i) {
        t.classList.toggle('is-active', i === active);
        t.setAttribute('aria-selected', String(i === active));
      });
    }

    var detailTl = null;
    function setActive(i) {
      if (i === active) return;
      active = i;
      layout();
      if (detailTl) detailTl.kill();
      detailTl = gsap.timeline()
        .to(detail, { autoAlpha: 0, y: -8, duration: 0.22, ease: 'power2.in' })
        .add(function () { detail.textContent = cards[i].getAttribute('data-detail'); })
        .fromTo(detail, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 });
    }

    ScrollTrigger.create({
      trigger: '.deck__stage', start: 'top 82%', once: true,
      onEnter: function () {
        entered = true;
        gsap.to(cards, { opacity: 1, duration: 0.9, stagger: 0.07, ease: 'power2.out' });
        layout({ duration: 1.7, stagger: 0.07 });
      }
    });

    cards.forEach(function (card, i) {
      card.addEventListener('click', function () { setActive(i); });
      card.addEventListener('pointerenter', function () {
        if (!entered || !finePointer) return;
        hovered = i;
        if (i !== active) layout({ duration: 0.8 });
      });
      card.addEventListener('pointerleave', function () {
        if (!entered || !finePointer) return;
        hovered = -1;
        layout({ duration: 0.9 });
        gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.9, ease: 'power3.out' });
      });
      card.addEventListener('pointermove', function (e) {
        if (!finePointer) return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        if (i === active) {
          gsap.to(card, { rotationY: (px - 0.5) * 14, rotationX: (0.5 - py) * 12, transformPerspective: 900, duration: 0.6, ease: 'power3.out' });
        }
      });
    });

    tabs.forEach(function (t, i) { t.addEventListener('click', function () { setActive(i); }); });
    $('.deck__tabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var ni = (active + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
      setActive(ni);
      tabs[ni].focus();
    });

    gsap.fromTo('.deck__rule i', { scaleX: 0 }, {
      scaleX: 1, duration: 1.8, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.deck__rule', start: 'top 90%', once: true }
    });

    window.addEventListener('resize', debounce(function () { if (entered) layout({ duration: 0.6 }); }, 150));
  }

  /* =======================================================
     Beyond code (scroll-driven coverflow)
     ======================================================= */
  function beyond() {
    var cards = $$('.fcard');
    var n = cards.length;
    var metaEl = $('#flowMeta'), titleEl = $('#flowTitle'), descEl = $('#flowDesc');
    var idxEl = $('#flowIndex'), bar = $('#flowBar'), dashes = $('#flowDashes');
    var linkEl = $('#flowLink'), totalEl = $('#flowTotal');
    if (totalEl) totalEl.textContent = String(n).padStart(2, '0');
    dashes.innerHTML = cards.map(function () { return '<i></i>'; }).join('');
    var dashEls = $$('i', dashes);

    var target = 0, current = 0, last = -1, near = false;
    var cardW = cards[0].offsetWidth;

    var st = ScrollTrigger.create({
      trigger: '.beyond',
      start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * (n - 1) * 0.55); },
      pin: '.beyond__pin',
      anticipatePin: 1,
      onUpdate: function (self) { target = self.progress * (n - 1); },
      onRefresh: function (self) { cardW = cards[0].offsetWidth; target = self.progress * (n - 1); }
    });

    ScrollTrigger.create({
      trigger: '.beyond', start: 'top bottom', end: 'bottom top',
      onToggle: function (self) { near = self.isActive; }
    });

    var infoTl = null;
    function updateInfo(i, prev) {
      var c = cards[i];
      idxEl.textContent = String(i + 1).padStart(2, '0');
      dashEls.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
      var apply = function () {
        metaEl.textContent = c.getAttribute('data-meta');
        titleEl.textContent = c.getAttribute('data-title');
        var tpl = c.querySelector('template.fcard__desc');
        if (tpl) descEl.innerHTML = tpl.innerHTML;
        else descEl.textContent = c.getAttribute('data-desc');
        descEl.classList.toggle('has-links', !!tpl);
        if (linkEl) {
          var href = c.getAttribute('data-link');
          if (href) {
            var label = c.getAttribute('data-link-label') || 'VIEW REPO ↗';
            var inner = linkEl.querySelector('.roll__inner');
            linkEl.href = href;
            inner.textContent = label;
            inner.setAttribute('data-text', label);
          }
          linkEl.classList.toggle('is-hidden', !href);
        }
      };
      if (prev < 0) { apply(); return; }
      var dir = i > prev ? 1 : -1;
      if (infoTl) infoTl.kill();
      infoTl = gsap.timeline()
        .to([metaEl, titleEl, descEl, linkEl], { yPercent: -40 * dir, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: 0.02 })
        .add(apply)
        .fromTo([metaEl, titleEl, descEl, linkEl], { yPercent: 40 * dir, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.75, stagger: 0.05 });
    }

    function render(force) {
      if (!near && !force) return;
      var diff = target - current;
      if (!force && Math.abs(diff) < 0.0003) return;
      current = Math.abs(diff) < 0.0003 ? target : current + diff * 0.1;

      for (var i = 0; i < n; i++) {
        var c = cards[i];
        var d = i - current, ad = Math.abs(d), sg = d < 0 ? -1 : 1;
        var x = sg * (ad <= 1 ? ad * 0.74 : 0.74 + (ad - 1) * 0.44) * cardW;
        var z = -ad * 170;
        var ry = -clamp(d, -2.4, 2.4) * 15;
        var s = 1 - Math.min(ad, 4) * 0.03;
        var o = clamp(1.95 - ad * 0.42, 0, 1);
        c.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(1) + 'px, 0, ' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
        c.style.opacity = o.toFixed(3);
        c.style.zIndex = String(100 - Math.round(ad * 10));
        var gs = Math.min(1, ad * 1.15);
        var bl = clamp((ad - 0.85) * 1.25, 0, 3);
        var f = 'grayscale(' + gs.toFixed(2) + ') blur(' + bl.toFixed(1) + 'px)';
        if (c._f !== f) { c.style.filter = f; c._f = f; }
        c.style.pointerEvents = o < 0.1 ? 'none' : 'auto';
      }
      var idx = clamp(Math.round(current), 0, n - 1);
      if (idx !== last) { updateInfo(idx, last); last = idx; }
      bar.style.transform = 'scaleX(' + (current / (n - 1)).toFixed(4) + ')';
    }

    render(true);
    gsap.ticker.add(function () { render(false); });

    cards.forEach(function (c, i) {
      c.addEventListener('click', function (e) {
        // links inside the front card open normally; on a side card they just bring it forward
        var a = e.target.closest ? e.target.closest('a') : null;
        if (a && i === last) return;
        if (a) e.preventDefault();
        var y = st.start + (i / (n - 1)) * (st.end - st.start);
        scrollToTarget(y, { duration: 1.3 });
      });
    });

    window.addEventListener('resize', debounce(function () { cardW = cards[0].offsetWidth; render(true); }, 150));
    return st;
  }

  /* =======================================================
     About
     ======================================================= */
  function about() {
    var lead = $('[data-words]');
    if (lead) {
      var words = lead.textContent.trim().split(/\s+/);
      lead.innerHTML = words.map(function (w) {
        var strong = /LOHITH/.test(w) ? ' style="font-weight:500"' : '';
        return '<span class="w"' + strong + '>' + w + '</span>';
      }).join(' ');
      gsap.fromTo($$('.w', lead), { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: lead, start: 'top 82%', end: 'bottom 48%', scrub: true }
      });
    }

    var card = $('.portrait__card');
    var mask = $('.portrait__mask'), inner = $('.portrait__mask-inner'), img = $('img', card);
    gsap.set(mask, { yPercent: 100 });
    gsap.set(inner, { yPercent: -100 });
    gsap.set(img, { scale: 1.22 });
    ScrollTrigger.create({
      trigger: card, start: 'top 86%', once: true,
      onEnter: function () {
        gsap.to([mask, inner], { yPercent: 0, duration: 1.7, ease: 'expo.inOut' });
        gsap.to(img, { scale: 1, duration: 2.4, delay: 0.15 });
      }
    });
    gsap.fromTo(img, { yPercent: -4 }, {
      yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true }
    });

    if (finePointer && !reduceMotion) {
      gsap.set(card, { transformPerspective: 1000 });
      var rx = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: 'power3' });
      var ry = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: 'power3' });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 12); rx((0.5 - py) * 10);
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () { rx(0); ry(0); });
    }

    $$('[data-count]').forEach(function (el) {
      var end = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var o = { v: 0 };
      el.textContent = (0).toFixed(dec);
      ScrollTrigger.create({
        trigger: el, start: 'top 94%', once: true,
        onEnter: function () {
          gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: function () { el.textContent = o.v.toFixed(dec); } });
        }
      });
    });
  }

  /* =======================================================
     Contact
     ======================================================= */
  function contact() {
    var title = $('.contact__title');
    ScrollTrigger.create({
      trigger: title, start: 'top 65%', once: true,
      onEnter: function () {
        setTimeout(function () { title.classList.add('is-filled'); }, 900);
        setTimeout(function () { title.classList.remove('is-filled'); }, 2900);
      }
    });
  }

  /* =======================================================
     Keep the reader's place when the window is resized
     (content reflows, so a raw pixel offset would land elsewhere)
     ======================================================= */
  function keepPlace(pins) {
    var sections = $$('main section[id]');
    var place = null, resized = false, lastCap = 0, capTimer = null;
    function capture() {
      if (resized) return;
      for (var i = 0; i < pins.length; i++) {
        if (pins[i] && pins[i].isActive) { place = { pin: i, p: pins[i].progress }; return; }
      }
      var mid = window.innerHeight / 2;
      for (var j = 0; j < sections.length; j++) {
        var r = sections[j].getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) { place = { sec: j, f: (mid - r.top) / Math.max(1, r.height) }; return; }
      }
    }
    function schedule() {
      var now = performance.now();
      if (now - lastCap > 150) { lastCap = now; capture(); }
      clearTimeout(capTimer);
      capTimer = setTimeout(capture, 170);
    }
    if (lenis) lenis.on('scroll', schedule);
    else window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', function () { resized = true; });
    ScrollTrigger.addEventListener('refresh', function () {
      if (!resized) return;
      resized = false;
      if (!place) return;
      var y;
      if (place.pin != null) {
        var st = pins[place.pin];
        y = st.start + place.p * (st.end - st.start);
      } else {
        var r = sections[place.sec].getBoundingClientRect();
        y = window.scrollY + r.top + place.f * r.height - window.innerHeight / 2;
      }
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    });
    capture();
  }

  /* =======================================================
     Nav, menu, cursor, anchors
     ======================================================= */
  function navState() {
    var links = $$('.nav__link');
    var setActive = function (id) {
      links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-section') === id); });
    };
    ['work', 'disciplines', 'beyond', 'about', 'contact'].forEach(function (id) {
      ScrollTrigger.create({
        trigger: '#' + id, start: 'top 50%', end: 'bottom 50%',
        onToggle: function (self) {
          if (self.isActive) setActive(id);
          else if (id === 'work' && self.direction < 0) setActive(null);
        }
      });
    });
  }

  var menuApi = { close: function () {} };
  function menu() {
    var btn = $('.menu-btn');
    var m = $('#menu');
    var links = $$('.menu__link .line > span', m);
    var open = false;
    var tl = gsap.timeline({ paused: true })
      .set(m, { visibility: 'visible' })
      .fromTo(m, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' })
      .fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.06 }, '-=0.45')
      .fromTo('.menu__foot', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, '-=0.7');
    function toggle(state) {
      open = state == null ? !open : state;
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      m.setAttribute('aria-hidden', String(!open));
      if (open) { tl.timeScale(1).play(); if (lenis) lenis.stop(); }
      else { tl.timeScale(1.7).reverse(); if (lenis) lenis.start(); }
    }
    btn.addEventListener('click', function () { toggle(); });
    menuApi.close = function () { if (open) toggle(false); };
  }

  function cursor() {
    if (!finePointer) return;
    var c = $('.cursor'), label = $('.cursor__dot span', c);
    var xTo = gsap.quickTo(c, 'x', { duration: 0.5, ease: 'power3' });
    var yTo = gsap.quickTo(c, 'y', { duration: 0.5, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    $$('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { label.textContent = el.getAttribute('data-cursor'); c.classList.add('is-on'); });
      el.addEventListener('pointerleave', function () { c.classList.remove('is-on'); });
    });
  }

  function anchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#') return;
        var target = href === '#top' ? 0 : document.querySelector(href);
        if (target == null) return;
        e.preventDefault();
        menuApi.close();
        scrollToTarget(target, { duration: href === '#top' ? 2.2 : 1.7 });
      });
    });
  }

  /* =======================================================
     Boot
     ======================================================= */
  heroPrepare();
  menu();
  anchors();
  cursor();

  function toTop() {
    window.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  }

  runLoader().then(function () {
    toTop();
    if (glitch) glitch.layout();
    if (window.Visuals) window.Visuals.drawAll();

    // create scroll scenes in document order (pins push later triggers)
    var heroST = heroScroll();
    reveals($('.work'));
    projects();
    reveals($('.deck'));
    deck();
    reveals($('.beyond'));
    var beyondST = beyond();
    reveals($('.about'));
    about();
    reveals($('.contact'));
    contact();
    navState();
    heroPointer();

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    toTop();
    keepPlace([heroST, beyondST]);
    intro();

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  });
})();
