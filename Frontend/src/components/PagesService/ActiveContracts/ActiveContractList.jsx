import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pagination from '../../common/Pagination';
import { getServiceContracts } from '../../Services/apiService';

const ActiveContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0
  });

  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Số Hợp đồng',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
    },
    {
      title: 'Tên Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'contractStatus',
      key: 'contractStatus',
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã kết thúc'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewDetails = (record) => {
    // Xử lý xem chi tiết hợp đồng
  };

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const currentPage = params.page !== undefined ? params.page : pagination.page;
      const currentSize = params.size !== undefined ? params.size : pagination.size;
      const response = await getServiceContracts({
        page: currentPage,
        size: currentSize,
        status: 'ACTIVE'
      });
      setContracts(response.data?.content || []);
      const pageInfo = response.data?.page || response.data || {};
      setPagination({
        page: pageInfo.number !== undefined ? pageInfo.number : currentPage,
        size: pageInfo.size || currentSize,
        totalElements: pageInfo.totalElements || 0
      });
    } catch (error) {
      toast.error('Không thể tải danh sách hợp đồng');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (newPage) => {
    fetchData({ page: newPage });
  };

  return (
    <Card title="Danh sách hợp đồng đang hoạt động">
      <Table
        columns={columns}
        dataSource={contracts}
        pagination={false}
        loading={loading}
        rowKey="id"
      />
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <Pagination
          currentPage={pagination.page}
          totalElements={pagination.totalElements}
          pageSize={pagination.size}
          onPageChange={handlePageChange}
        />
      </div>
    </Card>
  );
};

export default ActiveContractList;

