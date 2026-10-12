import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    useMemberTasks,
    useOrganizationMembership,
    useOrganizationMembersDetail
} from '../hooks/Organizations/useOrganizationMembers'
import { canManageOrganization } from '../utils/permissions'
import { getMemberName } from '../utils/memberName'
import { formatDate } from '../utils/formatDate'
import Avatar from '../components/ui/Avatar'
import RoleBadge from '../components/ui/RoleBadge'
import { PriorityBadge, StatusBadge } from '../components/ui/TaskBadges'

const BackLink = ({ organization_id }) => (
    <Link
        to={`/organizations/${organization_id}/members`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
    >
        <ArrowLeft size={14} aria-hidden="true" /> Members
    </Link>
)

const MessageCard = ({ organization_id, title, children }) => (
    <div>
        <BackLink organization_id={organization_id} />
        <div
            role="alert"
            className="mx-auto max-w-lg rounded-xl border border-line bg-white p-6 text-center shadow-sm"
        >
            <h1 className="text-base font-semibold text-slate-900">{title}</h1>
            {children && <p className="mt-2 text-sm text-slate-500">{children}</p>}
        </div>
    </div>
)

const MemberDetails = () => {
    const { organization_id, userId } = useParams()
    const {
        data: membership,
        isPending: membershipLoading
    } = useOrganizationMembership(organization_id)
    const canViewMemberTasks = canManageOrganization(membership?.role)
    const {
        data: members,
        isPending: membersLoading,
        error: membersError
    } = useOrganizationMembersDetail(organization_id)
    const {
        data: tasks,
        isPending: tasksLoading,
        error: tasksError
    } = useMemberTasks(organization_id, userId, canViewMemberTasks)

    if (membershipLoading || membersLoading || (canViewMemberTasks && tasksLoading)) {
        return (
            <div className="space-y-6" aria-live="polite">
                <div className="h-20 animate-pulse rounded-xl bg-slate-200/70" />
                <div className="h-48 animate-pulse rounded-xl bg-slate-200/70" />
                <span className="sr-only">Loading member details...</span>
            </div>
        )
    }

    if (!canViewMemberTasks) {
        return (
            <MessageCard
                organization_id={organization_id}
                title="Only organization owners and admins can view member tasks."
            />
        )
    }

    const member = members?.find((item) => String(item.user_id) === userId)
    if (membersError || (tasksError && tasksError.response?.status !== 404)) {
        const error = membersError || tasksError
        return (
            <MessageCard
                organization_id={organization_id}
                title="Couldn't load member details"
            >
                {error.response?.data?.detail || error.message}
            </MessageCard>
        )
    }

    if (!member) {
        return <MessageCard organization_id={organization_id} title="Member not found" />
    }

    const name = getMemberName(member)
    const taskList = tasksError?.response?.status === 404 ? [] : tasks ?? []

    return (
        <div className="space-y-6">
            <div>
                <div className="sm:hidden">
                    <BackLink organization_id={organization_id} />
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-line bg-white p-5 shadow-sm">
                    <Avatar name={name} size="lg" />
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                            {name}
                        </h1>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <RoleBadge role={member.role} />
                            <span className="text-xs text-slate-500">User ID {member.user_id}</span>
                        </div>
                    </div>
                </div>
            </div>

            <section
                aria-label="Member's tasks"
                className="rounded-xl border border-line bg-white shadow-sm"
            >
                <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
                    <h2 className="text-sm font-semibold text-slate-900">Member's Tasks</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {taskList.length}
                    </span>
                </header>

                {!taskList.length ? (
                    <p className="px-5 py-10 text-center text-sm text-slate-500">
                        No assigned tasks found.
                    </p>
                ) : (
                    <ul className="divide-y divide-line">
                        {taskList.map((task) => {
                            const due = formatDate(task.due_date)
                            return (
                                <li
                                    key={task.id}
                                    className="px-5 py-3 transition-colors hover:bg-slate-50"
                                >
                                    <Link
                                        to={`/project/${organization_id}/${task.project_id}`}
                                        className="block truncate text-sm font-medium text-slate-900 hover:text-brand-700"
                                    >
                                        {task.title}
                                    </Link>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <StatusBadge status={task.status} />
                                        <PriorityBadge priority={task.priority} />
                                        {due && (
                                            <span className="text-xs text-slate-500">Due {due}</span>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>
        </div>
    )
}

export default MemberDetails