import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Dropdown } from 'antd';
// Thêm các icon cần thiết
import { FilterOutlined, CheckOutlined } from '@ant-design/icons';
import { getAnnulRequests, getServiceRequestDetail } from '../../Services/apiService';
import RequestDetailModal from './RequestDetailModal';
import Pagination from '../../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ContractAnnulList = ({ refreshKey, keyword }) => {
  const [annuls, setAnnuls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  
  const [filterStatus, setFilterStatus] = useState(null); 

  // Helper render trạng thái (giống ContractTable)
  const renderStatus = (status) => {
    const s = (status || '').toUpperCase();
    const map = {
      PENDING: { text: 'Đang chờ xử lý', cls: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { text: 'Đã duyệt', cls: 'bg-green-100 text-green-800' },
      REJECTED: { text: 'Đã từ chối', cls: 'bg-red-100 text-red-800' },
    };
    const cfg = map[s] || { text: (status || '—'), cls: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${cfg.cls}`}>
        {cfg.text}
      </span>
    );
  };

  // --- LOGIC FILTER DROPDOWN MỚI ---
  const handleMenuClick = ({ key }) => {
      const status = key === 'all' ? null : key;
      setFilterStatus(status);
      fetchData({ page: 0, approvalStatus: status });
  };

  const filterMenu = {
      items: [
          { 
              key: 'all', 
              label: <div className="flex justify-between items-center w-full min-w-[120px]">Tất cả {filterStatus === null && <CheckOutlined className="text-blue-600"/>}</div> 
          },
          { 
              key: 'PENDING', 
              label: <div className="flex justify-between items-center w-full"><div><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-2"></span>Đang chờ xử lý</div> {filterStatus === 'PENDING' && <CheckOutlined className="text-blue-600"/>}</div> 
          },
          { 
              key: 'APPROVED', 
              label: <div className="flex justify-between items-center w-full"><div><span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>Đã duyệt</div> {filterStatus === 'APPROVED' && <CheckOutlined className="text-blue-600"/>}</div> 
          },
          { 
              key: 'REJECTED', 
              label: <div className="flex justify-between items-center w-full"><div><span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2"></span>Đã từ chối</div> {filterStatus === 'REJECTED' && <CheckOutlined className="text-blue-600"/>}</div> 
          },
      ],
      onClick: handleMenuClick
  };
  // --------------------------------

  // Class chung cho Header để đồng bộ style (Nhạt hơn, không quá đậm)
  const headerClass = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50';

  const columns = [
    { 
      title: 'Mã Hợp đồng', // Bỏ cột ID (tùy bạn quyết định giữ hay bỏ, code này bỏ theo ContractTransferList)
      dataIndex: 'contractNumber', 
      key: 'contractNumber',
      onHeaderCell: () => ({ className: headerClass }),
      className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'
    },
    { 
      title: 'Tên Khách hàng',
      dataIndex: 'customerName', 
      key: 'customerName',
      onHeaderCell: () => ({ className: headerClass }),
      className: 'px-6 py-4 text-sm text-gray-900'
    },
    { 
      title: 'Ngày yêu cầu',
      dataIndex: 'requestDate', 
      key: 'requestDate',
      onHeaderCell: () => ({ className: headerClass }),
      className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '—'
    },
    { 
      title: 'Lý do', 
      dataIndex: 'reason', 
      key: 'reason', 
      ellipsis: true,
      onHeaderCell: () => ({ className: headerClass }),
      className: 'px-6 py-4 text-sm text-gray-900'
    },
    {
      // --- SỬA TIÊU ĐỀ CỘT ĐỂ CÓ ICON LỌC ---
      title: (
        <div className="flex items-center gap-1 cursor-pointer">
            <span>Trạng thái</span>
            <Dropdown menu={filterMenu} trigger={['click']} placement="bottomRight">
                <div className={`p-1 rounded hover:bg-gray-200 transition-colors ${filterStatus !== null ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
                    <FilterOutlined style={{ fontSize: '12px' }} />
                </div>
            </Dropdown>
        </div>
      ),
      dataIndex: 'status',
      key: 'status',
      onHeaderCell: () => ({ className: headerClass }),
      className: 'px-6 py-4 whitespace-nowrap text-sm',
      render: (status) => renderStatus(status), // Sử dụng helper renderStatus mới
    },
    {
      title: 'Hành động',
      key: 'action',
      onHeaderCell: () => ({ className: headerClass }),
      className: 'px-6 py-4 text-sm',
      render: (_, record) => (
        <button
          key="detail"
          onClick={() => handleViewDetails(record)}
          className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
        >
          Chi tiết & Xử lý
        </button>
      ),
    },
  ];

  const handleViewDetails = (record) => {
    setDetailLoading(true);
    setDetailOpen(true);
    getServiceRequestDetail(record.id)
      .then(res => {
        const core = res?.data || {}; 
        setDetailData({
          id: record.id,
          contractNumber: core.contractNumber || record.contractNumber,
          requestDate: record.requestDate, 
          requestType: 'ANNUL',
          status: core.approvalStatus || record.status,
          reason: core.reason || record.reason,
          fromCustomerName: core.fromCustomerName || record.customerName,
          attachedEvidence: core.attachedEvidence,
          approvalNote: core.approvalNote,
        });
      })
      .catch(() => toast.error('Lỗi tải chi tiết'))
      .finally(() => setDetailLoading(false));
  };

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const page = params.page !== undefined ? params.page : pagination.page;
      const currentSize = params.size || pagination.size;
      
      let currentStatus = 'approvalStatus' in params ? params.approvalStatus : filterStatus;

      if (Array.isArray(currentStatus)) {
          currentStatus = currentStatus.length > 0 ? currentStatus.join(',') : null;
      }

      const response = await getAnnulRequests({
        page: page,
        size: currentSize,
        status: currentStatus, 
        keyword: keyword,
        sort: 'updatedAt,desc'
      });

      const data = response?.data || {};
      const rawItems = data?.content || data?.items || data?.list || data?.data || [];

      const items = rawItems.map((it) => ({
        id: it.id,
        contractNumber: it.contractNumber || '—',
        customerName: it.fromCustomerName || '—',
        requestDate: it.createdDate || it.createdAt || it.requestDate, 
        reason: it.reason || '—',
        status: it.status || it.approvalStatus || 'PENDING',
      }));

      // Robust pagination mapping
      const pageInfo = data?.page || data || {};
      const pageNum = (pageInfo.number ?? pageInfo.page ?? data?.number) ?? 0;
      const sizeNum = (pageInfo.size ?? pageInfo.pageSize ?? data?.size) ?? pagination.size ?? 10;
      const totalElements = (pageInfo.totalElements ?? pageInfo.total ?? data?.totalElements ?? data?.total) ?? rawItems.length;

      setAnnuls(items);
      setPagination({
        page: Number(pageNum),
        size: Number(sizeNum),
        totalElements: Number(totalElements),
      });
    } catch (error) {
      console.error(error);
      setAnnuls([]);
    } finally {
      setLoading(false);
    }
  };

  // Thêm keyword vào dependency array
  useEffect(() => { 
      fetchData({ page: 0 }); 
  }, [refreshKey, keyword]);

  const handlePageChange = (newPage) => { fetchData({ page: newPage }); };

  // Hàm handleTableChange giờ chỉ để giữ props, không dùng logic filter cũ nữa
  const handleTableChange = (pagination, filters) => {
    // Logic filter cũ đã bỏ
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      
      <Card 
        styles={{ body: { padding: 0 } }} 
        className="overflow-hidden rounded-lg shadow-sm border border-gray-200"
      > 
        <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={annuls}
              pagination={false} 
              loading={loading}
              rowKey="id"
              onChange={handleTableChange}
              onRow={(record) => ({ 'data-contract-id': record.id })}
              style={{ marginBottom: 0 }} 
              className="no-border-last-row"
            />
        </div>
        
        {!loading && annuls.length > 0 && (
          <div className="bg-white px-6 py-4">
            <Pagination
              currentPage={pagination.page}
              totalElements={pagination.totalElements}
              pageSize={pagination.size}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>

      <style>{`
        .no-border-last-row .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        /* Style cho Header Table để đồng bộ background màu xám nhạt */
        .ant-table-thead > tr > th {
            background: #f9fafb !important; /* bg-gray-50 */
            border-bottom: 1px solid #e5e7eb !important; /* border-gray-200 */
        }
      `}</style>

      <RequestDetailModal
        visible={detailOpen}
        onCancel={() => setDetailOpen(false)}
        loading={detailLoading}
        data={detailData}
        onSuccess={() => fetchData({ page: pagination.page })}
      />
    </>
  );
};

export default ContractAnnulList;