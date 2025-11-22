import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { createInstallationInvoice } from '../Services/apiAccountingStaff';
import { ArrowLeft, Calendar, FileText, AlertCircle, Save } from 'lucide-react';
import moment from 'moment';

function CreateInstallationInvoice() {
    const { contractId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const contractFromState = location.state?.contract || null;

    const [contract, setContract] = useState(contractFromState);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        invoiceNumber: '',
        invoiceDate: '',
        dueDate: '',
        subtotalAmount: 0,
        vatAmount: 0,
        totalAmount: 0,
        notes: ''
    });

    useEffect(() => {
        if (!contractFromState) {
            setError('Không tìm thấy dữ liệu Hợp đồng. Vui lòng quay lại danh sách.');
            setLoading(false);
            return;
        }

        setContract(contractFromState);

        const subtotal = contractFromState.contractValue || 0;
        const vatRate = 0.1; // VAT 10% (bạn có thể đổi)
        const vat = Math.round(subtotal * vatRate);
        const total = subtotal + vat;

        setFormData({
            invoiceNumber: `CN${contractFromState.id}${moment().format('MMYYYY')}`,
            invoiceDate: moment().format('YYYY-MM-DD'),
            dueDate: moment().add(15, 'days').format('YYYY-MM-DD'),
            subtotalAmount: subtotal,
            vatAmount: vat,
            totalAmount: total,
            notes: `Hóa đơn lắp đặt cho HĐ số ${contractFromState.contractNumber || contractId}.`
        });

        setLoading(false);
    }, [contractFromState, contractId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!contractId) {
            setError('Thiếu contractId trong URL.');
            return;
        }

        setSubmitting(true);
        setError(null);

        const payload = {
            contractId: parseInt(contractId),
            invoiceNumber: formData.invoiceNumber,
            invoiceDate: formData.invoiceDate,
            dueDate: formData.dueDate,
            subtotalAmount: parseFloat(formData.subtotalAmount) || 0,
            vatAmount: parseFloat(formData.vatAmount) || 0,
            totalAmount: parseFloat(formData.totalAmount) || 0
        };

        try {
            const response = await createInstallationInvoice(payload);
            alert(`Tạo Hóa đơn lắp đặt ${response.data.invoiceNumber} thành công!`);
            navigate('/accounting/invoices');
        } catch (err) {
            console.error('Lỗi khi tạo Hóa đơn lắp đặt:', err);
            setError(err.response?.data?.message || 'Tạo Hóa đơn lắp đặt thất bại.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6">
                <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="p-4 sm:p-6">
                <div className="mb-4">
                    <Link
                        to="/accounting/contracts/eligible-installation"
                        className="inline-flex items-center text-sm text-blue-600 hover:underline"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        Quay lại danh sách HĐ
                    </Link>
                </div>
                <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">
                    {error || 'Không tìm thấy thông tin Hợp đồng.'}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6">
            {/* Breadcrumb / Back */}
            <div className="flex items-center mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    Quay lại
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Thông tin Hợp đồng */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                            <FileText size={18} className="mr-2 text-gray-500" />
                            Thông tin Hợp đồng
                        </h3>
                        <div className="space-y-2 text-sm text-gray-700">
                            <p>
                                <span className="font-medium text-gray-600">Mã HĐ: </span>
                                {contract.contractNumber || `#${contract.id}`}
                            </p>
                            <p>
                                <span className="font-medium text-gray-600">ID Khách hàng: </span>
                                {contract.customerId ?? '-'}
                            </p>
                            <p>
                                <span className="font-medium text-gray-600">Ngày lắp đặt: </span>
                                {contract.installationDate
                                    ? moment(contract.installationDate).format('DD/MM/YYYY')
                                    : '-'}
                            </p>
                            <p className="flex items-center">
                                <span className="font-medium text-gray-600 mr-1">Giá trị HĐ: </span>
                                { (contract.contractValue || 0).toLocaleString('vi-VN') } đ
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form tạo Hóa đơn lắp đặt */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-5">
                            Thông tin Hóa đơn lắp đặt
                        </h3>

                        {/* Lỗi Submit */}
                        {error && (
                            <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md flex items-center">
                                <AlertCircle size={16} className="mr-2" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Số Hóa đơn - READONLY */}
                            <div>
                                <label
                                    htmlFor="invoiceNumber"
                                    className="block mb-1.5 text-sm font-medium text-gray-700"
                                >
                                    Số Hóa đơn *
                                </label>
                                <input
                                    type="text"
                                    id="invoiceNumber"
                                    name="invoiceNumber"
                                    value={formData.invoiceNumber}
                                    readOnly
                                    className="appearance-none block w-full border border-gray-200 bg-gray-50 rounded-md py-2 px-3 text-sm text-gray-700 cursor-not-allowed"
                                />
                            </div>

                            {/* Ngày lập Hóa đơn - READONLY */}
                            <div>
                                <label
                                    htmlFor="invoiceDate"
                                    className="block mb-1.5 text-sm font-medium text-gray-700"
                                >
                                    Ngày lập Hóa đơn *
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        id="invoiceDate"
                                        name="invoiceDate"
                                        value={formData.invoiceDate}
                                        readOnly
                                        className="appearance-none block w-full border border-gray-200 bg-gray-50 rounded-md py-2 px-3 text-sm pr-8 text-gray-700 cursor-not-allowed"
                                    />
                                    <Calendar
                                        size={16}
                                        className="absolute right-2 top-2.5 text-gray-300 pointer-events-none"
                                    />
                                </div>
                            </div>

                            {/* Hạn thanh toán - CHO PHÉP SỬA */}
                            <div>
                                <label
                                    htmlFor="dueDate"
                                    className="block mb-1.5 text-sm font-medium text-gray-700"
                                >
                                    Hạn thanh toán *
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        id="dueDate"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}   // chỉ field này cho onChange
                                        required
                                        className="appearance-none block w-full border border-gray-300 rounded-md py-2 px-3 text-sm pr-8"
                                    />
                                    <Calendar
                                        size={16}
                                        className="absolute right-2 top-2.5 text-gray-400 pointer-events-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tiền */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                            {/* Tiền lắp đặt (chưa VAT) - READONLY */}
                            <div>
                                <label
                                    htmlFor="subtotalAmount"
                                    className="block mb-1.5 text-sm font-medium text-gray-700"
                                >
                                    Tiền lắp đặt (chưa VAT) *
                                </label>
                                <input
                                    type="number"
                                    id="subtotalAmount"
                                    name="subtotalAmount"
                                    value={formData.subtotalAmount}
                                    readOnly
                                    className="appearance-none block w-full border border-gray-200 bg-gray-50 rounded-md py-2 px-3 text-sm text-gray-700 cursor-not-allowed"
                                />
                            </div>

                            {/* VAT - READONLY */}
                            <div>
                                <label
                                    htmlFor="vatAmount"
                                    className="block mb-1.5 text-sm font-medium text-gray-700"
                                >
                                    Tiền VAT *
                                </label>
                                <input
                                    type="number"
                                    id="vatAmount"
                                    name="vatAmount"
                                    value={formData.vatAmount}
                                    readOnly
                                    className="appearance-none block w-full border border-gray-200 bg-gray-50 rounded-md py-2 px-3 text-sm text-gray-700 cursor-not-allowed"
                                />
                            </div>

                            {/* Tổng cộng - READONLY */}
                            <div>
                                <label
                                    htmlFor="totalAmount"
                                    className="block mb-1.5 text-sm font-medium text-gray-700"
                                >
                                    Tổng cộng *
                                </label>
                                <input
                                    type="number"
                                    id="totalAmount"
                                    name="totalAmount"
                                    value={formData.totalAmount}
                                    readOnly
                                    className="appearance-none block w-full border border-gray-200 bg-gray-50 rounded-md py-2 px-3 text-sm font-bold text-red-600 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Ghi chú */}
                        <div className="pt-4 border-t">
                            <label
                                htmlFor="notes"
                                className="block mb-1.5 text-sm font-medium text-gray-700"
                            >
                                Ghi chú (tuỳ chọn)
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows="3"
                                value={formData.notes}
                                onChange={handleChange}
                                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                                placeholder="Thêm ghi chú cho Hóa đơn (nếu cần)..."
                            />
                        </div>

                        {/* Nút Submit */}
                        <div className="pt-4 border-t">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none ${
                                    submitting ? 'opacity-50' : ''
                                }`}
                            >
                                <Save size={18} className="mr-2" />
                                {submitting ? 'Đang phát hành...' : 'Xác nhận & Phát hành Hóa đơn lắp đặt'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateInstallationInvoice;
