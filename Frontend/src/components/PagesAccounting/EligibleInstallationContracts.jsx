import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEligibleInstallationContracts } from '../../Services/apiAccountingStaff';
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
                        Danh sách HĐ Chính thức chờ lập Hóa đơn
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Các Hợp đồng đã hoàn tất lắp đặt nhưng chưa phát hành Hóa đơn lắp đặt.
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
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Mã Hợp đồng
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID Khách hàng
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Giá trị HĐ
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ngày lắp đặt
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                        {contracts.length > 0 ? (
                            contracts.map((c, idx) => (
                                <tr
                                    key={c.id}
                                    className="hover:bg-gray-50 transition-colors duration-100"
                                >
                                    <td className="px-4 py-2 text-sm text-gray-700">
                                        {pagination.page * pagination.size + idx + 1}
                                    </td>
                                    <td className="px-4 py-2 text-sm font-medium text-gray-800">
                                        {c.contractNumber || `#${c.id}`}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700">
                                        {c.customerId ?? '-'}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right text-gray-800">
                                        {formatMoney(c.contractValue)}{' '}
                                        <span className="text-xs text-gray-500">đ</span>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700">
                                        {formatDate(c.installationDate)}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-center">
                                        <button
                                            onClick={() => handleCreateInvoice(c)}
                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <FileText size={14} className="mr-1" />
                                            Tạo HĐ lắp đặt
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-4 text-center text-sm text-gray-500 italic"
                                >
                                    {loading
                                        ? 'Đang tải...'
                                        : 'Không có Hợp đồng nào đang chờ lập Hóa đơn lắp đặt.'}
                                </td>
                            </tr>
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
