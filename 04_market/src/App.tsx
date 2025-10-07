import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Typography,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Header, Content } = Layout;
const { Title } = Typography;
const { TextArea } = Input;

interface Product {
  id: number;
  name: string;
  price: number;
  description: string | null;
  stock: number;
}

interface ProductFormData {
  name: string;
  price: number;
  description?: string;
  stock: number;
}

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/products/`);
      setProducts(response.data);
    } catch (error) {
      message.error('Failed to fetch products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new product
  const createProduct = async (productData: ProductFormData) => {
    try {
      await axios.post(`${API_BASE_URL}/products/`, productData);
      message.success('Product created successfully');
      fetchProducts();
      handleModalClose();
    } catch (error) {
      message.error('Failed to create product');
      console.error('Error creating product:', error);
    }
  };

  // Update an existing product
  const updateProduct = async (id: number, productData: Partial<ProductFormData>) => {
    try {
      await axios.put(`${API_BASE_URL}/products/${id}`, productData);
      message.success('Product updated successfully');
      fetchProducts();
      handleModalClose();
    } catch (error) {
      message.error('Failed to update product');
      console.error('Error updating product:', error);
    }
  };

  // Delete a product
  const deleteProduct = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      message.error('Failed to delete product');
      console.error('Error deleting product:', error);
    }
  };

  // Handle form submission
  const handleSubmit = (values: ProductFormData) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, values);
    } else {
      createProduct(values);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
    form.resetFields();
  };

  // Handle edit button click
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setIsModalVisible(true);
  };

  // Handle add new product
  const handleAddNew = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string | null) => description || 'No description',
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Product) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => deleteProduct(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <ShoppingCartOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Product Management System
          </Title>
        </div>
      </Header>
      
      <Content style={{ margin: '24px', background: '#f0f2f5' }}>
        <Card>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>Products</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
              size="large"
            >
              Add New Product
            </Button>
          </div>
          
          <Table
            columns={columns}
            dataSource={products}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
          />
        </Card>

        <Modal
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ marginTop: '20px' }}
          >
            <Form.Item
              label="Product Name"
              name="name"
              rules={[{ required: true, message: 'Please input the product name!' }]}
            >
              <Input placeholder="Enter product name" />
            </Form.Item>

            <Form.Item
              label="Price"
              name="price"
              rules={[
                { required: true, message: 'Please input the price!' },
                { type: 'number', min: 0, message: 'Price must be greater than or equal to 0!' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter price"
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
            >
              <TextArea
                rows={4}
                placeholder="Enter product description (optional)"
              />
            </Form.Item>

            <Form.Item
              label="Stock"
              name="stock"
              rules={[
                { required: true, message: 'Please input the stock quantity!' },
                { type: 'number', min: 0, message: 'Stock must be greater than or equal to 0!' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter stock quantity"
                min={0}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingProduct ? 'Update' : 'Create'} Product
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}

export default App;
