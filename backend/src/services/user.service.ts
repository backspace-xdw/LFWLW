// 用户服务层
import { UserModel } from '../models/user.model';
import { CreateUserDto, UpdateUserDto, User, UserRole, ChangePasswordDto } from '../types/user.types';
import bcrypt from 'bcryptjs';

export class UserService {
  // 创建用户
  static async createUser(data: CreateUserDto, creatorId: string, creatorRole: UserRole): Promise<any> {
    // 权限检查：只有超级管理员和管理员可以创建用户
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(creatorRole)) {
      throw new Error('权限不足：无法创建用户');
    }

    // 角色权限检查：管理员不能创建超级管理员
    if (creatorRole === UserRole.ADMIN && data.role === UserRole.SUPER_ADMIN) {
      throw new Error('权限不足：无法创建超级管理员账号');
    }

    // 验证用户名格式
    if (!this.isValidUsername(data.username)) {
      throw new Error('用户名格式无效：必须为4-20位字母数字下划线');
    }

    const result = await UserModel.create(data, creatorId);
    return result;
  }

  // 获取用户列表
  static async getUsers(requestorRole: UserRole): Promise<User[]> {
    const users = await UserModel.findAll();
    
    // 过滤敏感信息
    return users.map(user => ({
      ...user,
      passwordHash: undefined,
    } as any));
  }

  // 获取单个用户
  static async getUserById(userId: string): Promise<User | null> {
    const user = await UserModel.findById(userId);
    if (user) {
      // 移除密码信息
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword as any;
    }
    return null;
  }

  // 更新用户信息
  static async updateUser(
    userId: string, 
    data: UpdateUserDto, 
    operatorId: string, 
    operatorRole: UserRole
  ): Promise<User | null> {
    // 权限检查
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(operatorRole)) {
      throw new Error('权限不足：无法更新用户信息');
    }

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      throw new Error('用户不存在');
    }

    // 角色变更权限检查
    if (data.role) {
      if (operatorRole === UserRole.ADMIN && data.role === UserRole.SUPER_ADMIN) {
        throw new Error('权限不足：无法设置超级管理员角色');
      }
      if (targetUser.role === UserRole.SUPER_ADMIN && operatorRole !== UserRole.SUPER_ADMIN) {
        throw new Error('权限不足：无法修改超级管理员');
      }
    }

    const updatedUser = await UserModel.update(userId, data);
    if (updatedUser) {
      const { passwordHash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword as any;
    }
    return null;
  }

  // 重置密码
  static async resetPassword(userId: string, operatorRole: UserRole): Promise<string> {
    // 权限检查
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(operatorRole)) {
      throw new Error('权限不足：无法重置密码');
    }

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      throw new Error('用户不存在');
    }

    // 不能重置更高权限用户的密码
    if (targetUser.role === UserRole.SUPER_ADMIN && operatorRole !== UserRole.SUPER_ADMIN) {
      throw new Error('权限不足：无法重置超级管理员密码');
    }

    return await UserModel.resetPassword(userId);
  }

  // 修改密码
  static async changePassword(userId: string, data: ChangePasswordDto): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(data.oldPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('原密码错误');
    }

    // 验证新密码强度
    if (!this.isValidPassword(data.newPassword)) {
      throw new Error('新密码不符合要求：至少8位，包含大小写字母和数字');
    }

    // 更新密码
    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);
    await UserModel.updatePassword(userId, newPasswordHash);
  }

  // 锁定账号
  static async lockAccount(userId: string, operatorRole: UserRole): Promise<void> {
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(operatorRole)) {
      throw new Error('权限不足：无法锁定账号');
    }

    const success = await UserModel.lockAccount(userId);
    if (!success) {
      throw new Error('锁定账号失败');
    }
  }

  // 解锁账号
  static async unlockAccount(userId: string, operatorRole: UserRole): Promise<void> {
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(operatorRole)) {
      throw new Error('权限不足：无法解锁账号');
    }

    const success = await UserModel.unlockAccount(userId);
    if (!success) {
      throw new Error('解锁账号失败');
    }
  }

  // 删除用户
  static async deleteUser(userId: string, operatorRole: UserRole): Promise<void> {
    if (operatorRole !== UserRole.SUPER_ADMIN) {
      throw new Error('权限不足：只有超级管理员可以删除用户');
    }

    const success = await UserModel.delete(userId);
    if (!success) {
      throw new Error('删除用户失败');
    }
  }

  // 验证用户名格式
  private static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    return usernameRegex.test(username);
  }

  // 验证密码强度
  private static isValidPassword(password: string): boolean {
    // 至少8位，包含大小写字母和数字
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
}