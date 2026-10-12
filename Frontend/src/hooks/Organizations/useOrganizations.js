import { getMyOrganizations } from "../../services/organizationService";
import {useQuery} from "@tanstack/react-query"

export function useOrganizations(){
    return useQuery({
        queryKey:["organizations"],
        queryFn: ()=> getMyOrganizations()
    })
}