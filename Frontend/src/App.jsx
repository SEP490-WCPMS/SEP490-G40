import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from './components/common/ScrollToTop';
import './App.css';
import { useAuth } from './hooks/use-auth';
import Login from './components/Authentication/Login';
import ForgotPassword from './components/Authentication/ForgotPassword';
import ResetPassword from './components/Authentication/ResetPassword';
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
import UnbilledFeesList from './components/PagesAccounting/UnbilledFeesList';
import InvoiceList from './components/PagesAccounting/InvoiceList'; // <-- THÊM
import UnbilledFeeDetail from './components/PagesAccounting/UnbilledFeeDetail'; // <-- THÊM
import CreateServiceInvoice from './components/PagesAccounting/CreateServiceInvoice'; // <-- THÊM IMPORT MỚI
import InvoiceDetail from './components/PagesAccounting/InvoiceDetail';
import MyInvoiceListPage from "./components/Customer/MyInvoice/MyInvoiceListPage";
import MyInvoiceDetail from "./components/Customer/MyInvoice/MyInvoiceDetail";
import CreateInstallationInvoice from "./components/PagesAccounting/CreateInstallationInvoice"; // Sửa đường dẫn
import EligibleInstallationContracts from "./components/PagesAccounting/EligibleInstallationContracts.jsx"; // Sửa đường dẫn
import GenerateWaterInvoice from './components/PagesAccounting/GenerateWaterInvoice'; // Sửa đường dẫn
import RouteInvoiceList from './components/PagesCashier/RouteInvoiceList'; 
import RouteInvoiceDetail from './components/PagesCashier/RouteInvoiceDetail'; 
import AccountingDashboard from './components/PagesAccounting/AccountingDashboard';
import RouteManagementPage from './components/PagesAccounting/RouteManagementPage';
import CashPaymentForm from './components/PagesCashier/CashPaymentForm';
import CashierRouteList from './components/PagesCashier/CashierRouteList';
import CashierContractDetail from './components/PagesCashier/CashierContractDetail';
import CashierDashboard from './components/PagesCashier/CashierDashboard';
import LayoutAdmin from './components/Layouts/LayoutAdmin';
import AdminDashboard from './components/PagesAdmin/AdminDashboard';
import ContactPage from './components/Pages/ContactPage';
import StaffAccountList from './components/Admin/StaffAccountList';
import WaterMetersPage from './components/Admin/WaterMetersPage';
import WaterPriceTypesPage from './components/Admin/WaterPriceTypesPage';
import WaterPricesPage from './components/Admin/WaterPricesPage';
import { VerifyAccountPage } from './components/Authentication/VerifyAccount';

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
        <Route path="/verify" element={<VerifyAccountPage />} />
        <Route path="/forgot" element={
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header isAuthenticated={isAuthenticated} user={user} />
            <main style={{ flex: 1 }}>
              <ForgotPassword />
            </main>
            <Footer />
          </div>
        } />

        <Route path="/reset-password" element={
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header isAuthenticated={isAuthenticated} user={user} />
            <main style={{ flex: 1 }}>
              <ResetPassword />
            </main>
            <Footer />
          </div>
        } />
        {/* --- KẾT THÚC ĐOẠN THÊM --- */}


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
          <Route path="/cashier/*" element={<LayoutCashier />}>

            {/* --- SỬA LẠI ROUTE --- */}
            <Route index element={<CashierDashboard />} /> {/* Trang index mới */}
            <Route path="dashboard" element={<CashierDashboard />} /> {/* Thêm /dashboard */}
            {/* --- */}
            <Route path="scan" element={<MeterScan />} />
            <Route path="submit-reading" element={<ReadingConfirmation />} />
            <Route path="payment-counter" element={<CashPaymentForm />} /> {/* Thu tại quầy */}
            {/* Trang xem HÓA ĐƠN theo tuyến (để thu tiền) */}
            <Route path="my-route" element={<RouteInvoiceList />} /> {/* Mới: Thu tại nhà (List) */}
            <Route path="invoice-detail/:invoiceId" element={<RouteInvoiceDetail />} /> {/* Mới: Thu tại nhà (Detail) */}
            {/* Trang xem HỢP ĐỒNG theo tuyến (để ghi số) */}
            <Route path="route-list" element={<CashierRouteList />} />
            <Route path="route-contract/:contractId" element={<CashierContractDetail />} />

            <Route path="*" element={<div>Lỗi 404: Trang không tồn tại</div>} />
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
            <Route index element={<AccountingDashboard />} /> {/* Trang index mới */}
            <Route path="dashboard" element={<AccountingDashboard />} /> {/* Thêm /dashboard */}
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
            <Route path="route-management" element={<RouteManagementPage />} />
            {/* (Thêm các trang khác của Kế toán ở đây) */}
            <Route path="reading-routes" element={<ReadingRoutesList />} />
            <Route path="contracts/eligible-installation" element={<EligibleInstallationContracts />} />
            <Route path="contracts/:contractId/installation-invoice" element={<CreateInstallationInvoice />} />
            <Route path="*" element={<div>Lỗi 404: Trang không tồn tại</div>} />
            {/* ROUTE CHO HÓA ĐƠN TIỀN NƯỚC */}
            <Route path="billing/pending-readings" element={<GenerateWaterInvoice />} />
          </Route>
        </Route>
        {/* --- HẾT --- */}

        {/* (Thêm luồng ADMIN ở đây nếu cần) */}
        <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/*" element={<LayoutAdmin />}>
            {/* Admin index/dashboard */}
            <Route index element={<AdminDashboard />} />
            {/* (Thêm các trang khác của Admin ở đây) */}
            <Route path="users" element={<StaffAccountList />} />
            <Route path="water-meters" element={<WaterMetersPage />} />
            <Route path="water-price-types" element={<WaterPriceTypesPage />} />
            <Route path="water-prices" element={<WaterPricesPage />} />
            <Route path="*" element={<div>Lỗi 404: Trang không tồn tại</div>} />
          </Route>
        </Route>
        {/* --- HẾT --- */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;