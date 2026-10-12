import { Link, useParams } from 'react-router-dom'
import { ChevronRight, FolderKanban, Plus } from 'lucide-react'
import { useProjects } from '../hooks/Projects/useProjects'
import { useOrganizationMembership } from '../hooks/Organizations/useOrganizationMembers'
import { canManageOrganization } from '../utils/permissions'

const createButtonClass =
    "inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"

const ProjectsSkeleton = () => (
    <div className="space-y-6" aria-live="polite">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="divide-y divide-line rounded-xl border border-line bg-white">
            {[0, 1, 2].map((item) => (
                <div key={item} className="flex items-center gap-4 px-5 py-4">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                    </div>
                </div>
            ))}
        </div>
        <span className="sr-only">Loading projects...</span>
    </div>
)

const Projects = () => {
    const { organization_id } = useParams()
    const { data: membership } = useOrganizationMembership(organization_id)
    const canManage = canManageOrganization(membership?.role)

    //   Get Projects
    const { data: projects,
        isPending: projectsLoading,
        error: projectsError
    } = useProjects(organization_id)

    if (projectsLoading) {
        return <ProjectsSkeleton />
    }
    if (projectsError) {
        return (
            <div
                role="alert"
                className="mx-auto max-w-lg rounded-xl border border-line bg-white p-6 text-center shadow-sm"
            >
                <h2 className="text-base font-semibold text-slate-900">Couldn't load the data</h2>
                <p className="mt-2 text-sm text-slate-500">{projectsError.message}</p>
            </div>
        )
    }

    const projectList = Array.isArray(projects) ? projects : []

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Projects
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {projectList.length === 1
                            ? '1 project'
                            : `${projectList.length} projects`}
                    </p>
                </div>

                {canManage && (
                    <Link
                        to={`/projects/${organization_id}/create`}
                        className={createButtonClass}
                    >
                        <Plus size={16} aria-hidden="true" />
                        Create Project
                    </Link>
                )}
            </div>

            {projectList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <FolderKanban size={22} aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-base font-semibold text-slate-900">
                        No Projects Found
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {canManage
                            ? 'Create your first project to start organizing tasks.'
                            : 'Projects will appear here once they are created.'}
                    </p>
                    {canManage && (
                        <Link
                            to={`/projects/${organization_id}/create`}
                            className={`${createButtonClass} mt-5`}
                        >
                            <Plus size={16} aria-hidden="true" />
                            Create Project
                        </Link>
                    )}
                </div>
            ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm">
                    {projectList.map((project) => (
                        <li key={project.id}>
                            <Link
                                to={`/project/${organization_id}/${project.id}`}
                                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 focus-visible:-outline-offset-2"
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                                    <FolderKanban size={20} aria-hidden="true" />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                                        {project.name}
                                    </h2>
                                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                                        {project.description || 'No description'}
                                    </p>
                                </div>

                                <ChevronRight
                                    size={18}
                                    className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500"
                                    aria-hidden="true"
                                />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default Projects