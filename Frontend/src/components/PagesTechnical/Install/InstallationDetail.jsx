import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContractDetails, markInstallationAsCompleted } from '../../Services/apiService'; // Đảm bảo đường dẫn đúng
import { ArrowLeft } from 'lucide-react'; // Icon quay lại

function InstallationDetail() {
    const { contractId } = useParams();
    const navigate = useNavigate();

    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Dữ liệu cho biên bản lắp đặt
    const [installData, setInstallData] = useState({
        meterCode: '',
        initialReading: '',
        notes: '',
        installationImageBase64: null
    });

    const [imagePreview, setImagePreview] = useState(null); // State cho xem trước ảnh

    // Load chi tiết hợp đồng
    useEffect(() => {
        setLoading(true);
        setError(null);
        getContractDetails(contractId)
            .then(response => {
                setContract(response.data);
            })
            .catch(err => {
                console.error("Lỗi khi lấy chi tiết hợp đồng:", err);
                setError("Không thể tải chi tiết hợp đồng. Hợp đồng có tồn tại và được gán cho bạn không?");
            })
            .finally(() => setLoading(false));
    }, [contractId]);

    // Hàm xử lý khi người dùng nhập text/số
    const handleChange = (e) => {
        const { name, value } = e.target;
        setInstallData(prev => ({ ...prev, [name]: value }));
    };

    // Hàm xử lý khi chọn ảnh
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setInstallData(prev => ({ ...prev, installationImageBase64: null }));
            setImagePreview(null);
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(",")[1];
            setInstallData(prev => ({ ...prev, installationImageBase64: base64String }));
        };
        reader.readAsDataURL(file);
    };

    // Hàm xử lý nút Submit
    const handleMarkAsCompleted = () => {
        if (!installData.meterCode || installData.initialReading === '') {
            alert("Vui lòng nhập Mã Đồng Hồ và Chỉ Số Ban Đầu.");
            return;
        }
        if (!installData.installationImageBase64) {
            alert("Vui lòng chụp và đính kèm ảnh đồng hồ đã lắp đặt.");
            return;
        }
        if (!window.confirm("Xác nhận hoàn thành lắp đặt với thông tin đã nhập?")) {
            return;
        }
        setSubmitting(true);
        setError(null);
        markInstallationAsCompleted(contractId, installData)
            .then(() => {
                alert("Xác nhận hoàn thành lắp đặt thành công!");
                navigate('/technical/install'); // Quay lại danh sách
            })
            .catch(err => {
                console.error("Lỗi khi xác nhận:", err);
                setError(err.response?.data?.message || "Lỗi khi xác nhận. Vui lòng thử lại.");
            })
            .finally(() => setSubmitting(false));
    };

    // --- Loading State ---
    if (loading) {
         return (
             <div className="flex justify-center items-center h-[calc(100vh-100px)]"> {/* Chiều cao trừ header */}
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
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen"> {/* Bố cục nền */}
             {/* Header */}
             <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition duration-150 ease-in-out"> {/* Nút quay lại */}
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Chi Tiết Lắp Đặt</h1>
                    <p className="text-sm text-gray-600">Xem thông tin và nộp biên bản lắp đặt.</p>
                </div>
            </div>

            {/* Hiển thị lỗi */}
            {error && !contract && ( // Chỉ hiển thị lỗi nghiêm trọng nếu không load được contract
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                     <p className="font-bold">Đã xảy ra lỗi nghiêm trọng</p>
                     <p>{error}</p>
                </div>
            )}

            {/* Chỉ render nội dung nếu load thành công */}
            {contract && (
                <>
                    {/* Thông tin Hợp đồng & Khách hàng */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Thông tin Hợp Đồng & Khách Hàng</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <p><strong>Mã HĐ:</strong> {contract.contractNumber}</p>
                            <p><strong>Trạng thái:</strong>
                                <span className={`ml-2 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    contract.contractStatus === 'SIGNED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {contract.contractStatus === 'SIGNED' ? 'Chờ Lắp Đặt' : contract.contractStatus}
                                </span>
                            </p>
                            <p><strong>Khách hàng:</strong> {contract.customerName}</p>
                            <p><strong>Ngày yêu cầu:</strong> {contract.applicationDate}</p>
                            <p className="md:col-span-2"><strong>Địa chỉ lắp đặt:</strong> {contract.customerAddress}</p>
                        </div>
                    </div>

                    {/* Thông Tin Kỹ Thuật (Từ Báo Giá) */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Thông Tin Kỹ Thuật (Từ Khảo Sát)</h3>
                        <p className="text-sm mb-2"><strong>Chi Phí Dự Kiến:</strong> {contract.estimatedCost?.toLocaleString('vi-VN') || '-'} VNĐ</p>
                        <p className="text-sm mb-1"><strong>Thiết Kế Kỹ Thuật:</strong></p>
                        <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-sm whitespace-pre-wrap font-mono">
                            {contract.technicalDesign || "(Không có mô tả)"}
                        </pre>
                    </div>

                    {/* Form Biên bản Lắp đặt */}
                    {/* SỬA LẠI ĐIỀU KIỆN HIỂN THỊ FORM: Dùng 'SIGNED' */}
                    {contract.contractStatus === 'SIGNED' ? (
                        <form onSubmit={(e) => e.preventDefault()} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Biên Bản Lắp Đặt (Bắt buộc)</h3>

                            {/* Trường Mã Đồng Hồ */}
                            <div>
                                <label htmlFor="meterCode" className="block mb-1 text-sm font-medium text-gray-700">Mã Đồng Hồ (meter_code) *</label>
                                <input
                                    type="text"
                                    id="meterCode"
                                    name="meterCode"
                                    value={installData.meterCode}
                                    onChange={handleChange}
                                    placeholder="Nhập mã vạch/serial trên đồng hồ"
                                    required
                                    className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 w-full md:w-1/2"
                                />
                            </div>

                            {/* Trường Chỉ Số Ban Đầu */}
                            <div>
                                <label htmlFor="initialReading" className="block mb-1 text-sm font-medium text-gray-700">Chỉ Số Ban Đầu (m³) *</label>
                                <input
                                    type="number"
                                    step="0.01" // Cho phép nhập số thập phân
                                    id="initialReading"
                                    name="initialReading"
                                    value={installData.initialReading}
                                    onChange={handleChange}
                                    placeholder="Nhập chỉ số trên mặt đồng hồ (vd: 0, 1.5)"
                                    required
                                    className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 w-full md:w-1/2"
                                />
                            </div>

                            {/* Trường Upload Ảnh */}
                            <div>
                                <label htmlFor="installationImage" className="block mb-1 text-sm font-medium text-gray-700">Ảnh Chụp Đồng Hồ *</label>
                                <input
                                    type="file"
                                    id="installationImage"
                                    name="installationImage"
                                    accept="image/*" // Chỉ chấp nhận ảnh
                                    onChange={handleFileChange}
                                    required
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>

                            {/* Ảnh xem trước */}
                            {imagePreview && (
                                <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Ảnh xem trước:</p>
                                    <img src={imagePreview} alt="Xem trước ảnh lắp đặt" className="max-w-xs md:max-w-sm rounded border border-gray-300 shadow-sm" />
                                </div>
                            )}

                            {/* Trường Ghi Chú */}
                            <div>
                                <label htmlFor="notes" className="block mb-1 text-sm font-medium text-gray-700">Ghi Chú Lắp Đặt</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    rows="3"
                                    value={installData.notes}
                                    onChange={handleChange}
                                    placeholder="Ghi chú thêm nếu cần..."
                                    className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 w-full"
                                />
                            </div>

                             {/* Hiển thị lỗi submit (nếu có) */}
                             {error && contract && ( // Chỉ hiển thị lỗi submit, không phải lỗi load
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm" role="alert">
                                    {error}
                                </div>
                             )}

                            {/* Nút Submit */}
                            <div className="pt-4">
                                <button type="button" // Đổi type thành "button" để tránh submit form mặc định
                                        onClick={handleMarkAsCompleted}
                                        className={`inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={submitting}>
                                     {submitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </>
                                     ) : 'Xác Nhận Hoàn Thành Lắp Đặt'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        // Hiển thị nếu trạng thái không phải SIGNED
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                             <p className="text-sm text-gray-600 italic">Hợp đồng này đang ở trạng thái <strong>{contract.contractStatus}</strong> và không thể thực hiện lắp đặt.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default InstallationDetail;