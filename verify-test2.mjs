import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));
page.on('requestfailed', (req) => consoleErrors.push('REQFAILED: ' + req.url() + ' ' + req.failure()?.errorText));

async function shot(name) {
  await page.screenshot({ path: `verify-shots/${name}.png` });
  console.log(`SHOT: ${name} -> url=${page.url()}`);
}

try {
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'customer@demo.com');
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000);
  await shot('04-after-login-long-wait');
  console.log('URL:', page.url());
  console.log('ERRORS:', JSON.stringify(consoleErrors, null, 2));
} finally {
  await browser.close();
}
