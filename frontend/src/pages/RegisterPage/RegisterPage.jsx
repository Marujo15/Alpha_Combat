import React, { useContext } from 'react';
import Logo from '../../components/Logo/Logo.jsx';
import Form from '../../components/Form/Form';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import './RegisterPage.css';

const RegisterPage = () => {


    const handleSubmit = (event) => {
        event.preventDefault();
        console.log('Form submitted');
    };

    return (
        <div>
            <Logo />
            <Form title={"CRIAR CONTA"} onSubmit={handleSubmit}>
                <Input type="text" placeholder="APELIDO" />
                <Input type="text" placeholder="EMAIL" />
                <Input type="email" placeholder="SENHA" />
                <div className="register-btns">
                    <Button type="submit" className={"back-btn"}>VOLTAR</Button>
                    <Button type="submit" className={"login-btn"}>ENTRAR</Button>
                </div>
            </Form>
        </div>
    );
};

export default RegisterPage;