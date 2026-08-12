import puppeteer from 'puppeteer-core';
import fs from 'fs';

const dir = './temporary-screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

// ---------- Desktop: click open, screenshot, check aria + keyboard ----------
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  const toggle = await page.waitForSelector('.nav-dropdown-toggle');
  await toggle.click();
  await new Promise(r => setTimeout(r, 250));

  const expandedAfterClick = await page.$eval('.nav-dropdown-toggle', el => el.getAttribute('aria-expanded'));
  const panelVisible = await page.$eval('.nav-dropdown-panel', el => {
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.opacity !== '0';
  });
  const linkCount = await page.$$eval('.nav-dropdown-link', els => els.length);

  await page.screenshot({ path: `${dir}/nav-dropdown-desktop-open.png`, clip: { x: 0, y: 0, width: 1440, height: 420 } });

  // Escape closes and returns focus to toggle
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 250));
  const expandedAfterEscape = await page.$eval('.nav-dropdown-toggle', el => el.getAttribute('aria-expanded'));
  const focusedIsToggle = await page.evaluate(() => document.activeElement.classList.contains('nav-dropdown-toggle'));

  // Outside click closes
  await toggle.click();
  await new Promise(r => setTimeout(r, 250));
  await page.mouse.click(700, 700);
  await new Promise(r => setTimeout(r, 250));
  const expandedAfterOutsideClick = await page.$eval('.nav-dropdown-toggle', el => el.getAttribute('aria-expanded'));

  console.log('DESKTOP:');
  console.log('  aria-expanded after click:', expandedAfterClick);
  console.log('  panel visible:', panelVisible);
  console.log('  dropdown link count (expect 5):', linkCount);
  console.log('  aria-expanded after Escape:', expandedAfterEscape);
  console.log('  focus returned to toggle after Escape:', focusedIsToggle);
  console.log('  aria-expanded after outside click:', expandedAfterOutsideClick);

  await page.close();
}

// ---------- Mobile: hamburger open, dropdown disclosure open, screenshot ----------
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  const navToggle = await page.waitForSelector('.nav-toggle');
  await navToggle.click();
  await new Promise(r => setTimeout(r, 250));

  const servicesToggle = await page.waitForSelector('.nav-dropdown-toggle');
  await servicesToggle.click();
  await new Promise(r => setTimeout(r, 300));

  const expanded = await page.$eval('.nav-dropdown-toggle', el => el.getAttribute('aria-expanded'));
  const panelHeight = await page.$eval('.nav-dropdown-panel', el => el.getBoundingClientRect().height);

  await page.screenshot({ path: `${dir}/nav-dropdown-mobile-open.png` });

  console.log('MOBILE:');
  console.log('  aria-expanded after tap:', expanded);
  console.log('  panel rendered height (expect > 0):', panelHeight);

  await page.close();
}

await browser.close();
console.log('Done.');
