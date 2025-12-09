import React, { useState } from 'react';
import { Card, Input, Select, Tag, Row, Col } from 'antd';
import PendingContractList from './ContractCreation/PendingContractList';
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
  { key: 'all', label: 'Tất cả' },
  { key: 'requests', label: 'Đơn từ khách hàng' },
  { key: 'survey', label: 'Hợp đồng khảo sát' },
  { key: 'approved', label: 'Hợp đồng đã duyệt' },
  { key: 'signed', label: 'Hợp đồng đã ký' },
  { key: 'active', label: 'Hợp đồng đang hoạt động' },
  { key: 'transfers', label: 'Yêu cầu chuyển nhượng' },
  { key: 'annuls', label: 'Yêu cầu hủy hợp đồng' },
];

const ServiceContractsManager = ({ initialTab }) => {
  const [active, setActive] = useState(initialTab || 'all');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');

  const renderContent = () => {
    const props = { keyword, status };
    switch (active) {
      case 'all':
        return <AllContractsTab {...props} />;
      case 'requests':
        return <ContractRequestsPage {...props} />;
      case 'survey':
        return <SurveyReviewPage {...props} />;
      case 'approved':
        return <ApprovedContractsPage {...props} />;
      case 'signed':
        return <SignedContractsPage {...props} />;
      case 'active':
        return <ActiveContractsPage {...props} />;
      case 'transfers':
        return <ContractTransferList {...props} />;
      case 'annuls':
        return <ContractAnnulList {...props} />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <Row gutter={12} align="middle" style={{ marginBottom: 12 }}>
        <Col xs={24} md={12} lg={12} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Input.Search
            placeholder="Tìm nhanh: số HĐ, tên khách, SĐT, địa chỉ, ghi chú..."
            allowClear
            enterButton
            onSearch={(v) => setKeyword(v)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={12} lg={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Select
            value={status}
            onChange={(val) => {
              setStatus(val);
              // Map status -> tab and switch view
              const map = {
                all: 'all',
                DRAFT: 'requests',
                PENDING: 'requests',
                PENDING_SURVEY_REVIEW: 'survey',
                APPROVED: 'approved',
                PENDING_SIGN: 'signed',
                SIGNED: 'signed',
                ACTIVE: 'active',
                SUSPENDED: 'active'
              };
              const target = map[val] || 'all';
              setActive(target);
            }}
            style={{ minWidth: 180 }}
          >
            <Option value="all">Tất cả</Option>
            <Option value="DRAFT">Đơn từ khách hàng</Option>
            <Option value="APPROVED">Đã duyệt</Option>
            <Option value="SIGNED">Đã ký</Option>
            <Option value="ACTIVE">Đang hoạt động</Option>
          </Select>
        </Col>
      </Row>

      {/* Tab buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        {tabs.map(t => (
          <Tag
            key={t.key}
            color={active === t.key ? 'blue' : undefined}
            style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: 8 }}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </Tag>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </Card>
  );
};

export default ServiceContractsManager;
