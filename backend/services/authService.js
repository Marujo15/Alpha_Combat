import jwt from "jsonwebtoken";
import { comparePassword } from "../utils/comparePassword.js";
import { userRepository } from "../repositories/userRepository.js";
import { ErrorApi } from "../errors/ErrorApi.js";
import { SECRET_KEY } from "../config/index.js";
import { OAuth2Client } from 'google-auth-library';
import { userService } from "./userService.js";
import { generateNickname } from "../utils/generateNickName.js";
import { hashPassword } from "../utils/hashPassword.js";

const client = new OAuth2Client('911355440047-ou9u9fjvti6gqk0vdrhifog3h9q5epdm.apps.googleusercontent.com');

export const authService = {
    authenticateUser: async (email, password) => {
        try {
            const user = await userRepository.getUserByEmail(email);

            if (!user || !user.password) {
                return { auth: false, token: "" };
            }

            const matchPassword = await comparePassword(password, user.password);
    
            if (matchPassword) {
                const token = jwt.sign({ id: user.id }, SECRET_KEY, {
                    expiresIn: "5d",
                });
    
                return { auth: true, token, id: user.id };
            }
    
            return { auth: false, token: "" };
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to authenticate user",
                status: 500,
            });
        }
    },
    
    authenticateWithGoogle: async (token) => {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: '911355440047-ou9u9fjvti6gqk0vdrhifog3h9q5epdm.apps.googleusercontent.com',
            });

            const payload = ticket.getPayload();
            const userEmail = payload.email;
            const name = payload.name;
            const username = generateNickname(name);

            let user = await userRepository.getUserByEmail(userEmail);
            
            //se esse usuário autenticado com Google oAuth ainda não estiver na tabela 'users' do banco de dados (primeiro acesso), essa entidade será criada:
            if (!user) {

                const newUser = {
                    email: userEmail,
                    username: username,
                    password: null,
                    //é melhor que a password seja null, inicialmente, mesmo
                    authProvider: 'google',
                };
                //será criado um usuário com o authProvider (nova coluna que criei na tabela 'users') 'google', afinal ele entrou com o Google o Auth

                user = await userService.createUser(newUser.username, newUser.email, newUser.password, newUser.authProvider);
            }

            const jwtToken = jwt.sign({ id: user.id }, SECRET_KEY, {
                expiresIn: "5d",
            });
          
            console.log({ auth: true, token: jwtToken, id: user.id, user: user })

            return { auth: true, token: jwtToken, id: user.id, user: user };
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to authenticate with Google",
                status: 500,
            });
        }
    },

    setPassword: async (userId, password) => {
        try {
          const user = await userRepository.getUserById(userId);
    
          if (!user) {
            throw new ErrorApi({ message: 'User not found.', status: 404 });
          }
    
          if (user.password) {
            throw new ErrorApi({ message: 'Password already defined.', status: 400 });
          }
    
          const hashedPassword = await hashPassword(password);
          await userService.updateUserPassword(userId, hashedPassword);
    
          return true;
        } catch (error) {
          throw error;
        }
      },
}
