import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../../services/projectService";

export function useProjects(organization_id){
    return useQuery({
        queryKey:["projects" , organization_id],
        queryFn: () => getProjects(organization_id),
        enabled:!!organization_id
    })
}