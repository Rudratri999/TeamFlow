import { Link } from "react-router-dom"

// Centered message card for errors and "not allowed" states.
const PageMessage = ({ title, children, backTo, backLabel }) => (
  <div
    role="alert"
    className="mx-auto max-w-lg rounded-xl border border-line bg-white p-6 text-center shadow-sm"
  >
    <h1 className="text-base font-semibold text-slate-900">{title}</h1>
    {children && <p className="mt-2 text-sm text-slate-500">{children}</p>}
    {backTo && (
      <Link
        to={backTo}
        className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-600"
      >
        {backLabel}
      </Link>
    )}
  </div>
)

export default PageMessage