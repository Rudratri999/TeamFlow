import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useProject } from '../hooks/Projects/useProject'
import { useDeleteProject } from '../hooks/Projects/useDeleteProject'
import { useTasks } from '../hooks/Tasks/useTasks'
import { useDeleteTask } from '../hooks/Tasks/useDeleteTask'
import { useMoveTask } from '../hooks/Tasks/useMoveTask'
import TaskCard from '../components/Tasks/TaskCard'
import DraggableTaskCard from '../components/Tasks/DraggableTaskCard'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import {
    useOrganizationMembersDetail,
    useOrganizationMembership
} from '../hooks/Organizations/useOrganizationMembers'
import { useAssignTask } from '../hooks/Tasks/useAssignTask'
import { canManageOrganization } from '../utils/permissions'

const COLUMNS = [
    { status: "todo", title: "To Do", dot: "bg-status-todo", empty: "No tasks to do" },
    { status: "in_progress", title: "In Progress", dot: "bg-status-progress", empty: "Nothing in progress" },
    { status: "done", title: "Done", dot: "bg-status-done", empty: "Nothing completed yet" },
]

const secondaryButtonClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"

// Pointer position decides the target column; falls back to rectangle overlap
// for keyboard dragging (where there is no pointer).
const collisionDetection = (args) => {
    const pointerHits = pointerWithin(args)
    return pointerHits.length > 0 ? pointerHits : rectIntersection(args)
}

const BoardColumn = ({ column, tasks, renderCard }) => {
    const { setNodeRef, isOver } = useDroppable({ id: column.status })

    return (
        <section
            ref={setNodeRef}
            aria-label={`${column.title} tasks`}
            className={`min-h-48 min-w-[17rem] flex-1 rounded-2xl border p-3 transition-colors ${
                isOver ? 'border-brand-200 bg-brand-50 ring-2 ring-brand-200' : 'border-line bg-slate-100/80'
            }`}
        >
            <header className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} aria-hidden="true" />
                    {column.title}
                </h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-line">
                    {tasks.length}
                    <span className="sr-only"> tasks</span>
                </span>
            </header>

            {tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-xs text-slate-500">
                    {column.empty}
                </div>
            ) : (
                <ul className="space-y-2">
                    {tasks.map((task) => (
                        <li key={task.id}>{renderCard(task)}</li>
                    ))}
                </ul>
            )}
        </section>
    )
}

const ProjectSkeleton = () => (
    <div className="space-y-6" aria-live="polite">
        <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200/70" />
        </div>
        <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2].map((item) => (
                <div key={item} className="h-72 min-w-[17rem] flex-1 animate-pulse rounded-xl bg-slate-200/70" />
            ))}
        </div>
        <span className="sr-only">Loading project...</span>
    </div>
)

const ProjectDetails = () => {
    const { organization_id, projectId } = useParams()
    const [confirmingProjectDelete, setConfirmingProjectDelete] = useState(false)
    const [activeTaskId, setActiveTaskId] = useState(null)

    const { data: project,
        isPending: projectLoading,
        error: projectError } = useProject(organization_id, projectId)
    const { data: tasks,
        isPending: tasksLoading,
        error: tasksError } = useTasks(organization_id, projectId)

    const { data: members } = useOrganizationMembersDetail(organization_id);
    const { data: membership } = useOrganizationMembership(organization_id)
    const canManage = canManageOrganization(membership?.role)

    const assignTaskMutation = useAssignTask(
        organization_id,
        projectId
    );

    const deleteProjectMutation = useDeleteProject(organization_id, projectId)
    const deleteTaskMutation = useDeleteTask(organization_id, projectId)
    const moveTaskMutation = useMoveTask(organization_id, projectId, canManage)

    const sensors = useSensors(
        // A few pixels of movement before a drag starts, so plain clicks still work.
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    )

    if (projectLoading || tasksLoading) {
        return <ProjectSkeleton />
    }
    if (projectError || tasksError) {
        return (
            <div
                role="alert"
                className="mx-auto max-w-lg rounded-xl border border-line bg-white p-6 text-center shadow-sm"
            >
                <h2 className="text-base font-semibold text-slate-900">Couldn't load the data</h2>
                <p className="mt-2 text-sm text-slate-500">
                    {projectError?.message || tasksError?.message}
                </p>
            </div>
        )
    }

    const tasksByStatus = (status) =>
        tasks?.filter((task) => task.status === status) || []

    const totalTasks = tasks?.length ?? 0

    // Members can only edit task titles; task status movement remains admin-only.
    const canMoveTask = (task) => canManage

    const handleMove = (task, status) => {
        if (!canMoveTask(task) || task.status === status) return
        moveTaskMutation.mutate({ task, status })
    }

    const activeTask = tasks?.find((task) => task.id === activeTaskId) ?? null

    const handleDragStart = ({ active }) => setActiveTaskId(active.id)
    const handleDragCancel = () => setActiveTaskId(null)
    const handleDragEnd = ({ active, over }) => {
        setActiveTaskId(null)
        if (!over) return

        const task = tasks?.find((item) => item.id === active.id)
        if (task) handleMove(task, over.id)
    }

    // Screen-reader announcements that use real names instead of ids.
    const taskTitle = (id) => tasks?.find((item) => item.id === id)?.title ?? 'task'
    const columnTitle = (id) => COLUMNS.find((column) => column.status === id)?.title ?? 'a column'
    const announcements = {
        onDragStart: ({ active }) => `Picked up ${taskTitle(active.id)}.`,
        onDragOver: ({ active, over }) =>
            over
                ? `${taskTitle(active.id)} is over ${columnTitle(over.id)}.`
                : `${taskTitle(active.id)} is not over a column.`,
        onDragEnd: ({ active, over }) =>
            over
                ? `${taskTitle(active.id)} was dropped in ${columnTitle(over.id)}.`
                : `${taskTitle(active.id)} was dropped outside a column.`,
        onDragCancel: ({ active }) => `Moving ${taskTitle(active.id)} was cancelled.`,
    }

    return (
        <div className="space-y-8">
            {/* Project header */}
            <div>
                <Link
                    to={`/projects/${organization_id}`}
                    className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 sm:hidden"
                >
                    <ArrowLeft size={14} aria-hidden="true" /> Projects
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="break-words text-2xl font-semibold tracking-tight text-slate-900">
                            {project?.name}
                        </h1>
                        {project?.description && (
                            <p className="mt-1 max-w-2xl break-words text-sm text-slate-500">
                                {project.description}
                            </p>
                        )}
                    </div>

                    {canManage && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                            <Link
                                to={`/project/${organization_id}/${project.id}/edit`}
                                className={secondaryButtonClass}
                            >
                                <Pencil size={15} aria-hidden="true" /> Edit Project
                            </Link>
                            <button
                                type="button"
                                onClick={() => setConfirmingProjectDelete(true)}
                                disabled={deleteProjectMutation.isPending}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                            >
                                <Trash2 size={15} aria-hidden="true" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Board toolbar */}
            <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">Task board</h2>
                    <p className="text-sm text-slate-500">
                        {totalTasks === 1 ? '1 task' : `${totalTasks} tasks`}
                    </p>
                </div>

                {canManage && (
                    <Link
                        to={`/project/${organization_id}/${projectId}/create`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                    >
                        <Plus size={16} aria-hidden="true" />
                        Create Task
                    </Link>
                )}
            </div>

            {/* Board: columns scroll horizontally when the screen is narrow */}
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
                accessibility={{ announcements }}
            >
                <div
                    role="region"
                    aria-label="Task board"
                    tabIndex={0}
                    className="flex gap-4 overflow-x-auto rounded-2xl pb-3"
                >
                    {COLUMNS.map((column) => (
                        <BoardColumn
                            key={column.status}
                            column={column}
                            tasks={tasksByStatus(column.status)}
                            renderCard={(task) => (
                                <DraggableTaskCard
                                    task={task}
                                    organization_id={organization_id}
                                    projectId={projectId}
                                    currentUserId={membership?.user_id}
                                    canManage={canManage}
                                    deleteTaskMutation={deleteTaskMutation}
                                    members={members}
                                    assignTaskMutation={assignTaskMutation}
                                    canMove={canMoveTask(task)}
                                    onMove={handleMove}
                                    isMoving={
                                        moveTaskMutation.isPending &&
                                        moveTaskMutation.variables?.task.id === task.id
                                    }
                                />
                            )}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeTask ? (
                        <TaskCard
                            task={activeTask}
                            organization_id={organization_id}
                            projectId={projectId}
                            canManage={false}
                            members={members}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {confirmingProjectDelete && (
                <ConfirmDialog
                    title="Delete this project?"
                    description={`You're about to delete "${project?.name}". This action can't be undone.`}
                    pending={deleteProjectMutation.isPending}
                    onCancel={() => setConfirmingProjectDelete(false)}
                    onConfirm={() =>
                        deleteProjectMutation.mutate(undefined, {
                            onSettled: () => setConfirmingProjectDelete(false),
                        })
                    }
                />
            )}
        </div>
    )
}

export default ProjectDetails