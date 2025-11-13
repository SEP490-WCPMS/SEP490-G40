import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceNotificationContext } from '../../contexts/ServiceNotificationContext';
import { Bell, X } from 'lucide-react';

/**
 * 🔔 SERVICE STAFF ONLY - Notification Bell
 * Hiển thị ở header LayoutService
 * Click → dropdown danh sách thông báo
 */
export const ServiceNotificationBell = ({ compact = false }) => {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(ServiceNotificationContext);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedContractId, setHighlightedContractId] = useState(null);

    const handleNotificationClick = (notif) => {
        // Mark as read
        markAsRead(notif.id);
        setHighlightedContractId(notif.contractId); // Lưu ID contract cần highlight
        
        // Navigate based on notification type
        if (notif.type === 'CONTRACT_REQUEST_CREATED') {
            navigate('/service/requests');
            setTimeout(() => {
                highlightContractInPage(notif.contractId);
            }, 300);
        } else if (notif.type === 'TECH_SURVEY_COMPLETED') {
            navigate('/service/survey-reviews?tab=pending-survey-review');
            setTimeout(() => {
                highlightContractInPage(notif.contractId);
            }, 300);
        } else if (notif.type === 'SURVEY_APPROVED') {
            // Báo cáo đã duyệt → đi đến trang approved contracts để gửi cho khách ký
            navigate('/service/approved-contracts');
            setTimeout(() => {
                highlightContractInPage(notif.contractId);
            }, 300);
        } else if (notif.type === 'CUSTOMER_SIGNED_CONTRACT') {
            // Khách đã ký → đi đến trang signed contracts để gửi lắp đặt
            navigate('/service/signed-contracts');
            setTimeout(() => {
                highlightContractInPage(notif.contractId);
            }, 300);
        } else if (notif.type === 'SENT_TO_INSTALLATION') {
            // Đã gửi lắp đặt → theo dõi tiến độ installation
            navigate('/service/contracts?status=AWAITING_INSTALLATION');
            setTimeout(() => {
                highlightContractInPage(notif.contractId);
            }, 300);
        } else if (notif.type === 'INSTALLATION_COMPLETED') {
            // Lắp đặt xong → hợp đồng active
            navigate('/service/active-contracts');
            setTimeout(() => {
                highlightContractInPage(notif.contractId);
            }, 300);
        }
        
        setIsOpen(false);
    };

    const highlightContractInPage = (contractId) => {
        if (!contractId) return;
        
        // Tìm element có data-contract-id
        const contractElement = document.querySelector(`[data-contract-id="${contractId}"]`);
        console.log('[HIGHLIGHT] Looking for contract:', contractId);
        console.log('[HIGHLIGHT] Found element:', contractElement);
        
        if (contractElement) {
            // Scroll vào view
            contractElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Thêm class highlight (giữ mãi)
            contractElement.classList.add('notification-highlight');
            console.log('[HIGHLIGHT] Applied highlight class');
            
            // Click chỗ khác để remove highlight
            const removeHighlight = (e) => {
                // Không remove nếu click vào chính element đó
                if (contractElement.contains(e.target)) return;
                
                contractElement.classList.remove('notification-highlight');
                setHighlightedContractId(null);
                console.log('[HIGHLIGHT] Removed highlight');
                document.removeEventListener('click', removeHighlight);
            };
            
            setTimeout(() => {
                document.addEventListener('click', removeHighlight);
            }, 100);
        } else {
            console.warn('[HIGHLIGHT] Contract element not found for ID:', contractId);
        }
    };

    const getNotificationStyle = (type) => {
        const styles = {
            'CONTRACT_REQUEST_CREATED': { icon: '📋', title: 'Yêu cầu hợp đồng mới' },
            'TECH_SURVEY_COMPLETED': { icon: '✅', title: 'Báo cáo khảo sát hoàn thành' },
            'SURVEY_APPROVED': { icon: '👍', title: 'Báo cáo khảo sát đã duyệt' },
            'CUSTOMER_SIGNED_CONTRACT': { icon: '✍️', title: 'Khách đã ký - Cần gửi lắp đặt' },
            'SENT_TO_INSTALLATION': { icon: '📤', title: 'Đã gửi lắp đặt' },
            'INSTALLATION_COMPLETED': { icon: '🔧', title: 'Lắp đặt hoàn thành' },
            'SUPPORT_TICKET_CREATED': { icon: '🆘', title: 'Yêu cầu hỗ trợ mới' },
        };
        return styles[type] || { icon: '📢', title: 'Thông báo' };
    };

    // Format thời gian hiển thị (VD: "2 giờ trước", "5 phút trước")
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        
        const notifTime = new Date(timestamp);
        const now = new Date();
        const diffMs = now - notifTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        
        // Nếu > 7 ngày, hiển thị ngày tháng
        return notifTime.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Compact trigger (used inside avatar dropdown) */}
            {compact ? (
                <button
                    className="dropdown-item" // ✅ Class này đã có style chữ màu xanh/đen
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    title="Thông báo"
                    // ❌ Bỏ style inline 'justifyContent'
                >
                    <Bell size={16} />
                    <span>Thông báo</span>
                    {unreadCount > 0 && (
                        // ✨ ĐỔI SANG DÙNG CLASS CSS ✨
                        <span className="notification-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            ) : (
                /* Default standalone bell trigger (dùng TRÊN HEADER) */
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    // ✨ Chỉ dùng class, xóa bỏ TẤT CẢ style inline ✨
                    className="notification-bell-button" 
                    title="Thông báo"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        // ✨ ĐỔI SANG DÙNG CLASS CSS ✨
                        <span className="notification-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* Dropdown Panel (giữ nguyên) */}
            {isOpen && (
                <div className="notification-panel">
                    {/* Header */}
                    <div className="notification-panel-header">
                        <span className="notification-panel-title">Thông báo ({notifications.length})</span>
                        <div className="notification-panel-actions">
                            {unreadCount > 0 && (
                                <button className="notification-panel-markall" onClick={() => markAllAsRead()}>
                                    Đánh dấu tất cả
                                </button>
                            )}
                            <button className="notification-panel-close" onClick={() => setIsOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">Không có thông báo</div>
                        ) : (
                            [...notifications].reverse().map((notif) => {
                                const style = getNotificationStyle(notif.type);
                                const notifTime = new Date(notif.timestamp);
                                const now = new Date();
                                const isVeryRecent = (now - notifTime) < 5000; // 5 giây
                                
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`notification-item ${notif.isRead ? 'read' : 'unread'} ${isVeryRecent ? 'recent' : ''}`}
                                    >
                                        <div className="notification-item-inner">
                                            <span className="notification-item-icon">{style.icon}</span>
                                            <div className="notification-item-body">
                                                <div className="notification-item-title-row">
                                                    <span className="notification-item-title">{style.title}</span>
                                                    <span className="notification-item-time">{formatTimeAgo(notif.timestamp)}</span>
                                                </div>
                                                <div className="notification-item-message">{notif.message}</div>
                                                {notif.contractId && (
                                                    <div className="notification-item-contract">Hợp đồng #{notif.contractId}</div>
                                                )}
                                            </div>
                                            {!notif.isRead && <div className="notification-item-dot" />}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};