import { getUnassignedTask } from "../../services/dashboardService";
import { useQuery } from "@tanstack/react-query";
export function useUnassigneTasks(organization_id){
    return useQuery({
        queryKey:["unassign-tasks" , organization_id],
        queryFn: ()=>getUnassignedTask(organization_id),
        enabled : !!organization_id
    })
}