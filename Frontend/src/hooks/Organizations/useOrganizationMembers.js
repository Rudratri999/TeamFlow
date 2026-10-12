import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    addOrganizationMember,
    getMemberTasks,
    getOrganizationMembership,
    getOrganizationMembersDetail,
    removeOrganizationMember,
    changeOrganizationMemberRole
} from "../../services/organizationService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

export function useOrganizationMembership(organization_id) {
    return useQuery({
        queryKey: ["organizationMembership", organization_id],
        queryFn: () => getOrganizationMembership(organization_id),
        enabled: !!organization_id
    });
}

export function useOrganizationMembersDetail(organization_id) {
    return useQuery({
        queryKey: ["organizationMembers", organization_id],
        queryFn: () => getOrganizationMembersDetail(organization_id),
        enabled: !!organization_id
    });
}

export function useAddOrganizationMember(organization_id) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (user_id) => addOrganizationMember(organization_id, user_id),
        onSuccess: async () => {
            toast.success("Member added successfully");

            await queryClient.invalidateQueries({
                queryKey: ["organizationMembers", organization_id]
            });
        },
        onError: (error) => {
            const status = error?.response?.status;
            const messageByStatus = {
                401: "You are not authorized to add members to this organization.",
                403: "You are not authorized to add members to this organization.",
                404: "User not found. Check the user ID and try again.",
                409: "This user is already a member of this organization."
            };
            const message = messageByStatus[status]
                ?? getApiErrorMessage(error, "Failed to add member.");

            toast.error(message);
        }
    });
}

export function useRemoveOrganizationMember(organization_id) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (user_id) =>
            removeOrganizationMember(organization_id, user_id),

        onSuccess: async () => {
            toast.success("Member removed successfully");

            await queryClient.invalidateQueries({
                queryKey: ["organizationMembers", organization_id]
            });
        },

        onError: (error) => {
            toast.error(
                getApiErrorMessage(error, "Failed to remove member.")
            );
        }
    });
}

export function useChangeOrganizationMemberRole(organization_id) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ user_id, role }) =>
            changeOrganizationMemberRole(
                organization_id,
                user_id,
                role
            ),

        onSuccess: async () => {
            toast.success("Member role updated successfully");

            await queryClient.invalidateQueries({
                queryKey: ["organizationMembers", organization_id]
            });
        },

        onError: (error) => {
            toast.error(
                getApiErrorMessage(error, "Failed to change member role.")
            );
        }
    });
}

export function useMemberTasks(organization_id, user_id, enabled = true) {
    return useQuery({
        queryKey: ["memberTasks", organization_id, user_id],
        queryFn: () => getMemberTasks(organization_id, user_id),
        enabled: !!organization_id && !!user_id && enabled
    });
}