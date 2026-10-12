import { createProject } from "../../services/projectService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

export function useCreateProject(organization_id) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const createProjectMutation = useMutation({
        mutationFn: (data) => createProject(organization_id, data),

        onSuccess: async () => {
            toast.success("Project Created Successfully");

            await queryClient.invalidateQueries({
                queryKey: ["projects", organization_id]
            });

            navigate(`/projects/${organization_id}`, { replace: true });
        },

        onError: (error) => {
            toast.error(
                getApiErrorMessage(error, "Project Creation failed")
            );
        }
    });

    return createProjectMutation;
}