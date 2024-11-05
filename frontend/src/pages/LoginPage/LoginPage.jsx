import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import Logo from '../../components/Logo/Logo.jsx';
import Form from '../../components/Form/Form';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton.jsx';
import './LoginPage.css';

const LoginPage = () => {
    const { user, login, logout } = useContext(UserContext);

    const handleLogin = () => {
        // Simule o login com dados de usuário
        const userData = { id: '123', name: 'John Doe' };
        login(userData);
    };

    const handleLogout = () => {
        logout();
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log('Form submitted');
    };

    return (
        <div className='login-page-container'>
            <Logo />
            <Form title={"LOGIN"} onSubmit={handleSubmit}>
                <Input type="text" placeholder="EMAIL" />
                <Input type="email" placeholder="SENHA" />
                <Button type="submit" className={"login-btn"}>ENTRAR</Button>
                <a href="/register">CRIAR CONTA</a>
                <GoogleSignInButton></GoogleSignInButton>
            </Form>
        </div>
    );
};

export default LoginPage;