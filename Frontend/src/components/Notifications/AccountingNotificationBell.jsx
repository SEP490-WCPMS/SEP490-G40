import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { ServiceNotificationContext } from '../../contexts/ServiceNotificationContext';
import { useAuth } from '../../hooks/use-auth';

const InvoiceFilter = (n) => {
  if (!n) return false;
  const t = (n.type || '').toString().toUpperCase();
  const ref = (n.referenceType || '').toString().toUpperCase();
  return t.includes('INVOICE') || t.includes('BILL') || ref === 'INVOICE' || t === 'WATER_BILL_ISSUED';
};

export default function AccountingNotificationBell({ compact = false }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, syncUnreadCountFromDB } = useContext(ServiceNotificationContext);
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const invoices = notifications.filter(InvoiceFilter).slice().sort((a,b)=> new Date(b.timestamp||0)-new Date(a.timestamp||0));

  const handleClick = (n) => {
    if (!n) return;
    markAsRead(n.id);
    const invoiceId = n.referenceId || n.contractId || n.id;
    if (user?.roleName === 'CASHIER_STAFF') {
      if (invoiceId) navigate(`/cashier/invoice-detail/${invoiceId}`);
      else navigate('/cashier/my-route');
    } else {
      if (invoiceId) navigate(`/accounting/invoices/${invoiceId}`);
      else navigate('/accounting/invoices');
    }
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { const next = !isOpen; setIsOpen(next); if (next && user?.id) try{ syncUnreadCountFromDB(); } catch(e){} }} className="notification-bell-button" title="Thông báo Hóa đơn">
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount>99?'99+':unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <span className="notification-panel-title">Hóa đơn ({invoices.length})</span>
            <div className="notification-panel-actions">
              {unreadCount>0 && <button onClick={() => markAllAsRead()} className="notification-panel-markall">Đánh dấu tất cả</button>}
              <button className="notification-panel-close" onClick={()=>setIsOpen(false)}><X size={16} /></button>
            </div>
          </div>
          <div className="notification-list">
            {invoices.length===0 ? <div className="notification-empty">Không có thông báo hóa đơn</div> : (
              invoices.map(n => (
                <div key={n.id} className={`notification-item ${n.isRead? 'read':'unread'}`} onClick={()=>handleClick(n)}>
                  <div className="notification-item-inner">
                    <div className="notification-item-body">
                      <div className="notification-item-title-row">
                        <span className="notification-item-title">{n.title || n.type}</span>
                        <span className="notification-item-time">{new Date(n.timestamp||'').toLocaleString()}</span>
                      </div>
                      <div className="notification-item-message">{n.message}</div>
                    </div>
                    {!n.isRead && <div className="notification-item-dot" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
