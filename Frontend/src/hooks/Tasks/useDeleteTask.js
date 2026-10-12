import { useMutation , useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { deleteTask } from "../../services/taskService";

export function useDeleteTask(organization_id , projectId , taskId){
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const deleteTaskMutation = useMutation({
        mutationFn : (task_id) => deleteTask(organization_id , projectId , task_id ?? taskId),
        onSuccess: () => {
            toast.success("Task Deleted Successfully");

            queryClient.invalidateQueries({
                queryKey: ["tasks", organization_id, projectId]
            });

            navigate(`/project/${organization_id}/${projectId}`, {
                replace: true
            });
        },
        onError: (error) => {
            toast.error(
                error.response?.data?.detail || "Task Deletion failed"
            );
        }
    })
    return deleteTaskMutation
}