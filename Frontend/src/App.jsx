import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import { useAuth } from './hooks/use-auth';
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
import ServiceDashboardPage from './components/PagesService/ServiceDashboardPage';
import ContractRequestsPage from './components/PagesService/ContractRequestsPage';
import SurveyReviewPage from './components/PagesService/SurveyReviewPage';
import ApprovedContractsPage from './components/PagesService/ApprovedContractsPage';
import ActiveContractsPage from './components/PagesService/ActiveContractsPage';
import ContractTransferList from './components/PagesService/ContractManagement/Requests/ContractTransferList';
import ContractAnnulList from './components/PagesService/ContractManagement/Requests/ContractAnnulList';
import ContractRequestForm from "./components/Customer/ContractRequestForm";
import ContractRequestStatusList from "./components/Customer/ContractRequestStatusList";
import ContractList from './components/Customer/ContractList';
import ContractDetail from './components/Customer/ContractDetail';
import StaffProfileView from './components/Staff/StaffProfileView';
import Register from './components/Authentication/Register';
import PrivateRoute from './PrivateRoute';
import CustomerChangePassword from './components/Customer/CustomerChangePassword';


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
      <Routes>

        {/* === PUBLIC ROUTES (Đăng nhập, Đăng ký) === */}
        {/* Các trang này không cần layout hoặc layout riêng */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><AboutPage /></PublicLayout>} />
        <Route path="/" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><HomePage isAuthenticated={isAuthenticated} user={user} /></PublicLayout>} />


        {/* === CUSTOMER ROUTES (Cần đăng nhập, vai trò CUSTOMER) === */}
        <Route element={<PrivateRoute allowedRoles={['CUSTOMER']} />}>
          <Route path="/profile" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><CustomerProfileUpdate /></PublicLayout>} />
          <Route path="/contract-request" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><ContractRequestForm /></PublicLayout>} />
          <Route path="/my-requests" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><ContractRequestStatusList /></PublicLayout>} />
          <Route path="/contract-list" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><ContractList /></PublicLayout>} />
          <Route path="/contract-detail" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><ContractDetail /></PublicLayout>} />
          <Route path="/change-password" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><CustomerChangePassword /></PublicLayout>} />

        </Route>


        {/* === STAFF COMMON ROUTES (Cần đăng nhập, nhiều vai trò) === */}
        <Route element={<PrivateRoute allowedRoles={['TECHNICAL_STAFF', 'CASHIER_STAFF', 'SERVICE_STAFF', 'ADMIN']} />}>
          <Route path="/staff/profile" element={<PublicLayout isAuthenticated={isAuthenticated} user={user}><StaffProfileView /></PublicLayout>} />
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
            <Route path="survey-reviews" element={<SurveyReviewPage />} />
            <Route path="approved-contracts" element={<ApprovedContractsPage />} />
            <Route path="active-contracts" element={<ActiveContractsPage />} />
          </Route>
        </Route>

        {/* (Thêm luồng ADMIN ở đây nếu cần) */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;