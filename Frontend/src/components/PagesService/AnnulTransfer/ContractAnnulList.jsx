import React, { useState, useEffect } from 'react';
import { Card, Table, Tag } from 'antd';
import { getAnnulRequests, getServiceRequestDetail } from '../../Services/apiService';
import apiClient from '../../Services/apiClient';
import RequestDetailModal from './RequestDetailModal';
import Pagination from '../../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ContractAnnulList = () => {
  const [annuls, setAnnuls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

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
        const code = typeof status === 'object' && status !== null
          ? (status.code || status.name || status.value || status.state || 'PENDING')
          : (status || 'PENDING');
        let color = 'default';
        let text = code;
        switch (code) {
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
      render: (_, record) => {
        // ✨ CHỈ GIỮ LẠI NÚT CHI TIẾT ✨
        return (
          <button
            key="detail"
            onClick={() => handleViewDetails(record)}
            className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
          >
            Chi tiết & Xử lý
          </button>
        );
      },
    },
  ];

  const handleViewDetails = (record) => {
    setDetailLoading(true);
    setDetailOpen(true);
    getServiceRequestDetail(record.id)
      .then(res => {
        const payload = res?.data;
        const core = payload?.data || payload?.result || payload?.content || payload || {};
        const normalized = {
          // Gán id cho đúng (rất quan trọng)
          id: record.id, 
          // ... (các trường chuẩn hóa khác giữ nguyên)
          requestNumber: core.requestNumber || record.requestNumber,
          contractNumber: core.contractNumber || record.contractNumber,
          requestDate: core.requestDate || record.requestDate,
          requestType: (core.requestType || record.requestType || 'ANNUL').toString().toUpperCase(),
          status: (typeof core.approvalStatus === 'string' ? core.approvalStatus : null)
            || (typeof core.status === 'object' && core.status ? (core.status.code || core.status.name || core.status.value) : null)
            || (typeof core.status === 'string' ? core.status : null)
            || record.status,
          reason: core.reason || core.notes || core.note,
          fromCustomerName: core.fromCustomerName || record.customerName,
          toCustomerName: core.toCustomerName,
          attachedEvidence: core.attachedEvidence || core.evidence || core.files,
          approvalNote: core.approvalNote || core.note || core.notes,
        };
        setDetailData(normalized);
      })
      .catch(err => {
        console.error('Get request detail error:', err);
        toast.error('Không thể tải chi tiết yêu cầu');
        setDetailOpen(false);
      })
      .finally(() => setDetailLoading(false));
  };

  // Xóa hàm handleApprove và handleReject
  
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const currentPage = params.page !== undefined ? params.page : pagination.page;
      const currentSize = params.size || pagination.size;
      
      const response = await getAnnulRequests({
        page: currentPage,
        size: currentSize
      });
      const data = response?.data;
        
      const pickArray = (obj) => {
        if (Array.isArray(obj)) return obj;
        const direct = obj?.content || obj?.items || obj?.list || obj?.records || obj?.data;
        if (Array.isArray(direct)) return direct;
        if (direct && typeof direct === 'object' && Array.isArray(direct.content)) return direct.content;
        if (obj && typeof obj === 'object') {
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (Array.isArray(v) && v.length && typeof v[0] === 'object') return v;
          }
        }
        return [];
      };
      const rawItems = pickArray(data);
        
      const items = rawItems.map((it) => ({
        ...it,
        contractNumber: it.contractNumber || it.contract_no || it.contractNo || '—',
        customerName:
          (it.fromCustomerName && it.fromCustomerName.trim() !== '') ? it.fromCustomerName :
          (it.contract && it.contract.customerName && it.contract.customerName.trim() !== '' ? it.contract.customerName :
          (it.customerId ? `KH #${it.customerId}` : '—')),
        requestDate: it.requestDate ? new Date(it.requestDate).toLocaleDateString('vi-VN') : '—',
        reason: it.reason || it.note || '—',
        status: (typeof it.approvalStatus === 'string' ? it.approvalStatus : null)
          || (typeof it.status === 'object' && it.status ? (it.status.code || it.status.name || it.status.value) : null)
          || (typeof it.status === 'string' ? it.status : null)
          || 'PENDING',
      }));
      let finalItems = items;
      if (!items.length) {
        try {
          const alt = await apiClient.get('/service/requests', { 
            params: { page: currentPage, size: currentSize } 
          });
          const altData = alt?.data;
          const altRaw = pickArray(altData);
          finalItems = altRaw
            .filter(it => (it.requestType || it.type || '').toString().toUpperCase() === 'ANNUL')
            .map((it) => ({
              ...it,
              contractNumber: it.contractNumber || it.contract_no || it.contractNo || '—',
              customerName:
                (it.fromCustomerName && it.fromCustomerName.trim() !== '') ? it.fromCustomerName :
                (it.contract && it.contract.customerName && it.contract.customerName.trim() !== '' ? it.contract.customerName :
                (it.customerId ? `KH #${it.customerId}` : '—')),
              requestDate: it.requestDate ? new Date(it.requestDate).toLocaleDateString('vi-VN') : '—',
              reason: it.reason || it.note || '—',
              status: (typeof it.approvalStatus === 'string' ? it.approvalStatus : null)
                || (typeof it.status === 'object' && it.status ? (it.status.code || it.status.name || it.status.value) : null)
                || (typeof it.status === 'string' ? it.status : null)
                || 'PENDING',
            }));
        } catch (e) {
          console.warn('[AnnulList] alt fetch failed', e);
        }
      }
      setAnnuls(finalItems);
      const pageInfo = data?.page || data || {};
      setPagination({
        page: pageInfo.number || 0,
        size: pageInfo.size || currentSize,
        totalElements: pageInfo.totalElements || finalItems.length || 0
      });
    } catch (error) {
      toast.error('Không thể tải danh sách yêu cầu hủy hợp đồng');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (newPage) => {
    fetchData({ page: newPage });
  };  return (
    <>
      <ToastContainer 
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      <Card title="Danh sách yêu cầu hủy hợp đồng">
        <Table
          columns={columns}
          dataSource={annuls}
          pagination={false}
          loading={loading}
          rowKey="id"
        />
        {!loading && annuls.length > 0 && (
          <div className="bg-white p-3 border-t border-gray-200">
            <Pagination 
              currentPage={pagination.page}
              totalElements={pagination.totalElements}
              pageSize={pagination.size}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>
      <RequestDetailModal
        visible={detailOpen}
        onCancel={() => setDetailOpen(false)}
        loading={detailLoading}
        data={detailData}
        onSuccess={fetchData}
      />
    </>
  );
};

export default ContractAnnulList;