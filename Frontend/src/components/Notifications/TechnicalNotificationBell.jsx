import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { ServiceNotificationContext } from '../../contexts/ServiceNotificationContext';
import { useAuth } from '../../hooks/use-auth';
import { getContractDetails } from '../Services/apiTechnicalStaff';
import { getServiceContracts } from '../Services/apiService';
import { message } from 'antd';

const isTechnicalNotification = (n) => {
  if (!n) return false;
  const t = (n.type || '').toString().toUpperCase();
  const ref = (n.referenceType || '').toString().toUpperCase();
  // Business rule: only show in Technical bell when Technical needs to ACT:
  // - CONTRACT_REQUEST_CREATED: service forwarded a survey request to Technical (must go survey)
  // - CUSTOMER_SIGNED_CONTRACT: contract signed and now waiting for installation (Technical should prepare)
  const techVisible = ['CONTRACT_REQUEST_CREATED', 'CUSTOMER_SIGNED_CONTRACT'];
  if (techVisible.includes(t)) return true;

  // Everything else (survey completed/approved, installation completed) are actions performed by Technical
  // and should be transient (toast) rather than persistent bell entries.
  return false;
};

// Localized Vietnamese titles/messages for common notification types (consistent wording)
const translateNotification = (n) => {
  if (!n) return { title: n?.type || '', message: n?.message || '' };
  const rawType = (n.type || '').toString();
  const type = rawType.toUpperCase();
  // normalize type to handle variants like "Sent To Installation" or "SENT_TO_INSTALLATION"
  const normalized = type.replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const contractId = n.contractId || n.referenceId || n.reference_id || null;
  const lookup = {
    // When service forwards a contract request to Technical => Technical must go survey
    'CONTRACT_REQUEST_CREATED': { title: 'Yêu cầu khảo sát mới', message: contractId ? `Yêu cầu khảo sát cho hợp đồng #${contractId} cần xử lý` : 'Có yêu cầu khảo sát mới cần xử lý' },
    // When service assigns to installation team / technical => Technical must lắp đặt
    'SENT_TO_INSTALLATION': { title: 'Yêu cầu lắp đặt', message: contractId ? `Yêu cầu lắp đặt cho hợp đồng #${contractId}` : 'Có yêu cầu lắp đặt cần xử lý' },
    // When contract signed by customer and Technical should prepare for install
    'CUSTOMER_SIGNED_CONTRACT': { title: 'Hợp đồng đã ký — chuẩn bị lắp đặt', message: contractId ? `Hợp đồng #${contractId} đã được ký, chuẩn bị lắp đặt` : 'Hợp đồng đã được ký, chuẩn bị lắp đặt' },
    // Keep these as informational (fallback) but they are generally service-facing
    'SURVEY_APPROVED': { title: 'Khảo sát đã duyệt', message: contractId ? `Khảo sát hợp đồng #${contractId} đã được duyệt` : 'Khảo sát đã được duyệt' },
    'TECH_SURVEY_COMPLETED': { title: 'Khảo sát hoàn thành', message: contractId ? `Khảo sát hợp đồng #${contractId} đã hoàn thành` : 'Khảo sát đã hoàn thành' },
    'INSTALLATION_COMPLETED': { title: 'Hoàn tất lắp đặt', message: contractId ? `Lắp đặt cho hợp đồng #${contractId} đã hoàn tất` : 'Lắp đặt đã hoàn tất' }
  };
  // Prefer normalized lookup first, then raw type lookup, then fallback to payload/title
  return lookup[normalized] || lookup[type] || { title: n.title ? humanize(n.title) : n.type, message: n.message || '' };
};

const humanize = (s) => {
  if (!s) return '';
  return String(s).replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, t => t.toUpperCase());
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

  return notifTime.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
};

const getNotificationStyle = (type) => {
  const styles = {
    'CONTRACT_REQUEST_CREATED': { icon: '📋', color: '#722ed1', bgColor: '#f9f0ff' },
    'TECH_SURVEY_COMPLETED': { icon: '✅', color: '#52c41a', bgColor: '#f6ffed' },
    'SURVEY_APPROVED': { icon: '👍', color: '#13c2c2', bgColor: '#e6fffb' },
    'CUSTOMER_SIGNED_CONTRACT': { icon: '✍️', color: '#1890ff', bgColor: '#e6f7ff' },
    'SENT_TO_INSTALLATION': { icon: '🚚', color: '#eb2f96', bgColor: '#fff0f6' },
    'INSTALLATION_COMPLETED': { icon: '🔧', color: '#faad14', bgColor: '#fffbe6' },
    'SUPPORT_TICKET_CREATED': { icon: '🆘', color: '#f5222d', bgColor: '#fff1f0' },
  };
  return styles[type] || { icon: '📢', color: '#666', bgColor: '#f5f5f5' };
};

export default function TechnicalNotificationBell({ compact = false }) {
  const navigate = useNavigate();
  const { notifications = [], unreadCount = 0, markAsRead, markAllAsRead, syncUnreadCountFromDB } = useContext(ServiceNotificationContext);
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const techNotifs = (notifications || []).filter(isTechnicalNotification).slice().sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const handleClick = async (n) => {
    if (!n) return;
    try { markAsRead && markAsRead(n.id); } catch (e) { /* ignore */ }

    const rawType = (n.type || '').toString();
    const type = rawType.toUpperCase();
    const normalized = type.replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    let contractId = n.referenceId || n.contractId || n.contract_id || null;

    // Determine section route using normalized token to handle variants
    let sectionRoute = '/technical';
    const normalizedLower = normalized.toLowerCase();
    const looksLikeSurvey = normalizedLower.includes('survey') || normalized === 'CONTRACT_REQUEST_CREATED' || normalizedLower.includes('survey_completed') || normalizedLower.includes('survey_approved') || type.includes('SURVEY');
    const looksLikeInstall = normalizedLower.includes('install') || normalizedLower.includes('installation') || normalizedLower.includes('sent_to_installation') || type.includes('INSTALL');
    if (looksLikeSurvey) sectionRoute = '/technical/survey';
    else if (looksLikeInstall) sectionRoute = '/technical/install';

    // If we have a contractId, verify the contract detail is accessible before navigating to avoid server-error pages
    if (contractId) {
      // Normalize: if contractId is not a plain integer id (e.g. contains letters like a contract number),
      // try to resolve it to the numeric contract id used by the technical detail endpoint.
      const isNumericId = /^\d+$/.test(String(contractId));
      let resolvedId = contractId;
      if (!isNumericId) {
        try {
          // Try searching service contracts by keyword (contract number). This returns service-side contracts
          // and includes numeric `id` and `contractNumber` fields.
          const resp = await getServiceContracts({ keyword: contractId, size: 50, page: 0 });
          const items = resp?.data?.content || resp?.data || [];
          const found = Array.isArray(items) ? items.find(it => String(it.contractNumber || it.contract_number || it.contractNumber).toUpperCase() === String(contractId).toUpperCase() || String(it.contractNumber).includes(String(contractId))) : null;
          if (found && found.id) resolvedId = found.id;
        } catch (searchErr) {
          // ignore search errors and fall back to using the raw contractId
        }
      }

      try {
        await getContractDetails(resolvedId);
        const targetIdForNav = resolvedId;
        // Debug log to help trace routing issues
        try { console.debug('[TN_BELL] notif type=', type, 'normalized=', normalized, 'sectionRoute=', sectionRoute, 'resolvedId=', resolvedId); } catch (e) {}

        if (looksLikeSurvey) {
          navigate(`/technical/survey/report/${encodeURIComponent(targetIdForNav)}`);
        } else if (looksLikeInstall) {
          navigate(`/technical/install/detail/${encodeURIComponent(targetIdForNav)}`);
        } else {
          // If contractId present but we couldn't classify, prefer install detail as a reasonable default
          navigate(`/technical/install/detail/${encodeURIComponent(targetIdForNav)}`);
        }
      } catch (err) {
        // If server returns error (e.g. 500 or unauthorized), fallback to list and show message
        message.error('Không thể mở chi tiết từ thông báo — đã chuyển đến danh sách.');
        // Append highlight param with original contract identifier so lists that support highlighting can try to locate it
        const highlightParam = encodeURIComponent(contractId);
        navigate(`${sectionRoute}${sectionRoute.includes('?') ? '&' : '?'}highlight=${highlightParam}`);
      }
    } else {
      navigate(sectionRoute);
    }

    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => { const next = !isOpen; setIsOpen(next); if (next && syncUnreadCountFromDB) try { syncUnreadCountFromDB(); } catch (e) { /* ignore */ } }}
        className="notification-bell-button"
        title="Thông báo Kỹ thuật"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <span className="notification-panel-title">Kỹ thuật ({techNotifs.length})</span>
            <div className="notification-panel-actions">
              {/* Mark all technical notifications in this bell as read (not global) */}
              {/* Always show the button but disable when there are no unread tech notifications */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    const unread = techNotifs.filter(n => !n.isRead);
                    if (!unread || unread.length === 0) return;
                    unread.forEach(n => { try { markAsRead && markAsRead(n.id); } catch (ee) {} });
                    if (syncUnreadCountFromDB) syncUnreadCountFromDB();
                  } catch (err) {
                    /* ignore */
                  }
                }}
                className="notification-panel-markall"
                disabled={!techNotifs.some(n => !n.isRead)}
                title={techNotifs.some(n => !n.isRead) ? 'Đánh dấu tất cả là đã đọc' : 'Không có thông báo chưa đọc'}
                style={{ opacity: techNotifs.some(n => !n.isRead) ? 1 : 0.5, cursor: techNotifs.some(n => !n.isRead) ? 'pointer' : 'default' }}
              >Đánh dấu tất cả</button>
              <button className="notification-panel-close" onClick={() => setIsOpen(false)}><X size={16} /></button>
            </div>
          </div>

          <div className="notification-list">
            {techNotifs.length === 0 ? (
              <div className="notification-empty">Không có thông báo kỹ thuật</div>
            ) : (
              techNotifs.map(n => {
                const v = translateNotification(n);
                const contractId = n.contractId || n.referenceId || null;
                const style = getNotificationStyle((n.type || '').toString().toUpperCase());
                return (
                  <div key={n.id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`} onClick={() => handleClick(n)}>
                    <div className="notification-item-inner">
                      <div style={{display:'flex', gap:12, alignItems:'flex-start'}}>
                        <div style={{display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color: style.color, minWidth:28}}>
                          <span aria-hidden style={{lineHeight:1}}>{style.icon}</span>
                        </div>
                        <div className="notification-item-body" style={{flex:1}}>
                          <div className="notification-item-title-row">
                            <span className="notification-item-title">{v.title}</span>
                            <span className="notification-item-time">{formatTimeAgo(n.timestamp)}</span>
                          </div>
                          <div className="notification-item-message">{v.message || n.message}</div>
                          {contractId && <div className="notification-item-contract">Hợp đồng #{contractId}</div>}
                        </div>
                      </div>

                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        {/* Per-item mark-as-read button - stops event propagation so clicking it doesn't navigate */}
                        {!n.isRead && (
                          <button
                            onClick={(e) => { e.stopPropagation(); try { markAsRead && markAsRead(n.id); } catch(err){} }}
                            className="notification-mark-read"
                            title="Đánh dấu đã đọc"
                            style={{ background: 'transparent', border: 'none', color: '#2b6cb0', cursor: 'pointer', padding: 4 }}
                          >
                            Đã đọc
                          </button>
                        )}

                        {!n.isRead && <div className="notification-item-dot" />}
                      </div>
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
}

