import api from "./api";
export async function getProjects(organization_id) {
    const response = await api.get(`/projects/organizations/${organization_id}/projects`)
    return response.data
}
export async function createProject(organization_id, data) {
    const response = await api.post(
        `/projects/organizations/${organization_id}/projects`,
        { ...data, organization_id: Number(organization_id) }
    );
    return response.data;
}
export async function getProject(organization_id, project_id) {
    const response = await api.get(
        `/projects/organizations/${organization_id}/projects/${project_id}`
    );

    return response.data;
}
export async function updateProject(organization_id, project_id, data) {
    const response = await api.patch(
        `/projects/organizations/${organization_id}/projects/${project_id}`,
        data
    );

    return response.data;
}
export async function deleteProject(organization_id, project_id) {
    const response = await api.delete(
        `/projects/organizations/${organization_id}/projects/${project_id}`
    );

    return response.data;
}