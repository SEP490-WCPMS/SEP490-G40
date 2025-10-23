import React from 'react';
import { Table, Tag, Button, Space } from 'antd';
import { EditOutlined } from '@ant-design/icons';

// Định nghĩa các cột cho bảng
const columns = (onViewDetails) => [
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
    ellipsis: true, // Thêm dấu ... nếu quá dài
  },
  {
    title: 'Tên Khách hàng',
    dataIndex: 'customerName',
    key: 'customerName',
    ellipsis: true,
  },
  {
    title: 'Mã Khách hàng',
    dataIndex: 'customerCode',
    key: 'customerCode',
  },
  {
    title: 'Trạng thái',
    dataIndex: 'contractStatus',
    key: 'contractStatus',
    render: (status) => {
      let color;
      // Cập nhật case cho khớp với Enum backend nếu cần
      switch (status?.toUpperCase()) { // Dùng toUpperCase để đảm bảo khớp
        case 'DRAFT': color = 'blue'; break;
        case 'PENDING': case 'PENDING_SURVEY_REVIEW': color = 'orange'; break;
        case 'APPROVED': color = 'purple'; break;
        case 'ACTIVE': color = 'green'; break;
        case 'TERMINATED': case 'SUSPENDED': case 'EXPIRED': color = 'red'; break;
        default: color = 'default';
      }
      return <Tag color={color}>{status?.toUpperCase() || 'N/A'}</Tag>;
    },
  },
  {
    title: 'Hành động',
    key: 'action',
    fixed: 'right', // Giữ cột này cố định khi cuộn ngang
    width: 120,
    render: (_, record) => (
      <Space size="middle">
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => onViewDetails(record)}
        >
          Xem/Sửa
        </Button>
      </Space>
    ),
  },
];

const ContractTable = ({ data, loading, pagination, onPageChange, onViewDetails }) => {
  return (
    <Table
      columns={columns(onViewDetails)}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={onPageChange} // Antd Table tự xử lý sự kiện phân trang
      rowKey="id"
      style={{ marginTop: '20px' }}
      scroll={{ x: 'max-content' }} // Cho phép cuộn ngang
      bordered // Thêm đường viền cho bảng
    />
  );
};

export default ContractTable;