import React from 'react';
import Pagination from '../common/Pagination';
import { Loader2 } from 'lucide-react';
import { Tag, Tooltip, Space } from 'antd'; // Import thêm Space nếu cần, hoặc dùng div gap
import { PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';

// Helper: render trạng thái (Giữ nguyên style cũ)
const renderStatus = (status) => {
  const s = status?.toUpperCase();
  const map = {
    DRAFT: { text: 'Yêu cầu tạo đơn', cls: 'bg-blue-100 text-blue-800' },
    PENDING_SURVEY_REVIEW: { text: 'Đã khảo sát', cls: 'bg-orange-100 text-orange-800' },
    APPROVED: { text: 'Đã duyệt', cls: 'bg-cyan-100 text-cyan-800' },
    PENDING_SIGN: { text: 'Khách đã ký', cls: 'bg-indigo-100 text-indigo-800' },
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

// --- FIX: VIẾT LẠI HÀM renderActions (Logic chặt chẽ theo từng trạng thái) ---
const renderActions = (record, onViewDetails) => {
  const status = record.contractStatus?.toUpperCase();
  const actions = [];

  // 1. Luôn hiện nút "Chi tiết" cho mọi trạng thái
  actions.push(
    <button
      key="detail"
      onClick={() => onViewDetails(record, 'view')}
      className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
    >
      Chi tiết
    </button>
  );

  // 2. Logic hiển thị nút theo từng trạng thái cụ thể
  switch (status) {
    case 'DRAFT': // Yêu cầu tạo đơn
      actions.push(
        <button key="submit" onClick={() => onViewDetails(record, 'submit')} className="font-semibold text-indigo-600 hover:text-indigo-900">
          Gửi khảo sát
        </button>
      );
      break;

    case 'PENDING_SURVEY_REVIEW': // Đã khảo sát
      actions.push(
        <button key="generate" onClick={() => onViewDetails(record, 'generateWater')} className="font-semibold text-indigo-600 hover:text-indigo-900">
          Tạo HĐ chính thức
        </button>
      );
      break;

    case 'APPROVED': // Đã duyệt
      actions.push(
        <button key="sendToSign" onClick={() => onViewDetails(record, 'sendToSign')} className="font-semibold text-indigo-600 hover:text-indigo-900">
          Gửi ký
        </button>
      );
      break;
    
    case 'PENDING_SIGN': // Khách đã ký (Chờ gửi lắp đặt)
      actions.push(
        <button key="install" onClick={() => onViewDetails(record, 'sendToInstallation')} className="font-semibold text-indigo-600 hover:text-indigo-900">
          Gửi lắp đặt
        </button>
      );
      break;

    case 'ACTIVE': // Đang hoạt động
      actions.push(
        <button key="suspend" onClick={() => onViewDetails(record, 'suspend')} className="font-semibold text-amber-600 hover:text-amber-800">
          Tạm ngưng
        </button>
      );
      actions.push(
        <button key="terminate" onClick={() => onViewDetails(record, 'terminate')} className="font-semibold text-red-600 hover:text-red-800">
          Chấm dứt
        </button>
      );
      break;

    case 'SUSPENDED': // Đang tạm ngưng
      actions.push(
        <button key="reactivate" onClick={() => onViewDetails(record, 'reactivate')} className="font-semibold text-green-600 hover:text-green-800">
          Kích hoạt lại
        </button>
      );
      break;

    case 'EXPIRED': // Hết hạn
      actions.push(
        <button key="renew" onClick={() => onViewDetails(record, 'renew')} className="font-semibold text-indigo-600 hover:text-indigo-900">
          Gia hạn
        </button>
      );
      break;

    case 'TERMINATED': // Đã chấm dứt
      // Không hiện thêm nút gì (chỉ hiện nút Chi tiết đã có ở trên)
      break;
      
    default:
      // Các trạng thái khác (PENDING, PENDING_CUSTOMER_SIGN...) chỉ hiện Chi tiết
      break;
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
// -------------------------------------------------------------------------

const ContractTable = ({ data, loading, pagination, onPageChange, onViewDetails, showStatusFilter = false, showActionsForAll = false }) => {
  // Convert pagination từ Ant Design format sang Pagination component format
  const currentPage = pagination?.current ? pagination.current - 1 : 0; 
  const pageSize = pagination?.pageSize || 10;
  const totalElements = pagination?.total || 0;

  const handlePageChange = (newPage) => {
    // Convert từ 0-indexed sang 1-indexed cho Ant Design compatibility
    if (onPageChange) {
      onPageChange({ ...pagination, current: newPage + 1 });
    }
  };

  // Logic lọc cũ (defensive) có thể bỏ qua vì renderActions giờ đã chặt chẽ
  const filteredData = data; 

  return (
    <div className="bg-white rounded-lg shadow mt-5">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã hợp đồng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
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
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center gap-2 text-gray-500">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData && filteredData.length > 0 ? (
              filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50" data-contract-id={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.contractNumber}
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{record.customerName}</div>
                    {record.isGuest ? (
                       <Tag color="orange" className="mt-1 border-0">Khách (Chưa có tài khoản)</Tag>
                    ) : (
                       <div className="text-xs text-gray-500">{record.customerCode}</div>
                    )}
                  </td>

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
                    {/* Render action buttons theo logic mới */}
                    {renderActions(record, onViewDetails)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
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