import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import Logo from '../../components/Logo/Logo.jsx';
import Form from '../../components/Form/Form';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import './RegisterPage.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { user, setUser, login } = useContext(UserContext);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log('Form submitted');
    };

    const handleRegister = async (event) => {
        event.preventDefault();

        console.log("Registering user...");
        console.log("body", { username, password, email });

        try {
            const response = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password, email }),
            });

            if (!response.ok) {
                throw new Error(`Error on request: ${response.statusText}`);
            }

            login({ username, password, email });
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
            <Form title={"CRIAR CONTA"} onSubmit={handleSubmit}>
                <Input type="text" placeholder="APELIDO" onChange={(e) => setUsername(e.target.value)} />
                <Input type="text" placeholder="EMAIL" onChange={(e) => setEmail(e.target.value)} />
                <Input type="email" placeholder="SENHA" onChange={(e) => setPassword(e.target.value)} />
                <div className="register-btns">
                    <Button type="submit" className={"r-back-btn"} onClick={() => {navigate('/login')}}>VOLTAR</Button>
                    <Button type="submit" className={"register-btn"} onClick={handleRegister}>ENTRAR</Button>
                </div>
            </Form>
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
        </div>
    );
};

export default RegisterPage;