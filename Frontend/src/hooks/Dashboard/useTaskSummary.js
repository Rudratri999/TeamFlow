import { getTaskSummary } from "../../services/dashboardService";
import { useQuery } from "@tanstack/react-query";
export function useTaskSummary(organization_id){
    return useQuery({
        queryKey:["task-summary" ,organization_id ],
        queryFn: ()=>getTaskSummary(organization_id),
        enabled: !!organization_id
    })
}