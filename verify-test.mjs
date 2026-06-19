import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

async function shot(name) {
  await page.screenshot({ path: `verify-shots/${name}.png` });
  console.log(`SHOT: ${name} -> url=${page.url()}`);
}

try {
  console.log('--- STEP 1: login page ---');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await shot('01-login');

  await page.fill('input[type="email"]', 'customer@demo.com');
  await page.fill('input[type="password"]', 'demo1234');
  await shot('02-login-filled');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await shot('03-after-login');
  console.log('URL after login submit:', page.url());

  console.log('--- CONSOLE ERRORS SO FAR ---');
  console.log(JSON.stringify(consoleErrors, null, 2));
} catch (err) {
  console.log('SCRIPT ERROR:', err.message);
  await shot('99-error');
} finally {
  await browser.close();
}
