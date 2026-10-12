import { useMutation , useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { updateTask } from "../../services/taskService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

export function useUpdateTask(organization_id , projectId , taskId){
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const updateTaskMutation = useMutation({
        mutationFn : (data) => updateTask(organization_id , projectId , taskId , data),
        onSuccess: () => {
            toast.success("Task Updated Successfully");

            queryClient.invalidateQueries({
                queryKey: ["tasks", organization_id, projectId]
            });

            navigate(`/project/${organization_id}/${projectId}`, {
                replace: true
            });
        },
        onError: (error) => {
            toast.error(
                getApiErrorMessage(error, "Task Updation failed")
            );
        }
    })
    return updateTaskMutation
}