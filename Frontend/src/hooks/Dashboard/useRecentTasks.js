import { getRecentTasks } from "../../services/dashboardService";
import { useQuery } from "@tanstack/react-query";
export function useRecentTasks(organization_id) {
    return useQuery({
        queryKey: ["recent-Tasks", organization_id],
        queryFn: () => getRecentTasks(organization_id),
        enabled: !!organization_id
    })
}