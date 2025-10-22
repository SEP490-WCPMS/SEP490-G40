import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import CustomerProfileUpdate from "./component/Customer/CustomerProfileUpdate"; 
import LayoutTechnical from './component/Layouts/LayoutTechnical';
import TechnicalDashboard from './component/PagesTechnical/TechnicalDashboard';
import SurveyContractsList from './component/PagesTechnical/Survey/SurveyContractsList';
import SurveyForm from './component/PagesTechnical/Survey/SurveyForm';
import InstallContractsList from './component/PagesTechnical/Install/InstallContractsList';
import InstallationDetail from './component/PagesTechnical/Install/InstallationDetail';
import LayoutCashier from './component/Layouts/LayoutCashier';
import MeterScan from './component/PagesCashier/MeterScan'; // <-- Trang AI Scan của bạn
import ReadingConfirmation from './component/PagesCashier/ReadingConfirmation'; // <-- TRANG MỚI
import LayoutService from './component/Layouts/LayoutService';
import ServiceDashboardPage from './component/PageService/ServiceDashboardPage'; 
import ContractManagementPage from './component/PageService/ContractManagementPage'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* --- CÁC ROUTE CHUNG --- */}
        <Route path="/" element={<h1>Trang chủ</h1>} />
        <Route path="/profile" element={<CustomerProfileUpdate />} />

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
              <Route path="contracts" element={<ContractManagementPage />} />
          </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;