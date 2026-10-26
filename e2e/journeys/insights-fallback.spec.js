import { expect, test } from '@playwright/test'

// No AI provider is configured in the E2E stack, so analysis must degrade
// to the honest fallback without blocking anything else.
test('insights journey: analyze degrades to the fallback notice', async ({ page }) => {
  await page.goto('/insights')
  await page.getByRole('button', { name: /analyze my recent check-ins/i }).click()
  await expect(page.getByRole('status')).toContainText(/temporarily unavailable|not enough check-ins/i)
})
