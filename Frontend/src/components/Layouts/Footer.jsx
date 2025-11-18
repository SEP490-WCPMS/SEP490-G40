import React from 'react';
import { MapPin, Phone, Mail, Facebook, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section footer-about">
          <div className="footer-about-logo">
            <img 
              src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png"
              alt="Công ty Cổ phần Cấp nước Phú Thọ"
            />
          </div>
          <h3 className="footer-title">GIỚI THIỆU</h3>
          <p className="footer-about-text">Công ty Cổ phần cấp nước Phú Thọ tiền thân là Nhà máy nước Việt Trì được thành lập theo Quyết định số: 426/QĐ-UBND ngày 04/07/1970 của UBND Tỉnh Vĩnh Phú.</p>
          <Link to="/about" className="btn-detail">
            Chi tiết
          </Link>
        </div>

        {/* Contact Section */}
        <div className="footer-section">
          <h3 className="footer-title">LIÊN HỆ</h3>
          <div className="footer-content">
            <div className="footer-item">
              <MapPin size={16} />
              <a 
                href="https://www.google.com/maps/place/C%C3%B4ng+Ty+Cp+C%E1%BA%A5p+N%C6%B0%E1%BB%9Bc+Ph%C3%BA+Th%E1%BB%8D/@21.323954,105.402491,17z/data=!4m6!3m5!1s0x31348d544214c7e9:0x8251a3ced9755dff!8m2!3d21.32385!4d105.4032217!16s%2Fg%2F1hc3x7_pz?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                Số 8, Trần Phú, Phường Tân Dân, TP Việt Trì, Phú Thọ
              </a>
            </div>
            <div className="footer-item">
              <Phone size={16} />
              <span>0210 6251998 / 0210 3992369</span>
            </div>
            <div className="footer-item">
              <Mail size={16} />
              <a href="mailto:contact@capnuocphutho.vn" className="footer-link">
                contact@capnuocphutho.vn
              </a>
            </div>
            <div className="footer-item">
              <Zap size={16} />
              <span>Thứ 2 - Thứ 7: 08:00 - 17:00</span>
            </div>
          </div>
        </div>

        {/* Guide Section */}
        <div className="footer-section">
          <h3 className="footer-title">HƯỚNG DẪN</h3>
          <ul className="footer-links">
            <li><a href="#guide-register">Đăng ký cấp nước</a></li>
            <li><a href="#guide-transfer">Sang tên hợp đồng</a></li>
            <li><a href="#guide-payment">Thanh toán hóa đơn</a></li>
            <li><a href="#guide-suspend">Tạm ngưng cấp nước</a></li>
            <li><a href="#guide-invoice">Tra cứu hóa đơn</a></li>
          </ul>
        </div>

        {/* Information Section */}
        <div className="footer-section">
          <h3 className="footer-title">THÔNG TIN</h3>
          <ul className="footer-links">
            <li><a href="/about">Giới thiệu công ty</a></li>
            <li><a href="#news">Tin tức & thông báo</a></li>
            <li><a href="#policy">Chính sách bảo mật</a></li>
            <li><a href="#quality">Chất lượng nước</a></li>
            <li><a href="#faq">Câu hỏi thường gặp</a></li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="copyright">
            © 2025 Công ty Cổ phần Cấp nước Phú Thọ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
