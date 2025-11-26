import React, { useContext } from 'react';
import { ServiceNotificationContext } from '../../contexts/ServiceNotificationContext';
import { X } from 'lucide-react';

/**
 * 🔔 SERVICE STAFF ONLY - Notification Toast/Popup
 * Hiển thị thông báo ở góc dưới bên phải
 */
export const ServiceNotificationToast = () => {
    const { notifications, removeNotification, transientToasts } = useContext(ServiceNotificationContext);

    const getNotificationStyle = (type) => {
        const styles = {
            'CONTRACT_REQUEST_CREATED': { icon: '📋', title: 'Yêu cầu hợp đồng mới', color: '#722ed1', bgColor: '#f9f0ff' },
            'TECH_SURVEY_COMPLETED': { icon: '✅', title: 'Báo cáo khảo sát hoàn thành', color: '#52c41a', bgColor: '#f6ffed' },
            'SURVEY_APPROVED': { icon: '👍', title: 'Báo cáo khảo sát đã duyệt', color: '#13c2c2', bgColor: '#e6fffb' },
            'CUSTOMER_SIGNED_CONTRACT': { icon: '✍️', title: 'Khách hàng đã ký hợp đồng', color: '#1890ff', bgColor: '#e6f7ff' },
            'SENT_TO_INSTALLATION': { icon: '🚚', title: 'Đã gửi lắp đặt', color: '#eb2f96', bgColor: '#fff0f6' },
            'INSTALLATION_COMPLETED': { icon: '🔧', title: 'Lắp đặt hoàn thành', color: '#faad14', bgColor: '#fffbe6' },
            'SUPPORT_TICKET_CREATED': { icon: '🆘', title: 'Yêu cầu hỗ trợ mới', color: '#f5222d', bgColor: '#fff1f0' },
        };
        return styles[type] || { icon: '📢', title: 'Thông báo', color: '#666', bgColor: '#f5f5f5' };
    };

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
        
        return notifTime.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '380px'
        }}>
            {/* Render transient toasts first (self-actions) */}
            {transientToasts && transientToasts.slice(0,5).map((notif) => {
                const style = getNotificationStyle(notif.type);
                return (
                    <div key={notif.id} style={{
                        backgroundColor: style.bgColor,
                        border: `1px solid ${style.color}`,
                        borderRadius: '4px',
                        padding: '12px 16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        animation: 'slideInRight 0.3s ease-out'
                    }}>
                        <span style={{ fontSize: '18px', minWidth: '24px' }}>{style.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: style.color, marginBottom: '4px' }}>{style.title}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{notif.message}</div>
                        </div>
                    </div>
                );
            })}

            {notifications.slice(0, 5)
                .filter(notif => notif.isVisible !== false) // Chỉ hiển thị popup nếu isVisible = true
                .map((notif) => {
                const style = getNotificationStyle(notif.type);
                return (
                    <div
                        key={notif.id}
                        style={{
                            backgroundColor: style.bgColor,
                            border: `1px solid ${style.color}`,
                            borderRadius: '4px',
                            padding: '12px 16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            animation: 'slideInRight 0.3s ease-out'
                        }}
                    >
                        <span style={{ fontSize: '18px', minWidth: '24px' }}>
                            {style.icon}
                        </span>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: style.color,
                                marginBottom: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>{style.title}</span>
                                <span style={{
                                    fontSize: '11px',
                                    color: style.color,
                                    fontWeight: 'normal',
                                    opacity: 0.7
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
                        <button
                            onClick={() => removeNotification(notif.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#999',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            })}
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};
