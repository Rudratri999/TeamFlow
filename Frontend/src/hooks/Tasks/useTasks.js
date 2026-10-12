import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../../services/taskService";
export function useTasks(organization_id, project_id, params = {}) {
    return useQuery({
        queryKey: ["tasks", organization_id, project_id, params],
        queryFn: () => getTasks(organization_id, project_id, params),
        enabled: !!organization_id && !!project_id
    });
}