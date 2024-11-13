import React, { createContext, useEffect, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        setUser(userData);
        // Armazena todas as informações do usuário, incluindo o token, em um único objeto `user` no localStorage
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        // Remove o `user` do localStorage ao fazer logout
        localStorage.removeItem("user");
    };

    useEffect(() => {
        // Ao inicializar, busca o `user` do localStorage (se estiver logado previamente)
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};
