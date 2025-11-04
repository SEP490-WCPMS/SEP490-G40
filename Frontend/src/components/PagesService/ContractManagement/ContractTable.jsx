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
    ellipsis: true,
    width: '12%',
  },
  {
    title: 'Tên Khách hàng',
    dataIndex: 'customerName',
    key: 'customerName',
    ellipsis: true,
    width: '15%',
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
    filters: [
      { text: 'Bản nháp', value: 'DRAFT' },
      { text: 'Đang chờ khảo sát', value: 'PENDING' },
      { text: 'Đã khảo sát', value: 'PENDING_SURVEY_REVIEW' },
      { text: 'Đã duyệt', value: 'APPROVED' },
      { text: 'Đang chờ khách ký', value: 'PENDING_SIGN' },
      { text: 'Khách đã ký, chờ lắp đặt', value: 'SIGNED' },
      { text: 'Đang hoạt động', value: 'ACTIVE' },
      { text: 'Hết hạn', value: 'EXPIRED' },
      { text: 'Đã chấm dứt', value: 'TERMINATED' },
      { text: 'Bị tạm ngưng', value: 'SUSPENDED' }
    ],
    onFilter: (value, record) => record.contractStatus === value,
    render: (status) => {
      let color;
      let displayText;
      
      switch (status?.toUpperCase()) {
        case 'DRAFT':
          color = 'blue';
          displayText = 'Bản nháp';
          break;
        case 'PENDING':
          color = 'gold';
          displayText = 'Đang chờ khảo sát';
          break;
        case 'PENDING_SURVEY_REVIEW':
          color = 'orange';
          displayText = 'Đã khảo sát';
          break;
        case 'APPROVED':
          color = 'cyan';
          displayText = 'Đã duyệt';
          break;
        case 'PENDING_SIGN':
          color = 'geekblue';
          displayText = 'Đang chờ khách ký';
          break;
        case 'SIGNED':
          color = 'purple';
          displayText = 'Khách đã ký, chờ lắp đặt';
          break;
        case 'ACTIVE':
          color = 'green';
          displayText = 'Đang hoạt động';
          break;
        case 'EXPIRED':
          color = 'volcano';
          displayText = 'Hết hạn';
          break;
        case 'TERMINATED':
          color = 'red';
          displayText = 'Đã chấm dứt';
          break;
        case 'SUSPENDED':
          color = 'magenta';
          displayText = 'Bị tạm ngưng';
          break;
        default:
          color = 'default';
          displayText = status || 'N/A';
      }
      return <Tag color={color}>{displayText}</Tag>;
    },
  },
  {
    title: 'Hành động',
    key: 'action',
    fixed: 'right',
    width: 200,
    render: (_, record) => {
      const status = record.contractStatus?.toUpperCase();
      return (
        <Space size="small" wrap>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onViewDetails(record)}
          >
            Chi tiết
          </Button>
          
          {/* Hiển thị các nút hành động dựa trên trạng thái */}
          {status === 'DRAFT' && (
            <Button type="primary" onClick={() => onViewDetails(record, 'submit')}>
              Gửi khảo sát
            </Button>
          )}
          
          {status === 'PENDING' && (
            // Không hiển thị nút gì thêm, chỉ dùng "Chi tiết"
            null
          )}

          {status === 'PENDING_SURVEY_REVIEW' && (
            <>
              <Button type="primary" onClick={() => onViewDetails(record, 'approveSurvey')}>
                Duyệt báo cáo
              </Button>
              <Button danger onClick={() => onViewDetails(record, 'rejectSurvey')}>
                Từ chối
              </Button>
            </>
          )}

          {status === 'APPROVED' && (
            <>
              <Button onClick={() => onViewDetails(record, 'generateWater')}>
                Tạo HĐ chính thức
              </Button>
              <Button type="primary" onClick={() => onViewDetails(record, 'sendToSign')}>
                Gửi ký
              </Button>
              <Button onClick={() => onViewDetails(record, 'edit')}>
                Sửa
              </Button>
            </>
          )}

          {status === 'PENDING_SIGN' && (
            // Không hiển thị nút gì thêm, chỉ dùng "Chi tiết"
            null
          )}

          {status === 'SIGNED' && (
            <Button type="primary" onClick={() => onViewDetails(record, 'sendToInstall')}>
              Lắp đặt
            </Button>
          )}

          {status === 'ACTIVE' && (
            <>
              <Button type="default" onClick={() => onViewDetails(record, 'suspend')}>
                Tạm ngưng
              </Button>
              <Button danger onClick={() => onViewDetails(record, 'terminate')}>
                Chấm dứt
              </Button>
            </>
          )}

          {status === 'SUSPENDED' && (
            <Button type="primary" onClick={() => onViewDetails(record, 'reactivate')}>
              Kích hoạt lại
            </Button>
          )}
        </Space>
      );
    },
  },
];

const ContractTable = ({ data, loading, pagination, onPageChange, onViewDetails }) => {
  return (
    <Table
      columns={columns(onViewDetails)}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={onPageChange}
      rowKey="id"
      style={{ marginTop: '20px' }}
      bordered
    />
  );
};

export default ContractTable;