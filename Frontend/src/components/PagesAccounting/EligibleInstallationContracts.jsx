import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bulkCreateInstallationInvoices, getEligibleInstallationContracts } from '../Services/apiAccountingStaff';
import { RefreshCw, FileText } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EligibleInstallationContracts() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
    });

    const navigate = useNavigate();

    const fetchContracts = (page = 0, size = 10) => {
        setLoading(true);
        setError(null);

        getEligibleInstallationContracts({ page, size })
            .then((res) => {
                const data = res.data;
                const content = data.content || [];
                setContracts(content);
                setPagination({
                    page: data.number ?? page,
                    size: data.size ?? size,
                    totalElements: data.totalElements ?? content.length,
                });
            })
            .catch((err) => {
                console.error('Lỗi tải danh sách HĐ chờ lập HĐ lắp đặt:', err);
                setError(err.response?.data?.message || 'Không tải được danh sách hợp đồng.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchContracts(0, 10);
    }, []);

    const handleRefresh = () => {
        fetchContracts(pagination.page, pagination.size);
    };

    const toggleSelectAll = () => {
        if (!contracts || contracts.length === 0) return;

        const allIds = contracts.map((c) => c.id);
        const isAllSelected = selectedIds.length === allIds.length;
        setSelectedIds(isAllSelected ? [] : allIds);
    };

    const toggleSelectOne = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleBulkSubmit = async () => {
        if (!selectedIds || selectedIds.length === 0) return;

        setBulkSubmitting(true);
        setShowBulkConfirm(false);
        try {
            const res = await bulkCreateInstallationInvoices(selectedIds);
            const msg = res?.data?.message || `Đã lập Hóa đơn lắp đặt cho ${selectedIds.length} hợp đồng.`;

            toast.dismiss();
            toast.success(msg, { autoClose: 3000 });

            setSelectedIds([]);
            handleRefresh();
        } catch (err) {
            console.error('Lỗi lập Hóa đơn lắp đặt hàng loạt:', err);
            const msg = err?.response?.data?.message || 'Lập Hóa đơn lắp đặt hàng loạt thất bại.';
            toast.dismiss();
            toast.error(msg, { autoClose: 3000 });

        } finally {
            setBulkSubmitting(false);
        }
    };

    const handleCreateInvoice = (contract) => {
        navigate(`/accounting/contracts/${contract.id}/installation-invoice`, {
            state: { contract },
        });
    };

    const formatMoney = (value) => {
        if (value == null) return '-';
        return value.toLocaleString('vi-VN');
    };

    const formatDate = (value) => {
        if (!value) return '-';
        return moment(value).format('DD/MM/YYYY');
    };

    return (
        <div className="p-4 sm:p-6">
            <ToastContainer position="top-center" autoClose={5000} theme="colored" />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                        Danh sách HĐ Chính thức chờ lập Hóa đơn lắp đặt
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Các Hợp đồng đã hoàn tất lắp đặt, chưa phát hành Hóa đơn lắp đặt
                        và đã được phân công cho tài khoản kế toán hiện tại.
                    </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => setShowBulkConfirm(true)}
                            disabled={bulkSubmitting}
                            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileText size={16} className="mr-1" />
                            Lập HĐ ({selectedIds.length})
                        </button>
                    )}

                    <button
                        onClick={handleRefresh}
                        disabled={bulkSubmitting}
                        className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={16} className="mr-1" />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-2 w-10 text-center">
                                <input
                                    type="checkbox"
                                    disabled={bulkSubmitting}
                                    onChange={toggleSelectAll}
                                    checked={contracts.length > 0 && selectedIds.length === contracts.length}
                                />
                            </th>
                            <th className="px-4 py-2 text-left">Mã HĐ</th>
                            <th className="px-4 py-2 text-left">Khách hàng</th>
                            <th className="px-4 py-2 text-left">Địa chỉ</th>
                            <th className="px-4 py-2 text-left">Giá trị HĐ</th>
                            <th className="px-4 py-2 text-left">Ngày lắp đặt</th>
                            <th className="px-4 py-2 text-left">Trạng thái</th>
                            <th className="px-4 py-2 text-center">Thao tác</th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                        {contracts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-6 text-center text-gray-500 italic">
                                    {loading
                                        ? 'Đang tải...'
                                        : 'Không có Hợp đồng nào được phân công cho bạn đang chờ lập Hóa đơn lắp đặt.'}
                                </td>
                            </tr>
                        ) : (
                            contracts.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            disabled={bulkSubmitting}
                                            checked={selectedIds.includes(c.id)}
                                            onChange={() => toggleSelectOne(c.id)}
                                        />
                                    </td>

                                    <td className="px-4 py-2 text-blue-700 font-medium">
                                        {c.contractNumber || `HĐ#${c.id}`}
                                    </td>

                                    <td className="px-4 py-2">
                                        <div className="font-medium text-gray-800">
                                            {c.customerName || c.customerFullName || '---'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {c.customerPhone || c.contactPhone || ''}
                                        </div>
                                    </td>

                                    <td className="px-4 py-2 text-gray-700">
                                        {c.customerAddress || c.installationAddress || '---'}
                                    </td>

                                    <td className="px-4 py-2 text-left font-medium text-gray-800">
                                        {formatMoney(c.contractValue)}
                                    </td>

                                    <td className="px-4 py-2">
                                        {formatDate(c.installationDate)}
                                    </td>

                                    <td className="px-4 py-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                                {c.contractStatus || 'ACTIVE'}
                                            </span>
                                    </td>

                                    <td className="px-4 py-2 text-center">
                                        <button
                                            onClick={() => handleCreateInvoice(c)}
                                            className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-md hover:bg-emerald-700"
                                        >
                                            <FileText size={14} className="mr-1" />
                                            Tạo HĐ lắp đặt
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t text-xs text-gray-500 flex justify-between">
                    <span>Tổng: {pagination.totalElements} hợp đồng</span>
                    <span>Trang {pagination.page + 1}</span>
                </div>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={showBulkConfirm}
                onClose={() => setShowBulkConfirm(false)}
                onConfirm={handleBulkSubmit}
                title="Xác nhận lập Hóa đơn lắp đặt hàng loạt"
                message={`Bạn có chắc chắn muốn lập Hóa đơn lắp đặt cho ${selectedIds.length} hợp đồng đã chọn không?`}
                isLoading={bulkSubmitting}
            />
        </div>
    );
}

export default EligibleInstallationContracts;