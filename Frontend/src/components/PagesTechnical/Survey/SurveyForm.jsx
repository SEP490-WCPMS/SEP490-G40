import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContractDetails, submitSurveyReport } from '../../Services/apiService'; // Đảm bảo đường dẫn đúng
import { ArrowLeft } from 'lucide-react'; // Icon quay lại
import moment from 'moment'; // Import moment để format ngày

function SurveyForm() {
    const { contractId } = useParams();
    const navigate = useNavigate();

    const [contractDetails, setContractDetails] = useState(null);
    // Cập nhật state formData để dùng moment
    const [formData, setFormData] = useState({
        surveyDate: moment().format('YYYY-MM-DD'), // Format YYYY-MM-DD
        technicalDesign: '',
        estimatedCost: ''
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Load thông tin cơ bản của hợp đồng
    useEffect(() => {
        setLoading(true);
        setError(null); // Reset lỗi trước khi fetch
        getContractDetails(contractId)
            .then(response => {
                // --- BẠN THÊM DÒNG NÀY VÀO ---
                console.log("Dữ liệu gốc từ server:", response.data.applicationDate);
                setContractDetails(response.data);
            })
            .catch(err => {
                console.error("Lỗi khi lấy chi tiết hợp đồng:", err);
                // Cung cấp thông báo lỗi rõ ràng hơn
                setError("Không thể tải chi tiết hợp đồng. Hợp đồng có tồn tại và được gán cho bạn không?");
            })
            .finally(() => setLoading(false));
    }, [contractId]); // Dependency array chỉ chứa contractId

    // Hàm xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Hàm xử lý submit form
    const handleSubmit = (e) => {
        e.preventDefault(); // Ngăn submit form mặc định
        // Kiểm tra input cơ bản
        if (!formData.technicalDesign || !formData.estimatedCost || !formData.surveyDate) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc (*).");
            return;
        }

        setSubmitting(true); // Bắt đầu trạng thái submitting
        setError(null); // Reset lỗi

        // Gọi API nộp báo cáo
        submitSurveyReport(contractId, formData)
            .then(() => {
                alert("Nộp báo cáo khảo sát thành công!");
                navigate('/technical/survey'); // Quay lại trang danh sách khảo sát
            })
            .catch(err => {
                console.error("Lỗi khi nộp báo cáo:", err);
                // Hiển thị lỗi từ server hoặc lỗi chung
                setError(err.response?.data?.message || "Lỗi khi nộp báo cáo. Vui lòng thử lại.");
            })
            .finally(() => setSubmitting(false)); // Kết thúc trạng thái submitting
    };

    // --- Loading State ---
    if (loading) {
         return (
             // Spinner giống các trang khác
             <div className="flex justify-center items-center h-[calc(100vh-100px)]">
                 <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <span className="ml-3 text-gray-500 text-lg">Đang tải chi tiết hợp đồng...</span>
             </div>
         );
    }

    // --- Render Component ---
    return (
        // Bố cục nền chung
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header của trang */}
             <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                 {/* Nút Quay lại */}
                 <button
                     onClick={() => navigate(-1)} // Quay lại trang trước đó
                     className="p-2 rounded-full hover:bg-gray-100 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 {/* Tiêu đề trang */}
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Báo Cáo Khảo Sát & Báo Giá</h1>
                    <p className="text-sm text-gray-600">Điền thông tin khảo sát và chi phí dự kiến cho hợp đồng.</p>
                </div>
            </div>

            {/* Hiển thị lỗi nghiêm trọng (nếu không load được contract) */}
            {error && !contractDetails && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                     <p className="font-bold">Đã xảy ra lỗi nghiêm trọng</p>
                     <p>{error}</p>
                </div>
            )}

            {/* Chỉ render phần còn lại nếu load được contractDetails */}
            {contractDetails && (
                <>
                    {/* Box thông tin Hợp đồng (Read-only) */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                            Thông tin Yêu Cầu (HĐ: {contractDetails.contractNumber})
                        </h3>
                        {/* Grid layout cho thông tin */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
                            <p><strong>Khách hàng:</strong> {contractDetails.customerName || 'N/A'}</p>
                            <p><strong>Ngày yêu cầu:</strong> {contractDetails.applicationDate ? moment(contractDetails.applicationDate).format('DD/MM/YYYY') : 'N/A'}</p>
                            {/* Địa chỉ chiếm 2 cột trên màn hình lớn */}
                            <p className="md:col-span-2"><strong>Địa chỉ:</strong> {contractDetails.customerAddress || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Form nhập liệu báo cáo */}
                    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-5">
                            Nội dung Báo Cáo
                        </h3>

                        {/* Trường Ngày Khảo Sát */}
                        <div>
                            <label htmlFor="surveyDate" className="block mb-1.5 text-sm font-medium text-gray-700">Ngày Khảo Sát <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                id="surveyDate"
                                name="surveyDate"
                                value={formData.surveyDate}
                                onChange={handleChange}
                                required
                                className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                         {/* Trường Chi Phí Dự Kiến */}
                        <div>
                            <label htmlFor="estimatedCost" className="block mb-1.5 text-sm font-medium text-gray-700">Chi Phí Dự Kiến (VNĐ) <span className="text-red-500">*</span></label>
                            <input
                                type="number" // Giữ nguyên type number
                                id="estimatedCost"
                                name="estimatedCost"
                                value={formData.estimatedCost}
                                onChange={handleChange}
                                placeholder="Nhập tổng chi phí dự kiến"
                                required
                                className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Trường Thiết Kế Kỹ Thuật */}
                        <div>
                            <label htmlFor="technicalDesign" className="block mb-1.5 text-sm font-medium text-gray-700">Thiết Kế Kỹ Thuật Chi Tiết <span className="text-red-500">*</span></label>
                            <textarea
                                id="technicalDesign"
                                name="technicalDesign"
                                rows="6" // Tăng số dòng nếu cần
                                value={formData.technicalDesign}
                                onChange={handleChange}
                                placeholder="Mô tả chi tiết kỹ thuật lắp đặt, vật tư cần thiết, vị trí đề xuất, hiện trạng cơ sở hạ tầng, yêu cầu đặc biệt (nếu có)..."
                                required
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Hiển thị lỗi submit (nếu có) */}
                        {error && contractDetails && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm mt-2" role="alert">
                                {error}
                            </div>
                        )}

                        {/* Nút Submit */}
                        <div className="pt-4">
                            <button type="submit"
                                    className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={submitting}>
                                 {submitting ? (
                                    <>
                                        {/* SVG Spinner */}
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang nộp...
                                    </>
                                 ) : 'Nộp Báo Cáo'}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}

export default SurveyForm;