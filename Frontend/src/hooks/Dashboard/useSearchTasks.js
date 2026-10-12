import {useQuery} from "@tanstack/react-query";
import { serachTasks } from "../../services/dashboardService";

export function useSearchTasks(organization_id , query){
    return useQuery({
        queryKey:["search-tasks" , organization_id , query],
        queryFn: () => serachTasks(organization_id , query),
        enabled:!!organization_id && !!query
    })
}