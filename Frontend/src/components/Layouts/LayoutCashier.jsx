import React from 'react';
import { Outlet, Link } from 'react-router-dom';

function LayoutCashier() {
  return (
    <div className="app-container">
      <nav className="navbar">
        {/* Link này trỏ về trang chủ Thu Ngân */}
        <Link to="/cashier" className="nav-logo">WCPMS (Cashier)</Link>
        <div className="nav-links">
          
          {/* Link đến trang Ghi Chỉ Số (Scan) */}
          <Link to="scan" className="nav-link">Ghi Chỉ Số (Scan)</Link>
          {/* (Bạn có thể thêm các link khác cho Thu Ngân ở đây) */}

        </div>
        <div className="nav-user">
          <span>Xin chào, [Cashier Staff Name]</span>
        </div>
      </nav>
      <main className="main-content">
        <Outlet /> {/* Các trang con của Thu Ngân sẽ ở đây */}
      </main>
    </div>
  );
}

export default LayoutCashier;