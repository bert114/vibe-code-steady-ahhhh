import { expect, test } from '@playwright/test'

// Total API outage: pages must show the error contract, never a hang.
// Scoped to the API origin: a bare **/api/** would also abort Vite's
// dev-served /src/lib/api/*.js modules and break the bundle itself.
const API_CALLS = '**/localhost:5001/api/**'

test('dashboard shows an alert when the API is unreachable', async ({ page }) => {
  await page.route(API_CALLS, (route) => route.abort())
  await page.goto('/dashboard')
  await expect(page.getByRole('alert')).toContainText(/couldn't load your dashboard/i)
})

test('check-in history shows an error when the API is unreachable', async ({ page }) => {
  await page.route(API_CALLS, (route) => route.abort())
  await page.goto('/check-in')
  await expect(page.getByRole('alert')).toBeVisible()
})
