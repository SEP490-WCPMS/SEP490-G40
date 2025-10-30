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
    // <CartLayout>
    <section className="user-dashboard-section section-b-space">
      <div className="container d-flex justify-content-center">
        <div className="profile-form-wrapper col-12 col-md-10 col-lg-8 col-xl-6">
          <div className="dashboard-right-sidebar">
            <div className="title text-center">
              <h2>Chỉnh sửa hồ sơ</h2>
            </div>

            {message && <div className={`alert ${message.includes("❌") ? 'alert-danger' : 'alert-success'} mt-3`}>{message}</div>}

            <form onSubmit={handleSubmit} className="row g-4 mt-2">
              {/* --- THÔNG TIN CÁ NHÂN --- */}
              <div className="col-12"><input type="text" className="form-control" name="fullName" value={user.fullName} onChange={handleChange} placeholder="Họ và tên" required /></div>
              <div className="col-12"><input type="email" className="form-control" name="email" value={user.email} onChange={handleChange} placeholder="Email" required /></div>
              <div className="col-12"><input type="text" className="form-control" name="phone" value={user.phone} onChange={handleChange} placeholder="Số điện thoại" required /></div>

              {/* --- ĐỊA CHỈ --- */}
              <div className="col-12"><input type="text" className="form-control" name="address" value={user.address} onChange={handleChange} placeholder="Địa chỉ" required /></div>
              <div className="col-12"><input type="text" className="form-control" name="street" value={user.street} onChange={handleChange} placeholder="Đường/Phố" required /></div>
              <div className="col-md-6"><input type="text" className="form-control" name="district" value={user.district} onChange={handleChange} placeholder="Quận/Huyện" required /></div>
              <div className="col-md-6"><input type="text" className="form-control" name="province" value={user.province} onChange={handleChange} placeholder="Tỉnh/Thành phố" required /></div>

              {/* --- NÚT SUBMIT --- */}
              <div className="col-12 text-center mt-4">
                <button type="submit" className="btn theme-bg-color btn-md fw-bold text-light">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
    // </CartLayout>
  );
};

export default CustomerProfileUpdate;