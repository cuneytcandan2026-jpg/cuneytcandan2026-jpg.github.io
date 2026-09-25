/* Book-a-call page settings — the one file to edit per site.
   Wording on the page itself lives in book-a-call.html; the messages below are
   the ones booking.js shows in response to the booking API.
   Setup, redeploys and the client-kit checklist: booking-backend/SETUP.md. */
window.LaaraBookingConfig = {
  // The "Laara Booking API" Apps Script web-app URL (ends in /exec).
  // Empty = the page shows the call/WhatsApp/email fallback instead of a calendar.
  apiUrl: '',

  // Cloudflare Turnstile SITE key (public — the secret lives in Apps Script).
  // On localhost booking.js swaps in Cloudflare's always-pass test key.
  turnstileSiteKey: '',

  timeZone: 'Europe/London',
  timeZoneLabel: 'UK time',
  slotMinutes: 20,
  thankYouUrl: '/thank-you.html',

  messages: {
    loadFailed: 'Sorry, we couldn’t load the calendar just now. You can still book by phone, WhatsApp or email.',
    notConfigured: 'Online booking is being set up. In the meantime, book a call by phone, WhatsApp or email.',
    noSlots: 'There are no free times in the next three weeks. Get in touch and we’ll find a time that works.',
    slotTaken: 'Sorry, that time was just taken. Please pick another.',
    rateLimited: 'You’ve already booked a call. To change it, reply to your invite email or WhatsApp us.',
    botCheck: 'We couldn’t confirm you’re a real person. Please try again.',
    botCheckLoading: 'Just checking you’re a real person…',
    invalid: 'Please check the highlighted details and try again.',
    busy: 'Lots of people are booking right now. Please try again in a moment.',
    failed: 'Sorry, that didn’t go through. Please try again, or call or WhatsApp us instead.',
    sending: 'Booking your call… this takes a few seconds.'
  }
};
