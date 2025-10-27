import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, message } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { getAnnulRequests, approveAnnulRequest, rejectAnnulRequest } from '../../../Services/apiService';

const ContractAnnulList = () => {
  const [annuls, setAnnuls] = useState([]);
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
      title: 'Ngày yêu cầu',
      dataIndex: 'requestDate',
      key: 'requestDate',
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = status;
        switch (status) {
          case 'PENDING':
            color = 'gold';
            text = 'Đang chờ xử lý';
            break;
          case 'APPROVED':
            color = 'green';
            text = 'Đã duyệt';
            break;
          case 'REJECTED':
            color = 'red';
            text = 'Đã từ chối';
            break;
        }
        return <Tag color={color}>{text}</Tag>;
      },
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
          {record.status === 'PENDING' && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record)}
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleViewDetails = (record) => {
    // Xử lý xem chi tiết yêu cầu hủy hợp đồng
  };

  const handleApprove = async (record) => {
    try {
      await approveAnnulRequest(record.id);
      message.success('Duyệt yêu cầu hủy hợp đồng thành công!');
      fetchData();
    } catch (error) {
      message.error('Duyệt yêu cầu thất bại!');
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (record) => {
    try {
      await rejectAnnulRequest(record.id, 'Từ chối yêu cầu');
      message.success('Từ chối yêu cầu hủy hợp đồng thành công!');
      fetchData();
    } catch (error) {
      message.error('Từ chối yêu cầu thất bại!');
      console.error('Reject error:', error);
    }
  };

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const response = await getAnnulRequests({
        page: (params.current || pagination.current) - 1,
        size: params.pageSize || pagination.pageSize
      });
      setAnnuls(response.data?.content || []);
      setPagination({
        ...pagination,
        total: response.data?.totalElements || 0,
        current: params.current || pagination.current,
        pageSize: params.pageSize || pagination.pageSize
      });
    } catch (error) {
      message.error('Không thể tải danh sách yêu cầu hủy hợp đồng');
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
    <Card title="Danh sách yêu cầu hủy hợp đồng">
      <Table
        columns={columns}
        dataSource={annuls}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        rowKey="id"
      />
    </Card>
  );
};

export default ContractAnnulList;