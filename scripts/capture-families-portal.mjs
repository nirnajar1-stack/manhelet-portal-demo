import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const outDir =
  process.env.FAMILIES_SHOT_DIR ||
  '/cursor/stores/bc-0ba9ca7f-2fca-4c81-9ca7-57a245158b2f/media/families-portal'
const artifactsDir = '/opt/cursor/artifacts'
mkdirSync(outDir, { recursive: true })
mkdirSync(artifactsDir, { recursive: true })

const base = process.env.PORTAL_URL || 'http://127.0.0.1:5173'
const shots = [
  { path: '/families', file: 'home.png' },
  { path: '/families/requests', file: 'requests.png' },
  { path: '/families/companion', file: 'companion.png' },
  { path: '/families/programs', file: 'programs.png' },
]

const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_PATH ||
    '/usr/bin/google-chrome' ||
    undefined,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  locale: 'he-IL',
})
const page = await context.newPage()

for (const shot of shots) {
  await page.goto(`${base}${shot.path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const dest = join(outDir, shot.file)
  await page.screenshot({ path: dest, fullPage: true })
  await page.screenshot({
    path: join(artifactsDir, `families-${shot.file}`),
    fullPage: true,
  })
  console.log('wrote', dest)
}

await browser.close()
