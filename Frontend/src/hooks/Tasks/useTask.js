import { useQuery } from "@tanstack/react-query";
import { getTask } from "../../services/taskService";

export function useTask(organization_id, projectId, taskId) {
    return useQuery({
        queryKey: ["task", organization_id, projectId, taskId],
        queryFn: () => getTask(organization_id, projectId, taskId),
        enabled: !!organization_id && !!projectId && !!taskId
    });
}