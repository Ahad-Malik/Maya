import React, { useState, useRef } from 'react';
import { Modal, Button, Input, message, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const UploadFace = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef(null);

  const handleUpload = async () => {
    if (!name.trim()) {
      message.error('Please enter a name');
      return;
    }
    if (fileList.length === 0) {
      message.error('Please select at least one image');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append('images', file.originFileObj);
    });
    formData.append('name', name);

    try {
      await axios.post('http://127.0.0.1:5000/api/upload-images', formData);
      message.success(`Hey ${name}, Nice to meet you!`);
      setName('');
      setFileList([]);
      onClose();
    } catch (error) {
      message.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = ({ fileList }) => setFileList(fileList);

  return (
    <Modal
      title="Let Maya know you"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUpload}
          loading={uploading}
        >
          Upload
        </Button>,
      ]}
    >
      <Input
        placeholder="What's your name?"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Upload
        listType="picture-card"
        fileList={fileList}
        onChange={handleChange}
        beforeUpload={() => false}
        ref={uploadRef}
      >
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Upload your Image</div>
        </div>
      </Upload>
    </Modal>
  );
};

export default UploadFace;