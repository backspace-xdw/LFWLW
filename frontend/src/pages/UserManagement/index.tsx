import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Card,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import request from '@/utils/request';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface User {
  id: string;
  username: string;
  fullName: string;
  employeeId?: string;
  department?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  validUntil?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await request.get('/api/v1/users');
      setUsers(response.data.data.items || []);
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 创建用户
  const handleCreateUser = async (values: any) => {
    try {
      const response = await request.post('/api/v1/users', {
        ...values,
        validFrom: values.validFrom?.format('YYYY-MM-DD'),
        validUntil: values.validUntil?.format('YYYY-MM-DD'),
      });

      const { user, initialPassword } = response.data.data;
      
      Modal.success({
        title: '用户创建成功',
        width: 520,
        content: (
          <div>
            <p>用户已成功创建，请将以下信息提供给用户：</p>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, marginTop: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>用户名：</strong>
                <Text copyable>{user.username}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>初始密码：</strong>
                <Text copyable>{initialPassword}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>姓名：</strong>{user.fullName}
              </div>
              <div>
                <strong>角色：</strong>{getRoleTag(user.role)}
              </div>
            </div>
            <p style={{ marginTop: 16, color: '#ff4d4f' }}>
              <ExclamationCircleOutlined /> 请用户在首次登录后立即修改密码
            </p>
          </div>
        ),
        okText: '我已记录',
      });

      setModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建用户失败');
    }
  };

  // 更新用户
  const handleUpdateUser = async (values: any) => {
    if (!editingUser) return;

    try {
      await request.put(`/api/v1/users/${editingUser.id}`, {
        ...values,
        validUntil: values.validUntil?.format('YYYY-MM-DD'),
      });
      message.success('用户信息更新成功');
      setModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新用户失败');
    }
  };

  // 重置密码
  const handleResetPassword = async (userId: string) => {
    try {
      const response = await request.post(`/api/v1/users/${userId}/reset-password`);
      const { tempPassword } = response.data.data;
      
      Modal.success({
        title: '密码重置成功',
        content: (
          <div>
            <p>密码已重置，新的临时密码为：</p>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, marginTop: 16 }}>
              <Text copyable strong style={{ fontSize: 16 }}>
                {tempPassword}
              </Text>
            </div>
            <p style={{ marginTop: 16, color: '#ff4d4f' }}>
              <ExclamationCircleOutlined /> 请通知用户使用新密码登录，并在登录后立即修改密码
            </p>
          </div>
        ),
        okText: '我已记录',
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || '重置密码失败');
    }
  };

  // 锁定/解锁账号
  const handleToggleLock = async (userId: string, action: 'lock' | 'unlock') => {
    try {
      await request.post(`/api/v1/users/${userId}/${action}`);
      message.success(`账号已${action === 'lock' ? '锁定' : '解锁'}`);
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    try {
      await request.delete(`/api/v1/users/${userId}`);
      message.success('用户已删除');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除用户失败');
    }
  };

  // 获取角色标签
  const getRoleTag = (role: string) => {
    const roleMap = {
      super_admin: { text: '超级管理员', color: 'red' },
      admin: { text: '管理员', color: 'orange' },
      operator: { text: '操作员', color: 'blue' },
      viewer: { text: '查看者', color: 'green' },
    };
    const roleInfo = roleMap[role] || { text: role, color: 'default' };
    return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { text: '正常', color: 'success' },
      inactive: { text: '未激活', color: 'default' },
      locked: { text: '已锁定', color: 'error' },
    };
    const statusInfo = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      fixed: 'left',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 120,
    },
    {
      title: '员工号',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: getRoleTag,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: getStatusTag,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 150,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '有效期至',
      dataIndex: 'validUntil',
      key: 'validUntil',
      width: 120,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD') : '永久',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingUser(record);
                form.setFieldsValue({
                  ...record,
                  validUntil: record.validUntil ? dayjs(record.validUntil) : undefined,
                });
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="重置密码">
            <Popconfirm
              title="确定要重置该用户的密码吗？"
              onConfirm={() => handleResetPassword(record.id)}
            >
              <Button type="link" size="small" icon={<KeyOutlined />} />
            </Popconfirm>
          </Tooltip>
          {record.status === 'locked' ? (
            <Tooltip title="解锁">
              <Popconfirm
                title="确定要解锁该账号吗？"
                onConfirm={() => handleToggleLock(record.id, 'unlock')}
              >
                <Button type="link" size="small" icon={<UnlockOutlined />} />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="锁定">
              <Popconfirm
                title="确定要锁定该账号吗？"
                onConfirm={() => handleToggleLock(record.id, 'lock')}
              >
                <Button type="link" size="small" icon={<LockOutlined />} danger />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除该用户吗？此操作不可恢复！"
              onConfirm={() => handleDeleteUser(record.id)}
            >
              <Button type="link" size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const matchSearch = !searchText || 
      user.username.includes(searchText) || 
      user.fullName.includes(searchText) ||
      user.employeeId?.includes(searchText) ||
      user.department?.includes(searchText);
    const matchRole = !selectedRole || user.role === selectedRole;
    return matchSearch && matchRole;
  });

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            创建用户
          </Button>
        </Space>
        <Space style={{ float: 'right' }}>
          <Input
            placeholder="搜索用户名、姓名、员工号或部门"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="筛选角色"
            style={{ width: 150 }}
            allowClear
            value={selectedRole}
            onChange={setSelectedRole}
          >
            <Option value="super_admin">超级管理员</Option>
            <Option value="admin">管理员</Option>
            <Option value="operator">操作员</Option>
            <Option value="viewer">查看者</Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title={editingUser ? '编辑用户' : '创建用户'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingUser ? handleUpdateUser : handleCreateUser}
        >
          {!editingUser && (
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { pattern: /^[a-zA-Z0-9_]{4,20}$/, message: '用户名必须为4-20位字母数字下划线' }
              ]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
          )}
          
          <Form.Item
            name="fullName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="employeeId"
            label="员工号"
          >
            <Input placeholder="请输入员工号（选填）" />
          </Form.Item>

          <Form.Item
            name="department"
            label="部门"
          >
            <Input placeholder="请输入部门（选填）" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="operator">操作员</Option>
              <Option value="viewer">查看者</Option>
            </Select>
          </Form.Item>

          {editingUser && (
            <Form.Item
              name="status"
              label="状态"
            >
              <Select>
                <Option value="active">正常</Option>
                <Option value="inactive">未激活</Option>
                <Option value="locked">已锁定</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="validUntil"
            label="有效期至"
          >
            <DatePicker style={{ width: '100%' }} placeholder="不填则永久有效" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingUser(null);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;