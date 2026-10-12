import { getRecentUpdated } from "../../services/dashboardService";
import { useQuery } from "@tanstack/react-query";
export function useRecentUpdatedTasks(organization_id){
    return useQuery({
        queryKey:["recent-updated-tasks" , organization_id],
        queryFn: () => getRecentUpdated(organization_id),
        enabled: !!organization_id
    })
}