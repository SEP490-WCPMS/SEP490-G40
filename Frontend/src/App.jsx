import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
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
import ContractRequestForm from "./components/Customer/ContractRequestForm";
import ContractRequestStatusList from "./components/Customer/ContractRequestStatusList";
import StaffProfileView from './components/Staff/StaffProfileView';
import Register from './components/Authentication/Register';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);
  return (
    <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      <BrowserRouter>
        <Header isAuthenticated={isAuthenticated} user={user} />
        <main style={{ flex: 1 }}>
          <Routes>

        {/* Trang Login */}
        <Route path="/login" element={<Login />} />
        {/* Trang Đăng ký */}
        <Route path="/register" element={<Register />} />
        {/* --- CÁC ROUTE CHUNG --- */}
        <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} user={user} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/staff/profile" element={<StaffProfileView />} />

        {/* --- LUỒNG CỦA CUSTOMER --- */}
        <Route path="/profile" element={<CustomerProfileUpdate />} />
        <Route path="/contract-request" element={<ContractRequestForm />} />
        <Route path="/my-requests" element={<ContractRequestStatusList />} />


        {/* --- LUỒNG CỦA TECHNICAL STAFF --- */}
        {/* Tất cả các trang Kỹ thuật sẽ nằm dưới /technical
          và dùng chung <LayoutTechnical />
        */}
        <Route path="/technical" element={<LayoutTechnical />}>

          {/* Trang index của /technical (tức là /technical) 
            sẽ là TechnicalDashboard 
          */}
          <Route index element={<TechnicalDashboard />} />

          {/* Luồng 1: Survey & Design
            - /technical/survey
            - /technical/survey/report/:contractId
          */}
          <Route path="survey" element={<SurveyContractsList />} />
          <Route path="survey/report/:contractId" element={<SurveyForm />} />

          {/* Luồng 2: Installation
            - /technical/install
            - /technical/install/detail/:contractId
          */}
          <Route path="install" element={<InstallContractsList />} />
          <Route path="install/detail/:contractId" element={<InstallationDetail />} />
        </Route>


        {/* --- LUỒNG CỦA TECHNICAL STAFF --- */}
        {/* Tất cả các trang Kỹ thuật sẽ nằm dưới /technical
          và dùng chung <LayoutTechnical />
        */}
        <Route path="/cashier" element={<LayoutCashier />}>
          {/* <Route index element={<CashierDashboard />} /> (Trang chủ Thu ngân nếu có) */}

          {/* LUỒNG GHI CHỈ SỐ MỚI (Từ yêu cầu của bạn) */}
          <Route path="scan" element={<MeterScan />} />
          <Route path="submit-reading" element={<ReadingConfirmation />} />

        </Route>

        {/* --- LUỒNG CỦA SERVICE STAFF --- */}
        <Route path="/service" element={<LayoutService />}>
          {/* Trang index của /service sẽ là dashboard */}
          <Route index element={<ServiceDashboardPage />} />
          {/* Hoặc dùng Navigate nếu muốn URL luôn là /service/dashboard */}
          {/* <Route index element={<Navigate to="/service/dashboard" replace />} /> */}

          {/* Các trang cụ thể */}
          <Route path="dashboard" element={<ServiceDashboardPage />} />
          <Route path="requests" element={<ContractRequestsPage />} />
          <Route path="survey-reviews" element={<SurveyReviewPage />} />
          <Route path="approved-contracts" element={<ApprovedContractsPage />} />
        </Route>

      </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;