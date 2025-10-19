import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import MeterScan from "./component/MeterScan"; 
import CustomerProfileUpdate from "./component/Customer/CustomerProfileUpdate"; 
import LayoutTechnical from './component/Layouts/LayoutTechnical';
import TechnicalDashboard from './component/PagesTechnical/TechnicalDashboard';
import SurveyContractsList from './component/PagesTechnical/Survey/SurveyContractsList';
import SurveyForm from './component/PagesTechnical/Survey/SurveyForm';
import InstallContractsList from './component/PagesTechnical/Install/InstallContractsList';
import InstallationDetail from './component/PagesTechnical/Install/InstallationDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* --- CÁC ROUTE CHUNG --- */}
        <Route path="/" element={<h1>Trang chủ</h1>} />
        <Route path="/meter-scan" element={<MeterScan />} />
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

      </Routes>
    </BrowserRouter>
  );
}

export default App;