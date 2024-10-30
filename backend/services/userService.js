import { userRepository } from "../repositories/userRepository.js";

export const userService = {
  getAllUsers: async () => {
    try {
      return await userRepository.getAllUsers();
    } catch (err) {
      console.error(`Error retrieving all users: ${err.message}`);
      throw err;
    }
  }
};
