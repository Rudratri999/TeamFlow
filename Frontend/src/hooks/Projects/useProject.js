import { useQuery } from "@tanstack/react-query";
import { getProject } from "../../services/projectService";

export function useProject(organization_id , project_id){
    return useQuery({
        queryKey:["project" , organization_id , project_id],
        queryFn: () => getProject(organization_id , project_id),
        enabled:!!organization_id && !!project_id
    })
}