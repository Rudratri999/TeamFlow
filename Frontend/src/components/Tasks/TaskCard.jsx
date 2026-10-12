import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Pencil, Trash2, User } from 'lucide-react'
import { PriorityBadge } from '../ui/TaskBadges'
import ConfirmDialog from '../ui/ConfirmDialog'
import { formatDate, isPastDate } from '../../utils/formatDate'

const getMemberName = (member) =>
    member.user?.name ||
    member.username ||
    member.user?.email ||
    member.email ||
    `Member ${member.user_id}`

const getInitials = (name) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || '?'

const Avatar = ({ name }) =>
    name ? (
        <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700"
            aria-hidden="true"
        >
            {getInitials(name)}
        </span>
    ) : (
        <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400"
            aria-hidden="true"
        >
            <User size={12} />
        </span>
    )

const STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
]

const TaskCard = ({
    task,
    organization_id,
    projectId,
    currentUserId,
    canManage,
    deleteTaskMutation,
    members,
    assignTaskMutation,
    // Board-only props (all optional, so other pages using TaskCard keep working)
    dragHandle = null,
    onMove,
    isMoving = false,
    isOverlay = false

}) => {
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    // Same rule as before: managers, or the person the task is assigned to.
    const canEdit = canManage || task.assignee_id === currentUserId

    const assignee = members?.find((member) => member.user_id === task.assignee_id)
    const assigneeName =
        task.assignee_id == null
            ? null
            : assignee
                ? getMemberName(assignee)
                : `Member ${task.assignee_id}`

    const dueLabel = formatDate(task.due_date)
    const isDone = task.status === 'done'
    const isOverdue = !isDone && isPastDate(task.due_date)

    // Only react to the mutation if it belongs to this card's task.
    const isDeleting =
        Boolean(deleteTaskMutation?.isPending) && deleteTaskMutation.variables === task.id
    const isAssigning =
        Boolean(assignTaskMutation?.isPending) &&
        assignTaskMutation.variables?.taskId === task.id

    return (
        <article
            className={`rounded-lg border bg-white p-3 transition-shadow ${
                isOverlay
                    ? 'border-brand-200 shadow-lg ring-1 ring-brand-200'
                    : 'border-line shadow-sm hover:border-slate-300 hover:shadow-md'
            } ${isMoving ? 'opacity-70' : ''}`}
            aria-busy={isMoving || undefined}
        >
            <div className="flex items-start gap-1.5">
                {dragHandle}

                <h4
                    className={`min-w-0 flex-1 break-words text-sm font-medium leading-snug ${
                        isDone ? 'text-slate-500' : 'text-slate-900'
                    }`}
                >
                    {task.title}
                </h4>

                {!isOverlay && (canEdit || canManage) && (
                    <div className="-mr-1 -mt-1 flex shrink-0 items-center">
                        {canEdit && (
                            <Link
                                to={`/project/${organization_id}/${projectId}/task/${task.id}/edit`}
                                aria-label={`Edit ${task.title}`}
                                title="Edit task"
                                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <Pencil size={14} aria-hidden="true" />
                            </Link>
                        )}
                        {canManage && (
                            <button
                                type="button"
                                onClick={() => setConfirmingDelete(true)}
                                disabled={isDeleting}
                                aria-label={`Delete ${task.title}`}
                                title="Delete task"
                                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                                <Trash2 size={14} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {task.description && (
                <p className="mt-1 line-clamp-2 break-words text-xs text-slate-500">
                    {task.description}
                </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <PriorityBadge priority={task.priority} />
                {dueLabel && (
                    <span
                        className={`inline-flex items-center gap-1 text-xs ${
                            isOverdue ? 'font-medium text-red-600' : 'text-slate-500'
                        }`}
                    >
                        <CalendarDays size={13} aria-hidden="true" />
                        {dueLabel}
                        {isOverdue && <span className="sr-only"> (overdue)</span>}
                    </span>
                )}
            </div>

            <div className="mt-3 border-t border-line pt-2.5">
                {canManage ? (
                    <div className="flex items-center gap-2">
                        <Avatar name={assigneeName} />
                        <select
                            value={task.assignee_id ?? ""}
                            aria-label={`Assign ${task.title}`}
                            disabled={isAssigning}
                            onChange={(e) =>
                                assignTaskMutation.mutate({
                                    taskId: task.id,
                                    userId: e.target.value ? Number(e.target.value) : null
                                })
                            }
                            className="min-w-0 flex-1 rounded-md border border-line bg-white py-1 pl-2 pr-1 text-xs text-slate-700 hover:border-slate-300 focus:border-brand-500 disabled:opacity-60"
                        >
                            <option value="">Unassigned</option>

                            {members?.map((member) => (
                                <option key={member.user_id} value={member.user_id}>
                                    {getMemberName(member)}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Avatar name={assigneeName} />
                        <span className="truncate text-xs text-slate-600">
                            {assigneeName ?? 'Unassigned'}
                        </span>
                    </div>
                )}

                {/* Non-drag way to change status. Always available to keyboard and
                    screen-reader users, and shown on touch devices. */}
                {onMove && !isOverlay && (
                    <div className="sr-only mt-2.5 focus-within:not-sr-only pointer-coarse:not-sr-only">
                        <label className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="shrink-0">Move to</span>
                            <select
                                value={task.status}
                                disabled={isMoving}
                                onChange={(e) => onMove(task, e.target.value)}
                                aria-label={`Move ${task.title} to another column`}
                                className="min-w-0 flex-1 rounded-md border border-line bg-white py-1 pl-2 pr-1 text-xs text-slate-700 hover:border-slate-300 focus:border-brand-500 disabled:opacity-60"
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}
            </div>

            {confirmingDelete && !isOverlay && (
                <ConfirmDialog
                    title="Delete this task?"
                    description={`"${task.title}" will be deleted. This action can't be undone.`}
                    pending={isDeleting}
                    onCancel={() => setConfirmingDelete(false)}
                    onConfirm={() =>
                        deleteTaskMutation.mutate(task.id, {
                            onSettled: () => setConfirmingDelete(false),
                        })
                    }
                />
            )}
        </article>
    )
}

export default TaskCard