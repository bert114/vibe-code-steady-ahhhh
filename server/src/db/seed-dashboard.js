import pool, { dbQuery, dbTransaction } from "./pool.js";

const SEED_MARKER = "[steady-ahh-demo:v1]";
const SEED_MODEL = "dashboard-demo-v1";
const SEED_PROVIDER = "dashboard-demo-seed";

const sampleCheckins = [
  {
    daysAgo: 6,
    mood: 3,
    energy: 3,
    drain: 3,
    emotions: ["okay", "thoughtful"],
    contexts: ["work", "overtime"],
    note: "A busy day, but I found a little time to reset.",
  },
  {
    daysAgo: 4,
    mood: 1,
    energy: 1,
    drain: 5,
    emotions: ["tired", "anxious"],
    contexts: ["work", "overtime"],
    note: "I stayed late and felt stretched thin afterward.",
  },
  {
    daysAgo: 2,
    mood: 3,
    energy: 1,
    drain: 5,
    emotions: ["tired", "quiet"],
    contexts: ["work", "overtime"],
    note: "I needed a slower evening after a demanding day.",
  },
  {
    daysAgo: 0,
    mood: 3,
    energy: 3,
    drain: 5,
    emotions: ["reflective", "tired"],
    contexts: ["work", "overtime"],
    note: "I noticed the same work pattern and made room for a break.",
  },
];

function resolveSeedUserId() {
  return [process.env.SEED_USER_ID, process.env.DEV_USER_ID]
    .map((value) => value?.trim())
    .find(Boolean);
}

function buildCheckinInsert(userId) {
  const params = [];
  const values = sampleCheckins.map((checkin) => {
    const offset = params.length;
    params.push(
      userId,
      checkin.daysAgo,
      checkin.mood,
      checkin.energy,
      checkin.drain,
      checkin.emotions,
      checkin.contexts,
      `${SEED_MARKER} ${checkin.note}`,
    );
    return `(
      $${offset + 1},
      now() - ($${offset + 2}::int * interval '1 day'),
      $${offset + 3}, $${offset + 4}, $${offset + 5},
      $${offset + 6}, $${offset + 7}, $${offset + 8}
    )`;
  });

  return {
    text: `INSERT INTO checkins
      (user_id, occurred_at, mood_score, energy_score, drain_score, emotions, context_tags, note)
      VALUES ${values.join(",")}`,
    params,
  };
}

async function seedDashboard() {
  const userId = resolveSeedUserId();
  if (!userId) {
    throw new Error("Set SEED_USER_ID or DEV_USER_ID in the server environment before seeding.");
  }

  const { rows: identities } = await dbQuery(
    "SELECT user_id FROM auth_identities WHERE clerk_sub = $1",
    [userId],
  );
  if (identities[0] && identities[0].user_id !== userId) {
    throw new Error("The selected Clerk ID is mapped to a different user key; no data was changed.");
  }

  const markerPattern = `${SEED_MARKER}%`;
  const queries = [
    {
      text: "INSERT INTO users (clerk_id, role) VALUES ($1, 'user') ON CONFLICT (clerk_id) DO NOTHING",
      params: [userId],
    },
    {
      text: "INSERT INTO auth_identities (clerk_sub, user_id) VALUES ($1, $1) ON CONFLICT (clerk_sub) DO NOTHING",
      params: [userId],
    },
    {
      text: "DELETE FROM reminders WHERE user_id = $1 AND message LIKE $2",
      params: [userId, markerPattern],
    },
    {
      text: "DELETE FROM analysis_runs WHERE user_id = $1 AND provider = $2 AND model = $3",
      params: [userId, SEED_PROVIDER, SEED_MODEL],
    },
    {
      text: "DELETE FROM checkins WHERE user_id = $1 AND note LIKE $2",
      params: [userId, markerPattern],
    },
    buildCheckinInsert(userId),
    {
      text: `WITH latest AS (
          SELECT max(occurred_at) AS occurred_at
          FROM checkins
          WHERE user_id = $1 AND note LIKE $2
        ), run AS (
          INSERT INTO analysis_runs
            (user_id, status, completed_at, input_checkin_count, latest_checkin_at, provider, model)
          SELECT $1, 'completed', now(), $3, latest.occurred_at, $4, $5
          FROM latest
          RETURNING id
        ), insight AS (
          INSERT INTO insights
            (user_id, analysis_run_id, insight_type, title, summary, evidence, confidence, suggestions)
          SELECT $1, run.id, 'pattern', $6, $7, $8::jsonb, 'medium', $9::jsonb
          FROM run
          RETURNING id
        )
        INSERT INTO reminders (user_id, insight_id, kind, message)
        SELECT $1, insight.id, 'reflection', $10
        FROM insight`,
      params: [
        userId,
        markerPattern,
        sampleCheckins.length,
        SEED_PROVIDER,
        SEED_MODEL,
        "Sample insight: notice what overtime asks of you",
        "This sample data highlights repeated high-drain workdays. You might notice how a small pause changes the rest of your day.",
        JSON.stringify([
          "Several recent check-ins mention overtime.",
          "Energy felt lower after demanding workdays.",
        ]),
        JSON.stringify([
          "Try protecting one short break after a demanding day.",
          "Notice whether leaving work on time changes your energy.",
        ]),
        `${SEED_MARKER} Sample reminder: take a short pause after a demanding day.`,
      ],
    },
  ];

  await dbTransaction(queries);
  console.info("[dashboard-seed] sample dashboard data ready", {
    userId,
    checkins: sampleCheckins.length,
    insight: 1,
    reminder: 1,
  });
}

try {
  await seedDashboard();
} catch (error) {
  console.error("[dashboard-seed] failed", {
    code: error?.code ?? "SEED_FAILED",
    message: error?.message ?? "Unknown error",
  });
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
