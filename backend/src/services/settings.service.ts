import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

const updateSettingsSchema = z.object({
  appName: z.string().min(1).max(100).optional(),
  jwtExpiresIn: z.string().min(1).max(20).optional(),
  loginAttemptLimit: z.number().int().min(1).max(20).optional(),
  lockoutDurationMinutes: z.number().int().min(1).max(1440).optional(),
  allowOnlyActiveTemplates: z.boolean().optional(),
});

export type AppSettingsData = {
  appName: string;
  jwtExpiresIn: string;
  loginAttemptLimit: number;
  lockoutDurationMinutes: number;
  allowOnlyActiveTemplates: boolean;
  updatedAt: string;
};

export async function ensureSettings() {
  const existing = await prisma.appSettings.findUnique({ where: { id: 'default' } });
  if (existing) return existing;

  return prisma.appSettings.create({
    data: { id: 'default' },
  });
}

export async function getSettings(): Promise<AppSettingsData> {
  const settings = await ensureSettings();
  return toSettingsData(settings);
}

export async function getPublicSettings() {
  const settings = await ensureSettings();
  return { appName: settings.appName };
}

export async function updateSettings(input: unknown): Promise<AppSettingsData> {
  const data = updateSettingsSchema.parse(input);
  const settings = await prisma.appSettings.update({
    where: { id: 'default' },
    data,
  });
  return toSettingsData(settings);
}

function toSettingsData(settings: {
  appName: string;
  jwtExpiresIn: string;
  loginAttemptLimit: number;
  lockoutDurationMinutes: number;
  allowOnlyActiveTemplates: boolean;
  updatedAt: Date;
}): AppSettingsData {
  return {
    appName: settings.appName,
    jwtExpiresIn: settings.jwtExpiresIn,
    loginAttemptLimit: settings.loginAttemptLimit,
    lockoutDurationMinutes: settings.lockoutDurationMinutes,
    allowOnlyActiveTemplates: settings.allowOnlyActiveTemplates,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function getJwtExpiresIn() {
  const settings = await ensureSettings();
  return settings.jwtExpiresIn;
}

export async function getLoginSecuritySettings() {
  const settings = await ensureSettings();
  return {
    loginAttemptLimit: settings.loginAttemptLimit,
    lockoutDurationMinutes: settings.lockoutDurationMinutes,
  };
}

export async function shouldRequireActiveTemplate() {
  const settings = await ensureSettings();
  return settings.allowOnlyActiveTemplates;
}
