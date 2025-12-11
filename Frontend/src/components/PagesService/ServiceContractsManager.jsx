import React, { useState } from 'react';
import { Card, Input, Select, Row, Col, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
// Icons cho Tablist
import { 
  AppstoreOutlined, 
  FileAddOutlined, 
  CompassOutlined, 
  CheckCircleOutlined, 
  FormOutlined, 
  ThunderboltOutlined, 
  SwapOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';

import SurveyReviewPage from './ContractCreation/SurveyReviewPage';
import ApprovedContractsPage from './ContractCreation/ApprovedContractsPage';
import SignedContractsPage from './ContractCreation/SignedContractsPage';
import ActiveContractsPage from './ActiveContracts/ActiveContractsPage';
import ContractTransferList from './AnnulTransfer/ContractTransferList';
import ContractAnnulList from './AnnulTransfer/ContractAnnulList';
import ContractRequestsPage from './ContractCreation/ContractRequestsPage';
import AllContractsTab from './AllContractsTab';

const { Option } = Select;

const tabs = [
  { key: 'all', label: 'Tất cả', icon: <AppstoreOutlined /> },
  { key: 'requests', label: 'Đơn mới', icon: <FileAddOutlined /> },
  { key: 'survey', label: 'Khảo sát', icon: <CompassOutlined /> },
  { key: 'approved', label: 'Đã duyệt', icon: <CheckCircleOutlined /> },
  { key: 'signed', label: 'Đã ký', icon: <FormOutlined /> },
  { key: 'active', label: 'Hoạt động', icon: <ThunderboltOutlined /> },
  { key: 'transfers', label: 'Chuyển nhượng', icon: <SwapOutlined /> },
  { key: 'annuls', label: 'Hủy HĐ', icon: <CloseCircleOutlined /> },
];

const ServiceContractsManager = ({ initialTab }) => {
  const [active, setActive] = useState(initialTab || 'all');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabClick = (key) => {
    setActive(key);
    // Logic map tab -> status
    if (key === 'requests') setStatus('DRAFT');
    else if (key === 'survey') setStatus('PENDING_SURVEY_REVIEW');
    else if (key === 'approved') setStatus('APPROVED');
    else if (key === 'signed') setStatus('SIGNED');
    
    // --- FIX: Tab Active để mặc định là 'all' để con tự xử lý ---
    else if (key === 'active') setStatus('all'); 
    // -----------------------------------------------------------

    else if (key === 'transfers') setStatus('TRANSFER');
    else if (key === 'annuls') setStatus('ANNUL');
    else setStatus('all'); 
  };

  const statusToTab = {
    all: 'all',
    DRAFT: 'requests',
    PENDING_SURVEY_REVIEW: 'survey',
    APPROVED: 'approved',
    PENDING_SIGN: 'signed',
    SIGNED: 'signed',
    ACTIVE: 'active',
    SUSPENDED: 'active', 
    TERMINATED: 'active', 
    EXPIRED: 'active', 
    TRANSFER: 'transfers',
    ANNUL: 'annuls',
  };

  const renderContent = () => {
    const props = { keyword, status, refreshKey };
    switch (active) {
      case 'all': return <AllContractsTab {...props} />;
      case 'requests': return <ContractRequestsPage {...props} />;
      case 'survey': return <SurveyReviewPage {...props} />;
      case 'approved': return <ApprovedContractsPage {...props} />;
      case 'signed': return <SignedContractsPage {...props} />;
      case 'active': return <ActiveContractsPage {...props} />;
      case 'transfers': return <ContractTransferList {...props} />;
      case 'annuls': return <ContractAnnulList {...props} />;
      default: return null;
    }
  };

  return (
    // Thêm style ẩn thanh cuộn cho container chính
    <div style={{ padding: '0 0 20px 0', height: '100%', overflow: 'hidden' }} className="service-manager-container">
      {/* CSS ẩn thanh cuộn (Global hack cho component này) */}
      <style>{`
        .service-manager-container ::-webkit-scrollbar {
          display: none;
        }
        .service-manager-container {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      <Card bordered={false} className="shadow-sm" bodyStyle={{ padding: '16px' }} style={{ borderRadius: 8 }}>
        {/* Filter Bar */}
        <Row gutter={12} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} md={14} lg={16} style={{ marginBottom: 8 }}>
            <Input.Search
              placeholder="Tìm nhanh: số HĐ, tên khách, SĐT..."
              allowClear
              enterButton="Tìm kiếm"
              onSearch={(v) => setKeyword(v)}
              style={{ width: '100%', maxWidth: 400 }}
            />
          </Col>
          <Col xs={24} md={10} lg={8} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500, color: '#595959' }}>Trạng thái:</span>
                <Select
                  value={status}
                  onChange={(val) => {
                    setStatus(val);
                    const target = statusToTab[val] || 'all';
                    setActive(target);
                  }}
                  style={{ width: 160 }}
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="DRAFT">Đơn từ khách hàng</Option>
                  <Option value="PENDING_SURVEY_REVIEW">Đã khảo sát</Option>
                  <Option value="APPROVED">Đã duyệt</Option>
                  <Option value="SIGNED">Khách đã ký</Option>
                  <Option value="ACTIVE">Đang hoạt động</Option>
                  <Option value="SUSPENDED">Đang tạm ngưng</Option>
                  <Option value="TERMINATED">Đã chấm dứt</Option>
                  <Option value="EXPIRED">Hết hạn</Option>
                  <Option value="TRANSFER">Yêu cầu chuyển nhượng</Option>
                  <Option value="ANNUL">Yêu cầu hủy</Option>
                </Select>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => setRefreshKey(k => k + 1)}
                >
                  Làm mới
                </Button>
            </div>
          </Col>
        </Row>

        {/* --- TAB LIST (CỐ ĐỊNH, KHÔNG SCROLL NGANG) --- */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', // Tự động xuống dòng nếu hết chỗ
            gap: 8, 
            marginBottom: 20, 
            paddingBottom: 8,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {tabs.map((t) => {
            const isActive = active === t.key;
            return (
              <div
                key={t.key}
                onClick={() => handleTabClick(t.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: '6px', // Bo góc nhẹ
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  // Style nút bấm hiện đại
                  color: isActive ? '#fff' : '#595959',
                  backgroundColor: isActive ? '#1890ff' : '#f5f5f5', 
                  boxShadow: isActive ? '0 2px 4px rgba(24, 144, 255, 0.25)' : 'none',
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#e6f7ff';
                }}
                onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
              >
                {t.icon}
                <span>{t.label}</span>
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div style={{ minHeight: 400 }}>
           {renderContent()}
        </div>
      </Card>
    </div>
  );
};

export default ServiceContractsManager;