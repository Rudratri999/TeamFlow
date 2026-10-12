import { useQuery } from "@tanstack/react-query";
import {
    getMyProjects,
    getMyTasks
} from "../../services/organizationService";

export function useMyTasks(organization_id) {
    return useQuery({
        queryKey: ["myTasks", organization_id],
        queryFn: () => getMyTasks(organization_id),
        enabled: !!organization_id
    });
}

export function useMyProjects(organization_id) {
    return useQuery({
        queryKey: ["myProjects", organization_id],
        queryFn: () => getMyProjects(organization_id),
        enabled: !!organization_id
    });
}
