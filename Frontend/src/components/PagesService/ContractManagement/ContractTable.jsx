import React from 'react';
import { Table } from 'antd';

// Định nghĩa các cột cho bảng
const columns = (onViewDetails, showStatusFilter = false) => [
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
    filters: showStatusFilter ? [
      { text: 'Bản nháp', value: 'DRAFT' },
      { text: 'Đang chờ khảo sát', value: 'PENDING' },
      { text: 'Đã khảo sát', value: 'PENDING_SURVEY_REVIEW' },
      { text: 'Đã duyệt', value: 'APPROVED' },
      { text: 'Khách đã ký', value: 'PENDING_SIGN' },
      { text: 'Chờ lắp đặt', value: 'SIGNED' },
      { text: 'Đang hoạt động', value: 'ACTIVE' },
      { text: 'Hết hạn', value: 'EXPIRED' },
      { text: 'Đã chấm dứt', value: 'TERMINATED' },
      { text: 'Bị tạm ngưng', value: 'SUSPENDED' }
    ] : undefined,
    onFilter: showStatusFilter ? ((value, record) => record.contractStatus === value) : undefined,
    render: (status) => {
      const s = status?.toUpperCase();
      const map = {
        DRAFT: { text: 'Yêu cầu tạo đơn', cls: 'bg-blue-100 text-blue-800' },
        PENDING: { text: 'Đang chờ khảo sát', cls: 'bg-yellow-100 text-yellow-800' },
        PENDING_SURVEY_REVIEW: { text: 'Đã khảo sát', cls: 'bg-orange-100 text-orange-800' },
        APPROVED: { text: 'Đã duyệt', cls: 'bg-cyan-100 text-cyan-800' },
        PENDING_SIGN: { text: 'Khách đã ký', cls: 'bg-indigo-100 text-indigo-800' },
        SIGNED: { text: 'Chờ lắp đặt', cls: 'bg-purple-100 text-purple-800' },
        ACTIVE: { text: 'Đang hoạt động', cls: 'bg-green-100 text-green-800' },
        EXPIRED: { text: 'Hết hạn', cls: 'bg-rose-100 text-rose-800' },
        TERMINATED: { text: 'Đã chấm dứt', cls: 'bg-red-100 text-red-800' },
        SUSPENDED: { text: 'Bị tạm ngưng', cls: 'bg-pink-100 text-pink-800' },
      };
      const cfg = map[s] || { text: (status || 'N/A'), cls: 'bg-gray-100 text-gray-800' };
      return (
        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${cfg.cls}`}>
          {cfg.text}
        </span>
      );
    },
  },
  {
    title: 'Hành động',
    key: 'action',
    fixed: 'right',
    width: 200,
    render: (_, record) => {
      const status = record.contractStatus?.toUpperCase();

      // Xây danh sách nút hành động theo trạng thái
      const actions = [];
      actions.push(
        <button
          key="detail"
          onClick={() => onViewDetails(record)}
          className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
        >
          Chi tiết
        </button>
      );

      if (status === 'DRAFT') {
        actions.push(
          <button
            key="submit"
            className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
            onClick={() => onViewDetails(record, 'submit')}
          >
            Gửi khảo sát
          </button>
        );
      }

      if (status === 'PENDING_SURVEY_REVIEW') {
        actions.push(
          <button
            key="generate"
            className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
            onClick={() => onViewDetails(record, 'generateWater')}
          >
            Tạo HĐ chính thức
          </button>
        );
      }

      if (status === 'APPROVED') {
        actions.push(
          <button
            key="sendToSign"
            className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
            onClick={() => onViewDetails(record, 'sendToSign')}
          >
            Gửi ký
          </button>
        );
      }

      if (status === 'PENDING_SIGN') {
        actions.push(
          <button
            key="sendToInstall"
            className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
            onClick={() => onViewDetails(record, 'sendToInstallation')}
          >
            Gửi lắp đặt
          </button>
        );
      }

      if (status === 'ACTIVE') {
        actions.push(
          <button
            key="suspend"
            className="font-semibold text-gray-700 hover:text-gray-900 transition duration-150 ease-in-out"
            onClick={() => onViewDetails(record, 'suspend')}
          >
            Tạm ngưng
          </button>
        );
        actions.push(
          <button
            key="terminate"
            className="font-semibold text-red-600 hover:text-red-800 transition duration-150 ease-in-out"
            onClick={() => onViewDetails(record, 'terminate')}
          >
            Chấm dứt
          </button>
        );
      }

      if (status === 'SUSPENDED') {
        actions.push(
          <button
            key="reactivate"
            className="font-semibold text-green-600 hover:text-green-800 transition duration-150 ease-in-out"
            onClick={() => onViewDetails(record, 'reactivate')}
          >
            Kích hoạt lại
          </button>
        );
      }

      return (
        <div className="flex flex-wrap items-center gap-3">
          {actions.map((el, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-gray-300">|</span>}
              {el}
            </React.Fragment>
          ))}
        </div>
      );
    },
  },
];

const ContractTable = ({ data, loading, pagination, onPageChange, onViewDetails, showStatusFilter = false }) => {
  return (
    <Table
      columns={columns(onViewDetails, showStatusFilter)}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={onPageChange}
      rowKey="id"
      className="bg-white rounded-lg shadow"
      size="middle"
      bordered={false}
      style={{ marginTop: '20px' }}
    />
  );
};

export default ContractTable;