import { getOrganization } from "../../services/organizationService";
import {useQuery} from "@tanstack/react-query"

export function useOrganization(organization_id){
    return useQuery({
        queryKey:["organization" , organization_id],
        queryFn: () => getOrganization(organization_id)
    })
}