import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';
import {
  getJwtExpiresIn,
  getLoginSecuritySettings,
} from './settings.service.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole).optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  password: z.string().min(6).optional(),
});

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
};

async function signToken(user: AuthUser) {
  const expiresIn = (await getJwtExpiresIn()) as jwt.SignOptions['expiresIn'];
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    env.JWT_SECRET,
    { expiresIn },
  );
}

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
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
  return { token: await signToken(authUser), user: authUser };
}

export async function login(input: unknown) {
  const data = loginSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.status === UserStatus.DISABLED) {
    throw new AppError(403, 'Account is disabled');
  }

  const { loginAttemptLimit, lockoutDurationMinutes } = await getLoginSecuritySettings();

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(
      423,
      `Account locked. Try again after ${user.lockedUntil.toLocaleString()}`,
    );
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);

  if (!valid) {
    const attempts = user.loginAttempts + 1;
    const shouldLock = attempts >= loginAttemptLimit;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: attempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + lockoutDurationMinutes * 60 * 1000)
          : null,
      },
    });

    if (shouldLock) {
      throw new AppError(423, `Too many failed attempts. Account locked for ${lockoutDurationMinutes} minutes.`);
    }

    throw new AppError(401, 'Invalid email or password');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null },
  });

  const authUser = toAuthUser(user);
  return { token: await signToken(authUser), user: authUser };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.status === UserStatus.DISABLED) {
    return null;
  }
  return toAuthUser(user);
}

export async function updateProfile(userId: string, input: unknown) {
  const data = updateProfileSchema.parse(input);

  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, id: { not: userId } },
    });
    if (existing) {
      throw new AppError(409, 'Email already in use');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return toAuthUser(user);
}

export async function changePassword(userId: string, input: unknown) {
  const data = changePasswordSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(400, 'Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      loginAttempts: true,
      lockedUntil: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return users.map((user) => ({
    ...user,
    lockedUntil: user.lockedUntil?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));
}

export async function createUser(input: unknown) {
  const data = createUserSchema.parse(input);
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
      role: data.role ?? UserRole.USER,
    },
  });

  return toAuthUser(user);
}

export async function updateUser(id: string, input: unknown, currentUserId: string) {
  const data = updateUserSchema.parse(input);

  if (id === currentUserId && data.status === UserStatus.DISABLED) {
    throw new AppError(400, 'You cannot disable your own account');
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  if (existingUser.role === UserRole.ADMIN && data.role === UserRole.USER) {
    const otherAdmins = await prisma.user.count({
      where: { role: UserRole.ADMIN, id: { not: id } },
    });
    if (otherAdmins === 0) {
      throw new AppError(400, 'Cannot remove the last admin');
    }
  }

  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, id: { not: id } },
    });
    if (existing) {
      throw new AppError(409, 'Email already in use');
    }
  }

  const updateData: {
    email?: string;
    name?: string;
    role?: UserRole;
    status?: UserStatus;
    passwordHash?: string;
    loginAttempts?: number;
    lockedUntil?: Date | null;
  } = {
    email: data.email,
    name: data.name,
    role: data.role,
    status: data.status,
  };

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  if (data.status === UserStatus.ACTIVE) {
    updateData.loginAttempts = 0;
    updateData.lockedUntil = null;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return toAuthUser(user);
}

export async function deleteUser(id: string, currentUserId: string) {
  if (id === currentUserId) {
    throw new AppError(400, 'You cannot delete your own account');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.role === UserRole.ADMIN) {
    const otherAdmins = await prisma.user.count({
      where: { role: UserRole.ADMIN, id: { not: id } },
    });
    if (otherAdmins === 0) {
      throw new AppError(400, 'Cannot delete the last admin');
    }
  }

  const [templateCount, catalogCount] = await Promise.all([
    prisma.template.count({ where: { createdById: id } }),
    prisma.catalog.count({ where: { createdById: id } }),
  ]);

  if (templateCount > 0 || catalogCount > 0) {
    throw new AppError(400, 'Cannot delete a user who owns templates or catalogs');
  }

  await prisma.user.delete({ where: { id } });
}
