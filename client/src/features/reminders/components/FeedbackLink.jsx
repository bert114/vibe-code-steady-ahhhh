// Tester feedback entry point. The URL comes from VITE_FEEDBACK_URL (an
// external form — zero backend surface); with no URL configured the section
// hides itself instead of rendering a dead link.
export default function FeedbackLink({ url }) {
  if (!url) return null
  return (
    <section aria-labelledby="feedback-heading">
      <h2 id="feedback-heading">Help shape Steady-Ahh</h2>
      <p>
        <a href={url}>Share feedback with the team</a> — what helped, what confused
        you, and what you wish it did.
      </p>
    </section>
  )
}
