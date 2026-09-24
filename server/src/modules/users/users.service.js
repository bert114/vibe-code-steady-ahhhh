// Business rules live here — never in controllers, routes, or React.
import * as repository from './users.repository.js'

// Resolve a Clerk subject to its internal user id, provisioning on first
// sight. A unique-violation race (two concurrent first requests) resolves by
// re-reading the winner's row.
export async function resolveUserId(clerkSub) {
  const existing = await repository.findUserIdByClerkSub(clerkSub)
  if (existing) return existing
  try {
    return await repository.createUserForClerkSub(clerkSub)
  } catch (err) {
    if (err?.code === '23505') {
      const winner = await repository.findUserIdByClerkSub(clerkSub)
      if (winner) return winner
    }
    throw err
  }
}

export async function deleteUser(userId) {
  return repository.deleteUser(userId)
}

export async function exportUserData(userId) {
  const data = await repository.exportUserData(userId)
  return {
    ...data,
    exportedAt: new Date().toISOString(),
  }
}

