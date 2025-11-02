import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSupportTicketForCustomer, getAllCustomersSimple } from '../Services/apiService'; // Đảm bảo đường dẫn đúng
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
// (Bạn có thể cần thư viện Select/Dropdown nâng cao như 'react-select' để tìm kiếm)

function ServiceCreateTicketForm() {
    const [customers, setCustomers] = useState([]); // Danh sách KH để chọn
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [description, setDescription] = useState('');
    
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    // Load danh sách khách hàng khi component mount
    useEffect(() => {
        setLoadingCustomers(true);
        setError(null);
        getAllCustomersSimple()
            .then(res => {
                setCustomers(res.data || []);
            })
            .catch(err => {
                console.error("Lỗi tải danh sách khách hàng:", err);
                setError("Lỗi tải danh sách khách hàng. Vui lòng thử lại.");
            })
            .finally(() => {
                setLoadingCustomers(false);
            });
    }, []);

    // Xử lý submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCustomerId || !description.trim()) {
            setError("Vui lòng chọn khách hàng và nhập nội dung yêu cầu.");
            setSuccess(null);
            return;
        }
        
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        
        try {
            // Gọi API "Cách B"
            await createSupportTicketForCustomer(selectedCustomerId, description);
            setSuccess("Tạo ticket hỗ trợ thành công! Ticket đã được chuyển vào hàng chờ (PENDING).");
            // Reset form
            setDescription('');
            setSelectedCustomerId('');
        } catch (err) {
            console.error("Lỗi khi tạo ticket:", err);
            setError(err.response?.data?.message || "Tạo ticket thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition duration-150">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tạo Yêu Cầu Hỗ Trợ (Hộ Khách Hàng)</h1>
                    <p className="text-sm text-gray-600">Dùng khi khách hàng gọi điện thoại báo hỏng/khiếu nại.</p>
                </div>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-5">
                    Nội dung Yêu cầu
                </h3>
                
                {/* Thông báo Lỗi */}
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        <span>{error}</span>
                    </div>
                )}
                
                {/* Thông báo Thành công */}
                {success && (
                    <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded-md flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Chọn Khách Hàng */}
                <div>
                    <label htmlFor="customer" className="block mb-1.5 text-sm font-medium text-gray-700">
                        Chọn Khách hàng <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="customer"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        required
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={loadingCustomers || submitting}
                    >
                        <option value="" disabled>{loadingCustomers ? "Đang tải KH..." : "-- Chọn khách hàng --"}</option>
                        {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                                {customer.customerName} (Mã KH: {customer.customerCode})
                            </option>
                        ))}
                    </select>
                    {loadingCustomers && <p className="text-xs text-gray-500 mt-1">Đang tải danh sách...</p>}
                </div>

                {/* Nội dung */}
                <div>
                    <label htmlFor="description" className="block mb-1.5 text-sm font-medium text-gray-700">
                        Nội dung yêu cầu <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        rows="5"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ghi lại nội dung yêu cầu của khách hàng (ví dụ: Đồng hồ M001 bị hỏng, vỡ kính...)"
                        required
                        disabled={submitting}
                        className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                    />
                </div>
                
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={submitting || loadingCustomers}
                        className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none ${submitting || loadingCustomers ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Đang tạo...' : 'Tạo Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ServiceCreateTicketForm;