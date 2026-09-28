/* Book-a-call widget (book-a-call.html).
   Reads free slots from the Laara Booking API (Google Apps Script), lets the
   visitor pick a day + time, collects their details and books the call. The
   API creates the Google Calendar event with a Meet link and Google emails the
   invite. Settings: booking-config.js. Backend + setup: booking-backend/.

   Local testing against the mock API (scripts/_booking_mock.mjs):
   http://localhost:3000/book-a-call.html?api=http://localhost:3001
   The ?api override is honoured on localhost only. */
(() => {
  const root = document.querySelector('[data-booking]');
  if (!root) return;

  const config = window.LaaraBookingConfig || {};
  const msg = config.messages || {};
  const TZ = config.timeZone || 'Europe/London';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  const apiUrl = (isLocal && new URLSearchParams(location.search).get('api')) || config.apiUrl || '';
  // Cloudflare's documented always-pass test key: local runs never need the real one.
  const siteKey = isLocal ? '1x00000000000000000000AA' : (config.turnstileSiteKey || '');
  const visitorTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || TZ; } catch (e) { return TZ; } })();

  const $ = (sel) => root.querySelector(sel);
  const form = $('#booking-form');
  const steps = { 1: $('.wizard-step[data-step="1"]'), 2: $('.wizard-step[data-step="2"]') };
  const monthLabel = $('#booking-cal-month');
  const weekdaysEl = $('#booking-cal-weekdays');
  const grid = $('#booking-cal-grid');
  const timesWrap = $('#booking-times');
  const timesTitle = $('#booking-times-title');
  const timesList = $('#booking-times-list');
  const tzNote = $('#booking-tz-note');
  const calStatus = $('#booking-cal-status');
  const continueBtn = $('#booking-continue');
  const unavailable = $('#booking-unavailable');
  const unavailableText = $('#booking-unavailable-text');
  const pickArea = $('.booking-pick');
  const summaryWhen = $('#booking-summary-when');
  const submitBtn = $('#booking-submit');
  const formStatus = $('#booking-form-status');
  const turnstileEl = $('#booking-turnstile');

  const state = {
    step: 1,
    days: [],            // [{ date:'YYYY-MM-DD', times:[{ start, end, time:'HH:MM' }] }]
    byDate: {},
    columns: [1, 2, 3, 4, 5, 6, 0], // weekday numbers shown, Monday first
    date: null,
    slot: null,
    callType: 'video',
    turnstileId: null,
    token: ''
  };

  /* ---------- date helpers (everything is shown in UK time) ---------- */
  const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const pad = (n) => String(n).padStart(2, '0');
  const keyOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const partsOfKey = (key) => { const [y, m, d] = key.split('-').map(Number); return { y, m, d }; };
  // A calendar date formatted on its own (noon UTC keeps it on the right day).
  const formatKey = (key, opts) => new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'UTC' }, opts)).format(new Date(`${key}T12:00:00Z`));
  const dowOfKey = (key) => new Date(`${key}T12:00:00Z`).getUTCDay();

  function zonedParts(iso, tz) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return { key: `${p.year}-${p.month}-${p.day}`, hh: Number(p.hour), mm: Number(p.minute) };
  }
  // "9:30am", "10am", "2:30pm" — the site's own style (contact page: "9am–6pm").
  function clock(hh, mm) {
    const suffix = hh >= 12 ? 'pm' : 'am';
    const h = hh % 12 || 12;
    return mm ? `${h}:${pad(mm)}${suffix}` : `${h}${suffix}`;
  }
  const ukClock = (iso) => { const p = zonedParts(iso, TZ); return clock(p.hh, p.mm); };
  function localClock(iso) {
    if (visitorTz === TZ) return '';
    const uk = zonedParts(iso, TZ);
    const local = zonedParts(iso, visitorTz);
    if (uk.key === local.key && uk.hh === local.hh && uk.mm === local.mm) return '';
    const dayNote = local.key !== uk.key ? ` ${formatKey(local.key, { weekday: 'short' })}` : '';
    return `${clock(local.hh, local.mm)}${dayNote} your time`;
  }
  const todayKey = () => zonedParts(new Date().toISOString(), TZ).key;

  /* ---------- small UI helpers ---------- */
  function setStatus(el, text, kind) {
    if (!el) return;
    el.textContent = text || '';
    if (kind) el.dataset.state = kind; else el.removeAttribute('data-state');
  }
  const step1Controls = continueBtn.closest('.wizard-controls');
  function showUnavailable(text) {
    pickArea.hidden = true;
    step1Controls.hidden = true;
    setStatus(calStatus, '');
    unavailableText.textContent = text;
    unavailable.hidden = false;
  }

  /* ============================================================
     LOAD SLOTS
     ============================================================ */
  async function loadSlots({ keepSelection = false } = {}) {
    if (!apiUrl) { showUnavailable(msg.notConfigured); return; }
    root.classList.add('is-loading');
    setStatus(calStatus, 'Loading free times…');
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=slots`, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timer);
      const data = await res.json();
      if (!data || !data.ok || !Array.isArray(data.days)) throw new Error(data && data.error || 'bad_response');

      state.days = data.days;
      state.byDate = Object.fromEntries(data.days.map((d) => [d.date, d]));
      if (Array.isArray(data.openWeekdays) && data.openWeekdays.length) {
        state.columns = WEEKDAY_ORDER.filter((d) => data.openWeekdays.includes(d));
      }
      root.classList.remove('is-loading');

      if (!state.days.length) { showUnavailable(msg.noSlots); return; }
      unavailable.hidden = true;
      pickArea.hidden = false;
      step1Controls.hidden = false;

      if (!keepSelection || !state.byDate[state.date]) {
        state.date = state.days[0].date;
      }
      if (state.slot && !(state.byDate[state.date] || { times: [] }).times.some((t) => t.start === state.slot.start)) {
        state.slot = null;
      }
      renderWeekdays();
      renderCalendar();
      renderTimes();
      setStatus(calStatus, '');
    } catch (err) {
      root.classList.remove('is-loading');
      showUnavailable(msg.loadFailed);
    }
  }

  /* ============================================================
     CALENDAR — a rolling view, this week to the last bookable week.
     The window is only ~3 weeks, so a month grid would mostly show
     greyed-out days and hide next month's dates behind an arrow.
     ============================================================ */
  const addDays = (key, n) => {
    const p = partsOfKey(key);
    const d = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
    return keyOf(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  };
  const mondayOf = (key) => addDays(key, -((dowOfKey(key) + 6) % 7));

  function rangeLabel(fromKey, toKey) {
    const a = partsOfKey(fromKey);
    const b = partsOfKey(toKey);
    if (a.y === b.y && a.m === b.m) return formatKey(fromKey, { month: 'long', year: 'numeric' });
    if (a.y === b.y) return `${formatKey(fromKey, { month: 'long' })} – ${formatKey(toKey, { month: 'long', year: 'numeric' })}`;
    return `${formatKey(fromKey, { month: 'long', year: 'numeric' })} – ${formatKey(toKey, { month: 'long', year: 'numeric' })}`;
  }

  function renderWeekdays() {
    grid.style.setProperty('--booking-cols', state.columns.length);
    weekdaysEl.style.setProperty('--booking-cols', state.columns.length);
    weekdaysEl.innerHTML = state.columns.map((d) => {
      const key = keyOf(2026, 1, 4 + d); // 4 Jan 2026 is a Sunday
      return `<span>${formatKey(key, { weekday: 'short' })}</span>`;
    }).join('');
  }

  function renderCalendar() {
    const today = todayKey();
    const start = mondayOf(today);
    const end = addDays(mondayOf(state.days[state.days.length - 1].date), 6);
    monthLabel.textContent = rangeLabel(start, end);

    const cells = [];
    let prevMonth = null;
    for (let key = start; key <= end; key = addDays(key, 1)) {
      if (!state.columns.includes(dowOfKey(key))) continue; // always-closed weekday: no column
      const p = partsOfKey(key);
      const day = state.byDate[key];
      const n = day ? day.times.length : 0;
      const label = `${formatKey(key, { weekday: 'long', day: 'numeric', month: 'long' })}, ${n ? `${n} ${n === 1 ? 'time' : 'times'} free` : 'no times free'}`;
      // Name the month on the first cell of each month, so "1" can't be misread.
      const monthTag = prevMonth !== null && p.m !== prevMonth
        ? `<span class="booking-day-month">${formatKey(key, { month: 'short' })}</span>` : '';
      prevMonth = p.m;
      cells.push(
        `<button type="button" class="booking-day${key === today ? ' is-today' : ''}" data-date="${key}"` +
        ` aria-label="${label}" aria-pressed="${key === state.date}"${key === today ? ' aria-current="date"' : ''}` +
        `${n ? '' : ' disabled'} tabindex="-1">${monthTag}<span>${p.d}</span></button>`
      );
    }
    grid.innerHTML = cells.join('');

    // Roving tabindex: one tab stop for the whole grid, arrows move within it.
    const enabled = Array.from(grid.querySelectorAll('.booking-day:not([disabled])'));
    const current = enabled.find((b) => b.dataset.date === state.date) || enabled[0];
    if (current) current.tabIndex = 0;
  }

  function selectDate(key, { focus = false } = {}) {
    if (!state.byDate[key]) return;
    const changedDay = key !== state.date;
    state.date = key;
    if (changedDay) state.slot = null;
    renderCalendar();
    renderTimes();
    const n = state.byDate[key].times.length;
    setStatus(calStatus, `${formatKey(key, { weekday: 'long', day: 'numeric', month: 'long' })}: ${n} ${n === 1 ? 'time' : 'times'} free.`);
    if (focus) {
      const btn = grid.querySelector(`[data-date="${key}"]`);
      if (btn) btn.focus();
    }
  }

  function bindCalendar() {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.booking-day[data-date]');
      if (!btn || btn.disabled) return;
      selectDate(btn.dataset.date);
      // On a phone the times sit below the calendar — bring them into view.
      if (window.matchMedia('(max-width: 899px)').matches) {
        timesWrap.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
      }
    });
    grid.addEventListener('keydown', (e) => {
      const btn = e.target.closest('.booking-day[data-date]');
      if (!btn) return;
      const all = state.days.map((d) => d.date);
      const i = all.indexOf(btn.dataset.date);
      let target = null;
      if (e.key === 'ArrowRight') target = all[i + 1];
      else if (e.key === 'ArrowLeft') target = all[i - 1];
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        // Nearest free day about a week away.
        const base = new Date(`${btn.dataset.date}T12:00:00Z`).getTime();
        const goal = base + (e.key === 'ArrowDown' ? 7 : -7) * 86400000;
        const pool = all.filter((k) => (e.key === 'ArrowDown' ? k > btn.dataset.date : k < btn.dataset.date));
        target = pool.sort((a, b) => Math.abs(new Date(`${a}T12:00:00Z`) - goal) - Math.abs(new Date(`${b}T12:00:00Z`) - goal))[0];
      } else if (e.key === 'Home') target = all[0];
      else if (e.key === 'End') target = all[all.length - 1];
      if (!target) return;
      e.preventDefault();
      selectDate(target, { focus: true });
    });
  }

  /* ============================================================
     TIMES
     ============================================================ */
  function renderTimes() {
    const day = state.byDate[state.date];
    if (!day) { timesWrap.hidden = true; return; }
    timesWrap.hidden = false;
    timesTitle.textContent = formatKey(day.date, { weekday: 'long', day: 'numeric', month: 'long' });
    const anyLocal = day.times.some((t) => localClock(t.start));
    tzNote.textContent = anyLocal
      ? `Times are ${config.timeZoneLabel || 'UK time'}, with your local time underneath.`
      : `Times are ${config.timeZoneLabel || 'UK time'}.`;
    timesList.classList.toggle('has-local', anyLocal); // wider buttons for the second line
    timesList.innerHTML = day.times.map((t) => {
      const local = localClock(t.start);
      const checked = state.slot && state.slot.start === t.start;
      return `<button type="button" class="pill-toggle-btn booking-time" role="radio" aria-checked="${!!checked}" data-start="${t.start}">` +
        `<span class="booking-time-main">${ukClock(t.start)}</span>` +
        (local ? `<span class="booking-time-local">${local}</span>` : '') +
        '</button>';
    }).join('');
    continueBtn.disabled = !state.slot;
    continueBtn.setAttribute('aria-disabled', String(!state.slot));
  }

  function bindTimes() {
    timesList.addEventListener('click', (e) => {
      const btn = e.target.closest('.booking-time');
      if (!btn) return;
      const day = state.byDate[state.date];
      state.slot = day.times.find((t) => t.start === btn.dataset.start) || null;
      timesList.querySelectorAll('.booking-time').forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
      continueBtn.disabled = !state.slot;
      continueBtn.setAttribute('aria-disabled', String(!state.slot));
      if (state.slot) {
        setStatus(calStatus, `${slotSentence(state.slot)} selected. Press Continue.`);
      }
    });
  }

  function slotSentence(slot) {
    const key = zonedParts(slot.start, TZ).key;
    return `${formatKey(key, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at ${ukClock(slot.start)}`;
  }

  /* ============================================================
     STEPS
     ============================================================ */
  function goToStep(target) {
    const from = steps[state.step];
    const to = steps[target];
    if (!to || from === to) return;
    const forward = target > state.step;

    const finish = () => {
      from.classList.remove('is-active', 'is-transitioning', 'is-leaving-forward', 'is-leaving-back');
      from.hidden = true;
      to.hidden = false;
      to.classList.add('is-active');
      state.step = target;
      const heading = to.querySelector('[data-step-heading]');
      if (heading) heading.focus({ preventScroll: true });
      root.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      if (prefersReducedMotion) return;
      requestAnimationFrame(() => {
        to.classList.add('is-transitioning');
        to.classList.remove(forward ? 'is-entering-forward' : 'is-entering-back');
      });
    };

    if (prefersReducedMotion) { finish(); return; }
    from.classList.add('is-transitioning', forward ? 'is-leaving-forward' : 'is-leaving-back');
    to.classList.add(forward ? 'is-entering-forward' : 'is-entering-back');
    let done = false;
    const onEnd = () => { if (done) return; done = true; from.removeEventListener('transitionend', onEnd); finish(); };
    from.addEventListener('transitionend', onEnd);
    setTimeout(onEnd, 450); // same fallback as the quote wizard
  }

  function bindSteps() {
    continueBtn.addEventListener('click', () => {
      if (!state.slot) { setStatus(calStatus, 'Pick a time first.', 'error'); return; }
      summaryWhen.textContent = slotSentence(state.slot);
      setStatus(formStatus, '');
      goToStep(2);
      renderTurnstile();
    });
    root.querySelectorAll('[data-booking-change]').forEach((b) => b.addEventListener('click', () => goToStep(1)));
  }

  /* ============================================================
     CALL TYPE (video / phone) — same radio-pill pattern as the wizard
     ============================================================ */
  function bindCallType() {
    root.querySelectorAll('[data-call-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.callType = btn.dataset.callType;
        root.querySelectorAll('[data-call-type]').forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
      });
    });
  }

  /* ============================================================
     TURNSTILE — loaded only when step 2 opens, only on this page
     ============================================================ */
  let turnstilePromise = null;
  function loadTurnstile() {
    if (!siteKey) return Promise.resolve(null);
    if (turnstilePromise) return turnstilePromise;
    turnstilePromise = new Promise((resolve, reject) => {
      window.laaraTurnstileReady = () => resolve(window.turnstile);
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=laaraTurnstileReady';
      s.async = true;
      s.onerror = () => { turnstilePromise = null; reject(new Error('turnstile_load')); };
      document.head.appendChild(s);
    });
    return turnstilePromise;
  }
  function renderTurnstile() {
    loadTurnstile().then((ts) => {
      if (!ts || state.turnstileId !== null) return;
      state.turnstileId = ts.render(turnstileEl, {
        sitekey: siteKey,
        action: 'book-call',
        appearance: 'interaction-only', // invisible unless Cloudflare needs a click
        theme: 'light',
        size: 'flexible',
        callback: (token) => { state.token = token; },
        'expired-callback': () => { state.token = ''; },
        'error-callback': () => { state.token = ''; }
      });
    }).catch(() => {});
  }
  function resetTurnstile() {
    state.token = '';
    if (window.turnstile && state.turnstileId !== null) window.turnstile.reset(state.turnstileId);
  }
  async function waitForToken(ms) {
    if (!siteKey) return '';
    renderTurnstile();
    const until = Date.now() + ms;
    while (!state.token && Date.now() < until) await new Promise((r) => setTimeout(r, 250));
    return state.token;
  }

  /* ============================================================
     VALIDATION + SUBMIT
     ============================================================ */
  const FIELDS = {
    name: { el: $('#bk-name'), check: (v) => v.trim().length >= 2, error: 'Please enter your name.' },
    email: { el: $('#bk-email'), check: (v, el) => v.trim() !== '' && el.checkValidity(), error: 'Please enter a valid email address, so we can send your invite.' },
    phone: { el: $('#bk-phone'), check: (v) => /^[0-9+()\s-]+$/.test(v.trim()) && v.replace(/\D/g, '').length >= 7, error: 'Please enter a phone number we can reach you on.' }
  };

  function showFieldError(key, text) {
    const f = FIELDS[key];
    const err = $(`#${f.el.id}-error`);
    f.el.setAttribute('aria-invalid', 'true');
    if (err) { err.textContent = text; err.hidden = false; }
  }
  function clearFieldError(key) {
    const f = FIELDS[key];
    const err = $(`#${f.el.id}-error`);
    f.el.removeAttribute('aria-invalid');
    if (err) { err.textContent = ''; err.hidden = true; }
  }
  function validate() {
    let first = null;
    Object.keys(FIELDS).forEach((key) => {
      const f = FIELDS[key];
      clearFieldError(key);
      if (!f.check(f.el.value, f.el)) { showFieldError(key, f.error); first = first || f.el; }
    });
    return first;
  }

  const ERROR_TEXT = {
    invalid: msg.invalid, rate_limited: msg.rateLimited, bot_check_failed: msg.botCheck, busy: msg.busy
  };

  async function submit(e) {
    e.preventDefault();
    if (!state.slot) { goToStep(1); return; }
    const firstInvalid = validate();
    if (firstInvalid) {
      firstInvalid.focus();
      setStatus(formStatus, msg.invalid, 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-disabled', 'true');
    try {
      if (siteKey && !state.token) {
        setStatus(formStatus, msg.botCheckLoading);
        await waitForToken(10000);
        if (!state.token) { setStatus(formStatus, msg.botCheck, 'error'); return; }
      }
      setStatus(formStatus, msg.sending);

      const payload = {
        action: 'book',
        start: state.slot.start,
        name: FIELDS.name.el.value.trim(),
        email: FIELDS.email.el.value.trim(),
        phone: FIELDS.phone.el.value.trim(),
        business: $('#bk-business').value.trim(),
        website: $('#bk-website').value.trim(),
        notes: $('#bk-notes').value.trim(),
        callType: state.callType,
        turnstileToken: state.token,
        botcheck: form.querySelector('[name="botcheck"]').checked ? 'on' : ''
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      // text/plain keeps this a "simple" request: no CORS preflight, which
      // Apps Script web apps can't answer.
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);
      const result = await res.json();

      if (result && result.ok) {
        const firstName = payload.name.split(/\s+/)[0] || '';
        const url = `${config.thankYouUrl || '/thank-you.html'}?type=call&name=${encodeURIComponent(firstName)}` +
          `&start=${encodeURIComponent(result.start || state.slot.start)}&via=${encodeURIComponent(state.callType)}`;
        window.location.href = url;
        return;
      }

      const code = result && result.error;
      resetTurnstile(); // tokens are single-use
      if (code === 'slot_taken') {
        await loadSlots({ keepSelection: true });
        goToStep(1);
        setStatus(calStatus, msg.slotTaken, 'error');
        return;
      }
      if (code === 'invalid' && Array.isArray(result.fields)) {
        result.fields.forEach((f) => { if (FIELDS[f]) showFieldError(f, FIELDS[f].error); });
      }
      setStatus(formStatus, ERROR_TEXT[code] || msg.failed, 'error');
    } catch (err) {
      resetTurnstile();
      setStatus(formStatus, msg.failed, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-disabled');
    }
  }

  function bindForm() {
    Object.keys(FIELDS).forEach((key) => {
      FIELDS[key].el.addEventListener('input', () => clearFieldError(key));
    });
    form.addEventListener('submit', submit);
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    bindCalendar();
    bindTimes();
    bindSteps();
    bindCallType();
    bindForm();
    loadSlots();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
