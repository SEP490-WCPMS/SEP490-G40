import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { getMyNotifications, getUnreadNotificationCount, markNotificationAsRead } from '../Services/apiNotification';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Load số lượng chưa đọc định kỳ (Polling)
    const fetchCount = async () => {
        try {
            const res = await getUnreadNotificationCount();
            setUnreadCount(res.data || 0);
        } catch (err) {
            console.error("Lỗi lấy thông báo:", err);
        }
    };

    // Load danh sách chi tiết
    const fetchNotifications = async () => {
        try {
            const res = await getMyNotifications();
            setNotifications(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000); // 30s check 1 lần
        return () => clearInterval(interval);
    }, []);

    const handleToggle = () => {
        if (!isOpen) fetchNotifications();
        setIsOpen(!isOpen);
    };

    // Xử lý click vào thông báo -> ĐIỀU HƯỚNG
    const handleNotificationClick = async (noti) => {
        if (!noti.isRead) {
            await markNotificationAsRead(noti.id);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, isRead: true } : n));
        }
        setIsOpen(false);

        // --- LOGIC ĐIỀU HƯỚNG ---
        switch (noti.referenceType) {
            // Admin: Có khách cần tạo Acc -> Nhảy về trang Guest
            case 'GUEST_NEEDS_ACCOUNT':
            case 'GUEST_CONTRACT_CREATED':
                // navigate('/admin/customers?tab=guests&highlight=' + noti.referenceId); 
                // Vì trang admin dùng state 'activeTab' nội bộ chứ không phải query param,
                // Tạm thời navigate về trang customers, logic xử lý highlight sẽ làm ở trang đích.
                navigate(`/admin/customers?tab=guests&highlight=${noti.referenceId}`);
                break;

            // Service Staff: Admin đã tạo acc -> Nhảy về trang Quản lý Hợp đồng (Tab Tất cả) và highlight
            case 'GUEST_ACCOUNT_CREATED':
                // Nhảy đến trang Contracts với tab=all và highlight ID hợp đồng
                navigate(`/service/contracts?tab=all&highlight=${noti.referenceId}`);
                break;

            default:
                console.warn("Unknown type:", noti.referenceType);
        }
    };

    // Click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors" onClick={handleToggle}>
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b text-sm font-semibold text-white" style={{ backgroundColor: '#0A77E2' }}>Thông báo</div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">Không có thông báo mới</div>
                        ) : (
                            notifications.map(noti => (
                                <div 
                                    key={noti.id} 
                                    className="p-3 border-b cursor-pointer transition-colors"
                                    style={{ 
                                        backgroundColor: 'white',
                                        borderLeft: !noti.isRead ? '3px solid #0A77E2' : '3px solid transparent'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    onClick={() => handleNotificationClick(noti)}
                                >
                                    <div className={`text-sm font-medium ${!noti.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{noti.title}</div>
                                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">{noti.message}</div>
                                    <div className={`text-[10px] mt-1 text-right ${!noti.isRead ? 'text-blue-500' : 'text-gray-400'}`}>{new Date(noti.createdAt).toLocaleString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;