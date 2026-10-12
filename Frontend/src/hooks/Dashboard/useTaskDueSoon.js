import { getTaskDueSoon } from "../../services/dashboardService";
import { useQuery } from "@tanstack/react-query";

export function useTaskDueSoon(organization_id) {
    return useQuery({
        queryKey: ["tasks-dueSoon", organization_id],
        queryFn: () => getTaskDueSoon(organization_id),
        enabled: !!organization_id
    })
}