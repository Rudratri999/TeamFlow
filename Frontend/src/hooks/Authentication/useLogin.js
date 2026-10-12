import { loginUser } from "../../services/authService";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {  useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function useLogin() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const loginMutation = useMutation({
        mutationFn: loginUser,
        onSuccess: async () => {
            await login()
            toast.success("Login Successfully")
            navigate("/organizations", { replace: true })
        },
        onError: (error) => {
            toast.error(
                error.response?.data?.detail || "Login failed"
            );
        }
    })
    return loginMutation
}

// Login form → Zod validation → useLogin → loginUser() → /auth/login → JWT cookies → login() in AuthContext → getProfile() → setUser()