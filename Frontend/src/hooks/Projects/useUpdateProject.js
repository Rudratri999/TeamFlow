import { updateProject } from "../../services/projectService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export function useUpdateProject(organization_id, projectId) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const createUpdateProjectMutation = useMutation({
        mutationFn: (data) => updateProject(organization_id,projectId, data),

        onSuccess: () => {
            toast.success("Project Updated Successfully");

            queryClient.invalidateQueries({
                queryKey: ["project", organization_id, projectId]
            });
            queryClient.invalidateQueries({
                queryKey: ["projects", organization_id]
            })

            navigate(`/project/${organization_id}/${projectId}`, { replace: true });
        },

        onError: (error) => {
            toast.error(
                error.response?.data?.detail || "Project Updation failed"
            );
        }
    });

    return createUpdateProjectMutation;
}