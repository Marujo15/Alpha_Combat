import bcrypt from "bcrypt";

// Função para criar um hash seguro para a senha
export async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        return null;
    }
}
