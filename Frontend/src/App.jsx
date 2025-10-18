import { BrowserRouter, Routes, Route } from "react-router-dom";
import MeterScan from "./component/MeterScan";
import CustomerProfileUpdate from "./component/Customer/CustomerProfileUpdate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Trang chủ</h1>} />
        <Route path="/meter-scan" element={<MeterScan />} />
        <Route path="/profile" element={<CustomerProfileUpdate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
