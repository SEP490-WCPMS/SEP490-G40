import React from 'react';
import { Outlet, Link } from 'react-router-dom';

function LayoutTechnical() {
  return (
    <div className="app-container">
      <nav className="navbar">
        {/* Link này đúng, trỏ về trang index của /technical */}
        <Link to="/technical" className="nav-logo">WCPMS (Technical)</Link>
        <div className="nav-links">
          
          {/* SỬA LẠI ĐÂY: Bỏ dấu "/" */}
          <Link to="survey" className="nav-link">Khảo sát & Báo giá</Link>
          <Link to="install" className="nav-link">Lắp đặt</Link>

          {/* HOẶC dùng đường dẫn tuyệt đối đầy đủ (cũng đúng)
          <Link to="/technical/survey" className="nav-link">Khảo sát & Báo giá</Link>
          <Link to="/technical/install" className="nav-link">Lắp đặt</Link>
          */}

        </div>
        <div className="nav-user">
          <span>Xin chào, [Tech Staff Name]</span>
        </div>
      </nav>
      <main className="main-content">
        <Outlet /> {/* Các trang con sẽ hiển thị ở đây */}
      </main>
    </div>
  );
}

export default LayoutTechnical;