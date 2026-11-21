import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

export const DEFAULT_USER = {
  email: 'eng.amralihassan@gmail.com',
  password: 'password123',
  name: 'Amr Al-Hassan',
};

const JWT_SECRET =
  process.env.JWT_SECRET || 'digital-paper-agenda-development-secret';
const JWT_EXPIRES_IN = '30d';
const SALT_ROUNDS = 10;

export interface AuthUserPayload {
  userId: string;
  email: string;
  name?: string | null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function generateToken(user: {
  id: string;
  email: string;
  name?: string | null;
}): string {
  const payload: AuthUserPayload = {
    userId: user.id,
    email: user.email,
    name: user.name ?? null,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthUserPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  return decoded as AuthUserPayload;
}

/**
 * Guarantees the single account always exists, even after a database reset.
 * Existing passwords are never overwritten.
 */
export async function ensureDefaultUser() {
  const email = DEFAULT_USER.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email,
      password: await hashPassword(DEFAULT_USER.password),
      name: DEFAULT_USER.name,
    },
  });
}
