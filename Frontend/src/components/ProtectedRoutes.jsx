import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

// Here children means whatever you put inside the protected routes
const ProtectedRoutes = ({ children }) => {
    const { isAuthenticated, authLoading } = useAuth()
    if (authLoading) {
        return <p>Loading......</p>
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }
    return children
}

export default ProtectedRoutes
