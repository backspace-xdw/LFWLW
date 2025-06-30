import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import request from '@/utils/request';
import { useAuthStore } from '@/store/auth';

interface ChangePasswordModalProps {
  visible: boolean;
  isInitial?: boolean;
  tempToken?: string;
  onCancel?: () => void;
  onSuccess: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  isInitial = false,
  tempToken,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { logout } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isInitial && tempToken) {
        // 首次登录修改密码
        await request.post('/api/v1/auth/change-initial-password', {
          tempToken,
          newPassword: values.newPassword,
        });
        message.success('密码修改成功，请使用新密码登录');
        onSuccess();
      } else {
        // 正常修改密码
        await request.post('/api/v1/auth/change-password', {
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        });
        message.success('密码修改成功，请重新登录');
        // 退出登录
        logout();
        onSuccess();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('请输入密码');
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(value)) {
      return Promise.reject('密码至少8位，必须包含大写字母、小写字母和数字');
    }
    return Promise.resolve();
  };

  const handleCancel = () => {
    if (!isInitial && onCancel) {
      onCancel();
    }
  };

  return (
    <Modal
      title={isInitial ? '首次登录 - 修改密码' : '修改密码'}
      open={visible}
      onCancel={handleCancel}
      closable={!isInitial}
      maskClosable={false}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText="确定"
      cancelText="取消"
      cancelButtonProps={{ style: isInitial ? { display: 'none' } : {} }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {!isInitial && (
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password
              placeholder="请输入原密码"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
        )}

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[{ required: true, validator: validatePassword }]}
        >
          <Input.Password
            placeholder="请输入新密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="请再次输入新密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        {isInitial && (
          <div style={{ marginTop: 16, color: '#ff4d4f' }}>
            <p>* 为了您的账号安全，首次登录必须修改初始密码</p>
            <p>* 密码要求：至少8位，包含大小写字母和数字</p>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;