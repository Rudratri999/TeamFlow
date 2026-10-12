export function canManageOrganization(role) {
    return role === "owner" || role === "admin"
}
