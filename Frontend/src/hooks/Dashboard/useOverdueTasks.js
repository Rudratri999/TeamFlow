import { getOverdueTasks } from "../../services/dashboardService";
import { useQuery } from "@tanstack/react-query";
export function useOverdueTasks(organization_id){
    return useQuery({
        queryKey:["overdue-tasks" , organization_id],
        queryFn: () => getOverdueTasks(organization_id),
        enabled : !!organization_id
    })
}