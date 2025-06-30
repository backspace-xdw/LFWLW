// 用户数据模型（内存存储版本）
import { User, UserRole, UserStatus, CreateUserDto, UpdateUserDto } from '../types/user.types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class UserModel {
  private static users: Map<string, User> = new Map();
  private static usersByUsername: Map<string, string> = new Map(); // username -> userId

  // 初始化超级管理员账号
  static async initialize() {
    const superAdminId = uuidv4();
    const superAdmin: User = {
      id: superAdminId,
      username: 'superadmin',
      passwordHash: await bcrypt.hash('SuperAdmin@2024', 10),
      fullName: '超级管理员',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      validFrom: new Date(),
    };
    
    this.users.set(superAdminId, superAdmin);
    this.usersByUsername.set('superadmin', superAdminId);

    // 创建默认管理员账号
    const adminId = uuidv4();
    const admin: User = {
      id: adminId,
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      fullName: '系统管理员',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      validFrom: new Date(),
      createdBy: superAdminId,
    };
    
    this.users.set(adminId, admin);
    this.usersByUsername.set('admin', adminId);
  }

  static async create(data: CreateUserDto, creatorId: string): Promise<User> {
    // 检查用户名是否已存在
    if (this.usersByUsername.has(data.username)) {
      throw new Error('用户名已存在');
    }

    const userId = uuidv4();
    const now = new Date();
    
    // 生成初始密码
    const initialPassword = this.generateInitialPassword();
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    // 计算密码过期时间（90天）
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 90);

    const user: User = {
      id: userId,
      username: data.username,
      passwordHash,
      fullName: data.fullName,
      employeeId: data.employeeId,
      department: data.department,
      role: data.role,
      status: UserStatus.ACTIVE,
      mustChangePassword: true, // 首次登录必须修改密码
      passwordExpiresAt,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
      validFrom: data.validFrom || now,
      validUntil: data.validUntil,
    };

    this.users.set(userId, user);
    this.usersByUsername.set(data.username, userId);

    // 返回用户信息和初始密码（实际应用中应该通过安全方式传递）
    return { ...user, initialPassword } as any;
  }

  static async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const userId = this.usersByUsername.get(username);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  static async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  static async update(id: string, data: UpdateUserDto): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  static async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const passwordExpiresAt = new Date();
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 90);

    const updatedUser: User = {
      ...user,
      passwordHash: newPasswordHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      passwordExpiresAt,
      updatedAt: new Date(),
    };

    this.users.set(userId, updatedUser);
    return true;
  }

  static async resetPassword(userId: string): Promise<string> {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const updatedUser: User = {
      ...user,
      passwordHash,
      mustChangePassword: true,
      updatedAt: new Date(),
    };

    this.users.set(userId, updatedUser);
    return tempPassword;
  }

  static async delete(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    this.users.delete(id);
    this.usersByUsername.delete(user.username);
    return true;
  }

  static async updateLastLogin(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastLoginAt = new Date();
      this.users.set(userId, user);
    }
  }

  static async lockAccount(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    user.status = UserStatus.LOCKED;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return true;
  }

  static async unlockAccount(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    user.status = UserStatus.ACTIVE;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return true;
  }

  // 生成初始密码
  private static generateInitialPassword(): string {
    const prefix = 'Lfwlw@';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${year}${random}`;
  }

  // 生成临时密码
  private static generateTempPassword(): string {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `Temp-${part1}-${part2}`;
  }
}

// 初始化数据
UserModel.initialize();