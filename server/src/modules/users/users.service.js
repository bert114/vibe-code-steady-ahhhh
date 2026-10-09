// Business rules live here — never in controllers, routes, or React.
import * as repository from './users.repository.js'

// Resolve a Clerk subject to its internal user id, provisioning on first
// sight. A unique-violation race (two concurrent first requests) resolves by
// re-reading the winner's row.
export async function resolveUserId(clerkSub) {
  const user = await resolveUser(clerkSub);
  return user.id;
}

export async function resolveUser(clerkSub, defaultRole = 'user') {
  const existing = await repository.findUserByClerkSub(clerkSub);
  if (existing) {
    return { id: existing.userId, role: existing.role };
  }
  try {
    const created = await repository.createUserForClerkSub(clerkSub, defaultRole);
    return { id: created.userId, role: created.role };
  } catch (err) {
    if (err?.code === '23505') {
      const winner = await repository.findUserByClerkSub(clerkSub);
      if (winner) return { id: winner.userId, role: winner.role };
    }
    throw err;
  }
}

export async function getUserProfile(userId) {
  return repository.findUserById(userId);
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

