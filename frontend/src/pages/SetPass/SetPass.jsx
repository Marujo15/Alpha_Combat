import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo/Logo.jsx';
import Form from '../../components/Form/Form.jsx';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import './SetPass.css'

const SetPass = ({ title, children, onSubmit }) => {
    const apiUrl = import.meta.env.VITE_API_URL;
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

          const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const userId = decodedToken.id;

          const response = await fetch(`${apiUrl}/users`, {
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ password }),
              credentials: 'include',
          });

          const data = await response.json();

          if (response.status === 200) {
              setSuccessMessage('Senha definida com sucesso.');
              navigate('/dashboard');
          } else {
              setError(data.error || 'Erro ao definir a senha.');
          }
      } catch (error) {
          console.error('Erro na requisição:', error);
          setError('Erro ao definir a senha.');
      }
    };


    return (
        <div className='set-pass-container'>
            <Logo />
            <Form title={"CRIAR SENHA"} onSubmit={handleSubmit}>

            <label className='set-password-text'>Defina uma senha para conseguir, também, logar de maneira local:</label>
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
                <Button type="button" className={"sp-back-btn"} onClick={() => {navigate('/login')}}></Button>
                <Button type="submit" className={"set-pass-btn"}></Button> 
            </div>
            </Form>
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
        </div>
    );
};

export default SetPass;