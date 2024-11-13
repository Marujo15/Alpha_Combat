import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';

const ProtectedRoute = ({ children }) => {
    const { user } = useContext(UserContext);

    // Redireciona apenas se o usuário não estiver autenticado
    if (!user || !user.token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
