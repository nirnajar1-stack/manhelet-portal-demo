/**
 * Vite `base` / deploy subpath helpers.
 * `import.meta.env.BASE_URL` always ends with `/` (e.g. `/` or `/portal/`).
 */

/** Absolute public asset URL under the Vite base (e.g. logo, seed images). */
export function withBase(path: string): string {
  if (
    !path ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('tel:') ||
    path.startsWith('mailto:') ||
    path.startsWith('#')
  ) {
    return path
  }
  const base = import.meta.env.BASE_URL || '/'
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}${normalized}`
}

/**
 * React Router `basename` — no trailing slash (except root, which RR treats as none).
 * Pass `undefined` when the app is served from `/`.
 */
export function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL || '/'
  if (base === '/') return undefined
  return base.replace(/\/$/, '')
}
