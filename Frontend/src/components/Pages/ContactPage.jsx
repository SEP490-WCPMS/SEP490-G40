// File: src/components/Pages/ContactPage.jsx

import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react'; // Import icon
import './ContactPage.css'; // IMPORT FILE CSS 

const ContactPage = () => {

  return (
    <div className="contact-container"> 
      <h2 className="contact-title">Thông tin liên hệ</h2>
      
      <p className="contact-paragraph">
        Quý khách hàng có nhu cầu, thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi qua các kênh dưới đây:
      </p>

      <h3 className="contact-section-title">Công ty Cổ phần Cấp nước Phú Thọ</h3>
      
      {/* Mục Địa chỉ */}
      <div className="contact-item">
        <div className="contact-icon-wrapper"><MapPin size={20} /></div>
        <div>
          <strong className="contact-label">Địa chỉ</strong>
          <span>Số 8 - Đường Trần Phú - Phường Việt Trì - Tỉnh Phú Thọ</span>
        </div>
      </div>
      
      {/* Mục Điện thoại */}
      <div className="contact-item">
        <div className="contact-icon-wrapper"><Phone size={20} /></div>
        <div>
          <strong className="contact-label">Điện Thoại</strong>
          <span>02103 846 531 hoặc 02106251998</span>
        </div>
      </div>
      
      {/* Mục Email */}
      <div className="contact-item">
        <div className="contact-icon-wrapper"><Mail size={20} /></div>
        <div>
          <strong className="contact-label">Email</strong>
          <a 
            href="mailto:congtycophancapnuocphutho@gmail.com" 
            className="contact-email-link" 
          >
            congtycophancapnuocphutho@gmail.com
          </a>
        </div>
      </div>

      <h3 className="contact-section-title">Giờ làm việc</h3>
      
      {/* Mục Giờ làm việc */}
      <div className="contact-item">
        <div className="contact-icon-wrapper"><Clock size={20} /></div>
        <div>
          <strong className="contact-label">Thứ 2 - Thứ 7</strong>
          <span>08:00 - 17:00</span>
        </div>
      </div>

    </div>
  );
};

export default ContactPage;