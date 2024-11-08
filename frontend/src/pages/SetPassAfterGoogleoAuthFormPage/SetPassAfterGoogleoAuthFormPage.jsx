import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo/Logo.jsx';
import Form from '../../components/Form/Form.jsx';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import './SetPassAfterGoogleoAuthForm.css'

const SetPassAfterGoogleoAuthFormPage = ({ title, children, onSubmit }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();


    const handleSubmit = async (event) => {
        event.preventDefault();
    
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }

        try {
            const token = localStorage.getItem('token');
            console.log("o token que está vindo para cá:" + token);

            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const userId = decodedToken.id;
            console.log("o user id que está vindo pra cá:" + userId);

            const response = await fetch(`http://localhost:3000/api/users`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ password }),
              credentials: 'include',
            });

            const data = await response.json();
      
            if (response.ok) {
              setSuccessMessage('Password set successfully.');
            } else {
              setError('Error setting password.');
            }
        } catch (error) {
        console.error('Request error:', error);
        setError('Error setting password.');
        }

        console.log('Form submitted');
    };


    return (
        <div className='set-pass-container'>
            <Logo />
            <Form title={"CRIAR SENHA"} onSubmit={handleSubmit}>

            <label>"Defina uma senha para conseguir logar de maneira local:</label>
            <Input
                type="password"
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <Input
                type="password"
                placeholder="Confirme a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />    
            <div className="set-pass-btns">
                <Button type="button" className={"sp-back-btn"} onClick={() => {navigate('/login')}}>Voltar</Button>
                <Button type="submit" className={"set-pass-btn"}>Definir Senha</Button> 
            </div>
            </Form>
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
        </div>
    );
};

export default SetPassAfterGoogleoAuthFormPage;