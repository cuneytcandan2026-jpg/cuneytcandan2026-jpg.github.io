/* Laara Digital — cookie consent + GA4 loader (Basic Consent Mode v2)
   ------------------------------------------------------------------
   Google Analytics 4 (gtag.js, G-STHQ8M923Z) is NOT loaded until the
   visitor clicks "Accept" in the banner. Until then nothing is sent to
   Google and no `_ga` cookies are set. This is the "basic" flavour of
   Consent Mode — the tag is withheld entirely rather than sending
   cookieless pings — which matches the privacy posture of the rest of
   the site and the UK PECR requirement for prior opt-in to non-essential
   analytics.

     - The choice is stored in localStorage under 'laara-consent'
       ('granted' | 'denied'). Returning visitors are not re-prompted.
     - window.LaaraConsent.open() re-shows the banner so a visitor can
       change their mind — wired to the "Cookie settings" button in
       every footer ([data-consent-open]).
     - Only `analytics_storage` is ever granted. Ad-related signals stay
       denied; turning those on is a deliberate future change that needs
       its own privacy-policy update.
     - No JS => no banner, no tag, no cookies. That is the correct
       no-consent state, so there is nothing to degrade.

   User-facing notice: privacy.html, "Cookies and tracking".
*/
(function () {
  'use strict';

  var GA_ID = 'G-STHQ8M923Z';
  var STORAGE_KEY = 'laara-consent';
  var GRANTED = 'granted';
  var DENIED = 'denied';

  /* ---- Consent Mode plumbing: dataLayer + gtag shim, defaults denied ---- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tagLoaded = false;
  var banner = null;
  var lastFocus = null;

  function readChoice() {
    try { return window.localStorage.getItem(STORAGE_KEY); }
    catch (e) { return null; }
  }
  function saveChoice(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  function loadGa() {
    if (tagLoaded) return;
    tagLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function grant() {
    saveChoice(GRANTED);
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadGa();
  }

  function deny() {
    saveChoice(DENIED);
    gtag('consent', 'update', { analytics_storage: 'denied' });
  }

  function buildBanner() {
    var el = document.createElement('section');
    el.className = 'consent-banner';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML =
      '<div class="consent-banner-inner">' +
        '<p class="consent-banner-text">' +
          'We’d like to use Google Analytics to see how visitors use this site. ' +
          'It only sets cookies if you accept. Read our ' +
          '<a href="/privacy.html">privacy policy</a>.' +
        '</p>' +
        '<div class="consent-banner-actions">' +
          '<button type="button" class="laara-btn laara-btn--primary" data-consent-accept>Accept</button>' +
          '<button type="button" class="laara-btn laara-btn--secondary" data-consent-reject>Reject</button>' +
        '</div>' +
      '</div>';
    el.querySelector('[data-consent-accept]').addEventListener('click', function () {
      grant();
      close();
    });
    el.querySelector('[data-consent-reject]').addEventListener('click', function () {
      deny();
      close();
    });
    return el;
  }

  function show() {
    if (banner) return;
    banner = buildBanner();
    document.body.appendChild(banner);
    /* Two frames so the entry transition has a start state to move from. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (banner) banner.setAttribute('data-visible', '');
      });
    });
  }

  function close() {
    if (!banner) return;
    var node = banner;
    banner = null;
    node.removeAttribute('data-visible');

    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
    lastFocus = null;

    if (reduceMotion) {
      node.remove();
      return;
    }
    var removed = false;
    var finish = function () {
      if (removed) return;
      removed = true;
      node.remove();
    };
    node.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 600); /* fallback if transitionend never fires */
  }

  window.LaaraConsent = {
    open: function () {
      lastFocus = document.activeElement;
      show();
      var btn = banner && banner.querySelector('[data-consent-accept]');
      if (btn) {
        requestAnimationFrame(function () { btn.focus(); });
      }
    },
    accept: function () { grant(); close(); },
    reject: function () { deny(); close(); },
    status: readChoice
  };

  function wireTriggers() {
    var triggers = document.querySelectorAll('[data-consent-open]');
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function () {
        window.LaaraConsent.open();
      });
    }
  }

  function boot() {
    wireTriggers();
    var choice = readChoice();
    if (choice === GRANTED) {
      gtag('consent', 'update', { analytics_storage: 'granted' });
      loadGa();
    } else if (choice !== DENIED) {
      show();
    }
  }

  /* This file loads with `defer`, so the parser has finished and document.body
     exists — but keep the guard for safety if it is ever moved into <head>. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
