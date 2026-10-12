import { ClipboardCheck, FolderKanban, Users } from "lucide-react"
import ThemeToggle from "../ui/ThemeToggle"

const HIGHLIGHTS = [
  { icon: FolderKanban, text: "Plan projects on a shared Kanban board" },
  { icon: Users, text: "Organize members, roles and assignments" },
  { icon: ClipboardCheck, text: "Track priorities, deadlines and progress" },
]

// Shared shell for the Login and Register pages.
const AuthLayout = ({ title, subtitle, footer, children }) => (
  <div className="flex min-h-screen bg-canvas">
    {/* Brand panel (large screens only) */}
    <aside className="hidden w-[26rem] shrink-0 flex-col justify-between bg-brand-600 p-10 text-white lg:flex xl:w-[30rem]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-base font-bold">
          T
        </span>
        <span className="text-xl font-semibold tracking-tight">TeamFlow</span>
      </div>

      <div>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">
          Keep your team's work moving.
        </h2>
        <ul className="mt-8 space-y-4">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-brand-100">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon size={16} aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-brand-200">Project management for software teams.</p>
    </aside>

    {/* Form */}
    <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-base font-bold text-white">
            T
          </span>
          <span className="text-xl font-semibold tracking-tight text-slate-900">
            TeamFlow
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>

        <div className="mt-6 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
      </div>
    </main>
  </div>
)

export default AuthLayout