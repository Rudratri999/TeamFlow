import api from "./api"

export async function registerUser(data) {
    const response = await api.post("/auth/register", data)
    return response.data
}
export async function loginUser(credentials) {
    const response = await api.post("/auth/login", credentials)
    return response.data
}
export async function logoutUser() {
    const response = await api.post("/auth/logout")
    return response.data
}
export async function getProfile() {
    const response = await api.get("/auth/profile")
    return response.data
}