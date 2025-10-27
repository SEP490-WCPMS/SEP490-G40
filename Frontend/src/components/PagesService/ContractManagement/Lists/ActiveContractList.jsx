import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getServiceContracts } from '../../../Services/apiService';

const ActiveContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
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
      const response = await getServiceContracts({
        page: (params.current || pagination.current) - 1,
        size: params.pageSize || pagination.pageSize,
        status: 'ACTIVE'
      });
      setContracts(response.data?.content || []);
      setPagination({
        ...pagination,
        total: response.data?.totalElements || 0,
        current: params.current || pagination.current,
        pageSize: params.pageSize || pagination.pageSize
      });
    } catch (error) {
      message.error('Không thể tải danh sách hợp đồng');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableChange = (newPagination, filters, sorter) => {
    fetchData({
      pageSize: newPagination.pageSize,
      current: newPagination.current,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    });
  };

  return (
    <Card title="Danh sách hợp đồng đang hoạt động">
      <Table
        columns={columns}
        dataSource={contracts}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        rowKey="id"
      />
    </Card>
  );
};

export default ActiveContractList;