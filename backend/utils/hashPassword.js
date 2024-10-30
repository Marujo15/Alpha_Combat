import bcrypt from "bcrypt";

// Function to create a hashed password
export async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        return null;
    }
}
