import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import BASE_API_URL from "../utils/apiConfig";
import validators from "../utils/validators";

const AdminNews = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [form] = Form.useForm();
  const [selectedImage, setSelectedImage] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Fetch all news
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_API_URL}/api/articles`);
      if (!res.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await res.json();
      setNewsList(data);
    } catch (error) {
      console.error("Error fetching news:", error);
      message.error("Failed to fetch news articles");
    }
    setLoading(false);
  };

  // Handle Add/Edit Modal
  const handleOpenModal = (news = null) => {
    setEditingNews(news);
    setIsModalOpen(true);
    setValidationErrors([]);
    form.setFieldsValue(news || { title: "", content: "", author: "" });
    setSelectedImage(null); // Reset selected image
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNews(null);
    form.resetFields();
    setSelectedImage(null);
    setValidationErrors([]);
  };

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validators.validateFile(file, 'image/*', 10 * 1024 * 1024);
      if (validation.isValid) {
        setSelectedImage(file);
        setValidationErrors(validationErrors.filter(err => !err.includes('image')));
      } else {
        setValidationErrors([...validationErrors.filter(err => !err.includes('image')), validation.error]);
      }
    }
  };

  // Handle Form Submission
  const handleFormSubmit = async (values) => {
    setValidationErrors([]);
    setLoading(true);

    try {
      // Validate news data
      const validation = validators.validateNews(values);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setLoading(false);
        return;
      }

      // For new articles, image is required
      if (!editingNews && !selectedImage) {
        setValidationErrors(['Image file is required for new articles (max 10MB)']);
        setLoading(false);
        return;
      }

      // Validate image if provided
      if (selectedImage) {
        const imageValidation = validators.validateFile(selectedImage, 'image/*', 10 * 1024 * 1024);
        if (!imageValidation.isValid) {
          setValidationErrors([imageValidation.error]);
          setLoading(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("author", values.author);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      // Log file size for debugging
      if (selectedImage) {
        console.log('Uploading news image size:', selectedImage.size, 'bytes');
      }

      const response = await fetch(
        `${BASE_API_URL}/api/articles${editingNews ? `/${editingNews._id}` : ""}`,
        {
          method: editingNews ? "PUT" : "POST",
          headers: {
            // DO NOT set Content-Type - browser will set it with boundary
          },
          body: formData,
        }
      );

      if (response.status === 413) {
        setValidationErrors(['File too large. Server rejected payload. Try compressing image.']);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        const errorMsg = responseData.message || responseData.error || "Failed to save news";
        setValidationErrors([errorMsg]);
        setLoading(false);
        return;
      }

      message.success(editingNews ? "News updated successfully" : "News added successfully");
      fetchNews();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving news:", error);
      setValidationErrors([error.message || "An error occurred while saving the news. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  // Delete News
  const handleDeleteNews = async (id) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/api/articles/${id}`, { method: "DELETE" });
      if (response.ok) {
        message.success("News deleted successfully");
        fetchNews();
      } else {
        message.error("Failed to delete news");
      }
    } catch (error) {
      console.error("Error deleting news:", error);
      message.error("An error occurred while deleting the news");
    }
    setLoading(false);
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Author",
      dataIndex: "author",
      key: "author",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            style={{ marginRight: "8px" }}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteNews(record._id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <h1>Admin News Management</h1>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => handleOpenModal()}
        style={{ marginBottom: "16px" }}
      >
        Add News
      </Button>

      <Table
        columns={columns}
        dataSource={newsList}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingNews ? "Edit News" : "Add News"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
      >
        {validationErrors.length > 0 && (
          <div style={styles.errorContainer}>
            <h4 style={{ margin: '0 0 10px 0', color: '#721c24' }}>Validation Errors:</h4>
            {validationErrors.map((error, index) => (
              <p key={index} style={styles.error}>• {error}</p>
            ))}
          </div>
        )}

        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
        >
          <Form.Item
            label="Title *"
            name="title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="Enter news title" disabled={loading} />
          </Form.Item>

          <Form.Item
            label="Content *"
            name="content"
            rules={[{ required: true, message: "Content is required" }]}
          >
            <Input.TextArea rows={5} placeholder="Enter news content" disabled={loading} />
          </Form.Item>

          <Form.Item
            label="Author *"
            name="author"
            rules={[{ required: true, message: "Author is required" }]}
          >
            <Input placeholder="Enter author name" disabled={loading} />
          </Form.Item>

          <Form.Item
            label={`Image ${!editingNews ? '*' : '(Optional)'} (max 5MB)`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ width: "100%" }}
          >
            {editingNews ? "Update News" : "Add News"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

const styles = {
  errorContainer: {
    marginBottom: '15px',
    padding: '12px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    border: '1px solid #f5c6cb',
  },
  error: {
    color: '#721c24',
    margin: '5px 0',
    fontSize: '14px',
  }
};

export default AdminNews;
