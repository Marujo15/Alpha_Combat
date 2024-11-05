import { userService } from "../services/userService.js";
import { ErrorApi } from "../errors/ErrorApi.js";

export const userController = {
    getUserMe: async (req, res) => {
        const response = { success: false };

        try {
            const userId = req.user ?? "";

            if (!userId) {
                throw new ErrorApi({
                    message: "User ID not found",
                    status: 401,
                });
            }

            const user = await userService.getUserById(userId);

            response.success = true;
            response.data = user;
            response.message = "User found successfully";

            res.status(200).json(response);
        } catch (error) {
            if (error instanceof ErrorApi) {
                response.message = error.message;

                res.status(error.status).json(response);
                return;
            } else {
                response.message = "Unable to find information";

                res.status(401).json(response);
                return;
            }
        }
    },

    getUserById: async (req, res) => {
        const response = { success: false };

        try {
            const userId = req.params.userId;
            const userIdOnToken = req.user

            if (!userIdOnToken) {
                throw new ErrorApi({
                    message: "User not authenticated",
                    status: 401,
                });
            }

            if (userIdOnToken !== userId) {
                throw new ErrorApi({
                    message: "You are not authorized to access this user",
                    status: 403,
                });
            }

            const user = await userService.getUserById(userId);

            response.data = user;
            response.success = true;
            response.message = "User retrieved successfully";

            res.status(200).json(response);
        } catch (error) {
            console.error(error);

            if (error instanceof ErrorApi) {
                res.status(error.status).json({
                    error: error.message,
                });

                return;
            }

            res.status(403).json({
                data: null,
                error: "Permission denied, you need to be an admin",
            });
        }
    },

    getAllUsers: async (req, res) => {
        const response = { success: false };
        try {
            const users = await userService.getAllUsers();

            response.data = users;
            response.success = true;
            response.message = "Users retrieved successfully";

            res.status(200).json(response);
        } catch (error) {
            if (error instanceof ErrorApi) {
                res.status(error.status).json({
                    data: null,
                    error: error.message,
                });
                return;
            }
            console.error(error);

            res.status(500).json({ data: null, error: "Internal server error" });
        }
    },

    createUser: async (req, res) => {
        const response = { success: false };

        try {
            const { username, email, password } = req.body;
            let authProvider;
            if(!req.body.authProvider) {
                //se não houver um authProvider no corpo da requisição, significa que é 'local'
               authProvider = 'local';
            }

            const user = await userService.createUser(
                username,
                email,
                password,
                authProvider
            );

            response.data = user;
            response.success = true;
            response.message = "User successfully registered";

            res.status(201).json(response);
        } catch (error) {
            if (error instanceof ErrorApi) {
                response.message = error.message;

                res.status(error.status).json(response);
                return;
            } else {
                response.message = "Failed to register the user!";

                res.status(500).json(response);
                return;
            }
        }
    },

    updateUser: async (req, res) => {
        try {
            const userId = req.user
            const { username, email, password } = req.body

            const updatedUser = await userService.updateUser(userId, { username, email, password });
            if (updatedUser) res.json(updatedUser);
            else res.status(404).json({ error: "User not found" });
        } catch (error) {
            if (error instanceof ErrorApi) {
                res.status(error.status).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    },

    deleteUser: async (req, res) => {
        try {
            const userId = req.params.userId;
            const userIdOnToken = req.user

            if (!userIdOnToken) {
                throw new ErrorApi({
                    message: "User not authenticated",
                    status: 401,
                });
            }

            if (userIdOnToken !== userId) {
                throw new ErrorApi({
                    message: "You are not authorized to access this user",
                    status: 403,
                });
            }

            const deletedUser = await userService.deleteUser(userId);

            if (deletedUser) {
                res.json({ message: "User deleted successfully" })
            } else {
                res.status(404).json({ error: "User not found" })
            };
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};
