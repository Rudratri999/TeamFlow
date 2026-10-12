import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateTask } from "../../services/taskService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

// Moves a task to another status column (drag-and-drop or the "Move to" select).
// It calls the same updateTask service as the Edit Task page, with the same payload shape,
// so the backend still validates everything. Unlike useUpdateTask it does not
// navigate away, and it only shows a toast on failure.
export function useMoveTask(organization_id, projectId, canManage) {
    const queryClient = useQueryClient()
    const tasksKey = ["tasks", organization_id, projectId]

    return useMutation({
        mutationFn: ({ task, status }) => {
            const payload = {
                title: task.title,
                description: task.description || "",
                status,
                priority: task.priority,
                due_date: task.due_date || null
            }

            // Same rule as the Edit Task page: only managers send assignee_id.
            if (canManage) {
                payload.assignee_id = task.assignee_id ?? null
            }

            return updateTask(organization_id, projectId, task.id, payload)
        },

        // Show the move immediately...
        onMutate: async ({ task, status }) => {
            await queryClient.cancelQueries({ queryKey: tasksKey })
            const previous = queryClient.getQueriesData({ queryKey: tasksKey })

            queryClient.setQueriesData({ queryKey: tasksKey }, (old) =>
                Array.isArray(old)
                    ? old.map((item) => (item.id === task.id ? { ...item, status } : item))
                    : old
            )

            return { previous }
        },

        // ...and put things back if the backend rejects it.
        onError: (error, _variables, context) => {
            context?.previous?.forEach(([key, data]) => {
                queryClient.setQueryData(key, data)
            })
            toast.error(getApiErrorMessage(error, "Couldn't move task"))
        },

        // Always end in sync with the server.
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: tasksKey })
        }
    })
}