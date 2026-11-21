const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function runQA() {
  console.log('Starting automated QA with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  const screenshotDir = path.join(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Daily View
  await page.screenshot({ path: path.join(screenshotDir, '01_daily_view.png') });
  console.log('✓ Captured 01_daily_view.png');

  // 2. Interactive: Inscribe a new task
  const taskInput = await page.$('input[placeholder*="Inscribe additional"]');
  if (taskInput) {
    await taskInput.type('Inspect bespoke marbling paper from Fabriano mill');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 600));
  }
  await page.screenshot({ path: path.join(screenshotDir, '02_daily_after_task_add.png') });
  console.log('✓ Captured 02_daily_after_task_add.png');

  // Helper to click visible tab by label
  async function clickTab(label) {
    await page.evaluate((text) => {
      const buttons = Array.from(document.querySelectorAll('aside nav button, aside button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes(text));
      if (btn) btn.click();
    }, label);
    await new Promise(r => setTimeout(r, 600));
  }

  // 3. Weekly View
  await clickTab('WEEKLY');
  await page.screenshot({ path: path.join(screenshotDir, '03_weekly_view.png') });
  console.log('✓ Captured 03_weekly_view.png');

  // 4. Monthly View
  await clickTab('MONTHLY');
  await page.screenshot({ path: path.join(screenshotDir, '04_monthly_view.png') });
  console.log('✓ Captured 04_monthly_view.png');

  // 5. Notes View
  await clickTab('NOTES');
  await page.screenshot({ path: path.join(screenshotDir, '05_notes_view.png') });
  console.log('✓ Captured 05_notes_view.png');

  // 6. Arabic RTL Toggle
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Switch Language"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Go back to daily in Arabic
  await clickTab('يومي');
  await page.screenshot({ path: path.join(screenshotDir, '06_daily_arabic_rtl.png') });
  console.log('✓ Captured 06_daily_arabic_rtl.png');

  // 7. Settings Modal
  await page.evaluate(() => {
    const btn = document.querySelector('header button:last-child');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotDir, '07_settings_modal_arabic.png') });
  console.log('✓ Captured 07_settings_modal_arabic.png');

  // Close modal and switch back to English
  await page.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('إغلاق'));
    if (closeBtn) closeBtn.click();
    const enToggle = document.querySelector('button[title*="Switch Language"]');
    if (enToggle) enToggle.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 8. Mobile Viewport (375x812 iPhone)
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotDir, '08_mobile_verso.png') });
  console.log('✓ Captured 08_mobile_verso.png');

  // Toggle to Recto on mobile
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const rectoBtn = buttons.find(b => b.textContent && b.textContent.includes('Recto'));
    if (rectoBtn) rectoBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotDir, '09_mobile_recto.png') });
  console.log('✓ Captured 09_mobile_recto.png');

  await browser.close();
  console.log('All QA screenshots captured successfully!');
}

runQA().catch(err => {
  console.error('QA Automation Error:', err);
  process.exit(1);
});
