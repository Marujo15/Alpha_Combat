import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const LandingPage = () => {
    const { user, login, logout } = useContext(UserContext);

    const handleLogin = () => {
        // Simule o login com dados de usuário
        const userData = { id: '123', name: 'John Doe' };
        login(userData);
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Welcome to the Landing Page</h1>
            {user ? (
                <div style={styles.userInfo}>
                    <p>User ID: {user.id}</p>
                    <p>User Name: {user.name}</p>
                    <button style={styles.button} onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <button style={styles.button} onClick={handleLogin}>Login</button>
            )}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
    },
    title: {
        fontSize: '2rem',
        marginBottom: '1rem',
    },
    userInfo: {
        textAlign: 'center',
    },
    button: {
        padding: '0.5rem 1rem',
        fontSize: '1rem',
        cursor: 'pointer',
        marginTop: '1rem',
    },
};

export default LandingPage;