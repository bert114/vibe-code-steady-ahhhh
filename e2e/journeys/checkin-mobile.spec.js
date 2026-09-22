import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 } })

test('check-in journey works on a mobile viewport', async ({ page }) => {
  await page.goto('/check-in')
  await page.locator('div[aria-label="Mood"] input[value="4"]').check({ force: true })
  await page.locator('div[aria-label="Energy"] input[value="3"]').check({ force: true })
  await page.locator('div[aria-label="Drain"] input[value="2"]').check({ force: true })
  await page.getByRole('button', { name: 'Save check-in' }).click()
  await expect(page.getByRole('status')).toContainText(/saved/i)

  await page.goto('/dashboard')
  await expect(page.getByText(/mood 4, energy 3, drain 2/)).toBeVisible()
})
