// 用户相关类型定义

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  employeeId?: string;
  department?: string;
  role: UserRole;
  status: UserStatus;
  
  // 密码管理
  passwordExpiresAt?: Date;
  mustChangePassword: boolean;
  passwordChangedAt?: Date;
  
  // 账号管理
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // 限制条件
  validFrom: Date;
  validUntil?: Date;
}

export interface CreateUserDto {
  username: string;
  fullName: string;
  employeeId?: string;
  department?: string;
  role: UserRole;
  validFrom?: Date;
  validUntil?: Date;
}

export interface UpdateUserDto {
  fullName?: string;
  department?: string;
  role?: UserRole;
  status?: UserStatus;
  validUntil?: Date;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  userId: string;
  reason?: string;
}

export interface UserOperationLog {
  id: string;
  operatorId: string;
  operation: UserOperation;
  targetUserId?: string;
  details: any;
  ipAddress: string;
  createdAt: Date;
}

export enum UserOperation {
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  RESET_PASSWORD = 'reset_password',
  CHANGE_ROLE = 'change_role',
  LOCK_ACCOUNT = 'lock_account',
  UNLOCK_ACCOUNT = 'unlock_account',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
}

// 角色权限矩阵
export const rolePermissions = {
  [UserRole.SUPER_ADMIN]: {
    users: ['create', 'read', 'update', 'delete', 'reset_password'],
    devices: ['create', 'read', 'update', 'delete', 'control'],
    system: ['config', 'backup', 'restore'],
    roles: ['assign', 'modify'],
  },
  [UserRole.ADMIN]: {
    users: ['create', 'read', 'update', 'reset_password'],
    devices: ['create', 'read', 'update', 'delete', 'control'],
    system: ['config'],
    roles: ['assign'],
  },
  [UserRole.OPERATOR]: {
    users: ['read'],
    devices: ['read', 'update', 'control'],
    system: [],
    roles: [],
  },
  [UserRole.VIEWER]: {
    users: ['read'],
    devices: ['read'],
    system: [],
    roles: [],
  },
};