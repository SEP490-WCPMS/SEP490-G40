import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceNotificationContext } from '../../contexts/ServiceNotificationContext';
import { Bell, X } from 'lucide-react';

/**
 * 🔔 SERVICE STAFF ONLY - Notification Bell
 * Hiển thị ở header LayoutService
 * Click → dropdown danh sách thông báo
 */
export const ServiceNotificationBell = () => {
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
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    position: 'relative',
                    color: '#1890ff',
                    fontSize: '18px'
                }}
                title="Thông báo"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: '#f5222d',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    right: '-8px',
                    top: '100%',
                    marginTop: '8px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    width: '360px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    border: '1px solid #f0f0f0'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#fafafa'
                    }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            Thông báo ({notifications.length})
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#1890ff',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        padding: 0
                                    }}
                                >
                                    Đánh dấu tất cả
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#999',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div>
                        {notifications.length === 0 ? (
                            <div style={{
                                padding: '32px 16px',
                                textAlign: 'center',
                                color: '#999',
                                fontSize: '13px'
                            }}>
                                Không có thông báo
                            </div>
                        ) : (
                            // ✅ Reverse order: Mới nhất ở trên
                            [...notifications].reverse().map((notif) => {
                                const style = getNotificationStyle(notif.type);
                                // ✅ Tính xem có phải mới nhất không (trong 5 giây)
                                const isLatest = notifications.length > 0 && notif.id === notifications[notifications.length - 1].id;
                                const notifTime = new Date(notif.timestamp);
                                const now = new Date();
                                const isVeryRecent = (now - notifTime) < 5000; // 5 giây
                                
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #f0f0f0',
                                            cursor: 'pointer',
                                            backgroundColor: isVeryRecent ? '#fff7e6' : (notif.isRead ? '#fff' : '#f5f7fa'),
                                            fontWeight: isVeryRecent ? '600' : 'normal',
                                            borderLeft: isVeryRecent ? '3px solid #ff7a00' : 'none',
                                            paddingLeft: isVeryRecent ? '13px' : '16px',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isVeryRecent) {
                                                e.currentTarget.style.backgroundColor = '#f5f7fa';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isVeryRecent) {
                                                e.currentTarget.style.backgroundColor = notif.isRead ? '#fff' : '#f5f7fa';
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ fontSize: '16px', minWidth: '24px' }}>
                                                {style.icon}
                                            </span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '13px',
                                                    fontWeight: notif.isRead ? '500' : '600',
                                                    marginBottom: '4px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start'
                                                }}>
                                                    <span>{style.title}</span>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        color: '#999',
                                                        fontWeight: 'normal',
                                                        whiteSpace: 'nowrap',
                                                        marginLeft: '8px'
                                                    }}>
                                                        {formatTimeAgo(notif.timestamp)}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#666'
                                                }}>
                                                    {notif.message}
                                                </div>
                                                {notif.contractId && (
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#999',
                                                        marginTop: '4px'
                                                    }}>
                                                        Hợp đồng #{notif.contractId}
                                                    </div>
                                                )}
                                            </div>
                                            {!notif.isRead && (
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    backgroundColor: '#1890ff',
                                                    borderRadius: '50%',
                                                    marginTop: '4px'
                                                }} />
                                            )}
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
