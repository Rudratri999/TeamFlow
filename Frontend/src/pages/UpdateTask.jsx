import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useParams } from "react-router-dom"
import { taskUpdateSchema } from '../validation/taskSchema'
import { useUpdateTask } from '../hooks/Tasks/useUpdateTask'
import { useTask } from '../hooks/Tasks/useTask'
import {
    useOrganizationMembership,
    useOrganizationMembersDetail
} from '../hooks/Organizations/useOrganizationMembers'
import { canManageOrganization } from '../utils/permissions'
import { getMemberName } from '../utils/memberName'
import { getApiErrorMessage } from '../utils/getApiErrorMessage'
import FormPage, { FormError, FormSkeleton } from '../components/ui/FormPage'
import PageMessage from '../components/ui/PageMessage'
import {
    errorTextClass,
    inputClass,
    labelClass,
    primaryButtonClass,
    secondaryButtonClass
} from '../components/ui/formStyles'

const UpdateTask = () => {
    const { organization_id, projectId, taskId } = useParams()
    const {
        data: membership,
        isPending: membershipLoading
    } = useOrganizationMembership(organization_id)
    const {
        data: members,
        isPending: membersLoading,
        isError: membersError
    } = useOrganizationMembersDetail(organization_id)
    const canManage = canManageOrganization(membership?.role)

    const {
        data: task,
        isPending: taskLoading,
        isError: taskError
    } = useTask(organization_id, projectId, taskId)

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(taskUpdateSchema),
        values: {
            title: task?.title || "",
            description: task?.description || "",
            status: task?.status || "todo",
            priority: task?.priority || "medium",
            assignee_id: String(task?.assignee_id ?? ""),
            due_date: task?.due_date || ""
        }
    })

    const updateTaskMutation = useUpdateTask(
        organization_id,
        projectId,
        taskId
    )

    const onSubmit = (data) => {
        if (canManage) {
            updateTaskMutation.mutate(data)
            return
        }

        updateTaskMutation.mutate({ title: data.title })
    }

    const projectPath = `/project/${organization_id}/${projectId}`

    if (membershipLoading || taskLoading || membersLoading) {
        return <FormSkeleton label="Loading task..." />
    }

    if (taskError || membersError) {
        return (
            <PageMessage
                title={taskError ? "Couldn't load task." : "Couldn't load organization members."}
                backTo={projectPath}
                backLabel="Back to project"
            />
        )
    }

    if (!canManage && Number(task.assignee_id) !== Number(membership?.user_id)) {
        return (
            <PageMessage
                title="Members can only edit tasks assigned to themselves."
                backTo={projectPath}
                backLabel="Back to project"
            />
        )
    }

    const memberEditOnly = !canManage

    return (
        <FormPage
            title="Edit task"
            description={memberEditOnly ? "Update the task title." : "Update the task's details, status and due date."}
            backTo={projectPath}
            backLabel="Project"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

                <div>
                    <label htmlFor="title" className={labelClass}>Task Title</label>
                    <input
                        id="title"
                        type="text"
                        placeholder="Enter task title"
                        aria-invalid={errors.title ? "true" : undefined}
                        className={`${inputClass} mt-1.5`}
                        {...register("title")}
                    />
                    {errors.title && (
                        <p className={errorTextClass}>{errors.title.message}</p>
                    )}
                </div>

                {!memberEditOnly && (
                    <>
                        <div>
                            <label htmlFor="description" className={labelClass}>Description</label>
                            <textarea
                                id="description"
                                rows={4}
                                placeholder="Enter task description"
                                aria-invalid={errors.description ? "true" : undefined}
                                className={`${inputClass} mt-1.5`}
                                {...register("description")}
                            />
                            {errors.description && (
                                <p className={errorTextClass}>{errors.description.message}</p>
                            )}
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="status" className={labelClass}>Status</label>
                                <select id="status" className={`${inputClass} mt-1.5`} {...register("status")}>
                                    <option value="todo">Todo</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="priority" className={labelClass}>Priority</label>
                                <select id="priority" className={`${inputClass} mt-1.5`} {...register("priority")}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="assignee_id" className={labelClass}>Assignee</label>
                                <select
                                    id="assignee_id"
                                    aria-invalid={errors.assignee_id ? "true" : undefined}
                                    className={`${inputClass} mt-1.5`}
                                    {...register("assignee_id")}
                                >
                                    <option value="">Unassigned</option>
                                    {members?.map((member) => (
                                        <option key={member.user_id} value={member.user_id}>
                                            {getMemberName(member)}
                                        </option>
                                    ))}
                                </select>
                                {errors.assignee_id && (
                                    <p className={errorTextClass}>{errors.assignee_id.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="due_date" className={labelClass}>Due Date</label>
                                <input
                                    id="due_date"
                                    type="date"
                                    aria-invalid={errors.due_date ? "true" : undefined}
                                    className={`${inputClass} mt-1.5`}
                                    {...register("due_date")}
                                />
                                {errors.due_date && (
                                    <p className={errorTextClass}>{errors.due_date.message}</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {updateTaskMutation.isError && (
                    
                    <FormError>
                        {getApiErrorMessage(
                            updateTaskMutation.error,
                            "Couldn't Update Task, Try Again"
                        )}
                    </FormError>
                )}

                <div className="flex justify-end gap-2">
                    <Link to={projectPath} className={secondaryButtonClass}>
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={updateTaskMutation.isPending}
                        className={primaryButtonClass}
                    >
                        {updateTaskMutation.isPending
                            ? "Updating Task..."
                            : "Update Task"}
                    </button>
                </div>

            </form>
        </FormPage>
    )
}

export default UpdateTask