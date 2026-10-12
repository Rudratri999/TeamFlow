import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { registerUser } from "../../services/authService"
import { useNavigate } from "react-router-dom"

export function useRegister() {
    const navigate = useNavigate()
    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            toast.success("Registered Successfully")
            navigate("/login", { replace: true })
        },
        onError: (error) => {
            toast.error(
                error.response?.data?.detail || "Registered failed"

            )
        }
    })

    return registerMutation
}

// Register form → React Hook Form/Zod → useRegister → React Query mutation → authService → FastAPI → success → /login.