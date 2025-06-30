// 审计日志服务
import { UserOperation, UserOperationLog } from '../types/user.types';
import { v4 as uuidv4 } from 'uuid';

export class AuditLogService {
  private static logs: UserOperationLog[] = [];

  static async log(params: {
    operatorId: string;
    operation: UserOperation;
    targetUserId?: string;
    details?: any;
    ipAddress: string;
  }): Promise<void> {
    const log: UserOperationLog = {
      id: uuidv4(),
      operatorId: params.operatorId,
      operation: params.operation,
      targetUserId: params.targetUserId,
      details: params.details || {},
      ipAddress: params.ipAddress,
      createdAt: new Date(),
    };

    this.logs.push(log);

    // 保留最近1000条日志
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // 重要操作告警（实际应用中可以发送邮件或通知）
    if ([UserOperation.DELETE_USER, UserOperation.CHANGE_ROLE].includes(params.operation)) {
      console.warn('重要操作告警:', log);
    }
  }

  static async getLogs(filters?: {
    operatorId?: string;
    targetUserId?: string;
    operation?: UserOperation;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UserOperationLog[]> {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.operatorId) {
        filteredLogs = filteredLogs.filter(log => log.operatorId === filters.operatorId);
      }
      if (filters.targetUserId) {
        filteredLogs = filteredLogs.filter(log => log.targetUserId === filters.targetUserId);
      }
      if (filters.operation) {
        filteredLogs = filteredLogs.filter(log => log.operation === filters.operation);
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.createdAt >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.createdAt <= filters.endDate!);
      }
    }

    // 按时间倒序
    return filteredLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取用户最近的失败登录次数
  static async getRecentFailedLogins(username: string, minutes: number = 30): Promise<number> {
    const since = new Date();
    since.setMinutes(since.getMinutes() - minutes);

    return this.logs.filter(log => 
      log.operation === UserOperation.LOGIN_FAILED &&
      log.details?.username === username &&
      log.createdAt >= since
    ).length;
  }
}