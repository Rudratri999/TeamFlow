import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignTask, unassignTask } from "../../services/taskService";
import toast from "react-hot-toast";


export function useAssignTask(organization_id, projectId) {

    const queryClient = useQueryClient()

    const assignTaskMutation = useMutation({
        mutationFn: ({ taskId, userId }) => (
            userId === null
                ? unassignTask(organization_id, projectId, taskId)
                : assignTask(organization_id, projectId, taskId, userId)
        ),
        onSuccess: (_, { userId }) => {
            toast.success(userId === null ? "Task unassigned successfully" : "Task assigned successfully");

            queryClient.invalidateQueries({
                queryKey: ["tasks", organization_id, projectId]
            });
        },
        onError: (error) => {
            toast.error(
                error.response?.data?.detail || "Task assignment failed"
            );
        }
    })

    return assignTaskMutation
}