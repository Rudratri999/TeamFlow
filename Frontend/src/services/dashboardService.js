import api from "./api";

export async function getdashboard(organization_id) {
    const response = await api.get(`/organizations/organizations/${organization_id}/dashboard`)
    return response.data
}

export async function getTaskSummary(organization_id) {
    const response = await api.get(`/organizations/organizations/${organization_id}/tasks/summary`)
    return response.data
}

export async function getTaskPriority(organization_id) {
    const response = await api.get(`/organizations/organizations/${organization_id}/tasks/priority-summary`)
    return response.data
}
export async function getOverdueTasks(organization_id) {
    const response = await api.get(`/organizations/organizations/${organization_id}/tasks/overdue`)
    return response.data
}
export async function getUnassignedTask(organization_id) {
    const response = await api.get(`/organizations/organizations/${organization_id}/tasks/unassigned`)
    return response.data
}

export async function getTaskDueSoon(organization_id) {
    const response = await api.get(`/organizations/organizations/${organization_id}/tasks/due-soon`)
    return response.data
}

export async function getRecentTasks(organization_id) {
    const response = await api.get(`/organizations/organizations/${organization_id}/tasks/recent`)
    return response.data
}
export async function getRecentUpdated(organization_id) {
    const response = await api.get(`/organizations/organizations/${organization_id}/tasks/recent-updated`)
    return response.data
}
export async function serachTasks(organization_id, query) {
    const response = await api.get(
        `/organizations/organizations/${organization_id}/tasks/search`,
        { params: { query } }
    )
    return response.data
}
export async function serachProjects(organization_id, query) {
    const response = await api.get(
        `/organizations/organizations/${organization_id}/projects/search`,
        { params: { query } }
    )
    return response.data
}