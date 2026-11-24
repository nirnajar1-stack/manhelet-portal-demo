import { describe, expect, it } from 'vitest'
import { routerBasename, withBase } from './base-path'

describe('withBase', () => {
  it('prefixes Vite BASE_URL for root-relative paths', () => {
    expect(withBase('/brand/logo.jpg')).toMatch(/brand\/logo\.jpg$/)
    expect(withBase('families/nature.jpg')).toMatch(/families\/nature\.jpg$/)
  })

  it('leaves special schemes alone', () => {
    expect(withBase('tel:*8855')).toBe('tel:*8855')
    expect(withBase('https://example.com/x')).toBe('https://example.com/x')
    expect(withBase('#main')).toBe('#main')
  })
})

describe('routerBasename', () => {
  it('is undefined when served from root', () => {
    // Default vite BASE_URL in tests is `/`
    expect(routerBasename()).toBeUndefined()
  })
})
