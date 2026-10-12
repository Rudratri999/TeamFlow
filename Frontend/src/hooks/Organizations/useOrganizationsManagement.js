import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    updateOrganization,
    deleteOrganization,
    leaveOrganization,
    transferOrganizationOwnership
} from "../../services/organizationService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

async function invalidateOrganizationQueries(queryClient, organization_id) {
    await Promise.all([
        queryClient.invalidateQueries({
            queryKey: ["organization", organization_id]
        }),
        queryClient.invalidateQueries({
            queryKey: ["organizationMembership", organization_id]
        }),
        queryClient.invalidateQueries({
            queryKey: ["organizationMembers", organization_id]
        }),
        queryClient.invalidateQueries({
            queryKey: ["organizations"]
        })
    ]);
}

export function useUpdateOrganization(organization_id) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) =>
            updateOrganization(organization_id, data),

        onSuccess: async () => {
            toast.success("Organization updated successfully");
            await invalidateOrganizationQueries(queryClient, organization_id);
        },

        onError: (error) => {
            toast.error(
                getApiErrorMessage(error, "Failed to update organization.")
            );
        }
    });
}

export function useDeleteOrganization(organization_id) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: () => deleteOrganization(organization_id),

        onSuccess: async () => {
            toast.success("Organization deleted successfully");
            await invalidateOrganizationQueries(queryClient, organization_id);
            navigate("/organizations", { replace: true });
        },

        onError: (error) => {
            toast.error(
                getApiErrorMessage(error, "Failed to delete organization.")
            );
        }
    });
}

export function useLeaveOrganization(organization_id) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: () => leaveOrganization(organization_id),

        onSuccess: async () => {
            toast.success("You left the organization");
            await invalidateOrganizationQueries(queryClient, organization_id);
            navigate("/organizations", { replace: true });
        },

        onError: (error) => {
            toast.error(
                getApiErrorMessage(error, "Failed to leave organization.")
            );
        }
    });
}

export function useTransferOrganizationOwnership(organization_id) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (user_id) =>
            transferOrganizationOwnership(
                organization_id,
                user_id
            ),

        onSuccess: async () => {
            toast.success("Ownership transferred successfully");
            await invalidateOrganizationQueries(queryClient, organization_id);
        },

        onError: (error) => {
            toast.error(
                getApiErrorMessage(
                    error,
                    "Failed to transfer ownership."
                )
            );
        }
    });
}