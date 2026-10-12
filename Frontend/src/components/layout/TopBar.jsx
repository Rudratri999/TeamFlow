import { Fragment } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronRight, LogOut, Menu } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import ThemeToggle from "../ui/ThemeToggle"

// Maps the current URL to a page title and breadcrumb trail.
const getPageContext = (pathname) => {
  const routes = [
    [/^\/organizations$/, () => ({ title: "Organizations", crumbs: [] })],
    [
      /^\/create-organization$/,
      () => ({
        title: "New organization",
        crumbs: [{ label: "Organizations", to: "/organizations" }],
      }),
    ],
    [/^\/dashboard\/([^/]+)$/, () => ({ title: "Dashboard", crumbs: [] })],
    [/^\/projects\/([^/]+)$/, () => ({ title: "Projects", crumbs: [] })],
    [
      /^\/projects\/([^/]+)\/create$/,
      (m) => ({
        title: "New project",
        crumbs: [{ label: "Projects", to: `/projects/${m[1]}` }],
      }),
    ],
    [
      /^\/project\/([^/]+)\/([^/]+)$/,
      (m) => ({
        title: "Project",
        crumbs: [{ label: "Projects", to: `/projects/${m[1]}` }],
      }),
    ],
    [
      /^\/project\/([^/]+)\/([^/]+)\/edit$/,
      (m) => ({
        title: "Edit project",
        crumbs: [
          { label: "Projects", to: `/projects/${m[1]}` },
          { label: "Project", to: `/project/${m[1]}/${m[2]}` },
        ],
      }),
    ],
    [
      /^\/project\/([^/]+)\/([^/]+)\/create$/,
      (m) => ({
        title: "New task",
        crumbs: [
          { label: "Projects", to: `/projects/${m[1]}` },
          { label: "Project", to: `/project/${m[1]}/${m[2]}` },
        ],
      }),
    ],
    [
      /^\/project\/([^/]+)\/([^/]+)\/task\/([^/]+)\/edit$/,
      (m) => ({
        title: "Edit task",
        crumbs: [
          { label: "Projects", to: `/projects/${m[1]}` },
          { label: "Project", to: `/project/${m[1]}/${m[2]}` },
        ],
      }),
    ],
    [
      /^\/organizations\/([^/]+)\/members$/,
      () => ({ title: "Members", crumbs: [] }),
    ],
    [
      /^\/organizations\/([^/]+)\/members\/([^/]+)$/,
      (m) => ({
        title: "Member details",
        crumbs: [
          { label: "Members", to: `/organizations/${m[1]}/members` },
        ],
      }),
    ],
    [
      /^\/organizations\/([^/]+)\/my-work$/,
      () => ({ title: "My Work", crumbs: [] }),
    ],
    [
      /^\/organizations\/([^/]+)\/settings$/,
      () => ({ title: "Settings", crumbs: [] }),
    ],
  ]

  for (const [pattern, build] of routes) {
    const match = pathname.match(pattern)
    if (match) return build(match)
  }
  return { title: "TeamFlow", crumbs: [] }
}

const getInitials = (name) => {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

const TopBar = ({ onMenuClick, menuOpen }) => {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const { title, crumbs } = getPageContext(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
          aria-controls="app-sidebar"
          aria-expanded={menuOpen}
        >
          <Menu size={20} />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-sm">
            {crumbs.map((crumb) => (
              <Fragment key={crumb.to}>
                <li className="hidden sm:block">
                  <Link
                    to={crumb.to}
                    className="rounded text-slate-500 hover:text-slate-800"
                  >
                    {crumb.label}
                  </Link>
                </li>
                <li className="hidden text-slate-300 sm:block" aria-hidden="true">
                  <ChevronRight size={14} />
                </li>
              </Fragment>
            ))}
            <li
              className="truncate font-medium text-slate-900"
              aria-current="page"
            >
              {title}
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
            aria-hidden="true"
          >
            {getInitials(user?.name)}
          </span>
          <span className="hidden max-w-40 truncate text-sm font-medium text-slate-700 sm:block">
            {user?.name}
          </span>
        </div>

        <ThemeToggle />

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
          <span className="sr-only sm:hidden">Logout</span>
        </button>
      </div>
    </header>
  )
}

export default TopBar