export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export type User = {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  status?: UserStatus;
};

export type ManagedUser = User & {
  loginAttempts?: number;
  lockedUntil?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AppSettings = {
  appName: string;
  jwtExpiresIn: string;
  loginAttemptLimit: number;
  lockoutDurationMinutes: number;
  allowOnlyActiveTemplates: boolean;
  updatedAt: string;
};

export type PublicSettings = {
  appName: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};
