import { pool } from "../database/database.js";
import { ErrorApi } from "../errors/ErrorApi.js";

export const userRepository = {
    getAllUsers: async () => {
        try {
            const { rows } = await pool.query(`SELECT id, username, email, created_at FROM users`);
            return rows;
        } catch (error) {

            throw new ErrorApi({
                message: "Error updating users",
                status: 500,
            });
        }
    },

    createUser: async (
        username,
        email,
        password,
        authProvider
    ) => {
        //foi adicionado o parâmetro authProvider para criar um novo usuário (ele pode ser 'local' ou 'google')
        
        const query = `
            INSERT INTO users (username, email, password, authProvider) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, username, email, authProvider
            `;

        try {
            const result = await pool.query(query, [username, email, password, authProvider]);

            return result.rows[0];
        } catch (error) {
            console.error("Error creating user:", error);

            throw new ErrorApi({
                message: "Failed to create user.",
                status: 500,
            });
        }
    },

    getUserByUsername: async (username) => {
        const query = "SELECT * FROM users WHERE username=$1";

        try {
            const result = await pool.query(query, [username]);

            return result.rows;
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to locate the user by username.",
                status: 404,
            });
        }
    },

    getUserByEmail: async (email) => {
        const query = "SELECT * FROM users WHERE email=$1";

        try {
            const result = await pool.query(query, [email]);
            return result.rows[0];
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to locate the user by email.",
                status: 404,
            });
        }
    },

    getUserById: async (userId) => {
        try {
            const result = await pool.query(
                `SELECT *
                FROM users WHERE id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                throw new ErrorApi({
                    message: `User ${userId} was not found`,
                    status: 404,
                });
            }

            return result.rows[0];
        } catch (error) {
            console.error("Error while fetching user by ID:", error);

            throw new ErrorApi({
                message: "Failed to retrieve user by ID.",
                status: 500,
            });
        }
    },

    updateUser: async (id, userData) => {
        const { username, email, password } = userData;
        const query = `
            UPDATE users
            SET username=$1, email=$2, password=$3
            WHERE id=$4
            RETURNING id, username, email, created_at
            `;
        const values = [username, email, password, id]

        try {
            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                throw new ErrorApi({
                    message: `User ${id} was not found on DB`,
                    status: 404,
                });
            }

            return result.rows[0];
        } catch (error) {
            console.error("Error while updating user:", error);
            throw new ErrorApi({
                message: "Failed to update user on DB",
                status: 500,
            })
        }
    },

    deleteUser: async (id) => {
        const query = `
            DELETE FROM users WHERE id = $1 RETURNING *
        `

        try {
            const result = await pool.query(query, [id]);

            return result.rows[0];
        } catch (error) {
            throw new ErrorApi({
                message: "Failed to delete user on DB",
                status: 500,
            })
        }
    },
}



