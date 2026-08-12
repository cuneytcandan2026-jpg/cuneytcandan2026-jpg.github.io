import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const widths = [1440, 1280, 1024, 768, 480, 320];
const pages = ['/', '/about.html', '/pricing.html', '/work.html', '/contact.html'];

for (const path of pages) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle0', timeout: 30000 });

  for (const width of widths) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await new Promise((r) => setTimeout(r, 150));
    const overflow = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      let culprit = null;
      if (docWidth > winWidth) {
        let worst = null;
        let worstRight = winWidth;
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > worstRight + 1) { worstRight = r.right; worst = el; }
        });
        culprit = worst ? `${worst.tagName}.${[...worst.classList].join('.')}` : null;
      }
      return { docWidth, winWidth, overflowing: docWidth > winWidth, culprit };
    });
    if (overflow.overflowing) {
      console.log(`OVERFLOW ${path} @${width}px: doc=${overflow.docWidth} win=${overflow.winWidth} culprit=${overflow.culprit}`);
    }
  }
  if (consoleErrors.length) console.log(`CONSOLE ERRORS ${path}:`, consoleErrors);
  if (pageErrors.length) console.log(`PAGE ERRORS ${path}:`, pageErrors);
  await page.close();
}

console.log('Sweep complete.');
await browser.close();
