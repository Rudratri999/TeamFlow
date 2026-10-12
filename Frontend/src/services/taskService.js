import api from "./api";

export async function getTasks(
    organization_id,
    project_id,
    // For now, if you don't need filtering/pagination, simply call it with {}.
    params = {}
) {
    const response = await api.get(
        `/tasks/organizations/${organization_id}/projects/${project_id}/tasks`,
        { params }
    );

    return response.data;
}

export async function getTask(organization_id, project_id, task_id) {
    const response = await api.get(
        `/tasks/organizations/${organization_id}/projects/${project_id}/tasks/${task_id}`
    );

    return response.data;
}

export async function createTask(organization_id, project_id, data) {
    const response = await api.post(
        `/tasks/organizations/${organization_id}/projects/${project_id}/tasks`,
        { ...data, project_id: Number(project_id) }
    );

    return response.data;
}
export async function updateTask(organization_id, project_id, task_id , data) {
    const response = await api.put(
        `/tasks/organizations/${organization_id}/projects/${project_id}/tasks/${task_id}`,
        data
    );
    return response.data
}
export async function deleteTask(organization_id, project_id, task_id) {
    const response = await api.delete(
        `/tasks/organizations/${organization_id}/projects/${project_id}/tasks/${task_id}`
    )
    return response.data
}
export async function assignTask(
    organization_id,
    project_id,
    task_id,
    user_id
) {
    const response = await api.patch(
        `/organizations/organizations/${organization_id}/projects/${project_id}/task/${task_id}/assignee`,
        { user_id }
    );

    return response.data;
}

export async function unassignTask(organization_id, project_id, task_id) {
    const response = await api.patch(
        `/organizations/organizations/${organization_id}/projects/${project_id}/tasks/${task_id}/unassign`
    );

    return response.data;
}