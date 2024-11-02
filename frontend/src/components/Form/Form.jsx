import React from 'react';
import './Form.css';

const Form = ({ title, children, onSubmit }) => {
    return (
        <form className="form" onSubmit={onSubmit}>
            <h1>{title}</h1>
            {children}
        </form>
    );
};

export default Form;