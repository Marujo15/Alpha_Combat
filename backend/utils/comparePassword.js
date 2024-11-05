import bcrypt from "bcrypt";

export async function comparePassword(
  password,
  hashedPassword
) {
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
  } catch (error) {
    console.error("Error in comparePassword:", error);
    return false;
  }
}
