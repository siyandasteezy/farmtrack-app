/**
 * FarmTrack Documentation Screenshot Capture
 * Uses Puppeteer + system Chrome to screenshot every page.
 */
const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

const BASE_URL   = 'http://localhost:5174';
const OUT_DIR    = path.join(__dirname, '../docs/screenshots');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const USER = JSON.stringify({
  name: 'John Doe', email: 'john@greenmeadows.farm',
  farm: 'Green Meadows Farm', plan: 'trial',
  avatar: 'JD', role: 'Owner',
});

const PAGES = [
  { name: 'login',     path: '/login',       auth: false },
  { name: 'register',  path: '/register',    auth: false },
  { name: 'dashboard', path: '/dashboard',   auth: true  },
  { name: 'farm-plan', path: '/farm-plan',   auth: true  },
  { name: 'livestock', path: '/livestock',   auth: true  },
  { name: 'health',    path: '/health',      auth: true  },
  { name: 'sensors',   path: '/sensors',     auth: true  },
  { name: 'feed',      path: '/feed',        auth: true  },
  { name: 'equipment', path: '/equipment',   auth: true  },
  { name: 'regulations',path: '/regulations',auth: true  },
  { name: 'reports',   path: '/reports',     auth: true  },
  { name: 'tracking',  path: '/tracking',    auth: true  },
  { name: 'billing',   path: '/billing',     auth: true  },
];

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Pre-seed localStorage with auth token for protected pages
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle0' });
  await page.evaluate((u) => localStorage.setItem('farmtrack_user', u), USER);

  for (const pg of PAGES) {
    console.log(`  Capturing ${pg.name}…`);
    if (!pg.auth) {
      await page.evaluate(() => localStorage.removeItem('farmtrack_user'));
    } else {
      await page.evaluate((u) => localStorage.setItem('farmtrack_user', u), USER);
    }

    await page.goto(BASE_URL + pg.path, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800)); // let charts/maps render

    const file = path.join(OUT_DIR, `${pg.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`  ✓ ${file}`);
  }

  await browser.close();
  console.log('\nAll screenshots saved to', OUT_DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
