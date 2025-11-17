import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message } from 'antd';
import { getTransferRequests, approveTransferRequest, rejectTransferRequest, getServiceRequestDetail } from '../../Services/apiService';
import apiClient from '../../Services/apiClient';
import RequestDetailModal from './RequestDetailModal';

const ContractTransferList = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
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
      title: 'Khách hàng cũ',
      dataIndex: 'currentCustomer',
      key: 'currentCustomer',
    },
    {
      title: 'Khách hàng mới',
      dataIndex: 'newCustomer',
      key: 'newCustomer',
    },
    {
      title: 'Ngày yêu cầu',
      dataIndex: 'requestDate',
      key: 'requestDate',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        // Hỗ trợ cả dạng chuỗi và object { code, message }
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
        const actions = [];
        actions.push(
          <button
            key="detail"
            onClick={() => handleViewDetails(record)}
            className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
          >
            Chi tiết
          </button>
        );
        if ((record.status || '').toString().toUpperCase() === 'PENDING') {
          actions.push(
            <button
              key="approve"
              onClick={() => handleApprove(record)}
              className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
            >
              Duyệt
            </button>
          );
          actions.push(
            <button
              key="reject"
              onClick={() => handleReject(record)}
              className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
            >
              Từ chối
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

  const handleViewDetails = (record) => {
    setDetailLoading(true);
    setDetailOpen(true);
    getServiceRequestDetail(record.id)
      .then(res => {
        const payload = res?.data;
        // Một số BE trả { status: 200, data: {...} }, số khác trả thẳng object
        const core = payload?.data || payload?.result || payload?.content || payload || {};
        const normalized = {
          requestNumber: core.requestNumber || record.requestNumber,
          contractNumber: core.contractNumber || record.contractNumber,
          requestDate: core.requestDate || record.requestDate,
          requestType: (core.requestType || record.requestType || 'TRANSFER').toString().toUpperCase(),
          status: (typeof core.approvalStatus === 'string' ? core.approvalStatus : null)
            || (typeof core.status === 'object' && core.status ? (core.status.code || core.status.name || core.status.value) : null)
            || (typeof core.status === 'string' ? core.status : null)
            || record.status,
          reason: core.reason || core.notes || core.note,
          fromCustomerName: core.fromCustomerName || record.currentCustomer,
          toCustomerName: core.toCustomerName || record.newCustomer,
          attachedEvidence: core.attachedEvidence || core.evidence || core.files,
          approvalNote: core.approvalNote || core.note || core.notes,
        };
        setDetailData(normalized);
      })
      .catch(err => {
        console.error('Get request detail error:', err);
        message.error('Không thể tải chi tiết yêu cầu');
        setDetailOpen(false);
      })
      .finally(() => setDetailLoading(false));
  };

  const handleApprove = async (record) => {
    try {
      await approveTransferRequest(record.id);
      message.success('Duyệt yêu cầu chuyển nhượng thành công!');
      fetchData();
    } catch (error) {
      message.error('Duyệt yêu cầu thất bại!');
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (record) => {
    try {
      await rejectTransferRequest(record.id, 'Từ chối yêu cầu');
      message.success('Từ chối yêu cầu chuyển nhượng thành công!');
      fetchData();
    } catch (error) {
      message.error('Từ chối yêu cầu thất bại!');
      console.error('Reject error:', error);
    }
  };

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const response = await getTransferRequests({
        page: (params.current || pagination.current) - 1,
        size: params.pageSize || pagination.pageSize
      });
      // Chấp nhận nhiều dạng payload từ BE: Page, array, hoặc wrapper khác
      const data = response?.data;
      // Debug nhẹ để kiểm tra cấu trúc BE qua Console devtools
      // eslint-disable-next-line no-console
      console.log('[TransferList] payload', data);
      // Tìm mảng items theo nhiều cấu trúc trả về khác nhau (kể cả lồng 1 cấp)
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
      // eslint-disable-next-line no-console
      console.log('[TransferList] items.length', rawItems.length, 'first.keys', rawItems[0] && Object.keys(rawItems[0]));
      // Chuẩn hóa field cho bảng (mapping field name theo BE)
      const items = rawItems.map((it) => ({
        ...it,
        contractNumber: it.contractNumber || it.contract_no || it.contractNo || '—',
        currentCustomer: it.fromCustomerName || (it.fromCustomerId ? `KH #${it.fromCustomerId}` : '—'),
        newCustomer: it.toCustomerName || (it.toCustomerId ? `KH #${it.toCustomerId}` : '—'),
        requestDate: it.requestDate ? new Date(it.requestDate).toLocaleString('vi-VN') : '—',
        status: (typeof it.approvalStatus === 'string' ? it.approvalStatus : null)
          || (typeof it.status === 'object' && it.status ? (it.status.code || it.status.name || it.status.value) : null)
          || (typeof it.status === 'string' ? it.status : null)
          || 'PENDING',
      }));
      let finalItems = items;
      // Fallback: nếu không có dữ liệu do filter BE khác casing/tên tham số, thử gọi không filter rồi lọc client
      if (!items.length) {
        try {
          const alt = await apiClient.get('/service/requests', { params: { page: (params.current || pagination.current) - 1, size: params.pageSize || pagination.pageSize } });
          const altData = alt?.data;
          // eslint-disable-next-line no-console
          console.log('[TransferList] alt payload', altData);
          const altRaw = pickArray(altData);
          finalItems = altRaw
            .filter(it => (it.requestType || it.type || '').toString().toUpperCase() === 'TRANSFER')
            .map((it) => ({
              ...it,
              contractNumber: it.contractNumber || it.contract_no || it.contractNo || '—',
              currentCustomer: it.fromCustomerName || (it.fromCustomerId ? `KH #${it.fromCustomerId}` : '—'),
              newCustomer: it.toCustomerName || (it.toCustomerId ? `KH #${it.toCustomerId}` : '—'),
              requestDate: it.requestDate ? new Date(it.requestDate).toLocaleString('vi-VN') : '—',
              status: (typeof it.approvalStatus === 'string' ? it.approvalStatus : null)
                || (typeof it.status === 'object' && it.status ? (it.status.code || it.status.name || it.status.value) : null)
                || (typeof it.status === 'string' ? it.status : null)
                || 'PENDING',
            }));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[TransferList] alt fetch failed', e);
        }
      }
      setTransfers(finalItems);
      const total = Array.isArray(data)
        ? finalItems.length
        : (data?.totalElements ?? data?.total ?? data?.recordCount ?? finalItems.length ?? 0);
      setPagination({
        ...pagination,
        total,
        current: params.current || pagination.current,
        pageSize: params.pageSize || pagination.pageSize
      });
    } catch (error) {
      message.error('Không thể tải danh sách yêu cầu chuyển nhượng');
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
    <>
      <Card title="Danh sách yêu cầu chuyển nhượng hợp đồng">
        <Table
          columns={columns}
          dataSource={transfers}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          rowKey="id"
        />
      </Card>
      <RequestDetailModal
        visible={detailOpen}
        onCancel={() => setDetailOpen(false)}
        loading={detailLoading}
        data={detailData}
      />
    </>
  );
};

export default ContractTransferList;