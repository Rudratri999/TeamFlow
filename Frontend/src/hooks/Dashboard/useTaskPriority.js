import { getTaskPriority } from "../../services/dashboardService";
import { useQuery } from "@tanstack/react-query";

export function useTaskPriority(organization_id){
    return useQuery({
        queryKey:["task-priority" , organization_id],
        queryFn: () => getTaskPriority(organization_id),
        enabled:!!organization_id
    })
}

// ()=> uses so it does not immediately run it verify the id then run