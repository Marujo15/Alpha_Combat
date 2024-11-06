import { userService } from "../services/userService.js";
import { authService } from "../services/authService.js";
import { ErrorApi } from "../errors/ErrorApi.js";

export const authController = {
    authenticate: async (req, res) => {
        const { email, password, token } = req.body;

        try {
            if (token) {
                const { auth, token: jwtToken, id, user } = await authService.authenticateWithGoogle(token);

                if (!auth) {
                    res.status(400).json({ error: "Invalid Google token" });
                    return;
                }

                const maxAge = 5 * 24 * 60 * 60 * 1000;

                res.cookie("session_id", jwtToken, { maxAge, httpOnly: true });

                res.status(200).json({
                    auth,
                    token: jwtToken,
                    id,
                    message: "User successfully authenticated with Google!",
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                    },
                });
            } else if (email && password) {
                const { auth, token: jwtToken, id } = await authService.authenticateUser(email, password);

                if (!auth) {
                    res.status(400).json({ error: "Invalid email and/or password" });
                    return;
                }

                const user = await userService.getUserByEmail(email);

                const maxAge = 5 * 24 * 60 * 60 * 1000;

                res.cookie("session_id", jwtToken, { maxAge, httpOnly: true });

                res.status(200).json({
                    auth,
                    token: jwtToken,
                    id,
                    message: "User successfully authenticated!",
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                    },
                });
            } else {
                res.status(400).json({ error: "Email and password or token are required" });
            }
        } catch (error) {
            if (error instanceof ErrorApi) {
                res.status(error.status).json({ error: error.message });
                return;
            }

            res.status(500).json({ error: "Failed to authenticate user, server error" });
            return;
        }
    },

    logout: (req, res) => {
        try {
            if (!req.cookies.session_id) {
                res
                    .status(400)
                    .json({ success: false, message: "You are not logged in" });
                return;
            }

            res.clearCookie("session_id", { path: "/" });

            res.status(200).json({ success: true, message: "Logout successful" });
            return;
        } catch (error) {
            if (error instanceof ErrorApi) {
                res.status(error.status).json({ error: error.message });
                return;
            }

            res
                .status(500)
                .json({ error: "Internal server error when trying to log out" });
            return;
        }
    },

    setPassword: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { password } = req.body;
      
            if (!password) {
              return res.status(400).json({ message: 'You must set a password to be able to log in locally as well.' });
            }
      
            await authService.setPassword(userId, password);
      
            res.status(200).json({ message: 'Password set successfully.' });
          } catch (error) {
            next(error);
        }
    }
};
