import React from 'react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      {/* Hero Banner */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>GIỚI THIỆU TỔNG QUAN</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="about-content">
        <div className="about-container">
          {/* Company Title and Logo */}
          <div className="about-header">
            <h2>CÔNG TY CỔ PHẦN CẤP NƯỚC PHÚ THỌ</h2>
            <p className="company-subtitle">Phu Tho Water Supply and Sewerage Joint Stock Company</p>
            
            {/* Logo and Contact Info */}
            <div className="about-logo-contact">
              <div className="about-logo">
                <img 
                  src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png"
                  alt="Công ty Cổ phần Cấp nước Phú Thọ"
                />
              </div>
              
              <div className="about-contact-info">
                <div className="contact-item">
                  <h4>ĐIỆN THOẠI</h4>
                  <p>0210 6251998 / 0210 3992369</p>
                </div>
                <div className="contact-item">
                  <h4>ĐỊA CHỈ</h4>
                  <p>Số 8, Trần Phú, Phường Tân Dân,<br /> TP Việt Trì, Phú Thọ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Google Map */}
          <div className="about-map">
            <div className="map-contact">
              <div className="map-column">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1288.9835019072348!2d105.40249138964111!3d21.323954268710352!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31348d544214c7e9%3A0x8251a3ced9755dff!2zQ8O0bmcgVHkgQ3AgQ-G6pXAgTsaw4bubYyBQaMO6IFRo4buN!5e0!3m2!1svi!2s!4v1584880715987!5m2!1svi!2s"
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: '12px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Công ty Cổ phần Cấp nước Phú Thọ"
                />
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="about-timeline">
            <h3>QUÁ TRÌNH HÌNH THÀNH VÀ PHÁT TRIỂN</h3>
            
            <div className="timeline-items">
              <div className="timeline-item">
                <div className="timeline-date">04/07/1970</div>
                <div className="timeline-content">
                  <p>Công ty Cổ phần cấp nước Phú Thọ tiền thân là Nhà máy nước Việt Trì được thành lập theo Quyết định số: 426/QĐ-UBND ngày 04/07/1970 của UBND Tỉnh Vĩnh Phú.</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-date">04/07/1993</div>
                <div className="timeline-content">
                  <p>Ngày 04/07/1993 được UBND Tỉnh Vĩnh Phú Quyết định số: 890/QĐ-UBND đổi tên thành Công ty cấp nước Vĩnh Phú.</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-date">01/01/1997</div>
                <div className="timeline-content">
                  <p>Sau khi tái lập Tỉnh ngày 01/01/1997 đổi tên thành Công ty Cấp nước Phú Thọ.</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-date">28/12/2005</div>
                <div className="timeline-content">
                  <p>Tháng 12/2005 thực hiện chính sách đổi mới phát triển doanh nghiệp của Nhà nước, được UBND tỉnh Phú Thọ Quyết định số: 3605/QĐ-UBND ngày 28/12/2005 phê duyệt phương án chuyên đổi Công ty cấp nước Phú Thọ thành Công ty TNHH Nhà nước một thành viên cấp nước Phú Thọ.</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-date">17/11/2008</div>
                <div className="timeline-content">
                  <p>Tháng 01/2008 thực hiện chính sách cổ phần hoá của Nhà nước được UBND tỉnh Phú Thọ Quyết định số: 3315/QĐ-UBND ngày 17/11/2008 phê duyệt phương án chuyên đổi Công ty TNHH Nhà nước một thành viên cấp nước Phú Thọ thành Công ty Cổ phần cấp nước Phú Thọ.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section - REMOVED */}

        </div>
      </section>
    </div>
  );
};

export default AboutPage;
