import { Link, useParams } from 'react-router-dom'
import { CalendarDays, CheckCircle2, FolderKanban } from 'lucide-react'
import { useMyProjects, useMyTasks } from '../hooks/Organizations/useMyWork'
import { formatDate, isPastDate } from '../utils/formatDate'
import { PriorityBadge } from '../components/ui/TaskBadges'

const GROUPS = [
    { status: 'in_progress', title: 'In Progress', dot: 'bg-status-progress' },
    { status: 'todo', title: 'To Do', dot: 'bg-status-todo' },
    { status: 'done', title: 'Done', dot: 'bg-status-done' },
]

const cardClass = 'rounded-xl border border-line bg-white shadow-sm'

// Earliest due date first; tasks without a due date go last.
const byDueDate = (a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return String(a.due_date).localeCompare(String(b.due_date))
}

const TaskRow = ({ task, organization_id, projectName }) => {
    const due = formatDate(task.due_date)
    const isDone = task.status === 'done'
    const isOverdue = !isDone && isPastDate(task.due_date)

    return (
        <li className="px-5 py-3 transition-colors hover:bg-slate-50">
            <Link
                to={`/project/${organization_id}/${task.project_id}`}
                className={`block truncate text-sm font-medium hover:text-brand-700 ${
                    isDone ? 'text-slate-500' : 'text-slate-900'
                }`}
            >
                {task.title}
            </Link>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {projectName && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <FolderKanban size={13} aria-hidden="true" />
                        {projectName}
                    </span>
                )}
                <PriorityBadge priority={task.priority} />
                {due && (
                    <span
                        className={`inline-flex items-center gap-1 text-xs ${
                            isOverdue ? 'font-medium text-red-600' : 'text-slate-500'
                        }`}
                    >
                        <CalendarDays size={13} aria-hidden="true" />
                        {due}
                        {isOverdue && <span className="sr-only"> (overdue)</span>}
                    </span>
                )}
            </div>
        </li>
    )
}

const TaskGroup = ({ title, dot, tasks, organization_id, projectNames }) => (
    <section aria-label={`${title} tasks`} className={cardClass}>
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
                {title}
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {tasks.length}
            </span>
        </header>
        <ul className="divide-y divide-line">
            {tasks.map((task) => (
                <TaskRow
                    key={task.id}
                    task={task}
                    organization_id={organization_id}
                    projectName={projectNames.get(task.project_id)}
                />
            ))}
        </ul>
    </section>
)

const MyWorkSkeleton = () => (
    <div className="space-y-6" aria-live="polite">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-64 animate-pulse rounded-xl bg-slate-200/70 lg:col-span-2" />
            <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />
        </div>
        <span className="sr-only">Loading your work...</span>
    </div>
)

const MyWork = () => {
    const { organization_id } = useParams()
    const {
        data: tasks,
        isPending: tasksLoading,
        error: tasksError
    } = useMyTasks(organization_id)
    const {
        data: projects,
        isPending: projectsLoading,
        error: projectsError
    } = useMyProjects(organization_id)

    if (tasksLoading || projectsLoading) {
        return <MyWorkSkeleton />
    }

    if (tasksError || projectsError) {
        const error = tasksError || projectsError
        return (
            <div
                role="alert"
                className="mx-auto max-w-lg rounded-xl border border-line bg-white p-6 text-center shadow-sm"
            >
                <h1 className="text-base font-semibold text-slate-900">Couldn't load your work</h1>
                <p className="mt-2 text-sm text-slate-500">
                    {error.response?.data?.detail || error.message}
                </p>
            </div>
        )
    }

    const taskList = Array.isArray(tasks) ? tasks : []
    const projectList = Array.isArray(projects) ? projects : []
    const projectNames = new Map(projectList.map((project) => [project.id, project.name]))

    const knownStatuses = GROUPS.map((group) => group.status)
    const grouped = GROUPS.map((group) => ({
        ...group,
        tasks: taskList.filter((task) => task.status === group.status).sort(byDueDate),
    }))
    const otherTasks = taskList.filter((task) => !knownStatuses.includes(task.status))
    const openCount = taskList.filter((task) => task.status !== 'done').length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Work</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {openCount === 1 ? '1 open task' : `${openCount} open tasks`}
                    {' · '}
                    {projectList.length === 1 ? '1 project' : `${projectList.length} projects`}
                </p>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-3">
                {/* Tasks */}
                <section aria-label="My Tasks" className="space-y-4 lg:col-span-2">
                    <h2 className="text-base font-semibold text-slate-900">My Tasks</h2>

                    {!taskList.length ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                                <CheckCircle2 size={22} aria-hidden="true" />
                            </span>
                            <p className="mt-4 text-sm text-slate-600">
                                You have no assigned tasks in this organization.
                            </p>
                        </div>
                    ) : (
                        <>
                            {grouped.map((group) =>
                                group.tasks.length > 0 ? (
                                    <TaskGroup
                                        key={group.status}
                                        title={group.title}
                                        dot={group.dot}
                                        tasks={group.tasks}
                                        organization_id={organization_id}
                                        projectNames={projectNames}
                                    />
                                ) : null
                            )}
                            {otherTasks.length > 0 && (
                                <TaskGroup
                                    title="Other"
                                    dot="bg-slate-400"
                                    tasks={otherTasks}
                                    organization_id={organization_id}
                                    projectNames={projectNames}
                                />
                            )}
                        </>
                    )}
                </section>

                {/* Projects */}
                <section aria-label="My Projects" className="space-y-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">My Projects</h2>
                        <p className="text-sm text-slate-500">
                            Projects with tasks assigned to you
                        </p>
                    </div>

                    {!projectList.length ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
                            No projects found.
                        </div>
                    ) : (
                        <ul className={`${cardClass} divide-y divide-line overflow-hidden`}>
                            {projectList.map((project) => (
                                <li key={project.id}>
                                    <Link
                                        to={`/project/${organization_id}/${project.id}`}
                                        className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 focus-visible:-outline-offset-2"
                                    >
                                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                                            <FolderKanban size={16} aria-hidden="true" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-slate-900 group-hover:text-brand-700">
                                                {project.name}
                                            </span>
                                            {project.description && (
                                                <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">
                                                    {project.description}
                                                </span>
                                            )}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    )
}

export default MyWork