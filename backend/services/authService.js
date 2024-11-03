import jwt from "jsonwebtoken";
import { comparePassword } from "../utils/comparePassword.js";
import { userRepository } from "../repositories/userRepository.js";
import { ErrorApi } from "../errors/ErrorApi.js";
import { SECRET_KEY } from "../config/index.js";
import { OAuth2Client } from 'google-auth-library';
import { userService } from "./userService.js";

const client = new OAuth2Client('911355440047-ou9u9fjvti6gqk0vdrhifog3h9q5epdm.apps.googleusercontent.com');

export const authService = {
    authenticateUser: async (email, password) => {
        try {
            const user = await userRepository.getUserByEmail(email);
            
            console.log(`authService 1: ${JSON.stringify(user, null, 2)}`);

            if (!user) {
                return { auth: false, token: "" };
            }
    
            if (!user.password) {
                return { auth: false, token: "" };
            }

            console.log(`authService 2: ${email}, ${password}`)

            const matchPassword = await comparePassword(password, user.password);
            console.log("Result from matchPassword:", matchPassword);
    
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
            const username = payload.name;

            let user = await userRepository.getUserByEmail(userEmail);

            if (!user) {
                const newUser = {
                    email: userEmail,
                    username: username,
                    password: null,
                };
                user = await userService.createUser(newUser.username, newUser.email, newUser.password, true);
            }

            const jwtToken = jwt.sign({ id: user.id }, SECRET_KEY, {
                expiresIn: "5d",
            });

            return { auth: true, token: jwtToken, id: user.id, user: user };
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to authenticate with Google",
                status: 500,
            });
        }
    },
}
