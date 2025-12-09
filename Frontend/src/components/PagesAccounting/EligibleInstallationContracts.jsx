import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEligibleInstallationContracts } from '../Services/apiAccountingStaff';
import { RefreshCw, FileText } from 'lucide-react';
import moment from 'moment';

function EligibleInstallationContracts() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

                // Sắp xếp lại theo id ASC để hiển thị cùng thứ tự với SQL
                const sorted = [...content].sort((a, b) => (a.id || 0) - (b.id || 0));

                setContracts(sorted);
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
            {/* Header giống style InvoiceList / UnbilledFeesList */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Danh sách HĐ Chính thức chờ lập Hóa đơn lắp đặt
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Các Hợp đồng đã hoàn tất lắp đặt, chưa phát hành Hóa đơn lắp đặt
                        và đã được phân công cho tài khoản kế toán hiện tại.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
                >
                    <RefreshCw size={16} className="mr-1" />
                    Làm mới
                </button>
            </div>

            {/* Thông báo lỗi */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
                    {error}
                </div>
            )}

            {/* Card danh sách */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-2 text-left">Mã HĐ</th>
                            <th className="px-4 py-2 text-left">Khách hàng</th>
                            <th className="px-4 py-2 text-left">Địa chỉ</th>
                            <th className="px-4 py-2 text-right">Giá trị HĐ</th>
                            <th className="px-4 py-2 text-left">Ngày ký</th>
                            <th className="px-4 py-2 text-left">Trạng thái</th>
                            <th className="px-4 py-2 text-center">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {contracts.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-6 text-center text-gray-500 italic"
                                >
                                    {loading
                                        ? 'Đang tải...'
                                        : 'Không có Hợp đồng nào được phân công cho bạn đang chờ lập Hóa đơn lắp đặt.'}
                                </td>
                            </tr>
                        ) : (
                            contracts.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-blue-700 font-medium">
                                        {c.contractNumber || `HĐ#${c.id}`}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="font-medium text-gray-800">
                                            {c.customerName || c.customerFullName || '---'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {c.customerPhone || ''}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-gray-700">
                                        {c.customerAddress || c.installationAddress || '---'}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-gray-800">
                                        {formatMoney(c.contractValue)}
                                    </td>
                                    <td className="px-4 py-2">
                                        {formatDate(c.signingDate || c.createdAt)}
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

                {/* Footer giống các list khác */}
                <div className="px-4 py-3 border-t text-xs text-gray-500 flex justify-between">
                    <span>Tổng: {pagination.totalElements} hợp đồng</span>
                    <span>Trang {pagination.page + 1}</span>
                </div>
            </div>
        </div>
    );
}

export default EligibleInstallationContracts;
