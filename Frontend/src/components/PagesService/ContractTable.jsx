import React from 'react';
import Pagination from '../common/Pagination';
import { Loader2, FileText, User, Phone, MapPin } from 'lucide-react';
import { Tag, Tooltip, Space } from 'antd';
import { PhoneOutlined, EnvironmentOutlined, UserOutlined, EditOutlined, WarningOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';

// Helper: render trạng thái
// Trả về một badge nhỏ (styled span) mô tả trạng thái hợp đồng
const renderStatus = (record) => {
  const status = record.contractStatus;
  const note = record.notes || "";
  // Check nếu bị từ chối (Status APPROVED và có note reject)
  // const isRejected = status === 'APPROVED' && note.includes("[Customer Reject Sign]");
  const isRejected = false;
  const s = status?.toUpperCase();
  const map = {
    DRAFT: { text: 'Yêu cầu tạo đơn', cls: 'bg-blue-100 text-blue-800' },
    PENDING: { text: 'Đang chờ khảo sát', cls: 'bg-yellow-100 text-yellow-800' },
    PENDING_SURVEY_REVIEW: { text: 'Đã khảo sát', cls: 'bg-orange-100 text-orange-800' },
    // Nếu bị reject thì đổi màu đỏ cho nổi bật
    // APPROVED: { text: isRejected ? 'Bị từ chối (Cần sửa)' : 'Đã duyệt', cls: isRejected ? 'bg-red-100 text-red-800' : 'bg-cyan-100 text-cyan-800' },
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
    <div className="flex items-center gap-1">
      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${cfg.cls}`}>
        {cfg.text}
      </span>
      {/* {isRejected && (
        <Tooltip title="Khách hàng đã từ chối ký. Vui lòng xem lý do và sửa lại hợp đồng.">
           <WarningOutlined className="text-red-500 animate-pulse" />
        </Tooltip>
      )} */}
    </div>
  );
};

// Helper: render actions
// Sinh các nút hành động phù hợp với `record.contractStatus`.
// Các nút sẽ gọi `onViewDetails(record, action)` với action tương ứng.
const renderActions = (record, onViewDetails) => {
  const status = record.contractStatus?.toUpperCase();
  const note = record.notes || "";
  // const isRejected = status === 'APPROVED' && note.includes("[Customer Reject Sign]");
  const isRejected = false;
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

  // --- Nút "Tạo HĐ chính thức" ---
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
    // Chỉ hiện nút Gửi ký khi KHÔNG bị reject hoặc đã sửa xong (logic này tùy bạn, ở đây hiện luôn để gửi lại)
    actions.push(
      <button
        key="sendToSign"
        className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
        onClick={() => {
          // Block guest customers from sending to sign with a warning + red toast
          if (record.isGuest || !record.customerCode) {
            const contentNode = (
              <div>
                <p>Khách hàng <b>{record.customerName}</b> hiện là Guest (Chưa có tài khoản).</p>
                <p>Vui lòng liên hệ Admin để tạo tài khoản cho khách hàng này trước khi gửi hợp đồng ký điện tử.</p>
              </div>
            );
            // Show only a react-toastify error toast (no modal)
            toast.error(contentNode, { position: 'top-center', autoClose: 5000 });
            return;
          }
          onViewDetails(record, 'sendToSign');
        }}
      >
        Gửi ký
      </button>
    );

    // --- THÊM NÚT SỬA (CHỈ KHI BỊ REJECT) ---
    // if (isRejected) {
    //     actions.push(
    //       <button
    //         key="edit"
    //         className="font-semibold text-orange-600 hover:text-orange-900 transition duration-150 ease-in-out ml-2"
    //         onClick={() => onViewDetails(record, 'edit')} // Gọi action 'edit'
    //       >
    //         <EditOutlined /> Sửa
    //       </button>
    //     );
    // }
    // ----------------------------------------
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
    // Đã bỏ nút Tạm ngưng và Chấm dứt theo yêu cầu
  }

  // --- NÚT GIA HẠN ---
  if (status === 'EXPIRED') {
    actions.push(
      <button
        key="renew"
        className="font-semibold text-blue-600 hover:text-blue-800 transition duration-150 ease-in-out"
        onClick={() => onViewDetails(record, 'renew')}
      >
        Gia hạn
      </button>
    );
  }

  if (status === 'SUSPENDED') {
     // Đã bỏ nút Kích hoạt lại theo yêu cầu
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

// Component ContractTable
// - Hiển thị hàng hợp đồng, trạng thái, thông tin liên hệ và các hành động.
// - `onPageChange` nhận object pagination (AntD-style) hoặc số trang.
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

// --- CARD VIEW CHO MOBILE ---
  const MobileCard = ({ record }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 flex flex-col gap-2">
      {/* Hàng 1: Mã HĐ + Status */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 text-blue-700 font-semibold">
          <FileText size={16} />
          <span>{record.contractNumber}</span>
        </div>
        {renderStatus(record)}
      </div>

      {/* Hàng 2: Khách hàng */}
      <div className="flex items-start gap-2 mt-1">
        <User size={16} className="text-gray-400 mt-1 shrink-0" />
        <div>
          <div className="font-medium text-gray-800">{record.customerName || 'Guest'}</div>
          {(record.isGuest || !record.customerCode) ? (
             <span className="text-xs text-orange-500 bg-orange-50 px-1 rounded">Chưa có TK</span>
          ) : (
             <div className="text-xs text-gray-500">{record.customerCode}</div>
          )}
        </div>
      </div>

      {/* Hàng 3: Liên hệ (Phone + Address) */}
      <div className="pl-6 space-y-1 text-sm text-gray-600">
        {record.contactPhone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span>{record.contactPhone}</span>
          </div>
        )}
        {record.address && (
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-gray-400 mt-1 shrink-0" />
            <span className="line-clamp-2">{record.address}</span>
          </div>
        )}
      </div>

      {/* Hàng 4: Actions (Footer) */}
      <div className="border-t border-gray-100 pt-3 mt-2">
        {renderActions(record, onViewDetails)}
      </div>
    </div>
  );

  return (
    <div className="mt-5">
      {loading ? (
        <div className="py-12 text-center">
          <div className="flex justify-center items-center gap-2 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            <span>Đang tải...</span>
          </div>
        </div>
      ) : (
        <>
          {/* 1. MOBILE VIEW: Hiện danh sách thẻ khi màn hình < sm (640px) */}
          <div className="block sm:hidden">
            {data && data.length > 0 ? (
              data.map(record => <MobileCard key={record.id} record={record} />)
            ) : (
              <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-dashed">Không có dữ liệu</div>
            )}
          </div>

          {/* 2. DESKTOP VIEW: Hiện bảng khi màn hình >= sm */}
          <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Hợp đồng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data && data.length > 0 ? (
                    data.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.contractNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <UserOutlined className="text-gray-400" />
                            <div>
                              <div className="font-medium">{record.customerName || 'Guest'}</div>
                              {(record.isGuest || !record.customerCode) ? (
                                <Tag color="orange" className="mt-1 border-0 text-[10px] px-1">Chưa có tài khoản</Tag>
                              ) : (
                                <div className="text-xs text-gray-500">{record.customerCode}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-col gap-1">
                            {record.contactPhone && <div className="flex items-center gap-1"><PhoneOutlined className="text-xs text-blue-500"/> {record.contactPhone}</div>}
                            {record.address && <Tooltip title={record.address}><div className="flex items-center gap-1 max-w-[200px] truncate"><EnvironmentOutlined className="text-xs text-red-500"/> {record.address}</div></Tooltip>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{renderStatus(record)}</td>
                        <td className="px-6 py-4 text-sm">{renderActions(record, onViewDetails)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
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