import api from "./api";

export async function createOrganization(data) {
    const response = await api.post("/organizations/create-organization", data)
    return response.data
}

// _________ Get endpoints __________________

export async function getMyOrganizations() {
    const response = await api.get("/organizations/organizations")
    return response.data
}

export async function getOrganization(organization_id) {
    const response = await api.get(`/organizations/organizations/${organization_id}`)
    return response.data
}
export async function getOrganizationMembership(organization_id) {
    const response = await api.get(
        `/organizations/organizations/${organization_id}/membership`
    )

    return response.data
}
export async function getOrganizationMembers(organization_id) {
    const response = await api.get(`/organizations/organizations/${organization_id}/members`)
    return response.data
}
export async function addOrganizationMember(organization_id, user_id) {
    const response = await api.post(
        `/organizations/organizations/${organization_id}/members`,
        { user_id }
    )

    return response.data
}
export async function getOrganizationMembersDetail(organization_id) {
    const response = await api.get(
        `/organizations/organizations/${organization_id}/members/details`
    );

    return response.data;
}

export async function getMemberTasks(organization_id, user_id) {
    const response = await api.get(
        `/organizations/organizations/${organization_id}/users/${user_id}/tasks`
    );

    return response.data;
}

export async function getMyTasks(organization_id) {
    const response = await api.get(
        `/organizations/organizations/${organization_id}/my_tasks`
    );

    return response.data;
}

export async function getMyProjects(organization_id) {
    const response = await api.get(
        `/organizations/organizations/${organization_id}/my_projects`
    );

    return response.data;
}

export async function removeOrganizationMember(organization_id, user_id) {
    const response = await api.delete(
        `/organizations/organizations/${organization_id}/members/${user_id}`
    );

    return response.data;
}

export async function changeOrganizationMemberRole(
    organization_id,
    user_id,
    role
) {
    const response = await api.patch(
        `/organizations/organizations/${organization_id}/members/${user_id}/role`,
        { role }
    );

    return response.data;
}

export async function updateOrganization(organization_id, data) {
    const response = await api.patch(
        `/organizations/organizations/${organization_id}`,
        data
    );

    return response.data;
}

export async function deleteOrganization(organization_id) {
    const response = await api.delete(
        `/organizations/organizations/${organization_id}`
    );

    return response.data;
}

export async function leaveOrganization(organization_id) {
    const response = await api.delete(
        `/organizations/organizations/${organization_id}/leave`
    );

    return response.data;
}

export async function transferOrganizationOwnership(
    organization_id,
    user_id
) {
    const response = await api.patch(
        `/organizations/organizations/${organization_id}/owner`,
        { user_id }
    );

    return response.data;
}