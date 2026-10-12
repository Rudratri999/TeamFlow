import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { logoutUser, getProfile } from "../services/authService";
import { setRefreshFailureHandler } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)

    const clearAuthentication = useCallback(() => {
        setUser(null)
        queryClient.clear()
        if (user) {
            navigate("/login", { replace: true })
        }
    }, [navigate, queryClient, user])

    const login = async () => {
        const data = await getProfile()
        setUser(data)
    }

    const logout = async () => {
        try {
            await logoutUser()
        } catch (error) {
            console.error("Backend logout request failed:", error)
        } finally {
            clearAuthentication()
        }
    }

    const value = {
        login,
        logout,
        user,
        authLoading,
        isAuthenticated: !!user
    }

    useEffect(() => {
        setRefreshFailureHandler(clearAuthentication)
        return () => setRefreshFailureHandler(null)
    }, [clearAuthentication])

    //  It runs when page refresh after login
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await getProfile()
                setUser(data)
            } catch {
                setUser(null)
            } finally {
                setAuthLoading(false)
            }
        }
        fetchUser()
    }, [])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )

}

// Custom hook
// eslint-disable-next-line react-refresh/only-export-components -- Context hooks are intentionally colocated with their provider.
export function useAuth() {
    return useContext(AuthContext)
}