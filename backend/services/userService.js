import { userRepository } from "../repositories/userRepository.js";
import { validateEmail, validatePassword, validateName, } from "../utils/validation.js";
import { hashPassword } from "../utils/hashPassword.js";
import { ErrorApi } from "../errors/ErrorApi.js";

export const userService = {
    createUser: async (username, email, password) => {
        try {
            const result1 = await validateName(username);
            if (!result1.passed) {
                throw result1.error;
            }

            const result2 = await validateEmail(email);
            if (!result2.passed) {
                throw result2.error;
            }

            const result3 = validatePassword(password);
            if (!result3.passed) {
                throw result3.error;
            }

            const hashedPassword = await hashPassword(password);

            if (!hashedPassword) {
                throw new ErrorApi({
                    message: "Failed to hash password.",
                    status: 500,
                });
            }

            const user = await userRepository.createUser(
                username,
                email,
                hashedPassword,
            );

            return user;
        } catch (error) {
            throw error;
        }
    },

    getUserById: async (id) => {
        try {
            const user = await userRepository.getUserById(id);
            return {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
            };
        } catch (error) {
            throw error;
        }
    },

    getAllUsers: async () => {
        try {
            const users = await userRepository.getAllUsers();
            return users;
        } catch (error) {
            throw error;
        }
    },

    getUserByEmail: async (email) => {
        try {
            const user = await userRepository.getUserByEmail(email);

            if (!user || !(user.length > 0)) {
                throw new ErrorApi({
                    message: "User not found",
                    status: 404,
                });
            }

            return user[0];
        } catch (error) {
            throw error;
        }
    },

    deleteUser: async (id) => {
        try {
            const user = await userRepository.deleteUser(id);

            return user;
        } catch (error) {
            throw error;
        }
    },

    updateUser: async (id, fields) => {
        try {
            const oldUser = await userRepository.getUserById(id);

            if (!oldUser) {
                throw new Error("User does not exist");
            }

            let username;
            let email;
            let password;

            if (!!fields.username) {
                const result1 = await validateName(fields.username);


                if (!result1.passed) {
                    throw result1.error;
                }
                username = fields.username;
            }

            if (!!fields.email) {
                const result2 = await validateEmail(fields.email);
                if (!result2.passed) {
                    throw result2.error;
                }
                email = fields.email;
            }

            if (!!fields.password) {
                const result3 = validatePassword(fields.password);
                if (!result3.passed) {
                    throw result3.error;
                }
                password = await hashPassword(fields.password);
            }

            const newUser = {
                username: username || oldUser.username,
                email: email || oldUser.email,
                password: password || oldUser.password,
            };

            const updatedUser = await userRepository.updateUser(id, newUser);
            return updatedUser;
        } catch (error) {
            throw new ErrorApi({
                message: error.message,
                status: 500,
            });
        }
    },
}

