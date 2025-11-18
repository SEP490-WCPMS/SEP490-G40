import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from './components/common/ScrollToTop';
import './App.css';
import { useAuth } from './hooks/use-auth';
import { ServiceNotificationProvider } from './contexts/ServiceNotificationContext';
import { ServiceNotificationListener } from './components/Notifications/ServiceNotificationListener';
import { ServiceNotificationToast } from './components/Notifications/ServiceNotificationToast';
import Login from './components/Authentication/Login';
import Header from './components/Layouts/Header';
import Footer from './components/Layouts/Footer';
import HomePage from './components/Pages/HomePage';
import AboutPage from './components/Pages/AboutPage';
import CustomerProfileUpdate from "./components/Customer/CustomerProfileUpdate";
import LayoutTechnical from './components/Layouts/LayoutTechnical';
import TechnicalDashboard from './components/PagesTechnical/TechnicalDashboard';
import SurveyContractsList from './components/PagesTechnical/Survey/SurveyContractsList';
import SurveyForm from './components/PagesTechnical/Survey/SurveyForm';
import InstallContractsList from './components/PagesTechnical/Install/InstallContractsList';
import InstallationDetail from './components/PagesTechnical/Install/InstallationDetail';
import LayoutCashier from './components/Layouts/LayoutCashier';
import MeterScan from './components/PagesCashier/MeterScan';
import ReadingConfirmation from './components/PagesCashier/ReadingConfirmation';
import LayoutService from './components/Layouts/LayoutService';
import ServiceDashboardPage from './components/PagesService/Dashboard/ServiceDashboardPage';
import ContractRequestsPage from './components/PagesService/ContractCreation/ContractRequestsPage';
import SurveyReviewPage from './components/PagesService/ContractCreation/SurveyReviewPage';
import ApprovedContractsPage from './components/PagesService/ContractCreation/ApprovedContractsPage';
import SignedContractsPage from './components/PagesService/ContractCreation/SignedContractsPage';
import ActiveContractsPage from './components/PagesService/ActiveContracts/ActiveContractsPage';
import ContractTransferList from './components/PagesService/AnnulTransfer/ContractTransferList';
import ContractAnnulList from './components/PagesService/AnnulTransfer/ContractAnnulList';
import ContractCreatePage from './components/PagesService/ContractCreation/ContractCreatePage';
import ContractRequestForm from "./components/Customer/ContractRequestForm";
import ContractRequestStatusList from "./components/Customer/ContractRequestStatusList";
import ContractList from './components/Customer/ContractList';
import ContractDetail from './components/Customer/ContractDetail';
import PendingSignContract from './components/Customer/PendingSignContract';
import StaffProfileView from './components/Staff/StaffProfileView';
import Register from './components/Authentication/Register';
import PrivateRoute from './PrivateRoute';
import CustomerChangePassword from './components/Customer/CustomerChangePassword';
import MeterReplacementForm from './components/PagesTechnical/Replacement/MeterReplacementForm'; // <-- Trang mới
import OnSiteCalibrationForm from './components/PagesTechnical/OnSiteCalibration/OnSiteCalibrationForm'; // <-- Trang mới
import SupportTicketList from './components/PagesService/SupportTickets/SupportTicketList'; // <-- Trang mới
import MaintenanceRequestList from './components/PagesTechnical/MaintenanceRequestList'; // <-- Trang mới
import CustomerSupportForm from './components/Customer/Feedback/CustomerSupportForm'; // <-- Trang mới
import MySupportTicketList from './components/Customer/Feedback/MySupportTicketList'; // <-- Trang mới
import SupportTicketDetail from './components/Customer/Feedback/SupportTicketDetail'; // <-- Trang mới
import ServiceCreateTicketForm from './components/PagesService/SupportTickets/ServiceCreateTicketForm'; // <-- Trang mới
import ContractRequestChange from './components/Customer/ContractRequestChange';
import MaintenanceRequestDetail from './components/PagesTechnical/MaintenanceRequestDetail'; // <-- THÊM IMPORT NÀY
import StaffChangePassword from './components/Staff/StaffChangePassword';
import LayoutAccounting from './components/Layouts/LayoutAccounting';
import ReadingRoutesList from './components/Accounting/ReadingRoutesList';
import UnbilledFeesList from './components/Pages/PagesAccounting/UnbilledFeesList';
import InvoiceList from './components/Pages/PagesAccounting/InvoiceList'; // <-- THÊM
import UnbilledFeeDetail from './components/Pages/PagesAccounting/UnbilledFeeDetail'; // <-- THÊM
import CreateServiceInvoice from './components/Pages/PagesAccounting/CreateServiceInvoice'; // <-- THÊM IMPORT MỚI
import InvoiceDetail from './components/Pages/PagesAccounting/InvoiceDetail';
import MyInvoiceListPage from "./components/Customer/MyInvoice/MyInvoiceListPage";
import MyInvoiceDetail from "./components/Customer/MyInvoice/MyInvoiceDetail";
import CreateInstallationInvoice from "./components/Pages/PagesAccounting/CreateInstallationInvoice";
import EligibleInstallationContracts from "@/components/Pages/PagesAccounting/EligibleInstallationContracts.jsx";
import PendingReadingsList from './components/Pages/PagesAccounting/PendingReadingsList';
import LayoutAdmin from './components/Layouts/LayoutAdmin';
import ContactPage from './components/Pages/ContactPage';


// Wrapper cho các trang Public (có Header/Footer chung)
const PublicLayout = ({ children, isAuthenticated, user }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Header isAuthenticated={isAuthenticated} user={user} />
    <main style={{ flex: 1 }}>
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>

        {/* === PUBLIC ROUTES (Đăng nhập, Đăng ký) === */}
        {/* Các trang này không cần layout hoặc layout riêng */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><AboutPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><ContactPage /></PublicLayout>} />
        <Route path="/" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><HomePage isAuthenticated={isAuthenticated} user={user} /></PublicLayout>} />


        {/* === CUSTOMER ROUTES (Cần đăng nhập, vai trò CUSTOMER) === */}
        <Route element={<PrivateRoute allowedRoles={['CUSTOMER']} />}>
          <Route path="/profile" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><CustomerProfileUpdate /></PublicLayout>} />
          <Route path="/contract-request" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><ContractRequestForm /></PublicLayout>} />
          <Route path="/contract-request-change" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><ContractRequestChange /></PublicLayout>} />
          <Route path="/pending-sign-contract" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><PendingSignContract /></PublicLayout>} />
          <Route path="/my-requests" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><ContractRequestStatusList /></PublicLayout>} />
          <Route path="/contract-list" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><ContractList /></PublicLayout>} />
          <Route path="/contract-detail" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><ContractDetail /></PublicLayout>} />
          <Route path="/change-password" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><CustomerChangePassword /></PublicLayout>} />
          <Route path="/support-request" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><CustomerSupportForm /></PublicLayout>} />
          <Route path="/my-support-tickets" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><MySupportTicketList /></PublicLayout>} />
          <Route path="/my-support-tickets/:ticketId" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><SupportTicketDetail /></PublicLayout>} />
          <Route path="/my-invoices" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><MyInvoiceListPage /></PublicLayout>} />
          <Route path="/my-invoices/:invoiceId" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><MyInvoiceDetail /></PublicLayout>} />

        </Route>


        {/* === STAFF COMMON ROUTES (Cần đăng nhập, nhiều vai trò) === */}
        <Route path="/staff" element={<PrivateRoute allowedRoles={['TECHNICAL_STAFF', 'CASHIER_STAFF', 'SERVICE_STAFF', 'ADMIN']} />}>
          <Route path="profile" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><StaffProfileView /></PublicLayout>} />
          <Route path="change-password" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><StaffChangePassword /></PublicLayout>} />
        </Route>


        {/* === STAFF LAYOUT ROUTES (Layout riêng, không Header/Footer chung) === */}

        {/* --- LUỒNG CỦA TECHNICAL STAFF --- */}
        <Route element={<PrivateRoute allowedRoles={['TECHNICAL_STAFF']} />}>
          <Route path="/technical" element={<LayoutTechnical />}>
            <Route index element={<TechnicalDashboard />} />
            <Route path="survey" element={<SurveyContractsList />} />
            <Route path="survey/report/:contractId" element={<SurveyForm />} />
            <Route path="install" element={<InstallContractsList />} />
            <Route path="install/detail/:contractId" element={<InstallationDetail />} />
            <Route path="replace-meter" element={<MeterReplacementForm />} />
            <Route path="calibrate-on-site" element={<OnSiteCalibrationForm />} />
            <Route path="maintenance-requests" element={<MaintenanceRequestList />} />
            <Route path="maintenance-requests/:ticketId" element={<MaintenanceRequestDetail />} />
          </Route>
        </Route>

        {/* --- LUỒNG CỦA CASHIER STAFF --- */}
        <Route element={<PrivateRoute allowedRoles={['CASHIER_STAFF']} />}>
          <Route path="/cashier" element={<LayoutCashier />}>
            {/* <Route index element={<CashierDashboard />} /> */}
            <Route path="scan" element={<MeterScan />} />
            <Route path="submit-reading" element={<ReadingConfirmation />} />
          </Route>
        </Route>

        {/* --- LUỒNG CỦA SERVICE STAFF --- */}
        <Route element={<PrivateRoute allowedRoles={['SERVICE_STAFF']} />}>
          <Route path="/service" element={<LayoutService />}>
            <Route index element={<ServiceDashboardPage />} />
            <Route path="requests" element={<ContractRequestsPage />} />
            <Route path="contract-create" element={<ContractCreatePage />} />
            <Route path="survey-reviews" element={<SurveyReviewPage />} />
            <Route path="approved-contracts" element={<ApprovedContractsPage />} />
            <Route path="signed-contracts" element={<SignedContractsPage />} />
            <Route path="active-contracts" element={<ActiveContractsPage />} />
            {/* Quản lý yêu cầu chuyển nhượng/hủy hợp đồng */}
            <Route path="contract-transfers" element={<ContractTransferList />} />
            <Route path="contract-annuls" element={<ContractAnnulList />} />
            <Route path="support-tickets" element={<SupportTicketList />} />
            <Route path="create-ticket" element={<ServiceCreateTicketForm />} />
          </Route>
        </Route>


        {/* --- LUỒNG CỦA ACCOUNTING STAFF --- */}
        <Route element={<PrivateRoute allowedRoles={['ACCOUNTING_STAFF']} />}>
          <Route path="/accounting/*" element={<LayoutAccounting />}>
            {/* Trang index của /accounting */}
            <Route index element={<UnbilledFeesList />} />
            <Route path="unbilled-fees" element={<UnbilledFeesList />} />
            {/* --- THÊM 2 ROUTE MỚI --- */}
            {/* (Req 1) Trang Chi tiết Phí */}
            <Route path="unbilled-fees/:calibrationId" element={<UnbilledFeeDetail />} />
            {/* Thêm: Trang Tạo Hóa đơn */}
            <Route path="create-invoice/:calibrationId" element={<CreateServiceInvoice />} />
            {/* (Req 3) Trang Danh sách Hóa đơn */}
            <Route path="invoices" element={<InvoiceList />} />
            {/* (Req 1) Trang Chi tiết Hóa đơn (Read-only) */}
            <Route path="invoices/:invoiceId" element={<InvoiceDetail />} />
            {/* --- HẾT --- */}
            {/* (Thêm các trang khác của Kế toán ở đây) */}
            <Route path="reading-routes" element={<ReadingRoutesList />} />
            <Route path="contracts/eligible-installation" element={<EligibleInstallationContracts />} />
            <Route path="contracts/:contractId/installation-invoice" element={<CreateInstallationInvoice />} />
            <Route path="*" element={<div>Lỗi 404: Trang không tồn tại</div>} />
            {/* ROUTE CHO HÓA ĐƠN TIỀN NƯỚC */}
            <Route path="billing/pending-readings" element={<PendingReadingsList />} />
          </Route>
        </Route>
        {/* --- HẾT --- */}

        {/* (Thêm luồng ADMIN ở đây nếu cần) */}
        <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/*" element={<LayoutAdmin />}>

            {/* (Thêm các trang khác của Admin ở đây) */}
            <Route path="*" element={<div>Lỗi 404: Trang không tồn tại</div>} />
          </Route>
        </Route>
        {/* --- HẾT --- */}

      </Routes>
    </BrowserRouter>
  );
}

export default () => (
  <ServiceNotificationProvider>
    <ServiceNotificationListener />
    <ServiceNotificationToast />
    <App />
  </ServiceNotificationProvider>
);