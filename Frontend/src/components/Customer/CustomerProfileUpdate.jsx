import React, { useEffect, useState } from "react";
import axios from "axios"; // Dùng axios mặc định
import './CustomerProfileUpdate.css';
import { useNavigate } from "react-router-dom";

const CustomerProfileUpdate = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user"));

    // --- SỬA 1: Đọc token từ đúng key ---
    const token = localStorage.getItem("token");

    // --- SỬA 2: Kiểm tra cả user.id và token ---
    if (!currentUser || !currentUser.id || !token) {
      navigate("/login");
      return;
    }

    const fetchProfileData = async () => {
      try {
        // --- SỬA 3: Thêm Header Authorization vào request ---
        const response = await axios.get(`http://localhost:8080/api/profile/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setUser(response.data);
      } catch (error) {
        console.error("Lỗi: Không thể tải hồ sơ khách hàng:", error);
        setMessage("❌ Không thể tải hồ sơ.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user.fullName || !user.email || !user.phone || !user.address || !user.street || !user.district || !user.province) {
      setMessage("❌ Vui lòng điền đầy đủ tất cả các trường thông tin.");
      return;
    }

    // Lấy lại token từ localStorage
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("❌ Lỗi xác thực. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const updatedData = { ...user };

      // --- SỬA 4: Thêm Header Authorization vào request PUT ---
      // Lưu ý: Dùng user.id (vì DTO của back-end đã đổi)
      const res = await axios.put(`http://localhost:8080/api/profile/update/${user.id}`, updatedData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage("✅ Cập nhật thông tin thành công!");

      // Cập nhật lại localStorage với thông tin MỚI NHẤT
      const currentUserData = JSON.parse(localStorage.getItem("user"));
      // Gộp thông tin user cũ (id, roleName) với thông tin mới (fullName, address...)
      const updatedUser = {
        ...currentUserData,
        ...res.data.user
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

    } catch (err) {
      setMessage("❌ Cập nhật thất bại. Vui lòng thử lại.");
      console.error(err);
    }
  };

  // Hiển thị loading trong khi chờ fetch
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải hồ sơ...</div>;
  }

  // Nếu fetch xong mà user vẫn null (ví dụ API lỗi)
  if (!user) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{message || "Không thể tải hồ sơ."}</div>;
  }

  // Giao diện của component
  return (
    <section className="profile-update-section">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-icon">👤</div>
          <div className="profile-header-content">
            <h1>Chỉnh sửa hồ sơ cá nhân</h1>
            <p>Cập nhật thông tin tài khoản của bạn</p>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`profile-alert ${message.includes("❌") ? 'alert-error' : 'alert-success'}`}>
            <span className="alert-icon">{message.includes("❌") ? "⚠️" : "✅"}</span>
            <span>{message.replace(/^[❌✅]\s*/, '')}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="profile-form">
          {/* Section 1: Thông tin cá nhân */}
          <div className="form-section">
            <div className="section-title">
              <span className="section-icon">👤</span>
              <h3>Thông tin cá nhân</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName">Họ và tên</label>
                <input
                  type="text"
                  id="fullName"
                  className="form-input"
                  name="fullName"
                  value={user.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên đầy đủ"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  name="email"
                  value={user.email}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  type="text"
                  id="phone"
                  className="form-input"
                  name="phone"
                  value={user.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Địa chỉ */}
          <div className="form-section">
            <div className="section-title">
              <span className="section-icon">📍</span>
              <h3>Địa chỉ</h3>
            </div>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="address">Địa chỉ</label>
                <input
                  type="text"
                  id="address"
                  className="form-input"
                  name="address"
                  value={user.address}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ đầy đủ"
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="street">Đường/Phố</label>
                <input
                  type="text"
                  id="street"
                  className="form-input"
                  name="street"
                  value={user.street}
                  onChange={handleChange}
                  placeholder="Nhập tên đường/phố"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="district">Quận/Huyện</label>
                <input
                  type="text"
                  id="district"
                  className="form-input"
                  name="district"
                  value={user.district}
                  onChange={handleChange}
                  placeholder="Nhập quận/huyện"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="province">Tỉnh/Thành phố</label>
                <input
                  type="text"
                  id="province"
                  className="form-input"
                  name="province"
                  value={user.province}
                  onChange={handleChange}
                  placeholder="Nhập tỉnh/thành phố"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <span>💾</span>
              Lưu thay đổi
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              <span>↩️</span>
              Quay lại
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CustomerProfileUpdate;