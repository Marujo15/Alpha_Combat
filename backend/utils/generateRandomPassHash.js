import crypto from 'crypto';
import bcrypt from 'bcrypt';

export async function generateRandomPassHash() {
  try {
    const randomBytes = crypto.randomBytes(32);
    //gerando uma sequencia de bytes aleatória
    const randomHash = randomBytes.toString('hex');
    //transformando essa sequencia de bytes em uma string
    return randomHash;
    } catch (error) {
        return null;
    };
}