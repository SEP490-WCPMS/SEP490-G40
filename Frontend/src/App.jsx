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
import ContractRequestForm from "./components/Customer/ContractRequestForm";
import ContractRequestStatusList from "./components/Customer/ContractRequestStatusList";
import StaffProfileView from './components/Staff/StaffProfileView';
import Register from './components/Authentication/Register';


function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* === PUBLIC ROUTES - với Header + Footer === */}
        <Route path="/" element={
          <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <Header isAuthenticated={isAuthenticated} user={user} />
            <main style={{ flex: 1 }}>
              <HomePage isAuthenticated={isAuthenticated} user={user} />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/login" element={
          <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <Header isAuthenticated={isAuthenticated} user={user} />
            <main style={{ flex: 1 }}>
              <Login />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/register" element={
          <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <Header isAuthenticated={isAuthenticated} user={user} />
            <main style={{ flex: 1 }}>
              <Register />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/about" element={
          <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <Header isAuthenticated={isAuthenticated} user={user} />
            <main style={{ flex: 1 }}>
              <AboutPage />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/profile" element={
          <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <Header isAuthenticated={isAuthenticated} user={user} />
            <main style={{ flex: 1 }}>
              <CustomerProfileUpdate />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/contract-request" element={
          <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <Header isAuthenticated={isAuthenticated} user={user} />
            <main style={{ flex: 1 }}>
              <ContractRequestForm />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/my-requests" element={
          <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <Header isAuthenticated={isAuthenticated} user={user} />
            <main style={{ flex: 1 }}>
              <ContractRequestStatusList />
            </main>
            <Footer />
          </div>
        } />
        
        <Route path="/staff/profile" element={
          <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <Header isAuthenticated={isAuthenticated} user={user} />
            <main style={{ flex: 1 }}>
              <StaffProfileView />
            </main>
            <Footer />
          </div>
        } />

        {/* === STAFF ROUTES - không có Header/Footer === */}
        {/* --- LUỒNG CỦA TECHNICAL STAFF --- */}
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
          <Route path="active-contracts" element={<ActiveContractsPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;