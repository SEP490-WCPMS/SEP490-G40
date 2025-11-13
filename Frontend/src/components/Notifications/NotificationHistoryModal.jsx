import React, { useState, useContext } from 'react';
import { Modal, List, Spin, Empty, Button, message } from 'antd';
import { ServiceNotificationContext } from '../../contexts/ServiceNotificationContext';

/**
 * 🔔 Notification History Modal
 * Shows full notification history loaded from DB with pagination
 */
export const NotificationHistoryModal = ({ visible, onClose }) => {
    const { loadNotificationHistory } = useContext(ServiceNotificationContext);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0
    });

    // Load notifications when modal opens
    React.useEffect(() => {
        if (visible) {
            fetchNotifications(1);
        }
    }, [visible]);

    const fetchNotifications = async (page) => {
        setLoading(true);
        try {
            const response = await loadNotificationHistory(page - 1, pagination.pageSize);
            
            if (response?.content) {
                setNotifications(response.content);
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    total: response.totalElements || 0
                }));
            }
        } catch (error) {
            message.error('Lỗi khi tải lịch sử thông báo');
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
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
        
        return notifTime.toLocaleDateString('vi-VN', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal
            title="📋 Lịch Sử Thông Báo"
            visible={visible}
            onCancel={onClose}
            width={700}
            footer={null}
            loading={loading}
        >
            <Spin spinning={loading}>
                {notifications.length === 0 ? (
                    <Empty description="Không có thông báo" />
                ) : (
                    <List
                        dataSource={notifications}
                        renderItem={(notif) => (
                            <List.Item
                                style={{
                                    backgroundColor: notif.read ? '#fff' : '#f5f7fa',
                                    padding: '12px',
                                    borderRadius: '4px',
                                    marginBottom: '8px'
                                }}
                            >
                                <List.Item.Meta
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: notif.read ? '500' : '600' }}>
                                                {notif.type}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#999' }}>
                                                {formatTimeAgo(notif.createdAt)}
                                            </span>
                                        </div>
                                    }
                                    description={
                                        <div>
                                            <p style={{ margin: '4px 0', fontSize: '13px' }}>
                                                {notif.message}
                                            </p>
                                            {notif.referenceId && (
                                                <span style={{ fontSize: '11px', color: '#999' }}>
                                                    Hợp đồng #{notif.referenceId}
                                                </span>
                                            )}
                                        </div>
                                    }
                                />
                                {!notif.read && (
                                    <div
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#1890ff',
                                            borderRadius: '50%'
                                        }}
                                    />
                                )}
                            </List.Item>
                        )}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            onChange: fetchNotifications
                        }}
                    />
                )}
            </Spin>
        </Modal>
    );
};

export default NotificationHistoryModal;
