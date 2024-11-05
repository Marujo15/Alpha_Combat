import React, { useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import Logo from '../../components/Logo/Logo.jsx';
import Form from '../../components/Form/Form';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton.jsx';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
    const { user, login, logout } = useContext(UserContext);
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: senha,
                }),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                if (data.auth) {
                    login(data.user);
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

    const handleGoogleLoginSuccess = (credentialResponse) => {
        fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: credentialResponse.credential }),
            credentials: 'include',
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.auth) {
                    login(data.user);
                    navigate('/dashboard');
                } else {
                    setError(data.error || 'Failed to login with Google');
                }
            })
            .catch((error) => {
                setError('An error occurred during login with Google');
                console.error(error);
            });
    };

    const handleGoogleLoginError = () => {
        console.log('Failed to login with Google');
        setError('Failed to login with Google');
    };

    return (
        <div className='login-page-container'>
            <Logo />
            <Form title="LOGIN" onSubmit={handleSubmit}>
                <Input
                    type="email"
                    placeholder="EMAIL"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="SENHA"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                />
                <Button type="submit" className="login-btn">ENTRAR</Button>
                {error && <p className="error-message">{error}</p>}
                <a href="/register">CRIAR CONTA</a>
                <div className="google-btn">
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={handleGoogleLoginError}
                    />
                </div>
                <GoogleSignInButton></GoogleSignInButton>
            </Form>
        </div>
    );
};

export default LoginPage;