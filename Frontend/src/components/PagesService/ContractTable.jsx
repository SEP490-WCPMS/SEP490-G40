import React from 'react';
import Pagination from '../common/Pagination';
import { Loader2 } from 'lucide-react';
import { Tag, Tooltip } from 'antd';
import { PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';

// Helper: render trạng thái
const renderStatus = (status) => {
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
};

// Helper: render actions
const renderActions = (record, onViewDetails) => {
  const status = record.contractStatus?.toUpperCase();
  const actions = [];

  // Chi tiết button (luôn có)
  actions.push(
    <button
      key="detail"
      onClick={() => onViewDetails(record)}
      className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
    >
      Chi tiết
    </button>
  );

  // Action buttons theo trạng thái
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

  // --- SỬA LẠI ĐÚNG NHƯ CŨ: Nút "Tạo HĐ chính thức" ---
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
    // Vẫn giữ nút Từ chối nếu cần thiết (theo code SurveyReviewPage của bạn)
    actions.push(
       <button
        key="reject"
        className="font-semibold text-red-600 hover:text-red-800 transition duration-150 ease-in-out"
        onClick={() => onViewDetails(record, 'rejectSurvey')}
      >
        Từ chối
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
};

const ContractTable = ({ data, loading, pagination, onPageChange, onViewDetails, showStatusFilter = false }) => {
  // Convert pagination từ Ant Design format sang Pagination component format
  const currentPage = pagination?.current ? pagination.current - 1 : 0; // Ant Design dùng 1-indexed, Pagination dùng 0-indexed
  const pageSize = pagination?.pageSize || 10;
  const totalElements = pagination?.total || 0;

  const handlePageChange = (newPage) => {
    // Convert từ 0-indexed sang 1-indexed cho Ant Design compatibility
    if (onPageChange) {
      onPageChange({ ...pagination, current: newPage + 1 });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mt-5">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số Hợp đồng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              {/* Cột mới: Liên hệ (Hiển thị SĐT/Địa chỉ cho Guest) */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Liên hệ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center gap-2 text-gray-500">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50" data-contract-id={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.contractNumber}
                  </td>
                  
                  {/* --- LOGIC HIỂN THỊ TÊN VÀ BADGE GUEST --- */}
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{record.customerName}</div>
                    {record.isGuest ? (
                       <Tag color="orange" className="mt-1 border-0">Khách (Chưa có tài khoản)</Tag>
                    ) : (
                       <div className="text-xs text-gray-500">{record.customerCode}</div>
                    )}
                  </td>

                  {/* --- CỘT LIÊN HỆ (Cho Guest và cả Customer) --- */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                     <div className="flex flex-col gap-1">
                        {record.contactPhone && (
                            <div className="flex items-center gap-1">
                                <PhoneOutlined className="text-xs text-blue-500"/> {record.contactPhone}
                            </div>
                        )}
                        {record.address && (
                            <Tooltip title={record.address}>
                                <div className="flex items-center gap-1 max-w-[200px] truncate">
                                    <EnvironmentOutlined className="text-xs text-red-500"/> {record.address}
                                </div>
                            </Tooltip>
                        )}
                     </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {renderStatus(record.contractStatus)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {renderActions(record, onViewDetails)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default ContractTable;