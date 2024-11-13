import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

    if (!user || !user.token) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;