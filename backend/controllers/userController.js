import { userService } from "../services/userService.js";

export const userController = {
  getAllUsers: async (req, res) => {
    try {
        const allUsers = await userService.getAllUsers();
  
        if (allUsers.length === 0) {
          return res.status(404).json({
            success: false,
            data: "There are no users in the database",
          });
        }
  
        const mappedUsers = allUsers.map((user) => {
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at
          };
        });
  
        res.status(200).json({
          success: true,
          data: mappedUsers,
        });
      } catch (err) {
        console.error(`Error retrieving all users: ${err.message}`);
        res.status(500).json({
          success: false,
          error: "Error retrieving all users:",
        });
    }
  }
};
