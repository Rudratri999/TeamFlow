import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteProject } from "../../services/projectService";

export function useDeleteProject(organization_id, projectId) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: () => deleteProject(organization_id, projectId),

        onSuccess: () => {
            toast.success("Project Deleted Successfully");

            queryClient.invalidateQueries({
                queryKey: ["projects", organization_id]
            });

            navigate(`/projects/${organization_id}`, { replace: true });
        },

        onError: (error) => {
            toast.error(
                error.response?.data?.detail || "Project Deletion failed"
            );
        }
    });
}