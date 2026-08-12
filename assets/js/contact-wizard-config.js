/*
  Single edit point for quote-wizard wording and price bands.
  Figures must trace back to docs/pricing.md — don't invent numbers here.
*/
window.LaaraWizardConfig = {
  services: [
    {
      id: 'website',
      label: 'Website Design & Build',
      desc: 'A new site or a full rebuild, from £797',
      icon: 'globe'
    },
    {
      id: 'seo',
      label: 'Local SEO & Google Visibility',
      desc: 'Get found by customers searching nearby',
      icon: 'pin'
    },
    {
      id: 'booking',
      label: 'Booking & Enquiry Systems',
      desc: 'Let customers book or enquire online',
      icon: 'calendar'
    },
    {
      id: 'care',
      label: 'Ongoing Care & Support',
      desc: 'Hosting, updates and monthly SEO, from £97/month',
      icon: 'shield'
    },
    {
      id: 'growth',
      label: 'Growth & Paid Ads',
      desc: 'Google & Meta ads managed for you',
      icon: 'trend'
    },
    {
      id: 'not-sure',
      label: 'Not sure yet',
      desc: 'Tell us what’s going on and we’ll point you the right way',
      icon: 'question',
      muted: true
    }
  ],

  features: [
    { id: 'contact-forms', label: 'Contact Forms' },
    { id: 'online-booking', label: 'Online Booking' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'payments', label: 'Payments' },
    { id: 'blog', label: 'Blog / News' },
    { id: 'cms', label: 'CMS' },
    { id: 'galleries', label: 'Galleries / Portfolio' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'maps', label: 'Maps / Location' },
    { id: 'social', label: 'Social Integration' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'seo', label: 'SEO' },
    { id: 'animations', label: 'Advanced Animations' },
    { id: 'ai-chatbot', label: 'AI / Chatbot' },
    { id: 'not-sure', label: 'Not Sure Yet' }
  ],

  pageCounts: [
    { id: '1-3', label: '1–3' },
    { id: '4-6', label: '4–6' },
    { id: '7-10', label: '7–10' },
    { id: '10-plus', label: '10+' },
    { id: 'not-sure', label: 'Not sure' }
  ],

  budgetBands: [
    { id: 'essential', label: 'Essential', range: 'From £797', desc: 'A focused, fixed-price site' },
    { id: 'professional', label: 'Professional', range: 'From £1,497', desc: 'Our most popular package' },
    { id: 'growth', label: 'Growth', range: 'From £2,497', desc: 'Full-scope builds' },
    { id: 'care-only', label: 'Care plan only', range: '£97–£497/month', desc: 'Ongoing support, no new build' },
    { id: 'not-sure', label: 'Not sure yet', range: '', desc: 'We’ll help you find the right fit' }
  ],

  timelines: [
    { id: 'asap', label: 'ASAP' },
    { id: '2-4-weeks', label: 'Within 2–4 weeks' },
    { id: '1-2-months', label: '1–2 months' },
    { id: '2-3-months', label: '2–3 months' },
    { id: 'exploring', label: 'Just exploring' }
  ],

  preferredContact: [
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'whatsapp', label: 'WhatsApp' }
  ],

  hearAbout: [
    { id: 'google', label: 'Google' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'referral', label: 'Referral' },
    { id: 'existing-client', label: 'Existing Client' },
    { id: 'other', label: 'Other' }
  ]
};
