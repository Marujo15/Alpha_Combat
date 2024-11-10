import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import Logo from '../../components/Logo/Logo.jsx';
import Form from '../../components/Form/Form';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton.jsx';
import './LoginPage.css';

const LoginPage = () => {
    const { user, login, logout } = useContext(UserContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleLogin = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                if (data.auth) {
                    const userData = {
                        user: data.user,
                        token: data.token
                    };
                    login(userData);
                    navigate('/dashboard');
                } else {
                    setError(data.error || 'Failed to login');
                }
            } else {
                setError(data.error || 'An error occurred during login');
            }
        } catch (error) {
            setError('Failed to login');
            console.error(error);
        }
    };

    const handleGoogleLoginSuccess = async (credentialResponse) => {
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential }),
                credentials: 'include',
            });
        
            const data = await response.json();
        
            if (data.auth) {
                login(data.user);
        
                localStorage.setItem('token', data.token);
        
                if (data.needsPassword) {
                    console.log('User needs to set password. Redirecting to /set-password');
                    navigate('/set-password');
                    // se o usuário precisar definir uma senha, redireciona para a página set-password
                } else {
                    console.log('User does not need to set password. Redirecting to /dashboard');
                    navigate('/dashboard');
                    //caso contrário, redireciona para o dashboard
                }
            } else {
                console.log('Authentication failure:', data.error);
                setError(data.error || 'Failed to login with Google');
            }
        } catch (error) {
            console.error('Request error:', error);
            setError('An error occurred during login with Google');
        }
        
    };

    const handleGoogleLoginError = () => {
        console.log('Failed to login with Google');
        setError('Failed to login with Google');
    };

    return (
        <div className='login-page-container'>
            <Logo />
            <Form title="LOGIN" onSubmit={handleLogin}>
                <Input
                    type="email"
                    placeholder="EMAIL"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="SENHA"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit" className="login-btn"></Button>
                {error && <p className="error-message">{error}</p>}
                <a href="/register"></a>
                <div className="google-btn">
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={handleGoogleLoginError}
                    />
                </div>
            </Form>
        </div>
    );
};

export default LoginPage;