import React from 'react';
import { 
    User, MapPin, Gauge, Calculator, Droplets, // Thay Hash bằng Gauge
    AlertCircle, Calendar, CreditCard, Receipt, Phone 
} from 'lucide-react';
import { Tag } from 'antd';
import moment from 'moment';

const WaterInvoicePreview = ({ data, customerInfo }) => {
    if (!data) return null;

    const fmtMoney = (v) => (v != null ? `${Number(v).toLocaleString('vi-VN')} đ` : '0 đ');

    return (
        <div className="space-y-6 text-sm text-gray-700">
            
            {/* 1. Box Thông tin Khách hàng & Đồng hồ */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    Thông tin Khách hàng & Đồng hồ
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cột trái: Thông tin cá nhân */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="p-2 bg-gray-100 rounded-full"><User size={18} /></div>
                            <div>
                                <p className="text-xs text-gray-500">Khách hàng</p>
                                <p className="font-medium text-base">{customerInfo.customerName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="p-2 bg-gray-100 rounded-full"><MapPin size={18} /></div>
                            <div>
                                <p className="text-xs text-gray-500">Địa chỉ sử dụng</p>
                                <p className="font-medium">{customerInfo.customerAddress}</p>
                            </div>
                        </div>
                        {/* Nếu có SĐT/Email trong customerInfo thì hiện, không thì ẩn */}
                        {customerInfo.phone && (
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="p-2 bg-gray-100 rounded-full"><Phone size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500">Số điện thoại</p>
                                    <p className="font-medium">{customerInfo.phone}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cột phải: Thông tin Kỹ thuật */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-700">
                            {/* Dùng icon Gauge */}
                            <div className="p-2 bg-gray-100 rounded-full"><Gauge size={18} /></div>
                            <div>
                                <p className="text-xs text-gray-500">Mã đồng hồ</p>
                                <p className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded inline-block">
                                    {customerInfo.meterCode}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className="p-2 bg-gray-100 rounded-full"><Calendar size={18} /></div>
                            <div>
                                <p className="text-xs text-gray-500">Kỳ ghi chỉ số</p>
                                <p className="font-medium">
                                    {moment(data.readingDate).format('DD/MM/YYYY')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Box Chi tiết Tính tiền */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Chi tiết Hóa đơn Nước</h3>
                    <Tag color="cyan" className="text-sm font-medium px-3 py-0.5 rounded-full border-cyan-200 text-cyan-700">
                        {data.priceTypeName}
                    </Tag>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
                    {/* --- Bảng tính tiền sang trái --- */}
                    <div className="lg:col-span-2 space-y-4 order-last lg:order-first">
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-100 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Receipt size={16} className="text-gray-400"/> Đơn giá áp dụng
                                </span>
                                <span className="font-medium">{fmtMoney(data.unitPrice)} / m³</span>
                            </div>
                            
                            <div className="border-t border-gray-200"></div>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Thành tiền (chưa thuế):</span>
                                <span className="font-medium text-gray-900">{fmtMoney(data.subtotalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-1">
                                    + Phí BVMT ({fmtMoney(data.environmentFee)}/m³)
                                </span>
                                <span>{fmtMoney(data.environmentFeeAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-1">
                                    + Thuế VAT ({data.vatRate}%)
                                </span>
                                <span>{fmtMoney(data.vatAmount)}</span>
                            </div>
                        </div>

                        {/* Tổng tiền */}
                        <div className="flex justify-between items-center pt-2">
                            <div className="flex items-center gap-2 text-gray-500">
                                <CreditCard size={18} />
                                <span className="uppercase text-sm font-bold tracking-wider">Tổng thanh toán</span>
                            </div>
                            <span className="text-3xl font-bold text-red-600 tracking-tight">
                                {fmtMoney(data.totalAmount)}
                            </span>
                        </div>
                    </div>

                    {/* --- Chỉ số nước sang phải --- */}
                    <div className="lg:col-span-1 bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col justify-center space-y-3 h-full">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Chỉ số cũ:</span>
                            <span className="font-mono font-semibold">{data.previousReading}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Chỉ số mới:</span>
                            <span className="font-mono font-bold text-blue-600 text-lg">{data.currentReading}</span>
                        </div>
                        <div className="border-t border-blue-200 my-1"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-blue-900 font-bold uppercase text-xs">Tiêu thụ</span>
                            <span className="text-2xl font-black text-blue-700">{data.consumption} <span className="text-sm font-normal text-gray-500">m³</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaterInvoicePreview;