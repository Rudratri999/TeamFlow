import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ClipboardCheck,
  Building2,
  ArrowLeftRight,
  X,
} from "lucide-react"
import { useActiveOrganizationId } from "../../hooks/Organizations/useActiveOrganizationId"
import { useOrganization } from "../../hooks/Organizations/useOrganization"

const linkClass = (active) =>
  `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? "bg-brand-50 text-brand-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`

const iconClass = (active) =>
  active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"

// Rendered only inside an organization, so the query always has an id.
const OrganizationName = ({ organizationId }) => {
  const { data: organization } = useOrganization(organizationId)

  if (!organization?.name) return null

  return (
    <p className="mt-1 truncate text-sm font-semibold text-slate-900" title={organization.name}>
      {organization.name}
    </p>
  )
}

const Sidebar = ({ open, onClose }) => {
  const { pathname } = useLocation()
  const organizationId = useActiveOrganizationId()
  const isCreatingOrganization = pathname === "/create-organization"
  const showOrganizationNav = Boolean(organizationId) && !isCreatingOrganization

  const items = showOrganizationNav
    ? [
        {
          label: "Dashboard",
          to: `/dashboard/${organizationId}`,
          icon: LayoutDashboard,
          active: pathname.startsWith(`/dashboard/${organizationId}`),
        },
        {
          label: "Projects",
          to: `/projects/${organizationId}`,
          icon: FolderKanban,
          active:
            pathname.startsWith(`/projects/${organizationId}`) ||
            pathname.startsWith(`/project/${organizationId}`),
        },
        {
          label: "Members",
          to: `/organizations/${organizationId}/members`,
          icon: Users,
          active: pathname.startsWith(`/organizations/${organizationId}/members`),
        },
        {
          label: "My Work",
          to: `/organizations/${organizationId}/my-work`,
          icon: ClipboardCheck,
          active: pathname.startsWith(`/organizations/${organizationId}/my-work`),
        },
      ]
    : !isCreatingOrganization
      ? [
          {
            label: "Organizations",
            to: "/organizations",
            icon: Building2,
            active: pathname === "/organizations",
          },
        ]
      : []

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Link
            to={
              organizationId
                ? `/dashboard/${organizationId}`
                : "/organizations"
            }
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-md"
          >
            <img
              src="/teamflow-mark.svg"
              alt=""
              className="h-10 w-10"
            />
            <span className="text-xl font-semibold tracking-tight text-slate-900">
              TeamFlow
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Organization context */}
        {showOrganizationNav && (
          <div className="border-b border-line px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Workspace
            </p>
            <OrganizationName organizationId={organizationId} />
            <Link
              to="/organizations"
              onClick={onClose}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-md text-sm text-slate-500 hover:text-brand-700"
            >
              <ArrowLeftRight size={14} />
              Switch organization
            </Link>
          </div>
        )}

        {/* Primary navigation */}
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {items.map(({ label, to, icon: Icon, active }) => (
              <li key={label}>
                <Link
                  to={to}
                  onClick={onClose}
                  className={linkClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} className={iconClass(active)} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar