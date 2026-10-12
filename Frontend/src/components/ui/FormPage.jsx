import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

// Page frame for the create/edit forms: back link, title, and a form card.
const FormPage = ({ title, description, backTo, backLabel, children }) => (
  <div className="mx-auto max-w-2xl">
    <Link
      to={backTo}
      className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
    >
      <ArrowLeft size={14} aria-hidden="true" /> {backLabel}
    </Link>

    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
    {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}

    <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-7">
      {children}
    </div>
  </div>
)

// Request-level error shown above the form buttons.
export const FormError = ({ children }) => (
  <div
    role="alert"
    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
  >
    <span>{children}</span>
  </div>
)

export const FormSkeleton = ({ label }) => (
  <div className="mx-auto max-w-2xl space-y-4" aria-live="polite">
    <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
    <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />
    <span className="sr-only">{label}</span>
  </div>
)

export default FormPage