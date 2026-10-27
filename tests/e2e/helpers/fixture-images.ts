import type { Page } from '@playwright/test'

/** Keep browser acceptance independent of the external demo-image CDN. */
export async function routeFixtureImages(page: Page) {
  await page.route('https://images.unsplash.com/**', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1800"><rect width="100%" height="100%" fill="#758577"/></svg>'
  }))
}
