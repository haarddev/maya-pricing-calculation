import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

function signToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function toAuthUser(user: { id: string; email: string; name: string }): AuthUser {
  return { id: user.id, email: user.email, name: user.name };
}

export async function register(input: unknown) {
  const data = registerSchema.parse(input);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
    },
  });

  const authUser = toAuthUser(user);
  return { token: signToken(authUser), user: authUser };
}

export async function login(input: unknown) {
  const data = loginSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const authUser = toAuthUser(user);
  return { token: signToken(authUser), user: authUser };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toAuthUser(user) : null;
}
