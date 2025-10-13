import { BrowserRouter, Routes, Route } from "react-router-dom";
import MeterScan from "./component/MeterScan";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Trang chủ</h1>} />
        <Route path="/meter-scan" element={<MeterScan />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
