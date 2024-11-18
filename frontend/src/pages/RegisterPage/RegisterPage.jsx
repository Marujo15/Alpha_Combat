import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import Logo from '../../components/Logo/Logo.jsx';
import Form from '../../components/Form/Form';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import './RegisterPage.css';

const RegisterPage = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const { user, setUser, login } = useContext(UserContext);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
    };

    const handleRegister = async (event) => {
        event.preventDefault()

        const trimmedUsername = username.trim().replace(/\s+/g, '');

        try {
            const response = await fetch(`${apiUrl}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: trimmedUsername, email, password }),
            });

            if (!response.ok) {
                throw new Error(`Error on request: ${response.statusText}`);
            }

            setSuccessMessage("Registered successfully! Redirecting...");
            setTimeout(() => {
                setSuccessMessage("");
                navigate("/dashboard");
            }, 2000);
        } catch (error) {
            console.error("Error registering user:", error);
            setError("Error registering user. Please, try again.");
            setTimeout(() => {
                setError("");
            }, 3000);
        }
    };

    return (
        <div className='register-container'>
            <Logo />
            <Form title={"CRIAR CONTA"} onSubmit={handleRegister}>
                <Input type="text" placeholder="APELIDO" onChange={(e) => setUsername(e.target.value)} />
                <Input type="text" placeholder="EMAIL" onChange={(e) => setEmail(e.target.value)} />
                <div className="password-input-container">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="SENHA"
                        onChange={(e) => setPassword(e.target.value)} />
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
                <ul className="register-password">A senha deve conter:
                    <li>8 caracteres</li>
                    <li>1 letra maiúscula</li>
                    <li>1 número</li>
                    <li>1 caractere especial</li>
                </ul>
                <div className="register-btns">
                    <Button type="submit" className={"register-btn"}></Button>
                    <Button type="submit" className={"r-back-btn"} onClick={() => {navigate('/login')}}></Button>
                </div>
            </Form>
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
        </div>
    );
};

export default RegisterPage;