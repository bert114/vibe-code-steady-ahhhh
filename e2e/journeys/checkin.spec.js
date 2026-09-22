import { expect, test } from '@playwright/test'

async function submitCheckin(page, { mood, energy, drain, emotions = '', context = '', note = '' }) {
  await page.goto('/check-in')
  for (const [group, value] of [
    ['Mood', mood],
    ['Energy', energy],
    ['Drain', drain],
  ]) {
    await page.locator(`div[aria-label="${group}"] input[value="${value}"]`).check({ force: true })
  }
  await page.getByLabel(/emotions/i).fill(emotions)
  await page.getByLabel(/what was going on/i).fill(context)
  await page.getByLabel(/what happened/i).fill(note)
  await page.getByRole('button', { name: 'Save check-in' }).click()
}

test('check-in journey: submit appears on the dashboard', async ({ page }) => {
  const note = `e2e journey ${Date.now()}`
  await submitCheckin(page, {
    mood: 3,
    energy: 2,
    drain: 4,
    emotions: 'tired',
    context: 'e2e',
    note,
  })
  await expect(page.getByRole('status')).toContainText(/saved/i)

  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Recent check-ins' })).toBeVisible()
  await expect(page.getByText(/mood 3, energy 2, drain 4/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reminders' })).toBeVisible()
  await expect(page.getByText(/no reminders right now/i)).toBeVisible()
})
