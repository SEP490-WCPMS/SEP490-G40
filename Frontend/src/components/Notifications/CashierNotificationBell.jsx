import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { ServiceNotificationContext } from '../../contexts/ServiceNotificationContext';
import { useAuth } from '../../hooks/use-auth';

const CashierFilter = (n) => {
  if (!n) return false;
  const t = (n.type || '').toString().toUpperCase();
  const ref = (n.referenceType || '').toString().toUpperCase();
  return t === 'PAYMENT_RECEIVED' || t === 'WATER_BILL_ISSUED' || t.includes('INVOICE') || ref === 'INVOICE';
};

const translateCashierNotification = (n) => {
  if (!n) return { title: n?.type || '', message: n?.message || '' };
  const type = (n.type || '').toString().toUpperCase();
  const refId = n.referenceId || n.contractId || n.id || null;
  const map = {
    'PAYMENT_RECEIVED': { title: 'Thanh toán thành công', message: refId ? `Hóa đơn #${refId} đã được thanh toán` : 'Thanh toán đã được ghi nhận' },
    'WATER_BILL_ISSUED': { title: 'Hóa đơn tiền nước', message: refId ? `Hóa đơn #${refId} đã được phát hành` : 'Hóa đơn đã được phát hành' },
    'WATER_BILL_PAYMENT_RECEIVED': { title: 'Thanh toán hóa đơn nước', message: refId ? `Hóa đơn #${refId} đã được thanh toán` : 'Thanh toán đã được ghi nhận' }
  };
  return map[type] || { title: n.title || n.type, message: n.message || '' };
};

export default function CashierNotificationBell({ compact = false }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, syncUnreadCountFromDB } = useContext(ServiceNotificationContext);
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const items = notifications.filter(CashierFilter).slice().sort((a,b)=> new Date(b.timestamp||0)-new Date(a.timestamp||0));

  const handleClick = (n) => {
    if (!n) return;
    try { markAsRead(n.id); } catch(e){}
    const invoiceId = n.referenceId || n.contractId || n.id;
    // Navigate to list first and highlight invoice if possible
    navigate('/cashier/my-route');
    if (invoiceId) {
      setTimeout(() => {
        const el = document.querySelector(`[data-invoice-id="${invoiceId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('notification-highlight');
          const removeHighlight = (e) => {
            if (el.contains(e.target)) return;
            el.classList.remove('notification-highlight');
            document.removeEventListener('click', removeHighlight);
          };
          setTimeout(() => document.addEventListener('click', removeHighlight), 100);
        }
      }, 300);
    }
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { const next = !isOpen; setIsOpen(next); if (next && user?.id) try{ syncUnreadCountFromDB(); } catch(e){} }} className="notification-bell-button" title="Thông báo Thu Ngân">
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount>99?'99+':unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <span className="notification-panel-title">Thu ngân ({items.length})</span>
            <div className="notification-panel-actions">
              {unreadCount>0 && <button onClick={() => markAllAsRead()} className="notification-panel-markall">Đánh dấu tất cả</button>}
              <button className="notification-panel-close" onClick={()=>setIsOpen(false)}><X size={16} /></button>
            </div>
          </div>
          <div className="notification-list">
            {items.length===0 ? <div className="notification-empty">Không có thông báo</div> : (
              items.map(n => {
                const v = translateCashierNotification(n);
                return (
                  <div key={n.id} className={`notification-item ${n.isRead? 'read':'unread'}`} onClick={()=>handleClick(n)}>
                    <div className="notification-item-inner">
                      <div className="notification-item-body">
                        <div className="notification-item-title-row">
                          <span className="notification-item-title">{v.title}</span>
                          <span className="notification-item-time">{new Date(n.timestamp||'').toLocaleString()}</span>
                        </div>
                        <div className="notification-item-message">{v.message || n.message}</div>
                      </div>
                      {!n.isRead && <div className="notification-item-dot" />}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
