import React, { useEffect, useState } from "react";
import axios from "axios";
import './CustomerProfileUpdate.css';
import { useNavigate } from "react-router-dom";

const CustomerProfileUpdate = () => {
  // State quản lý thông tin người dùng
  const [user, setUser] = useState(null);

  // State tiện ích
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // useEffect: Chạy khi component được tải lần đầu để lấy thông tin người dùng
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (!currentUser) {
      navigate("/login");
    } else {
      // Điền thông tin vào state 'user' từ localStorage
      setUser({
        accountId: currentUser.accountId,
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        street: currentUser.street || "",
        district: currentUser.district || "",
        province: currentUser.province || "",
      });
    }
  }, [navigate]);

  // Hàm xử lý khi người dùng thay đổi giá trị trong các ô input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  // Hàm xử lý khi người dùng nhấn nút "Lưu thay đổi"
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra các trường thông tin không được để trống
    if (!user.fullName || !user.email || !user.phone || !user.address || !user.street || !user.district || !user.province) {
      setMessage("❌ Vui lòng điền đầy đủ tất cả các trường thông tin.");
      return;
    }

    try {
      // Dữ liệu gửi đi giờ đây chỉ là thông tin trong state 'user'
      const updatedData = { ...user };

      // Gọi API để cập nhật thông tin
      const res = await axios.put(`http://localhost:8080/api/profile/update/${user.accountId}`, updatedData);

      setMessage("✅ Cập nhật thông tin thành công!");

      // Cập nhật lại thông tin trong localStorage với dữ liệu mới nhất từ server
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      setMessage("❌ Cập nhật thất bại. Vui lòng thử lại.");
      console.error(err);
    }
  };

  // Nếu chưa có dữ liệu user, không render gì cả để tránh lỗi
  if (!user) {
    return null; // Hoặc hiển thị một component loading
  }

  // Giao diện của component
  return (
    <CartLayout>
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
                <div className="col-12"><input type="text" className="form-control" name="address" value={user.address} onChange={handleChange} placeholder="Số nhà" required /></div>
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
    </CartLayout>
  );
};

export default CustomerProfileUpdate;