(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Cross-service pill nav: keep the current page's pill in view ----------
     .service-pill-nav sits inside the hero's 40rem-wide centered container, so all
     5 pills together overflow it — without this, the active pill (the one telling
     you "you are here") can default to scrolled out of view, e.g. on growth-ads.html
     where it's last in the row. */
  document.querySelectorAll('.service-pill-nav .is-active').forEach(el => {
    el.scrollIntoView({ inline: 'center', block: 'nearest' });
  });

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('main-nav--open');
      navToggle.setAttribute('aria-expanded', String(open));
      if (!open) {
        mainNav.querySelectorAll('.nav-dropdown.is-open').forEach(d => {
          d.classList.remove('is-open');
          const t = d.querySelector('.nav-dropdown-toggle');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  /* ---------- Services nav dropdown ----------
     Click-to-toggle (works everywhere), plus hover-open on fine-pointer
     devices only, so this never becomes a hover-only interaction on touch.
     openedByHover guards against a real mouse-user bug: hovering opens the
     panel, and if the same click that follows lands on the toggle, a plain
     toggle-on-click would immediately flip it shut again.
     The panel sits a few px below the toggle (its own floating card), so
     .nav-dropdown's hoverable box doesn't actually cover that gap — closing
     on mouseleave with no delay meant the panel shut before the cursor ever
     reached it. A short cancellable close-delay bridges that gap. */
  document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;
    let openedByHover = false;
    let closeTimer = null;
    const clearCloseTimer = () => {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    };
    const setOpen = (open) => {
      clearCloseTimer();
      dropdown.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => {
      if (openedByHover) { openedByHover = false; return; }
      setOpen(!dropdown.classList.contains('is-open'));
    });
    if (hasFinePointer) {
      dropdown.addEventListener('mouseenter', () => {
        clearCloseTimer();
        openedByHover = true;
        setOpen(true);
      });
      dropdown.addEventListener('mouseleave', () => {
        closeTimer = setTimeout(() => {
          openedByHover = false;
          dropdown.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }, 300);
      });
    }
    dropdown.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { setOpen(false); toggle.focus(); }
    });
  });
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-dropdown.is-open').forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('is-open');
        const t = dropdown.querySelector('.nav-dropdown-toggle');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });
  });

  /* ---------- Nav hover/active indicator ---------- */
  if (mainNav) {
    const navLinks = Array.from(mainNav.querySelectorAll(':scope > a, :scope > .nav-dropdown > .nav-dropdown-toggle'));
    if (navLinks.length) {
      const indicator = document.createElement('span');
      indicator.className = 'nav-indicator';
      mainNav.appendChild(indicator);

      // getBoundingClientRect (not offsetLeft) so this stays correct even
      // though the Services toggle now sits inside a positioned
      // .nav-dropdown wrapper (its own offsetParent, not .main-nav).
      const moveIndicatorTo = (el) => {
        const navRect = mainNav.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        indicator.style.width = `${elRect.width}px`;
        indicator.style.transform = `translateX(${elRect.left - navRect.left}px)`;
        indicator.style.opacity = '1';
      };
      const currentLink = navLinks.find(a => a.getAttribute('href') === window.location.pathname)
        || navLinks.find(a => a.getAttribute('href') === '/' && window.location.pathname === '/')
        || (window.location.pathname.startsWith('/services/')
          ? mainNav.querySelector('.nav-dropdown-toggle')
          : null);

      navLinks.forEach(a => {
        a.addEventListener('mouseenter', () => moveIndicatorTo(a));
        a.addEventListener('focus', () => moveIndicatorTo(a));
      });
      mainNav.addEventListener('mouseleave', () => {
        if (currentLink) moveIndicatorTo(currentLink);
        else indicator.style.opacity = '0';
      });

      if (currentLink) {
        requestAnimationFrame(() => moveIndicatorTo(currentLink));
      }
    }
  }

  /* ---------- Animated typography: split hero headline into words ----------
     Scoped to h1.laara-display only — .laara-display is also used on the
     homepage stat band, which has live [data-counter] spans nested inside
     that must not be destroyed by a textContent rebuild. */
  if (!prefersReducedMotion) {
    document.querySelectorAll('h1.laara-display').forEach(el => {
      const text = el.textContent.trim();
      if (!text) return;
      el.setAttribute('aria-label', text);
      const wrap = document.createElement('span');
      wrap.className = 'word-split-wrap';
      wrap.setAttribute('aria-hidden', 'true');
      const words = text.split(/\s+/).filter(Boolean);
      words.forEach((word, i) => {
        const span = document.createElement('span');
        span.className = 'word-split';
        span.textContent = word;
        span.style.transitionDelay = `${Math.min(i, 10) * 35}ms`;
        wrap.appendChild(span);
        if (i < words.length - 1) wrap.appendChild(document.createTextNode(' '));
      });
      el.textContent = '';
      el.appendChild(wrap);
      el.classList.add('word-split-parent');
    });
  }

  /* ---------- Image zoom-reveal on portfolio/case-study imagery ----------
     Originally built as a clip-path wipe, but clip-path targets proved
     unreliable with IntersectionObserver in testing (never crossed the
     intersection threshold even when clearly scrolled through the
     viewport) — a scale+opacity reveal gets the same "creative reveal"
     read using the exact mechanism already proven everywhere else. */
  document.querySelectorAll('.work-media, .case-study-media, .case-frame-media').forEach(el => {
    el.classList.add('reveal-zoom');
  });

  /* ---------- Scroll reveals (staggered/cascading) ---------- */
  const revealEls = Array.from(document.querySelectorAll('.reveal, .reveal-zoom, .reveal-heading, .reveal-support'));
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const siblingIndex = new Map();
    revealEls.forEach(el => {
      /* .reveal-heading/.reveal-support carry their own baked-in CSS
         transition-delay (eyebrow -> heading -> support copy sequencing) —
         skip them here so the auto-stagger doesn't clobber it with an
         inline style. */
      if (el.classList.contains('reveal-heading') || el.classList.contains('reveal-support')) return;
      const parent = el.parentElement;
      const idx = siblingIndex.get(parent) || 0;
      siblingIndex.set(parent, idx + 1);
      const delay = Math.min(idx, 4) * 70;
      if (delay) el.style.transitionDelay = `${delay}ms`;
    });
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ---------- Work carousel: drag, autoplay, arrow + dot controls ----------
     Native scroll-snap on .work-track already makes this swipeable on
     touch with zero JS. On top of that this adds: a mouse click-and-hold
     drag (mice have no native touch-scroll gesture), a ping-pong
     autoplay that pauses the moment anyone interacts, and arrow/dot
     navigation kept in sync with wherever the user ends up. */
  const workTrack = document.querySelector('[data-work-track]');
  if (workTrack) {
    const workCards = Array.from(workTrack.children);
    const workPrevBtn = document.querySelector('[data-work-prev]');
    const workNextBtn = document.querySelector('[data-work-next]');
    const workDots = Array.from(document.querySelectorAll('[data-work-dot]'));
    const workCarouselRoot = workTrack.closest('.work-carousel') || workTrack;

    /* Links and images are natively draggable — Chrome shows its own
       "this is draggable" affordance (underline + outline) the moment a
       mousedown-then-move starts over one, even with dragstart prevented
       below. Turning off the draggable flag itself is what actually stops
       the rendering, not just the drag operation. */
    workCards.forEach(card => {
      card.draggable = false;
      card.querySelectorAll('img').forEach(img => { img.draggable = false; });
    });

    /* Proportional, not "closest offsetLeft" — when there are more cards
       than fit at once, the last card is narrower than the viewport and
       can never actually reach the track's left edge, so scrollLeft
       clamps short of its offsetLeft. Reading position as a fraction of
       the real scrollable range keeps the last dot/arrow state correct
       right up to the clamped max instead of falling back to an earlier
       card once you can't scroll any further. */
    const getMaxWorkScroll = () => workTrack.scrollWidth - workTrack.clientWidth;
    const getCurrentWorkIndex = () => {
      const maxScroll = getMaxWorkScroll();
      if (maxScroll <= 0) return 0;
      const fraction = workTrack.scrollLeft / maxScroll;
      return Math.round(fraction * (workCards.length - 1));
    };
    const scrollToWorkCard = (index) => {
      const clampedIndex = Math.max(0, Math.min(workCards.length - 1, index));
      const card = workCards[clampedIndex];
      if (!card) return;
      const target = clampedIndex === workCards.length - 1 ? getMaxWorkScroll() : card.offsetLeft;
      workTrack.scrollTo({ left: target, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    };
    const syncWorkControls = () => {
      const index = getCurrentWorkIndex();
      workDots.forEach((dot, i) => {
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (workPrevBtn) workPrevBtn.disabled = workTrack.scrollLeft <= 2;
      if (workNextBtn) workNextBtn.disabled = workTrack.scrollLeft >= workTrack.scrollWidth - workTrack.clientWidth - 2;
    };

    if (workPrevBtn) workPrevBtn.addEventListener('click', () => scrollToWorkCard(getCurrentWorkIndex() - 1));
    if (workNextBtn) workNextBtn.addEventListener('click', () => scrollToWorkCard(getCurrentWorkIndex() + 1));
    workDots.forEach((dot, i) => dot.addEventListener('click', () => scrollToWorkCard(i)));

    let workScrollTicking = false;
    workTrack.addEventListener('scroll', () => {
      if (workScrollTicking) return;
      workScrollTicking = true;
      requestAnimationFrame(() => { syncWorkControls(); workScrollTicking = false; });
    });
    syncWorkControls();

    /* ---- Mouse click-and-hold drag ----
       Touch already gets a drag gesture for free from native scrolling,
       so this only engages for mouse/pen pointers — grabbing on touch
       would fight the browser's own scroll handling. */
    let isDragging = false;
    let dragMoved = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;

    /* Images/links are natively draggable — left unchecked, a mousedown-
       then-move over a card image starts the browser's own HTML5 drag
       (a ghost-image drag) instead of the pointermove events below ever
       firing. Suppress it so our custom drag wins. */
    workTrack.addEventListener('dragstart', (e) => e.preventDefault());

    workTrack.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || (e.pointerType === 'mouse' && e.button !== 0)) return;
      isDragging = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartScrollLeft = workTrack.scrollLeft;
      workTrack.classList.add('is-dragging');
      workTrack.setPointerCapture(e.pointerId);
    });
    workTrack.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const delta = e.clientX - dragStartX;
      if (Math.abs(delta) > 3) dragMoved = true;
      workTrack.scrollLeft = dragStartScrollLeft - delta;
    });
    const endWorkDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      workTrack.classList.remove('is-dragging');
      /* A drag that actually moved shouldn't leave the card it started on
         focused — the pointer never meant to "select" that link. */
      if (dragMoved && document.activeElement && workTrack.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      if (e && e.pointerId !== undefined && workTrack.hasPointerCapture(e.pointerId)) {
        workTrack.releasePointerCapture(e.pointerId);
      }
    };
    workTrack.addEventListener('pointerup', endWorkDrag);
    workTrack.addEventListener('pointercancel', endWorkDrag);
    /* Suppress the click a drag ends on, so releasing over a card doesn't
       also fire its link navigation. Consumes the flag immediately so it
       never lingers to block a later keyboard-triggered (Enter) click. */
    workTrack.addEventListener('click', (e) => {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      }
    }, true);

    /* ---- Autoplay: gently ping-pongs end to end, pausing for any sign
       of user attention (hover, drag, keyboard focus, tab hidden, or the
       section being scrolled out of view) and never running at all under
       prefers-reduced-motion. */
    if (!prefersReducedMotion && workCards.length > 1) {
      let autoplayDirection = 1;
      let pointerOver = false;
      let hasFocus = false;
      let isInView = true;

      workCarouselRoot.addEventListener('pointerenter', () => { pointerOver = true; });
      workCarouselRoot.addEventListener('pointerleave', () => { pointerOver = false; });
      workTrack.addEventListener('focusin', () => { hasFocus = true; });
      workTrack.addEventListener('focusout', () => { hasFocus = false; });

      const workInViewObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { isInView = entry.isIntersecting; });
      }, { threshold: 0.2 });
      workInViewObserver.observe(workCarouselRoot);

      setInterval(() => {
        if (isDragging || pointerOver || hasFocus || document.hidden || !isInView) return;
        const current = getCurrentWorkIndex();
        if (current >= workCards.length - 1) autoplayDirection = -1;
        else if (current <= 0) autoplayDirection = 1;
        scrollToWorkCard(current + autoplayDirection);
      }, 3800);
    }
  }

  /* ---------- Pricing helper (homepage-only compact "help me choose") ----------
     pricing.html keeps its own full 3-question tool with a dedicated
     result panel (pricing.js/pricing-data.js, separate scripts not
     loaded on this page). This is a smaller, self-contained version
     scoped to the homepage teaser: same scoring facts and tie-break
     rule (ties default to Professional, matching pricing.md's stated
     sales goal), but the "result" is shown by highlighting the
     matching card already on screen rather than duplicating a result
     panel. Reuses .pill-toggle-btn's existing role="radio" pattern
     verbatim — same component the contact wizard uses. */
  const pricingHelper = document.querySelector('[data-pricing-helper]');
  if (pricingHelper) {
    const helperResult = pricingHelper.querySelector('[data-pricing-helper-result]');
    const helperCards = Array.from(document.querySelectorAll('.pricing-grid .pricing-card[data-package]'));
    const helperPagesToPackage = { '4-5': 'essential', '6-8': 'professional', '8-12': 'growth' };
    const helperGoalToPackage = { fast: 'essential', visibility: 'professional', competitors: 'growth' };
    const helperOrder = ['essential', 'professional', 'growth'];
    const helperNames = { essential: 'Essential', professional: 'Professional', growth: 'Growth' };
    const helperState = { pages: null, goal: null, booking: null };

    function computeHelperResult() {
      helperCards.forEach((card) => card.classList.remove('is-recommended'));
      if (!helperState.pages || !helperState.goal || !helperState.booking) {
        helperResult.textContent = 'Answer all three and we’ll highlight your best match above.';
        return;
      }
      const scores = { essential: 0, professional: 0, growth: 0 };
      scores[helperPagesToPackage[helperState.pages]] += 1;
      scores[helperGoalToPackage[helperState.goal]] += 1;
      if (helperState.booking === 'yes') { scores.professional += 1; scores.growth += 1; }
      else { scores.essential += 1; }

      const max = Math.max(scores.essential, scores.professional, scores.growth);
      const tied = helperOrder.filter((id) => scores[id] === max);
      const winner = tied.includes('professional') ? 'professional' : tied[0];

      const winnerCard = helperCards.find((card) => card.dataset.package === winner);
      if (winnerCard) winnerCard.classList.add('is-recommended');
      helperResult.textContent = `${helperNames[winner]} looks like your best starting point — highlighted above.`;
    }

    pricingHelper.querySelectorAll('.pill-toggle-btn[data-radio]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.radio;
        const group = btn.closest('.pill-toggle');
        group.querySelectorAll('.pill-toggle-btn').forEach((b) => b.setAttribute('aria-checked', 'false'));
        btn.setAttribute('aria-checked', 'true');
        helperState[key] = btn.dataset.value;
        computeHelperResult();
      });
    });
  }

  /* ---------- Smart sticky header + scroll-linked parallax (shared rAF loop) ---------- */
  const header = document.querySelector('.site-header');
  const parallaxEl = document.querySelector('.hero-bg');
  let lastScrollY = window.scrollY;
  let ticking = false;
  const hideThreshold = 80;

  function onScroll() {
    const currentY = window.scrollY;

    if (header) {
      if (currentY > hideThreshold && currentY > lastScrollY) {
        header.classList.add('header--hidden');
      } else {
        header.classList.remove('header--hidden');
      }
    }

    if (parallaxEl && !prefersReducedMotion) {
      parallaxEl.style.transform = `translateY(${currentY * 0.15}px)`;
    }

    lastScrollY = currentY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  });

  /* ---------- Interactive cards: magnetic buttons (fine pointer only) ---------- */
  if (hasFinePointer && !prefersReducedMotion) {
    const magneticEls = document.querySelectorAll('.laara-btn--primary');
    magneticEls.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${(x * 0.25).toFixed(1)}px, ${(y * 0.25).toFixed(1)}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });

    /* ---------- Custom cursor (decorative, additive — never replaces the native cursor) ---------- */
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let cursorX = targetX;
    let cursorY = targetY;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    function cursorLoop() {
      cursorX += (targetX - cursorX) * 0.2;
      cursorY += (targetY - cursorY) * 0.2;
      cursor.style.transform = `translate(${cursorX.toFixed(1)}px, ${cursorY.toFixed(1)}px)`;
      requestAnimationFrame(cursorLoop);
    }
    requestAnimationFrame(cursorLoop);

    document.querySelectorAll('a, button, .laara-card, .work-card, .case-card, .service-card, .pricing-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('custom-cursor--active'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('custom-cursor--active'));
    });

    /* ---------- Glow cards: cursor-reactive glow ----------
       Applies to every card carrying "glow-card" — the services grid,
       the plain differentiator cards, and the contact method cards.
       Writes --mx/--my (px, relative to the card) for the radial-gradient
       in style.css. Cached rect + one rAF slot per card avoids layout
       thrashing — pointermove never triggers a synchronous reflow, and
       at most one style write happens per animation frame per card. */
    document.querySelectorAll('.glow-card').forEach(card => {
      let cardRect = null;
      let frame = null;
      let mx = 0;
      let my = 0;
      const applyGlow = () => {
        card.style.setProperty('--mx', `${mx}px`);
        card.style.setProperty('--my', `${my}px`);
        frame = null;
      };
      card.addEventListener('pointerenter', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        cardRect = card.getBoundingClientRect();
      });
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        if (!cardRect) cardRect = card.getBoundingClientRect();
        mx = e.clientX - cardRect.left;
        my = e.clientY - cardRect.top;
        if (!frame) frame = requestAnimationFrame(applyGlow);
      });
    });

    /* ---------- Work page hero: pointer-tracked collage parallax ----------
       Writes --px/--py once on the collage container; each .work-hero-frame
       reads them back through its own --depth (set inline per frame in the
       HTML) via calc(), so one write per pointermove drives every frame at
       a different depth — no per-frame listeners needed. */
    const heroCollage = document.querySelector('.work-hero-collage');
    if (heroCollage) {
      let collageRect = null;
      let collageFrame = null;
      let px = 0;
      let py = 0;
      const applyParallax = () => {
        heroCollage.style.setProperty('--px', `${px}px`);
        heroCollage.style.setProperty('--py', `${py}px`);
        collageFrame = null;
      };
      heroCollage.addEventListener('pointerenter', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        collageRect = heroCollage.getBoundingClientRect();
      });
      heroCollage.addEventListener('pointermove', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        if (!collageRect) collageRect = heroCollage.getBoundingClientRect();
        const relX = (e.clientX - collageRect.left) / collageRect.width - 0.5;
        const relY = (e.clientY - collageRect.top) / collageRect.height - 0.5;
        px = relX * 16;
        py = relY * 16;
        if (!collageFrame) collageFrame = requestAnimationFrame(applyParallax);
      });
      heroCollage.addEventListener('pointerleave', () => {
        px = 0;
        py = 0;
        applyParallax();
      });
    }
  }

  /* ---------- Case study filters (Work page) ----------
     Filters apply across both the Client work and Concept lab grids —
     querySelectorAll('.case-card') already spans both since they're
     just two separate containers of the same card markup. */
  const filterPills = document.querySelectorAll('.filter-pill');
  const caseCards = document.querySelectorAll('.case-card');
  const caseFilters = document.querySelector('.case-filters');
  if (filterPills.length && caseCards.length) {
    let moveFilterIndicator = null;
    if (caseFilters) {
      const filterIndicator = document.createElement('span');
      filterIndicator.className = 'filter-indicator';
      filterIndicator.setAttribute('aria-hidden', 'true');
      caseFilters.appendChild(filterIndicator);
      moveFilterIndicator = (el) => {
        filterIndicator.style.width = `${el.offsetWidth}px`;
        filterIndicator.style.transform = `translateX(${el.offsetLeft}px)`;
      };
      const initialActive = document.querySelector('.filter-pill.is-active');
      if (initialActive) requestAnimationFrame(() => moveFilterIndicator(initialActive));
    }

    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        if (moveFilterIndicator) moveFilterIndicator(pill);
        const filter = pill.dataset.filter;
        caseCards.forEach(card => {
          const categories = card.dataset.category.split(' ');
          const match = filter === 'all' || categories.includes(filter);
          card.classList.toggle('is-hidden', !match);
        });
      });
    });
  }

  /* ---------- Contact form (Web3Forms) ---------- */
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const statusEl = form.querySelector('.form-status');
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      statusEl.textContent = 'Sending…';
      statusEl.removeAttribute('data-state');

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const result = await response.json();
        if (result.success) {
          statusEl.textContent = "Thanks — we've got your message and will reply the same working day.";
          statusEl.dataset.state = 'success';
          form.reset();
        } else {
          throw new Error(result.message || 'Something went wrong');
        }
      } catch (err) {
        statusEl.textContent = "Sorry, that didn't send. Please call or WhatsApp us instead.";
        statusEl.dataset.state = 'error';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
})();
