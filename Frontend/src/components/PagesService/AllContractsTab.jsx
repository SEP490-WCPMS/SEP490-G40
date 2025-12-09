import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import ContractTable from './ContractTable';
import ContractViewModal from './ContractViewModal';
import { getServiceContracts, getServiceContractDetail } from '../Services/apiService';

const AllContractsTab = ({ keyword: externalKeyword, status: externalStatus }) => {
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState(externalKeyword || '');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const fetch = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const page = params.page !== undefined ? params.page : pagination.page;
      // Nếu có keyword, lấy bộ lớn hơn để lọc client-side giống ContractRequestsPage
      const effectiveKeyword = (externalKeyword !== undefined) ? externalKeyword : keyword;
      const effectiveStatus = (externalStatus !== undefined) ? externalStatus : status;
      const requestedSize = effectiveKeyword ? Math.max(200, pagination.size || 10) : (params.size || pagination.size || 10);
      const resp = await getServiceContracts({ page: 0, size: requestedSize, status: effectiveStatus === 'all' ? null : effectiveStatus, keyword: effectiveKeyword });
      const payload = resp?.data || {};
      let items = payload?.content || payload || [];

      // If we're showing the "All" aggregate, exclude requests that are PENDING (chờ khảo sát)
      // and SIGNED (chờ lắp đặt) as requested by UX.
      if ((effectiveStatus === 'all' || !effectiveStatus) && Array.isArray(items)) {
        items = items.filter(it => !['PENDING', 'SIGNED'].includes((it.contractStatus || '').toUpperCase()));
      }

      if (effectiveKeyword && effectiveKeyword.toString().trim() !== '') {
        const kw = effectiveKeyword.toString().toLowerCase();
        items = (Array.isArray(items) ? items : []).filter(it => {
          return (
            String(it.contractNumber || '').toLowerCase().includes(kw) ||
            String(it.customerName || '').toLowerCase().includes(kw) ||
            String(it.customerCode || '').toLowerCase().includes(kw) ||
            String(it.contactPhone || it.phone || '').toLowerCase().includes(kw) ||
            String(it.address || it.contract?.address || '').toLowerCase().includes(kw) ||
            String(it.notes || it.note || it.contract?.notes || '').toLowerCase().includes(kw)
          );
        });
      }

      setData(Array.isArray(items) ? items : []);
      const pageInfo = payload?.page || payload || {};
      setPagination({ page: pageInfo.number || page, size: pageInfo.size || requestedSize, totalElements: pageInfo.totalElements || (Array.isArray(items) ? items.length : 0) });
    } catch (e) {
      console.error('Fetch all contracts error', e);
      message.error('Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  }, [externalKeyword, externalStatus, status, keyword, pagination.page, pagination.size]);

  useEffect(() => {
    setKeyword(externalKeyword || '');
  }, [externalKeyword]);

  useEffect(() => {
    fetch({ page: 0 });
  }, [fetch, externalKeyword, externalStatus]);

  const handlePageChange = ({ current }) => {
    // current expected 1-indexed by ContractTable's pagination conversion; adapt
    const newPage = (current || 1) - 1;
    fetch({ page: newPage });
  };

  const handleViewDetails = async (record, action) => {
    try {
      setModalLoading(true);
      const resp = await getServiceContractDetail(record.id);
      setSelectedContract(resp?.data || record);
      setModalVisible(true);
    } catch (e) {
      console.error('Error loading contract detail', e);
      message.error('Không thể tải chi tiết hợp đồng');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <ContractTable
        data={data}
        loading={loading}
        pagination={{ current: pagination.page + 1, pageSize: pagination.size, total: pagination.totalElements }}
        onPageChange={handlePageChange}
        onViewDetails={handleViewDetails}
      />

      {modalVisible && (
        <ContractViewModal
          open={modalVisible}
          onCancel={() => { setModalVisible(false); setSelectedContract(null); }}
          initialData={selectedContract}
          loading={modalLoading}
        />
      )}
    </div>
  );
};

export default AllContractsTab;
