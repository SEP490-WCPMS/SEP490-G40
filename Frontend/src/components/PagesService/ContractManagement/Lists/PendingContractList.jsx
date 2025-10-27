import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, message } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { getServiceContracts, updateContractStatus } from '../../../Services/apiService';

const PendingContractList = () => {
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
      title: 'Ngày yêu cầu',
      dataIndex: 'requestDate',
      key: 'requestDate',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'contractStatus',
      key: 'contractStatus',
      render: (status) => {
        let color;
        let text;
        switch (status) {
          case 'PENDING':
            color = 'gold';
            text = 'Đang chờ xử lý';
            break;
          case 'PENDING_SURVEY_REVIEW':
            color = 'orange';
            text = 'Đang chờ báo cáo khảo sát';
            break;
          case 'APPROVED':
            color = 'cyan';
            text = 'Đã duyệt';
            break;
          case 'REJECTED':
            color = 'red';
            text = 'Đã từ chối';
            break;
          default:
            color = 'default';
            text = status;
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
          {record.contractStatus === 'PENDING' && (
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
    // Xử lý xem chi tiết hợp đồng
  };

  const handleApprove = async (record) => {
    try {
      await updateContractStatus(record.id, 'APPROVED', 'Duyệt hợp đồng');
      message.success('Duyệt hợp đồng thành công!');
      fetchData();
    } catch (error) {
      message.error('Duyệt hợp đồng thất bại!');
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (record) => {
    try {
      await updateContractStatus(record.id, 'REJECTED', 'Từ chối hợp đồng');
      message.success('Từ chối hợp đồng thành công!');
      fetchData();
    } catch (error) {
      message.error('Từ chối hợp đồng thất bại!');
      console.error('Reject error:', error);
    }
  };

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const statuses = ['PENDING', 'PENDING_SURVEY_REVIEW', 'PENDING_SIGN'];
      const allContracts = [];
      
      for (const status of statuses) {
        const response = await getServiceContracts({
          page: 0,
          size: 100,
          status: status
        });
        allContracts.push(...(response.data?.content || []));
      }
      
      setContracts(allContracts);
      setPagination({
        ...pagination,
        total: allContracts.length,
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
    <Card title="Danh sách hợp đồng đang xử lý">
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

export default PendingContractList;