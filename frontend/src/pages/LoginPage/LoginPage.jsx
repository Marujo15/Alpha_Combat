import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import Logo from '../../components/Logo/Logo.jsx';
import Form from '../../components/Form/Form';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import './LoginPage.css';

const LoginPage = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const { user, login, logout } = useContext(UserContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user]);

    const handleLogin = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(`${apiUrl}/auth/login`, {
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
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential }),
                credentials: 'include',
            });
        
            const data = await response.json();
        
            if (data.auth) {
                login(data);
        
                localStorage.setItem('token', data.token);
            } else {
                setError(data.error || 'Failed to login with Google');
            }
        } catch (error) {
            console.error('Request error:', error);
            setError('An error occurred during login with Google');
        }
        
    };

    const handleGoogleLoginError = () => {
        setError('Failed to login with Google');
    };

    const handleRegisterClick = () => {
        navigate("/register");
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
                <div className="password-input-container">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="SENHA"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className="toggle-password-visibility"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        <img
                            src={showPassword ? "./public/assets/Lock.svg" : "./public/assets/Lock_Open.svg"}
                            alt={showPassword ? "Hide password" : "Show password"}
                            className="password-visibility-icon"
                        />
                    </button>
                </div>
                <Button type="submit" className="login-btn"></Button>
                {error && <p className="error-message">{error}</p>}
                <Button className='register' onClick={handleRegisterClick}>CRIAR CONTA</Button>
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