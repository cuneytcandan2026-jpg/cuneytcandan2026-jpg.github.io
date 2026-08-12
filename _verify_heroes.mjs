import puppeteer from 'puppeteer-core';
import fs from 'fs';

const pages = [
  { url: '/services/website-design.html', slug: 'services-website-design' },
  { url: '/services/local-seo.html', slug: 'services-local-seo' },
  { url: '/services/booking-systems.html', slug: 'services-booking-systems' },
  { url: '/services/care-plans.html', slug: 'services-care-plans' },
  { url: '/services/growth-ads.html', slug: 'services-growth-ads' },
  { url: '/work.html', slug: 'work' },
  { url: '/pricing.html', slug: 'pricing' },
  { url: '/about.html', slug: 'about' },
  { url: '/contact.html', slug: 'contact' },
];

fs.mkdirSync('temporary-screenshots', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

for (const { url, slug } of pages) {
  for (const mobile of [false, true]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
    const vw = mobile ? 390 : 1440;
    const vh = mobile ? 700 : 800;
    await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000' + url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 400));

    // sweep the mouse across the hero to trigger a visible reveal
    await page.evaluate(async () => {
      const canvas = document.querySelector('.hero-fluid');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const midY = rect.top + rect.height * 0.6;
      function fire(type, x, y) {
        canvas.dispatchEvent(new PointerEvent(type, { pointerType: 'mouse', clientX: x, clientY: y, bubbles: true, cancelable: true }));
      }
      fire('pointerenter', rect.left + 10, midY);
      for (let i = 0; i <= 15; i++) {
        fire('pointermove', rect.left + 10 + i * (rect.width - 20) / 15, midY + Math.sin(i * 0.6) * 20);
        await new Promise(r => setTimeout(r, 35));
      }
    });
    await new Promise(r => setTimeout(r, 250));

    const heroBox = await page.evaluate(() => {
      const el = document.querySelector('.page-hero, .hero');
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const label = slug + (mobile ? '-mobile' : '-desktop');
    await page.screenshot({ path: `temporary-screenshots/_verify_${label}.png`, clip: heroBox });

    if (errors.length) {
      console.log(`[${label}] ERRORS:`, errors.join(' | '));
    } else {
      console.log(`[${label}] clean`);
    }
    await page.close();
  }
}

await browser.close();
console.log('done');
