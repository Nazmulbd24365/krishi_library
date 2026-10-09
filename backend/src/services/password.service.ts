import { hash, verify, Algorithm } from '@node-rs/argon2';

// Argon2id parameters (OWASP-recommended baseline).
const options = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, options);
}

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain, options);
  } catch {
    return false;
  }
}
