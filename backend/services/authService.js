import jwt from "jsonwebtoken";
import { comparePassword } from "../utils/comparePassword.js";
import { userRepository } from "../repositories/userRepository.js";
import { ErrorApi } from "../errors/ErrorApi.js";
import { SECRET_KEY } from "../config/index.js";

export const authService = {
    authenticateUser: async (email, password) => {
        try {
            const user = await userRepository.getUserByEmail(email);

            if (!user || !(user.length > 0)) {
                return { auth: false, token: "" };
            }

            const matchPassword = await comparePassword(password, user[0].password);

            if (matchPassword) {
                const token = jwt.sign({ id: user[0].id }, SECRET_KEY, {
                    expiresIn: "5d",
                });

                return { auth: true, token, id: user[0].id };
            }

            return { auth: false, token: "" };
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to authenticate user",
                status: 500,
            });
        }

    }
}
