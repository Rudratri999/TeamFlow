import { useQuery } from "@tanstack/react-query";
import { getdashboard } from "../../services/dashboardService";
export function useDashboard(organization_id) {
    return useQuery({
        queryKey: ["dashboard", organization_id],
        queryFn: () => getdashboard(organization_id),
        enabled: !!organization_id
    })
}