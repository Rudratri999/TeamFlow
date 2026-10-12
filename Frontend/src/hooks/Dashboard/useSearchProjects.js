import { useQuery } from "@tanstack/react-query";
import { serachProjects } from "../../services/dashboardService";
export function useSearchProjects(organization_id , query){
    return useQuery({
        queryKey:["search-projects" , organization_id , query],
        queryFn: () => serachProjects(organization_id , query),
        enabled:!!organization_id && !!query
    })
}