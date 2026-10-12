import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  FolderKanban,
  History,
  ListPlus,
  Plus,
  Search,
  Settings,
  UserX,
  Users,
  ClipboardCheck,
} from 'lucide-react'
import { useDashboard } from "../hooks/Dashboard/useDashboard"
import { useTaskSummary } from '../hooks/Dashboard/useTaskSummary'
import { useTaskPriority } from '../hooks/Dashboard/useTaskPriority'
import { useSearchTasks } from '../hooks/Dashboard/useSearchTasks'
import { useSearchProjects } from '../hooks/Dashboard/useSearchProjects'
import { useOverdueTasks } from '../hooks/Dashboard/useOverdueTasks'
import { useUnassigneTasks } from '../hooks/Dashboard/useUnassigneTasks'
import { useTaskDueSoon } from '../hooks/Dashboard/useTaskDueSoon'
import { useRecentTasks } from '../hooks/Dashboard/useRecentTasks'
import { useRecentUpdatedTasks } from '../hooks/Dashboard/useRecentUpdatedTask'
import { useOrganizationMembership } from '../hooks/Organizations/useOrganizationMembers'
import { canManageOrganization } from '../utils/permissions'
import { formatDate } from '../utils/formatDate'
import { PriorityBadge, StatusBadge } from '../components/ui/TaskBadges'

const cardClass = "rounded-xl border border-line bg-white shadow-sm"

const secondaryLinkClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"

/* ---------- Small building blocks ---------- */

const StatItem = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-3 px-5 py-4">
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
      <Icon size={18} aria-hidden="true" />
    </span>
    <div>
      <p className="text-2xl font-semibold leading-none text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  </div>
)

// Stacked proportion bar plus a legend with counts.
const DistributionCard = ({ title, items }) => {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <section aria-label={title} className={`${cardClass} p-5`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">{total} total</span>
      </div>

      <div
        className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={items.map((item) => `${item.label}: ${item.value}`).join(', ')}
      >
        {total > 0 &&
          items.map((item) =>
            item.value > 0 ? (
              <div
                key={item.label}
                className={item.bar}
                style={{ width: `${(item.value / total) * 100}%` }}
              />
            ) : null
          )}
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-full ${item.bar}`} aria-hidden="true" />
              {item.label}
            </span>
            <span className="font-medium text-slate-900">{item.value}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

const TaskPanel = ({
  title,
  icon: Icon,
  emptyMessage,
  tasks,
  isPending,
  error,
  organizationId,
  tone = "default",
}) => {
  const iconTone =
    tone === "danger"
      ? "bg-red-50 text-red-600"
      : tone === "warning"
        ? "bg-amber-50 text-amber-600"
        : "bg-slate-100 text-slate-500"

  return (
    <section aria-label={title} className={`${cardClass} flex flex-col`}>
      <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-md ${iconTone}`}>
            <Icon size={15} aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
        {!isPending && !error && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {tasks?.length ?? 0}
          </span>
        )}
      </header>

      {isPending ? (
        <div className="space-y-3 p-5" aria-live="polite">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          <span className="sr-only">Loading {title.toLowerCase()}...</span>
        </div>
      ) : error ? (
        <p role="alert" className="p-5 text-sm text-red-600">
          {error.response?.data?.detail || `Couldn't load ${title.toLowerCase()}.`}
        </p>
      ) : !tasks?.length ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-line">
          {tasks.map((task) => {
            const due = formatDate(task.due_date)
            return (
              <li key={task.id} className="px-5 py-3 transition-colors hover:bg-slate-50">
                <Link
                  to={`/project/${organizationId}/${task.project_id}`}
                  className="block truncate text-sm font-medium text-slate-900 hover:text-brand-700"
                >
                  {task.title}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <span
                    className={`text-xs ${
                      tone === "danger" && due ? "font-medium text-red-600" : "text-slate-500"
                    }`}
                  >
                    {due ? `Due ${due}` : 'No due date'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {task.assignee_id == null ? 'Unassigned' : `User #${task.assignee_id}`}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

const SearchGroup = ({ title, children }) => (
  <div>
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {title}
    </h3>
    {children}
  </div>
)

const DashboardSkeleton = () => (
  <div className="space-y-6" aria-live="polite">
    <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
    <div className="h-24 animate-pulse rounded-xl bg-slate-200/70" />
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-44 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="h-44 animate-pulse rounded-xl bg-slate-200/70" />
    </div>
    <span className="sr-only">Loading dashboard...</span>
  </div>
)

/* ---------- Page ---------- */

const Dashboard = () => {
  const { organizationId } = useParams()
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isPending, error } = useDashboard(organizationId)
  const { data: membership } = useOrganizationMembership(organizationId)
  const canManage = canManageOrganization(membership?.role)
  const {
    data: taskSummary,
    isPending: taskSummaryLoading,
    error: taskSummaryError
  } = useTaskSummary(organizationId)
  const {
    data: taskPriority,
    isPending: taskPriorityLoading,
    error: taskPriorityError
  } = useTaskPriority(organizationId)
  const {
    data: searchResults,
    error: searchError,
    isPending: searchLoading
  } = useSearchTasks(organizationId, searchQuery.trim())
  const {
    data: searchProResults,
    error: searchProError,
    isPending: projectSearchLoading
  } = useSearchProjects(organizationId, searchQuery.trim())
  const overdueTasks = useOverdueTasks(organizationId)
  const unassignedTasks = useUnassigneTasks(organizationId)
  const dueSoonTasks = useTaskDueSoon(organizationId)
  const recentTasks = useRecentTasks(organizationId)
  const recentlyUpdatedTasks = useRecentUpdatedTasks(organizationId)

  if (isPending || taskSummaryLoading || taskPriorityLoading) {
    return <DashboardSkeleton />
  }
  if (error || taskSummaryError || taskPriorityError) {
    return (
      <div role="alert" className={`${cardClass} mx-auto max-w-lg p-6 text-center`}>
        <h2 className="text-base font-semibold text-slate-900">Couldn't load the data</h2>
        <p className="mt-2 text-sm text-slate-500">
          {error?.message ||
            taskSummaryError?.message ||
            taskPriorityError?.message}
        </p>
      </div>
    )
  }

  const hasQuery = Boolean(searchQuery.trim())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Organization overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            A snapshot of your team's work and progress.
          </p>
        </div>

        <nav aria-label="Quick links" className="flex flex-wrap gap-2">
          <Link to={`/projects/${organizationId}`} className={secondaryLinkClass}>
            <FolderKanban size={15} aria-hidden="true" /> Projects
          </Link>
          <Link to={`/organizations/${organizationId}/members`} className={secondaryLinkClass}>
            <Users size={15} aria-hidden="true" /> Members
          </Link>
          <Link to={`/organizations/${organizationId}/my-work`} className={secondaryLinkClass}>
            <ClipboardCheck size={15} aria-hidden="true" /> My Work
          </Link>
          <Link to={`/organizations/${organizationId}/settings`} className={secondaryLinkClass}>
            <Settings size={15} aria-hidden="true" /> Settings
          </Link>
          {canManage && (
            <Link
              to={`/projects/${organizationId}/create`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              <Plus size={15} aria-hidden="true" /> Create Project
            </Link>
          )}
        </nav>
      </div>

      {/* Search */}
      <section aria-label="Search organization work">
        <label htmlFor="dashboard-search" className="sr-only">
          Search by task or project name
        </label>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="dashboard-search"
            type="search"
            placeholder="Search tasks and projects..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>

        {hasQuery && (
          <div className={`${cardClass} mt-3 grid gap-6 p-5 md:grid-cols-2`}>
            <SearchGroup title="Tasks">
              {searchLoading ? (
                <p className="text-sm text-slate-500">Searching tasks...</p>
              ) : searchError?.response?.status === 404 ? (
                <p className="text-sm text-slate-500">No tasks found</p>
              ) : searchError ? (
                <p role="alert" className="text-sm text-red-600">
                  Couldn't search tasks: {searchError.response?.data?.detail || searchError.message}
                </p>
              ) : searchResults?.length === 0 ? (
                <p className="text-sm text-slate-500">No tasks found</p>
              ) : (
                <ul className="divide-y divide-line">
                  {searchResults?.map((task) => (
                    <li key={task.id} className="py-2">
                      <Link
                        to={`/project/${organizationId}/${task.project_id}`}
                        className="block truncate text-sm font-medium text-slate-900 hover:text-brand-700"
                      >
                        {task.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {formatDate(task.due_date)
                          ? `Due ${formatDate(task.due_date)}`
                          : 'No due date'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </SearchGroup>

            <SearchGroup title="Projects">
              {projectSearchLoading ? (
                <p className="text-sm text-slate-500">Searching projects...</p>
              ) : searchProError?.response?.status === 404 ? (
                <p className="text-sm text-slate-500">No projects found</p>
              ) : searchProError ? (
                <p role="alert" className="text-sm text-red-600">
                  Couldn't search projects: {searchProError.response?.data?.detail || searchProError.message}
                </p>
              ) : searchProResults?.length === 0 ? (
                <p className="text-sm text-slate-500">No projects found</p>
              ) : (
                <ul className="divide-y divide-line">
                  {searchProResults?.map((project) => (
                    <li key={project.id} className="py-2">
                      <Link
                        to={`/project/${organizationId}/${project.id}`}
                        className="block truncate text-sm font-medium text-slate-900 hover:text-brand-700"
                      >
                        {project.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SearchGroup>
          </div>
        )}
      </section>

      {/* Key numbers */}
      <section
        aria-label="Organization statistics"
        className={`${cardClass} grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0`}
      >
        <StatItem label="Members" value={data?.members ?? 0} icon={Users} />
        <StatItem label="Projects" value={data?.projects ?? 0} icon={FolderKanban} />
        <StatItem label="Tasks" value={data?.tasks ?? 0} icon={ClipboardCheck} />
      </section>

      {/* Status and priority */}
      <section aria-label="Task summaries" className="grid gap-4 md:grid-cols-2">
        <DistributionCard
          title="Tasks by status"
          items={[
            { label: 'To do', value: taskSummary?.todo ?? 0, bar: 'bg-status-todo' },
            { label: 'In progress', value: taskSummary?.in_progress ?? 0, bar: 'bg-status-progress' },
            { label: 'Completed', value: taskSummary?.done ?? 0, bar: 'bg-status-done' },
          ]}
        />
        <DistributionCard
          title="Tasks by priority"
          items={[
            { label: 'Low', value: taskPriority?.low ?? 0, bar: 'bg-slate-400' },
            { label: 'Medium', value: taskPriority?.medium ?? 0, bar: 'bg-amber-500' },
            { label: 'High', value: taskPriority?.high ?? 0, bar: 'bg-red-500' },
          ]}
        />
      </section>

      {/* Needs attention */}
      <section aria-label="Tasks needing attention">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Needs attention</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TaskPanel
            title="Overdue Tasks"
            icon={AlertTriangle}
            tone="danger"
            emptyMessage="No overdue tasks."
            tasks={overdueTasks.data}
            isPending={overdueTasks.isPending}
            error={overdueTasks.error}
            organizationId={organizationId}
          />
          <TaskPanel
            title="Due Soon Tasks"
            icon={CalendarClock}
            tone="warning"
            emptyMessage="No tasks are due soon."
            tasks={dueSoonTasks.data}
            isPending={dueSoonTasks.isPending}
            error={dueSoonTasks.error}
            organizationId={organizationId}
          />
          <TaskPanel
            title="Unassigned Tasks"
            icon={UserX}
            emptyMessage="No unassigned tasks."
            tasks={unassignedTasks.data}
            isPending={unassignedTasks.isPending}
            error={unassignedTasks.error}
            organizationId={organizationId}
          />
        </div>
      </section>

      {/* Recent activity */}
      <section aria-label="Recent activity">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Recent activity</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <TaskPanel
            title="Recently Created Tasks"
            icon={ListPlus}
            emptyMessage="No recently created tasks."
            tasks={recentTasks.data}
            isPending={recentTasks.isPending}
            error={recentTasks.error}
            organizationId={organizationId}
          />
          <TaskPanel
            title="Recently Updated Tasks"
            icon={History}
            emptyMessage="No recently updated tasks."
            tasks={recentlyUpdatedTasks.data}
            isPending={recentlyUpdatedTasks.isPending}
            error={recentlyUpdatedTasks.error}
            organizationId={organizationId}
          />
        </div>
      </section>
    </div>
  )
}

export default Dashboard