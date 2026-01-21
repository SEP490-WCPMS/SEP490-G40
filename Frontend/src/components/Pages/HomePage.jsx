import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Zap, Building2, CreditCard, Users, Briefcase, Smartphone, AlertTriangle } from 'lucide-react';
import './HomePage.css';

const HomePage = ({ isAuthenticated, user }) => {
  const navigate = useNavigate();
  const [waterPrices, setWaterPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  // --- THÊM: State quản lý modal bắt buộc cập nhật ---
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  // --- THÊM: Effect kiểm tra CCCD khi user thay đổi ---
  useEffect(() => {
    // Chỉ kiểm tra nếu đã đăng nhập và là khách hàng
    if (isAuthenticated && user && user.roleName === 'CUSTOMER') {
      // Kiểm tra xem identityNumber có tồn tại hay không
      // Lưu ý: Đảm bảo object 'user' trong localStorage hoặc props có trường identityNumber
      if (!user.identityNumber || user.identityNumber.trim() === '') {
        setShowIdentityModal(true);
      }
    }
  }, [isAuthenticated, user]);

  // --- THÊM: Xử lý khi bấm "Đồng ý" ---
  const handleAgreeUpdate = () => {
    navigate('/profile'); // Chuyển sang trang update profile
  };

  // --- THÊM: Xử lý khi bấm "Không đồng ý" (Đăng xuất) ---
  const handleDisagree = () => {
    // Xóa thông tin đăng nhập
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Reload lại trang để về trạng thái chưa đăng nhập
    window.location.reload();
  };

  useEffect(() => {
    const fetchWaterPrices = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/water-prices/active-details');
        if (response.ok) {
          const data = await response.json();
          setWaterPrices(data);
        }
      } catch (error) {
        console.error('Error fetching water prices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWaterPrices();
  }, []);

  // Payment methods
  const paymentMethods = [
    {
      id: 1,
      title: 'TẠI ĐIỂM THU',
      description: 'Thanh toán tại UBND xã, nhà văn hóa khu dân cư',
      icon: '🏘️'
    },
    {
      id: 2,
      title: 'THANH TOÁN TRỰC TUYẾN',
      description: 'Chuyển khoản hoặc đăng ký thanh toán tự động với ngân hàng',
      icon: '💳'
    },
    {
      id: 3,
      title: 'TẠI CÔNG TY',
      description: 'Thanh toán tại công ty hoặc các điểm thu hộ chính thức',
      icon: '🏢'
    }
  ];

  // Banks - with real bank logos
  const banks = [
    {
      name: 'VietinBank',
      logo: 'https://capnuocphutho.vn/wp-content/uploads/2024/05/0e3349ab85ae5ebf604df3cb380f9c8f-150x150.jpg',
      isImage: true
    },
    {
      name: 'BIDV',
      logo: 'https://capnuocphutho.vn/wp-content/uploads/2024/05/logo-bidv-20220426071253-150x150.jpg',
      isImage: true
    },
    {
      name: 'Agribank',
      logo: 'https://capnuocphutho.vn/wp-content/uploads/2021/04/AGRIBANK-150x150.png',
      isImage: true
    },
    {
      name: 'Vietcombank',
      logo: 'https://capnuocphutho.vn/wp-content/uploads/2024/05/logo_VCB_828891-150x150.jpg',
      isImage: true
    },
    {
      name: 'MB Bank',
      logo: 'https://capnuocphutho.vn/wp-content/uploads/2024/05/tai-xuong-150x150.png',
      isImage: true
    },
    {
      name: 'IenVietBank',
      logo: 'https://capnuocphutho.vn/wp-content/uploads/2024/05/lvp20210802084406.1116220-150x150.png',
      isImage: true
    },
    {
      name: 'Payoo',
      logo: 'https://capnuocphutho.vn/wp-content/uploads/2024/05/logo-sacombank-150x150.jpg',
      isImage: true
    }
  ];

  return (
    <div className="homepage">
      {/* --- THÊM: MODAL BẮT BUỘC CẬP NHẬT CCCD --- */}
      {showIdentityModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '12px',
            maxWidth: '500px', width: '90%', textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ backgroundColor: '#fff7ed', padding: '12px', borderRadius: '50%' }}>
                <AlertTriangle size={48} color="#c2410c" />
              </div>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#1f2937' }}>
              Yêu cầu cập nhật thông tin
            </h2>
            <p style={{ color: '#4b5563', marginBottom: '25px', lineHeight: '1.6' }}>
              Tài khoản của bạn chưa cập nhật <strong>Căn cước công dân/Mã số thuế</strong>.
              <br />
              Theo quy định, bạn bắt buộc phải cập nhật thông tin này để tiếp tục sử dụng các dịch vụ của hệ thống.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={handleDisagree}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db',
                  backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: '600'
                }}
              >
                Không đồng ý
              </button>
              <button
                onClick={handleAgreeUpdate}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#0A77E2', color: 'white', cursor: 'pointer', fontWeight: '600'
                }}
              >
                Đồng ý cập nhật ngay
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Company Banner Section */}
      <section className="company-banner-section">
        <img
          src="https://capnuocphutho.vn/wp-content/uploads/2024/05/cropped-cong_ty_co_phan_cap_nuoc_phu_tho_-_55_nam_xay_dung_hoi_nhap_va_phat_trien-1.jpg"
          alt="Công ty Cổ phần Cấp nước Phú Thọ"
          className="company-banner-image"
        />
      </section>

      {/* Water Price Section */}
      <section className="water-price-section" id="gia-nuoc">
        <h2>Bảng giá nước</h2>
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : waterPrices.length > 0 ? (
          <div className="water-price-table">
            <table>
              <thead>
                <tr>
                  <th>Loại khách hàng</th>
                  <th>Giá nước (VNĐ/m³)</th>
                  <th>Phí môi trường (VNĐ/m³)</th>
                  <th>Thuế VAT (%)</th>
                  <th>Ngày áp dụng</th>
                </tr>
              </thead>
              <tbody>
                {waterPrices.map((price, index) => (
                  <tr key={index}>
                    <td>{price.typeName}</td>
                    <td>{parseFloat(price.unitPrice).toLocaleString('vi-VN')} đ</td>
                    <td>{parseFloat(price.environmentFee).toLocaleString('vi-VN')} đ</td>
                    <td>{price.vatRate}%</td>
                    <td>{new Date(price.effectiveDate).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">Không có dữ liệu giá nước</div>
        )}
      </section>

      {/* Payment Methods Section */}
      <section className="payment-methods-section">
        <h2>Các hình thức thanh toán tiền nước của công ty</h2>
        <div className="payment-methods-grid">
          {paymentMethods.map((method) => (
            <div key={method.id} className="payment-method-card">
              <div className="payment-icon">{method.icon}</div>
              <h3>{method.title}</h3>
              <p>{method.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section with Background */}
      <section className="stats-section">
        <div className="stats-overlay"></div>
        <div className="stats-content">
          <div className="stat-item">
            <Users size={40} className="stat-icon" />
            <div className="stat-number">180,000+</div>
            <div className="stat-label">Khách hàng</div>
            <div className="stat-description">Công ty đang cung cấp nước sạch cho hơn 180.000 khách hàng trên toàn tỉnh</div>
          </div>
          <div className="stat-item">
            <Building2 size={40} className="stat-icon" />
            <div className="stat-number">19</div>
            <div className="stat-label">Xí nghiệp, Xưởng SX, Tổ</div>
            <div className="stat-description">19 xí nghiệp, xưởng sản xuất, tổ trực thuộc</div>
          </div>
          <div className="stat-item">
            <Users size={40} className="stat-icon" />
            <div className="stat-number">400+</div>
            <div className="stat-label">Cán bộ nhân viên</div>
            <div className="stat-description">Tổng số lao động trong toàn Công ty đến thời điểm tháng 12/2011 là: 400 người</div>
          </div>
          <div className="stat-item">
            <Briefcase size={40} className="stat-icon" />
            <div className="stat-number">10</div>
            <div className="stat-label">Phòng chức năng</div>
            <div className="stat-description">Công ty có 10 phòng ban tại văn phòng công ty</div>
          </div>
        </div>
      </section>

      {/* Banks Section */}
      <section className="banks-section">
        <h2>Các ngân hàng liên kết thanh toán</h2>
        <div className="banks-grid">
          {banks.map((bank, index) => (
            <div key={index} className="bank-item">
              {bank.isImage ? (
                <img
                  src={bank.logo}
                  alt={bank.name}
                  className="bank-logo-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="bank-logo">{bank.logo}</div>
              )}
              <p className="bank-name">{bank.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
