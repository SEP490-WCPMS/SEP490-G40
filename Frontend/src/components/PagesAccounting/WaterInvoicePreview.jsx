import React from 'react';
import { User, MapPin, Hash, Calculator, Droplets, AlertCircle, FileText, Phone, Mail } from 'lucide-react';
import { Tag, Divider } from 'antd';
import moment from 'moment';

const WaterInvoicePreview = ({ data, customerInfo }) => {
    if (!data) return null;

    const fmtMoney = (v) => (v != null ? `${Number(v).toLocaleString('vi-VN')} đ` : '0 đ');

    return (
        <div className="space-y-6 text-sm text-gray-700">
            
            {/* 1. Box Thông tin Sử Dụng Nước (Giống InvoiceDetail) */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3">
                <h3 className="text-base font-bold text-gray-700 mb-2 uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                    <Droplets size={18} className="text-blue-600" /> Thông tin Sử Dụng Nước
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 text-gray-600">
                    <p><strong className="text-gray-700">Khách hàng:</strong> {customerInfo.customerName}</p>
                    <p><strong className="text-gray-700">Địa chỉ:</strong> {customerInfo.customerAddress}</p>
                    <p><strong className="text-gray-700">Đồng hồ:</strong> <span className="font-mono bg-gray-100 px-1 rounded text-gray-800">{customerInfo.meterCode}</span></p>
                    
                    <p><strong className="text-gray-700">Ngày ghi:</strong> {moment(data.readingDate).format('DD/MM/YYYY')}</p>
                    <p><strong className="text-gray-700">Chỉ số cũ:</strong> {data.previousReading}</p>
                    <p><strong className="text-gray-700">Chỉ số mới:</strong> <span className="font-bold text-blue-600">{data.currentReading}</span></p>
                    
                    <div className="col-span-1 md:col-span-2 mt-2 pt-2 border-t border-dashed border-gray-200 flex justify-between items-center bg-blue-50 p-2 rounded">
                        <span className="font-medium text-blue-900">Tổng tiêu thụ:</span>
                        <span className="text-xl font-bold text-blue-700">{data.consumption} m³</span>
                    </div>
                </div>
            </div>

            {/* 2. Box Chi tiết Thanh toán (Giống InvoiceDetail) */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Calculator size={20} className="text-green-600" />
                        Chi Tiết Tính Tiền
                    </h3>
                    <Tag color="blue" className="text-sm font-medium">{data.priceTypeName}</Tag>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-gray-600">
                        <span>Đơn giá áp dụng:</span>
                        <span className="font-medium">{fmtMoney(data.unitPrice)} / m³</span>
                    </div>

                    <div className="border-t border-gray-100 my-2"></div>

                    <div className="flex justify-between text-gray-600">
                        <span>Thành tiền (chưa VAT):</span>
                        <span className="font-medium text-gray-900">{fmtMoney(data.subtotalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>+ Phí BVMT ({fmtMoney(data.environmentFee)}/m³):</span>
                        <span>{fmtMoney(data.environmentFeeAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>+ Thuế VAT ({data.vatRate}%):</span>
                        <span>{fmtMoney(data.vatAmount)}</span>
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-3"></div>

                    <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                        <span className="text-base font-bold text-gray-700 uppercase">TỔNG CỘNG PHẢI THU:</span>
                        <span className="text-2xl font-black text-red-600">
                            {fmtMoney(data.totalAmount)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Warning Text */}
            <div className="flex items-start gap-3 text-sm text-orange-700 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-orange-600" />
                <p>
                    <strong>Lưu ý quan trọng:</strong> 
                    Vui lòng kiểm tra kỹ các thông tin về chỉ số và số tiền trước khi "xác nhận".
                </p>
            </div>
        </div>
    );
};

export default WaterInvoicePreview;