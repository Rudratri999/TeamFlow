import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createTask } from "../../services/taskService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

export function useCreateTask(organization_id, projectId) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data) =>
            createTask(organization_id, projectId, data),

        onSuccess: () => {
            toast.success("Task Created Successfully");

            queryClient.invalidateQueries({
                queryKey: ["tasks", organization_id, projectId]
            });

            navigate(`/project/${organization_id}/${projectId}`, {
                replace: true
            });
        },

        onError: (error) => {
            toast.error(
                getApiErrorMessage(error, "Task Creation failed")
            );
        }
    });
}