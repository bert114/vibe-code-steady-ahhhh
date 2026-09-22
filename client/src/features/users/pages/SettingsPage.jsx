import { useClerk } from '@clerk/clerk-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clerkEnabled } from '../../../app/auth.jsx'
import { deleteMyAccount } from '../api.js'

function ClerkSignOut({ onSignedOut }) {
  const { signOut } = useClerk()
  return (
    <DeleteAccount
      onDeleted={async () => {
        await signOut()
        onSignedOut()
      }}
    />
  )
}

function DeleteAccount({ onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setDeleting(true)
    try {
      await deleteMyAccount()
      onDeleted()
    } catch {
      // Failure already surfaced as an error toast by the shared request helper.
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <p>
        Deleting your account permanently removes your check-ins, insights, reminders, and
        analysis history. This cannot be undone.
      </p>
      <button type="button" onClick={handleDelete} disabled={deleting}>
        {deleting ? 'Deleting…' : confirming ? 'Click again to confirm deletion' : 'Delete my account'}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [deleted, setDeleted] = useState(false)

  if (deleted) {
    return (
      <main className="settings-page">
        <h1>Account deleted</h1>
        <p role="status">Your account and all of your data have been deleted.</p>
        <p>
          <Link to="/">Home</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="settings-page">
      <p className="page-eyebrow">Your space, your choices</p>
      <h1>Settings & Privacy</h1>

      <section className="settings-section" aria-labelledby="ownership-heading">
        <h2 id="ownership-heading">Your data</h2>
        <p>
          Your check-ins, insights, and reminders belong to you. They are stored in our
          database and are only ever visible to your signed-in account — one account can
          never read or change another account&apos;s records.
        </p>
      </section>

      <section className="settings-section" aria-labelledby="ai-use-heading">
        <h2 id="ai-use-heading">How AI uses your data</h2>
        <p>
          When you run an analysis, only your own recent check-ins and the pattern signals
          our rules found are sent to our AI provider (Groq&apos;s API), which rephrases
          that evidence into supportive observations. The provider never receives other
          users&apos; data, passwords, or credentials. Groq does not train its models on
          API data and does not retain prompts.
        </p>
      </section>

      <section className="settings-section" aria-labelledby="not-medical-heading">
        <h2 id="not-medical-heading">Not medical advice</h2>
        <p>
          Steady-Ahh is a self-reflection tool, not a medical device. Insights are
          observations about your own records, never diagnoses, and suggestions are optional
          reflections — never instructions. If you are struggling, please reach out to a
          qualified professional or a local support line.
        </p>
      </section>

      <section className="settings-section settings-danger" aria-labelledby="delete-heading">
        <h2 id="delete-heading">Delete your account</h2>
        {clerkEnabled ? (
          <ClerkSignOut onSignedOut={() => setDeleted(true)} />
        ) : (
          <DeleteAccount onDeleted={() => setDeleted(true)} />
        )}
      </section>
    </main>
  )
}
