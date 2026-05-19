import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredPermission }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Yuklanmoqda...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check granular permission if specified
    if (requiredPermission && !user.is_superuser) {
        const hasPermission = user.permissions?.[requiredPermission];
        if (!hasPermission) {
            // Redirect to dashboard or show unauthorized
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
