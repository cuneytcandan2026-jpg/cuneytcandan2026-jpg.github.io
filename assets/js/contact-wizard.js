(() => {
  const section = document.querySelector('.quote-wizard-section');
  if (!section) return;

  const config = window.LaaraWizardConfig;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORAGE_KEY = 'laaraQuoteWizard';
  const STEP_NAMES = ['Project', 'Requirements', 'Budget', 'Your Details', 'Review'];

  const defaultState = () => ({
    mode: 'quote',
    step: 1,
    services: [],
    hasWebsite: null,
    currentUrl: '',
    features: [],
    pageCount: null,
    projectNotes: '',
    budgetBand: null,
    timeline: null,
    hasLaunchDate: null,
    launchDate: '',
    firstName: '',
    lastName: '',
    business: '',
    email: '',
    phone: '',
    preferredContact: null,
    location: '',
    hearAbout: null,
    _returnToReview: false
  });

  let state = defaultState();

  /* ---------- sessionStorage persistence ---------- */
  function saveStateToSession() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable — fail silently, not fatal */ }
  }
  function restoreStateFromSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        state = Object.assign(defaultState(), saved);
        return true;
      }
    } catch (e) { /* corrupt/blocked storage — start fresh */ }
    return false;
  }
  let saveDebounce = null;
  function saveStateDebounced() {
    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(saveStateToSession, 150);
  }

  /* ============================================================
     MODE SWITCH
     ============================================================ */
  const modeButtons = Array.from(document.querySelectorAll('.mode-switch-btn'));
  const modeIndicator = document.querySelector('.mode-switch-indicator');
  const quotePanel = document.getElementById('quote-mode-panel');
  const enquiryPanel = document.getElementById('enquiry-mode-panel');

  function moveIndicatorTo(btn) {
    if (!modeIndicator || !btn) return;
    modeIndicator.style.width = `${btn.offsetWidth}px`;
    modeIndicator.style.transform = `translateX(${btn.offsetLeft}px) translateY(${btn.offsetTop}px)`;
  }

  function setMode(mode) {
    state.mode = mode;
    modeButtons.forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
      if (active) moveIndicatorTo(btn);
    });
    if (quotePanel) quotePanel.hidden = mode !== 'quote';
    if (enquiryPanel) enquiryPanel.hidden = mode !== 'enquiry';
    saveStateToSession();
  }

  function bindModeSwitch() {
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    /* moveIndicatorTo reads offsetLeft/offsetWidth, which forces a synchronous
       layout. Bound straight to resize, that fired on every tick of a window
       drag and on the address-bar show/hide that counts as a resize on mobile
       — a forced reflow each time. Coalesced into one read per frame via rAF:
       the indicator still tracks the resize, but repeated events collapse into
       a single measurement instead of one apiece. */
    let resizeFrame = null;
    window.addEventListener('resize', () => {
      if (resizeFrame !== null) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        const active = modeButtons.find(b => b.classList.contains('is-active'));
        if (active) moveIndicatorTo(active);
      });
    });
  }

  /* ============================================================
     CONFIG-DRIVEN GROUP RENDERING (chips + single-select pills)
     ============================================================ */
  function renderChips() {
    const wrap = document.getElementById('features-chips');
    if (!wrap) return;
    wrap.innerHTML = config.features.map(f =>
      `<button type="button" class="chip-select-item" data-chip="features" data-value="${f.id}" aria-pressed="false">${f.label}</button>`
    ).join('');
  }

  function renderPillGroup(containerId, items, stateKey) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.innerHTML = items.map(it =>
      `<button type="button" class="pill-toggle-btn" role="radio" data-radio="${stateKey}" data-value="${it.id}" aria-checked="false">${it.label}</button>`
    ).join('');
  }

  function renderBudgetCards() {
    const wrap = document.getElementById('budget-cards');
    if (!wrap) return;
    wrap.innerHTML = config.budgetBands.map(b => `
      <label class="option-card">
        <input type="radio" name="budget_band" value="${b.id}" class="option-card-input" data-radio-card="budgetBand" />
        <span class="option-card-range">${b.label}</span>
        ${b.range ? `<span class="option-card-desc">${b.range}</span>` : ''}
        <span class="option-card-desc">${b.desc}</span>
      </label>
    `).join('');
  }

  /* ============================================================
     SERVICE / FEATURE MULTI-SELECT
     ============================================================ */
  function bindOptionCardCheckboxes() {
    document.querySelectorAll('.option-card-input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', () => {
        const label = input.closest('.option-card');
        label.classList.toggle('is-selected', input.checked);
        const arr = state.services; // only services use multi-select checkboxes currently
        const val = input.value;
        const idx = arr.indexOf(val);
        if (input.checked && idx === -1) arr.push(val);
        if (!input.checked && idx !== -1) arr.splice(idx, 1);
        clearFieldError('services');
        renderSummaryPanel();
        saveStateToSession();
      });
    });
  }

  function bindChips() {
    const wrap = document.getElementById('features-chips');
    if (!wrap) return;
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-select-item');
      if (!btn) return;
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!pressed));
      const idx = state.features.indexOf(btn.dataset.value);
      if (!pressed && idx === -1) state.features.push(btn.dataset.value);
      if (pressed && idx !== -1) state.features.splice(idx, 1);
      renderSummaryPanel();
      saveStateToSession();
    });
  }

  /* ---------- Single-select radio-style pill groups ---------- */
  function bindRadioPillGroups() {
    document.querySelectorAll('.pill-toggle-btn[data-radio]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.radio;
        const group = btn.closest('.pill-toggle');
        group.querySelectorAll('.pill-toggle-btn').forEach(b => b.setAttribute('aria-checked', 'false'));
        btn.setAttribute('aria-checked', 'true');
        state[key] = btn.dataset.value;
        renderSummaryPanel();
        saveStateToSession();
      });
    });
  }

  /* ---------- Budget cards (single-select radio under option-card) ---------- */
  function bindBudgetCards() {
    document.querySelectorAll('.option-card-input[type="radio"][data-radio-card="budgetBand"]').forEach(input => {
      input.addEventListener('change', () => {
        document.querySelectorAll('#budget-cards .option-card').forEach(c => c.classList.remove('is-selected'));
        input.closest('.option-card').classList.add('is-selected');
        state.budgetBand = input.value;
        renderSummaryPanel();
        saveStateToSession();
      });
    });
  }

  /* ---------- Yes/No pill toggles (hasWebsite / hasLaunchDate) ---------- */
  function setRevealOpen(key, open, skipTransition) {
    const el = document.querySelector(`.wizard-reveal[data-reveal="${key}"]`);
    if (!el) return;
    if (skipTransition || prefersReducedMotion) {
      el.style.transitionDuration = '0s';
      requestAnimationFrame(() => { el.style.transitionDuration = ''; });
    }
    el.classList.toggle('is-open', open);
    el.hidden = false; // stays in flow (0fr collapses it visually) so grid-rows can animate
    const input = el.querySelector('input');
    if (input) input.disabled = !open;
  }

  function bindYesNoToggles() {
    document.querySelectorAll('.pill-toggle-btn[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.toggle;
        const group = btn.closest('.pill-toggle');
        group.querySelectorAll('.pill-toggle-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        state[key] = btn.dataset.value;
        if (key === 'hasWebsite') setRevealOpen('current-url', btn.dataset.value === 'yes');
        if (key === 'hasLaunchDate') setRevealOpen('launch-date', btn.dataset.value === 'yes');
        renderSummaryPanel();
        saveStateToSession();
      });
    });
  }

  /* ============================================================
     TEXT/EMAIL INPUT BINDING (state <-> plain inputs)
     ============================================================ */
  const TEXT_FIELD_MAP = {
    'current-url': 'currentUrl',
    'project-notes': 'projectNotes',
    'launch-date': 'launchDate',
    'first-name': 'firstName',
    'last-name': 'lastName',
    'business-name': 'business',
    email: 'email',
    'phone-number': 'phone',
    location: 'location'
  };

  function bindTextFields() {
    Object.keys(TEXT_FIELD_MAP).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const stateKey = TEXT_FIELD_MAP[id];
      el.addEventListener('input', () => {
        state[stateKey] = el.value;
        if (stateKey === 'firstName' || stateKey === 'lastName' || stateKey === 'email') {
          clearFieldError(id);
        }
        saveStateDebounced();
        if (stateKey === 'firstName' || stateKey === 'lastName' || stateKey === 'email' || stateKey === 'business') {
          renderSummaryPanel();
        }
      });
    });
  }

  /* ============================================================
     VALIDATION
     ============================================================ */
  function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`) || document.querySelector(`[data-error-for="${fieldId}"]`);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  }
  function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`) || document.querySelector(`[data-error-for="${fieldId}"]`);
    if (input) input.removeAttribute('aria-invalid');
    if (errorEl) { errorEl.textContent = ''; errorEl.hidden = true; }
  }

  function validateStep(step) {
    let firstInvalid = null;

    if (step === 1) {
      clearFieldError('services');
      if (state.services.length === 0) {
        showFieldError('services', "Pick at least one option, or 'Not sure yet' if you're still deciding.");
        firstInvalid = document.querySelector('.option-card-grid');
      }
    }

    if (step === 4) {
      ['first-name', 'last-name', 'email'].forEach(id => clearFieldError(id));
      const firstNameEl = document.getElementById('first-name');
      const lastNameEl = document.getElementById('last-name');
      const emailEl = document.getElementById('email');

      if (!firstNameEl.value.trim()) {
        showFieldError('first-name', 'Please enter your first name.');
        firstInvalid = firstInvalid || firstNameEl;
      }
      if (!lastNameEl.value.trim()) {
        showFieldError('last-name', 'Please enter your last name.');
        firstInvalid = firstInvalid || lastNameEl;
      }
      if (!emailEl.value.trim() || !emailEl.checkValidity()) {
        showFieldError('email', 'Please enter a valid email address.');
        firstInvalid = firstInvalid || emailEl;
      }
    }

    return { valid: !firstInvalid, firstInvalidEl: firstInvalid };
  }

  /* ============================================================
     STEP NAVIGATION
     ============================================================ */
  const quoteForm = document.getElementById('quote-form');
  const backBtn = document.querySelector('.wizard-back');
  const nextBtn = document.querySelector('.wizard-next');
  const submitBtn = document.querySelector('.wizard-submit');
  const progressFill = document.getElementById('wizard-progress-fill');
  const progressBarFill = document.getElementById('wizard-progress-bar-fill');
  const progressCurrentEl = document.querySelector('[data-progress-current]');
  const progressNameEl = document.querySelector('[data-progress-name]');
  const progressSteps = Array.from(document.querySelectorAll('.wizard-progress-step'));

  function updateProgressUI(step) {
    const pct = ((step - 1) / 4) * 100;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressBarFill) progressBarFill.style.width = `${(step / 5) * 100}%`;
    if (progressCurrentEl) progressCurrentEl.textContent = String(step);
    if (progressNameEl) progressNameEl.textContent = STEP_NAMES[step - 1];
    progressSteps.forEach(li => {
      const liStep = Number(li.dataset.step);
      li.classList.toggle('is-current', liStep === step);
      li.classList.toggle('is-complete', liStep < step);
    });
  }

  function updateControlsUI(step) {
    if (backBtn) backBtn.hidden = step === 1;
    if (nextBtn) nextBtn.hidden = step === 5;
    if (submitBtn) submitBtn.hidden = step !== 5;
  }

  function focusFirstFieldOfStep(step) {
    const fieldset = document.querySelector(`.wizard-step[data-step="${step}"]`);
    if (!fieldset) return;
    const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
    fieldset.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  }

  function goToStep(targetStep, opts = {}) {
    targetStep = Math.max(1, Math.min(5, targetStep));
    const currentStep = state.step;
    const isForward = targetStep > currentStep;

    if (isForward && !opts.isRestore) {
      const result = validateStep(currentStep);
      if (!result.valid) {
        if (result.firstInvalidEl) {
          result.firstInvalidEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
          if (typeof result.firstInvalidEl.focus === 'function') result.firstInvalidEl.focus();
        }
        return;
      }
    }

    const currentEl = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
    const targetEl = document.querySelector(`.wizard-step[data-step="${targetStep}"]`);
    if (!targetEl) return;

    const direction = isForward ? 'forward' : 'back';

    const finishSwap = () => {
      if (currentEl && currentEl !== targetEl) {
        currentEl.classList.remove('is-active', 'is-transitioning', 'is-leaving-forward', 'is-leaving-back');
        currentEl.hidden = true;
        currentEl.setAttribute('aria-hidden', 'true');
      }
      targetEl.hidden = false;
      targetEl.setAttribute('aria-hidden', 'false');
      targetEl.classList.add('is-active');

      state.step = targetStep;
      updateProgressUI(targetStep);
      updateControlsUI(targetStep);
      hydrateStepFromState(targetStep);

      if (targetStep === 5) renderReviewStep();

      if (state._returnToReview && targetStep !== 5 && !opts.fromReview) {
        // no-op: flag only cleared once user completes the edited step and returns
      }

      if (!opts.isRestore) focusFirstFieldOfStep(targetStep);
      saveStateToSession();

      if (opts.isRestore) return;

      requestAnimationFrame(() => {
        targetEl.classList.add('is-transitioning');
        targetEl.classList.remove(direction === 'forward' ? 'is-entering-forward' : 'is-entering-back');
      });
    };

    if (opts.isRestore || prefersReducedMotion || !currentEl || currentEl === targetEl) {
      finishSwap();
      return;
    }

    currentEl.classList.add('is-transitioning', direction === 'forward' ? 'is-leaving-forward' : 'is-leaving-back');
    targetEl.classList.add(direction === 'forward' ? 'is-entering-forward' : 'is-entering-back');
    targetEl.hidden = false;

    let done = false;
    const onEnd = () => {
      if (done) return;
      done = true;
      currentEl.removeEventListener('transitionend', onEnd);
      finishSwap();
    };
    currentEl.addEventListener('transitionend', onEnd);
    setTimeout(onEnd, 450); // fallback in case transitionend doesn't fire
  }

  function bindNav() {
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (state._returnToReview && state.step < 5) {
          // Will land back on review once this step's Next is pressed again after edit.
        }
        const wasEditing = state._returnToReview;
        const next = wasEditing ? 5 : state.step + 1;
        const result = validateStep(state.step);
        if (!result.valid) {
          if (result.firstInvalidEl) {
            result.firstInvalidEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
            if (typeof result.firstInvalidEl.focus === 'function') result.firstInvalidEl.focus();
          }
          return;
        }
        if (wasEditing) state._returnToReview = false;
        goToStep(next, { fromReview: wasEditing });
      });
    }
    if (backBtn) {
      backBtn.addEventListener('click', () => goToStep(state.step - 1));
    }
  }

  /* ============================================================
     REHYDRATION (state -> controls), used on Back nav + restore
     ============================================================ */
  function hydrateStepFromState(step) {
    if (step === 1) {
      document.querySelectorAll('.option-card-input[type="checkbox"]').forEach(input => {
        const checked = state.services.includes(input.value);
        input.checked = checked;
        input.closest('.option-card').classList.toggle('is-selected', checked);
      });
    }
    if (step === 2) {
      document.querySelectorAll('.pill-toggle-btn[data-toggle="hasWebsite"]').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.value === state.hasWebsite));
      });
      setRevealOpen('current-url', state.hasWebsite === 'yes', true);
      const urlEl = document.getElementById('current-url');
      if (urlEl) urlEl.value = state.currentUrl || '';

      document.querySelectorAll('.chip-select-item[data-chip="features"]').forEach(btn => {
        btn.setAttribute('aria-pressed', String(state.features.includes(btn.dataset.value)));
      });
      document.querySelectorAll('#pages-pills .pill-toggle-btn').forEach(btn => {
        btn.setAttribute('aria-checked', String(btn.dataset.value === state.pageCount));
      });
      const notesEl = document.getElementById('project-notes');
      if (notesEl) notesEl.value = state.projectNotes || '';
    }
    if (step === 3) {
      document.querySelectorAll('#budget-cards .option-card-input').forEach(input => {
        const checked = input.value === state.budgetBand;
        input.checked = checked;
        input.closest('.option-card').classList.toggle('is-selected', checked);
      });
      document.querySelectorAll('#timeline-pills .pill-toggle-btn').forEach(btn => {
        btn.setAttribute('aria-checked', String(btn.dataset.value === state.timeline));
      });
      document.querySelectorAll('.pill-toggle-btn[data-toggle="hasLaunchDate"]').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.value === state.hasLaunchDate));
      });
      setRevealOpen('launch-date', state.hasLaunchDate === 'yes', true);
      const dateEl = document.getElementById('launch-date');
      if (dateEl) dateEl.value = state.launchDate || '';
    }
    if (step === 4) {
      const map = { 'first-name': 'firstName', 'last-name': 'lastName', 'business-name': 'business', email: 'email', 'phone-number': 'phone', location: 'location' };
      Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = state[map[id]] || '';
      });
      document.querySelectorAll('#preferred-contact-pills .pill-toggle-btn').forEach(btn => {
        btn.setAttribute('aria-checked', String(btn.dataset.value === state.preferredContact));
      });
      document.querySelectorAll('#hear-about-pills .pill-toggle-btn').forEach(btn => {
        btn.setAttribute('aria-checked', String(btn.dataset.value === state.hearAbout));
      });
    }
  }

  /* ============================================================
     REVIEW STEP
     ============================================================ */
  function labelFor(list, id) {
    const item = (list || []).find(i => i.id === id);
    return item ? item.label : null;
  }

  function reviewRow(label, value, emptyText) {
    const display = value && String(value).trim() ? value : (emptyText || 'Not selected yet');
    return `<div class="wizard-review-row"><dt>${label}</dt><dd${value ? '' : ' class="is-empty"'}>${display}</dd></div>`;
  }

  function renderReviewStep() {
    const el = document.getElementById('wizard-review-content');
    if (!el) return;

    const serviceLabels = state.services.map(id => labelFor(config.services, id)).filter(Boolean).join(', ');
    const featureLabels = state.features.map(id => labelFor(config.features, id)).filter(Boolean).join(', ');
    const pageLabel = labelFor(config.pageCounts, state.pageCount);
    const budgetItem = (config.budgetBands || []).find(b => b.id === state.budgetBand);
    const budgetLabel = budgetItem ? `${budgetItem.label}${budgetItem.range ? ' — ' + budgetItem.range : ''}` : null;
    const timelineLabel = labelFor(config.timelines, state.timeline);
    const contactLabel = labelFor(config.preferredContact, state.preferredContact);
    const hearLabel = labelFor(config.hearAbout, state.hearAbout);
    const fullName = [state.firstName, state.lastName].filter(Boolean).join(' ');

    el.innerHTML = `
      <div class="wizard-review-group">
        <div class="wizard-review-group-head">
          <p class="laara-label">Project</p>
          <button type="button" class="wizard-review-edit" data-edit-step="1">Edit</button>
        </div>
        ${reviewRow('Services', serviceLabels)}
      </div>
      <div class="wizard-review-group">
        <div class="wizard-review-group-head">
          <p class="laara-label">Requirements</p>
          <button type="button" class="wizard-review-edit" data-edit-step="2">Edit</button>
        </div>
        ${reviewRow('Existing website', state.hasWebsite === 'yes' ? (state.currentUrl || 'Yes') : (state.hasWebsite === 'no' ? 'No' : ''))}
        ${reviewRow('Features', featureLabels)}
        ${reviewRow('Pages', pageLabel)}
        ${reviewRow('Notes', state.projectNotes, 'Not provided')}
      </div>
      <div class="wizard-review-group">
        <div class="wizard-review-group-head">
          <p class="laara-label">Budget &amp; Timeline</p>
          <button type="button" class="wizard-review-edit" data-edit-step="3">Edit</button>
        </div>
        ${reviewRow('Budget', budgetLabel)}
        ${reviewRow('Timeline', timelineLabel)}
        ${reviewRow('Launch date', state.hasLaunchDate === 'yes' ? state.launchDate : '', 'Not provided')}
      </div>
      <div class="wizard-review-group">
        <div class="wizard-review-group-head">
          <p class="laara-label">Contact</p>
          <button type="button" class="wizard-review-edit" data-edit-step="4">Edit</button>
        </div>
        ${reviewRow('Name', fullName)}
        ${reviewRow('Business', state.business, 'Not provided')}
        ${reviewRow('Email', state.email)}
        ${reviewRow('Phone', state.phone, 'Not provided')}
        ${reviewRow('Preferred contact', contactLabel)}
        ${reviewRow('Location', state.location, 'Not provided')}
        ${reviewRow('Heard about us via', hearLabel)}
      </div>
    `;
  }

  function bindReviewEdit() {
    const el = document.getElementById('wizard-review-content');
    if (!el) return;
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('.wizard-review-edit');
      if (!btn) return;
      state._returnToReview = true;
      goToStep(Number(btn.dataset.editStep));
    });
  }

  /* ============================================================
     SUMMARY PANEL (sticky, desktop)
     ============================================================ */
  function renderSummaryPanel() {
    const body = document.getElementById('wizard-summary-body');
    if (!body) return;
    const serviceLabels = state.services.map(id => labelFor(config.services, id)).filter(Boolean).join(', ');
    const budgetItem = (config.budgetBands || []).find(b => b.id === state.budgetBand);
    const fullName = [state.firstName, state.lastName].filter(Boolean).join(' ');

    body.innerHTML = [
      reviewRow('Services', serviceLabels),
      reviewRow('Features', `${state.features.length || ''}${state.features.length ? ' selected' : ''}`),
      reviewRow('Budget', budgetItem ? budgetItem.label : ''),
      reviewRow('Timeline', labelFor(config.timelines, state.timeline)),
      reviewRow('Contact', fullName)
    ].join('').replace(/class="wizard-review-row"/g, 'class="wizard-summary-row"');
  }

  /* ============================================================
     WEB3FORMS SUBMISSION
     ============================================================ */
  function composeSummaryMessage() {
    const lines = [
      `Services: ${state.services.map(id => labelFor(config.services, id)).join(', ') || 'Not specified'}`,
      `Existing website: ${state.hasWebsite === 'yes' ? (state.currentUrl || 'Yes') : (state.hasWebsite === 'no' ? 'No' : 'Not specified')}`,
      `Features: ${state.features.map(id => labelFor(config.features, id)).join(', ') || 'Not specified'}`,
      `Pages: ${labelFor(config.pageCounts, state.pageCount) || 'Not specified'}`,
      `Project notes: ${state.projectNotes || 'Not specified'}`,
      `Budget: ${(() => { const b = config.budgetBands.find(x => x.id === state.budgetBand); return b ? `${b.label} (${b.range || b.desc})` : 'Not specified'; })()}`,
      `Timeline: ${labelFor(config.timelines, state.timeline) || 'Not specified'}`,
      `Launch date: ${state.hasLaunchDate === 'yes' ? (state.launchDate || 'Not specified') : 'Not specified'}`,
      `Preferred contact: ${labelFor(config.preferredContact, state.preferredContact) || 'Not specified'}`,
      `Location: ${state.location || 'Not specified'}`,
      `Heard about us via: ${labelFor(config.hearAbout, state.hearAbout) || 'Not specified'}`
    ];
    return lines.join('\n');
  }

  function buildQuotePayload() {
    return {
      access_key: quoteForm.querySelector('[name="access_key"]').value,
      subject: quoteForm.querySelector('[name="subject"]').value,
      botcheck: '',
      lead_type: 'Quote Request',
      from_name: [state.firstName, state.lastName].filter(Boolean).join(' '),
      name: [state.firstName, state.lastName].filter(Boolean).join(' '),
      business: state.business,
      email: state.email,
      phone: state.phone,
      preferred_contact: state.preferredContact || '',
      services: state.services.join(', '),
      has_existing_website: state.hasWebsite || '',
      current_url: state.currentUrl,
      features: state.features.join(', '),
      page_count: state.pageCount || '',
      project_notes: state.projectNotes,
      budget_band: state.budgetBand || '',
      timeline: state.timeline || '',
      launch_date: state.hasLaunchDate === 'yes' ? state.launchDate : 'Not specified',
      location: state.location,
      hear_about: state.hearAbout || '',
      message: composeSummaryMessage()
    };
  }

  async function submitToWeb3Forms(payload, form) {
    const statusEl = form.querySelector('.form-status');
    const activeSubmitBtn = form.querySelector('[type="submit"]');
    if (activeSubmitBtn) { activeSubmitBtn.disabled = true; activeSubmitBtn.setAttribute('aria-disabled', 'true'); }
    if (statusEl) { statusEl.textContent = 'Sending…'; statusEl.removeAttribute('data-state'); }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Something went wrong');
      return true;
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "Sorry, that didn't send. Please call or WhatsApp us instead.";
        statusEl.dataset.state = 'error';
      }
      return false;
    } finally {
      if (activeSubmitBtn) { activeSubmitBtn.disabled = false; activeSubmitBtn.removeAttribute('aria-disabled'); }
    }
  }

  function bindQuoteSubmit() {
    if (!quoteForm) return;
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = validateStep(4);
      if (!result.valid) {
        goToStep(4);
        return;
      }
      const ok = await submitToWeb3Forms(buildQuotePayload(), quoteForm);
      if (ok) {
        sessionStorage.removeItem(STORAGE_KEY);
        window.location.href = '/thank-you.html?type=quote&name=' + encodeURIComponent(state.firstName || '');
      }
    });
  }

  function bindEnquirySubmit() {
    const form = document.getElementById('enquiry-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      const nameEl = document.getElementById('enq-name');
      const emailEl = document.getElementById('enq-email');
      const messageEl = document.getElementById('enq-message');
      ['enq-name', 'enq-email', 'enq-message'].forEach(clearFieldError);

      if (!nameEl.value.trim()) { showFieldError('enq-name', 'Please enter your name.'); valid = false; }
      if (!emailEl.value.trim() || !emailEl.checkValidity()) { showFieldError('enq-email', 'Please enter a valid email address.'); valid = false; }
      if (!messageEl.value.trim()) { showFieldError('enq-message', 'Please add a short message.'); valid = false; }
      if (!valid) return;

      const payload = Object.assign(
        { lead_type: 'General Enquiry' },
        Object.fromEntries(new FormData(form))
      );
      const ok = await submitToWeb3Forms(payload, form);
      if (ok) {
        const firstName = nameEl.value.trim().split(' ')[0];
        window.location.href = '/thank-you.html?type=enquiry&name=' + encodeURIComponent(firstName || '');
      }
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function initWizard() {
    renderChips();
    renderPillGroup('pages-pills', config.pageCounts, 'pageCount');
    renderPillGroup('timeline-pills', config.timelines, 'timeline');
    renderPillGroup('preferred-contact-pills', config.preferredContact, 'preferredContact');
    renderPillGroup('hear-about-pills', config.hearAbout, 'hearAbout');
    renderBudgetCards();

    bindModeSwitch();
    bindOptionCardCheckboxes();
    bindChips();
    bindRadioPillGroups();
    bindBudgetCards();
    bindYesNoToggles();
    bindTextFields();
    bindNav();
    bindReviewEdit();
    bindQuoteSubmit();
    bindEnquirySubmit();

    const restored = restoreStateFromSession();
    setMode(state.mode);

    /* Pricing-page package CTAs link here as /contact.html?package=<id>,
       using the same lowercase ids as config.budgetBands. An explicit
       fresh click always wins over a stale sessionStorage value, so this
       runs after restoreStateFromSession(), not before it. */
    const requestedPackage = new URLSearchParams(location.search).get('package');
    if (requestedPackage && (config.budgetBands || []).some((b) => b.id === requestedPackage)) {
      state.budgetBand = requestedPackage;
      // care-only enquiries want ongoing support, not a new build — push the
      // matching service so the submission doesn't misrepresent intent.
      const impliedService = requestedPackage === 'care-only' ? 'care' : 'website';
      if (!state.services.includes(impliedService)) state.services.push(impliedService);
      // Step 3 (Budget) may be past startStep on a fresh visit — hydrate it
      // explicitly so the matching card is already checked when the visitor
      // reaches it, not just held in state.
      hydrateStepFromState(3);
    }

    const startStep = restored ? state.step : 1;
    state.step = 1; // goToStep computes direction from current state.step
    goToStep(startStep, { isRestore: true });
    for (let s = 1; s <= startStep; s += 1) hydrateStepFromState(s);
    renderSummaryPanel();

    requestAnimationFrame(() => {
      const activeModeBtn = modeButtons.find(b => b.classList.contains('is-active'));
      if (activeModeBtn) moveIndicatorTo(activeModeBtn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWizard);
  } else {
    initWizard();
  }
})();
