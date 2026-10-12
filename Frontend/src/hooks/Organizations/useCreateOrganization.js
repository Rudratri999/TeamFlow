import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { createOrganization } from "../../services/organizationService"

export function useCreateOrganization() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const createOrgMutation = useMutation({
        mutationFn: createOrganization,
        onSuccess: (organization) => {
            toast.success("Organization Created Successfully")
            queryClient.invalidateQueries({
                queryKey: ["organizations"]
            })
            navigate(`/dashboard/${organization.id}`, { replace: true })
        },
        onError: (error) => {
            toast.error(
                error.response?.data?.detail || "Organization Creation failed"

            )
        }
    })

    return createOrgMutation
}