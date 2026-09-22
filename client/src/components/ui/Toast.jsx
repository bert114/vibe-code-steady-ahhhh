import { useToastStore } from './toastStore.js'

function SuccessIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="toast__icon">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="m5.5 8.2 1.8 1.8 3.2-3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="toast__icon">
      <path
        d="M8 2.2 14.5 13.5H1.5L8 2.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M8 6.5v3.2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="8" cy="11.6" r="1" fill="currentColor" />
    </svg>
  )
}

function ToastItem({ toast, onDismiss }) {
  const isError = toast.kind === 'error'
  return (
    <div role={isError ? 'alert' : 'status'} className={`toast toast--${toast.kind}`}>
      {isError ? <ErrorIcon /> : <SuccessIcon />}
      <div className="toast__body">
        <p className="toast__message">{toast.message}</p>
        {toast.details.length > 0 && (
          <ul className="toast__details">
            {toast.details.map((detail, i) => (
              <li key={i}>{detail}</li>
            ))}
          </ul>
        )}
        {toast.hiddenCount > 0 && (
          <p className="toast__more">+{toast.hiddenCount} more</p>
        )}
      </div>
      <button type="button" className="toast__close" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            d="m4.5 4.5 7 7m0-7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}

export default function ToastStack() {
  const { toasts, dismiss } = useToastStore()
  if (toasts.length === 0) return null
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  )
}
