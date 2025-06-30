import React, { useState } from 'react';
import { Card, List, Avatar, Button, Upload, message, Modal, Input, Form, Tag, Space, Typography, Divider } from 'antd';
import { 
  UploadOutlined, 
  EyeOutlined, 
  DeleteOutlined, 
  FileAddOutlined,
  AppstoreOutlined,
  BarsOutlined,
  BoxPlotOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import Model3DViewer from '@/components/Model3DViewer';
import styles from './index.module.scss';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface Model3DItem {
  id: string;
  name: string;
  description: string;
  fileUrl: string;
  fileSize: string;
  uploadDate: string;
  tags: string[];
  thumbnail?: string;
}

// Mock data with demo indicator
const mockModels: Model3DItem[] = [
  {
    id: '1',
    name: 'Water Pump Demo',
    description: 'Demo water pump model using procedural geometry',
    fileUrl: 'demo:water-pump',
    fileSize: 'Demo',
    uploadDate: '2025-06-30',
    tags: ['pump', 'equipment', 'demo'],
    thumbnail: ''
  },
  {
    id: '2',
    name: 'Valve Assembly Demo',
    description: 'Demo valve assembly model using procedural geometry',
    fileUrl: 'demo:valve-assembly',
    fileSize: 'Demo',
    uploadDate: '2025-06-30',
    tags: ['valve', 'control', 'demo']
  },
  {
    id: '3',
    name: 'Storage Tank Demo',
    description: 'Demo storage tank model using procedural geometry',
    fileUrl: 'demo:storage-tank',
    fileSize: 'Demo',
    uploadDate: '2025-06-30',
    tags: ['tank', 'storage', 'demo']
  }
];

const Model3D: React.FC = () => {
  const [models, setModels] = useState<Model3DItem[]>(mockModels);
  const [selectedModel, setSelectedModel] = useState<Model3DItem | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [form] = Form.useForm();

  const handleView = (model: Model3DItem) => {
    setSelectedModel(model);
    setViewerVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Model',
      content: 'Are you sure you want to delete this 3D model?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setModels(models.filter(m => m.id !== id));
        message.success('Model deleted successfully');
      }
    });
  };

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.fbx,.obj,.gltf,.glb',
    beforeUpload: (file) => {
      const isValidType = file.name.endsWith('.fbx') || 
                         file.name.endsWith('.obj') || 
                         file.name.endsWith('.gltf') || 
                         file.name.endsWith('.glb');
      if (!isValidType) {
        message.error('You can only upload FBX, OBJ, GLTF or GLB files!');
        return false;
      }
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error('File must be smaller than 50MB!');
        return false;
      }
      return false; // Prevent auto upload
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  const handleUploadSubmit = (values: any) => {
    const newModel: Model3DItem = {
      id: Date.now().toString(),
      name: values.name,
      description: values.description,
      fileUrl: `/models/${values.name.toLowerCase().replace(/\s+/g, '-')}.fbx`,
      fileSize: '10.0 MB', // This would come from the actual file
      uploadDate: new Date().toISOString().split('T')[0],
      tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : []
    };
    
    setModels([newModel, ...models]);
    setUploadVisible(false);
    form.resetFields();
    message.success('Model uploaded successfully');
  };

  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchText.toLowerCase()) ||
    model.description.toLowerCase().includes(searchText.toLowerCase()) ||
    model.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
  );

  const renderGridItem = (model: Model3DItem) => (
    <Card
      hoverable
      className={styles.gridCard}
      cover={
        <div className={styles.modelPreview}>
          {model.thumbnail ? (
            <img src={model.thumbnail} alt={model.name} />
          ) : (
            <div className={styles.placeholder}>
              <BoxPlotOutlined style={{ fontSize: 48, color: '#999' }} />
            </div>
          )}
        </div>
      }
      actions={[
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => handleView(model)}
          key="view"
        >
          View
        </Button>,
        <Button 
          type="link" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => handleDelete(model.id)}
          key="delete"
        >
          Delete
        </Button>
      ]}
    >
      <Card.Meta
        title={model.name}
        description={
          <>
            <Paragraph ellipsis={{ rows: 2 }}>{model.description}</Paragraph>
            <div className={styles.tags}>
              {model.tags.map(tag => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </div>
            <div className={styles.meta}>
              <Text type="secondary">{model.fileSize}</Text>
              <Text type="secondary">{model.uploadDate}</Text>
            </div>
          </>
        }
      />
    </Card>
  );

  const renderListItem = (model: Model3DItem) => (
    <List.Item
      actions={[
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          onClick={() => handleView(model)}
        >
          View
        </Button>,
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => handleDelete(model.id)}
        >
          Delete
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={
          model.thumbnail ? (
            <Avatar src={model.thumbnail} size={64} shape="square" />
          ) : (
            <Avatar icon={<BoxPlotOutlined />} size={64} shape="square" />
          )
        }
        title={<a onClick={() => handleView(model)}>{model.name}</a>}
        description={
          <>
            <Paragraph ellipsis={{ rows: 2 }}>{model.description}</Paragraph>
            <Space>
              {model.tags.map(tag => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </Space>
            <div>
              <Text type="secondary">Size: {model.fileSize} | </Text>
              <Text type="secondary">Uploaded: {model.uploadDate}</Text>
            </div>
          </>
        }
      />
    </List.Item>
  );

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <div>
            <Title level={4}>3D Models Library</Title>
            <Text type="secondary">Manage and view 3D models for equipment visualization</Text>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<FileAddOutlined />}
              onClick={() => setUploadVisible(true)}
            >
              Upload Model
            </Button>
          </Space>
        </div>

        <Divider />

        <div className={styles.toolbar}>
          <Search
            placeholder="Search models by name, description or tags"
            allowClear
            enterButton="Search"
            style={{ width: 400 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Space>
            <Button
              icon={<AppstoreOutlined />}
              className={viewMode === 'grid' ? styles.activeView : ''}
              onClick={() => setViewMode('grid')}
            />
            <Button
              icon={<BarsOutlined />}
              className={viewMode === 'list' ? styles.activeView : ''}
              onClick={() => setViewMode('list')}
            />
          </Space>
        </div>

        {viewMode === 'grid' ? (
          <div className={styles.gridContainer}>
            {filteredModels.map(model => (
              <div key={model.id} className={styles.gridItem}>
                {renderGridItem(model)}
              </div>
            ))}
          </div>
        ) : (
          <List
            itemLayout="vertical"
            size="large"
            dataSource={filteredModels}
            renderItem={renderListItem}
          />
        )}

        {filteredModels.length === 0 && (
          <div className={styles.empty}>
            <BoxPlotOutlined style={{ fontSize: 64, color: '#999' }} />
            <Title level={5} type="secondary">No models found</Title>
            <Text type="secondary">Try adjusting your search or upload a new model</Text>
          </div>
        )}
      </Card>

      {/* 3D Viewer Modal */}
      <Modal
        title={selectedModel?.name}
        open={viewerVisible}
        onCancel={() => {
          setViewerVisible(false);
          setSelectedModel(null);
        }}
        width={1200}
        footer={null}
        destroyOnClose
      >
        {selectedModel && (
          <Model3DViewer
            modelUrl={selectedModel.fileUrl}
            modelName={selectedModel.name}
            height={600}
          />
        )}
      </Modal>

      {/* Upload Modal */}
      <Modal
        title="Upload 3D Model"
        open={uploadVisible}
        onCancel={() => {
          setUploadVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUploadSubmit}
        >
          <Form.Item
            name="file"
            label="Model File"
            rules={[{ required: true, message: 'Please upload a model file' }]}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="name"
            label="Model Name"
            rules={[{ required: true, message: 'Please enter model name' }]}
          >
            <Input placeholder="Enter model name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter model description" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags"
            extra="Separate tags with commas"
          >
            <Input placeholder="e.g., pump, valve, equipment" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => {
                setUploadVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Upload
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Model3D;