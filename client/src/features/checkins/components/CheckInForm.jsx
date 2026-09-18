import { useCheckinsStore } from '../store.js'

const SCORES = [1, 2, 3, 4, 5]

function ScoreField({ label, name, value, onChange }) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div role="radiogroup" aria-label={label}>
        {SCORES.map((score) => (
          <label key={score}>
            <input
              type="radio"
              name={name}
              value={score}
              checked={Number(value) === score}
              onChange={() => onChange(score)}
            />
            {score}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// Presentational form: draft state lives in the store, validation mirrors
// the server (1-5 required scores). Submit handling lives in the page.
export default function CheckInForm({ onSubmit, saving }) {
  const { draft, setDraft } = useCheckinsStore()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <ScoreField
        label="Mood"
        name="moodScore"
        value={draft.moodScore}
        onChange={(v) => setDraft({ moodScore: v })}
      />
      <ScoreField
        label="Energy"
        name="energyScore"
        value={draft.energyScore}
        onChange={(v) => setDraft({ energyScore: v })}
      />
      <ScoreField
        label="Drain"
        name="drainScore"
        value={draft.drainScore}
        onChange={(v) => setDraft({ drainScore: v })}
      />

      <div>
        <label htmlFor="checkin-emotions">Emotions (comma-separated)</label>
        <input
          id="checkin-emotions"
          type="text"
          value={draft.emotions}
          onChange={(e) => setDraft({ emotions: e.target.value })}
          placeholder="e.g. tired, hopeful"
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="checkin-context">What was going on? (comma-separated tags)</label>
        <input
          id="checkin-context"
          type="text"
          value={draft.contextTags}
          onChange={(e) => setDraft({ contextTags: e.target.value })}
          placeholder="e.g. work, family dinner"
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="checkin-note">What happened? (optional)</label>
        <textarea
          id="checkin-note"
          value={draft.note}
          onChange={(e) => setDraft({ note: e.target.value })}
          rows={4}
          maxLength={5000}
        />
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save check-in'}
      </button>
    </form>
  )
}
