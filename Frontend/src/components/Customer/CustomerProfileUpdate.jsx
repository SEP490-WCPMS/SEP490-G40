import React, { useEffect, useState } from "react";
import axios from "axios"; // Dùng axios mặc định
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
  const styles = {
    section: {
      minHeight: '100vh',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4f9 0%, #e8eef7 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    },
    container: {
      width: '100%',
      maxWidth: '900px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      animation: 'slideUp 0.5s ease-out',
    },
    header: {
      background: 'linear-gradient(135deg, #0A77E2 0%, #085fb5 100%)',
      color: '#ffffff',
      padding: '40px',
      display: 'flex',
      alignItems: 'center',
      gap: '25px',
    },
    headerIcon: {
      fontSize: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '80px',
      height: '80px',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      flexShrink: 0,
    },
    headerH1: {
      fontSize: '28px',
      fontWeight: 700,
      marginBottom: '8px',
      letterSpacing: '-0.5px',
      margin: 0,
    },
    headerP: {
      fontSize: '14px',
      opacity: 0.9,
      fontWeight: 500,
      margin: 0,
    },
    alert: (isError) => ({
      margin: '30px 40px 0 40px',
      padding: '16px 20px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontWeight: 500,
      animation: 'slideDown 0.3s ease-out',
      borderLeft: '4px solid',
      backgroundColor: isError ? '#fef2f2' : '#ecfdf5',
      color: isError ? '#7f1d1d' : '#065f46',
      borderLeftColor: isError ? '#ef4444' : '#10b981',
    }),
    form: {
      padding: '40px',
    },
    formSection: {
      marginBottom: '40px',
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '2px solid #f0f4f9',
    },
    sectionIcon: {
      fontSize: '24px',
      display: 'flex',
      alignItems: 'center',
    },
    sectionH3: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#1f2937',
      margin: 0,
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    formGroupFullWidth: {
      gridColumn: '1 / -1',
    },
    label: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#1f2937',
      marginBottom: '8px',
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '14px',
      fontFamily: 'inherit',
      color: '#1f2937',
      backgroundColor: '#f9fafb',
      transition: 'all 0.3s ease',
      cursor: 'text',
    },
    inputFocus: {
      outline: 'none',
      borderColor: '#0A77E2',
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 4px rgba(10, 119, 226, 0.1)',
      transform: 'translateY(-1px)',
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '40px',
      paddingTop: '32px',
      borderTop: '2px solid #f0f4f9',
    },
    buttonPrimary: {
      padding: '14px 32px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      letterSpacing: '0.3px',
      textTransform: 'uppercase',
      flex: 1,
      backgroundColor: '#0A77E2',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(10, 119, 226, 0.2)',
    },
    buttonSecondary: {
      padding: '14px 32px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      letterSpacing: '0.3px',
      textTransform: 'uppercase',
      flex: 1,
      backgroundColor: '#f0f4f9',
      color: '#1f2937',
    },
    '@media': {
      mobile: {
        header: {
          padding: '25px 16px',
          gap: '15px',
        },
        headerIcon: {
          width: '60px',
          height: '60px',
          fontSize: '32px',
        },
        headerH1: {
          fontSize: '20px',
        },
      },
      tablet: {
        section: {
          padding: '20px 16px',
        },
        header: {
          padding: '30px 20px',
          flexDirection: 'column',
          textAlign: 'center',
        },
        headerIcon: {
          width: '70px',
          height: '70px',
          fontSize: '40px',
        },
        headerH1: {
          fontSize: '24px',
        },
        form: {
          padding: '30px 20px',
        },
      },
    },
  };

  return (
    <section style={styles.section}>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        input::placeholder {
          color: #6b7280;
          opacity: 0.6;
        }
        input:hover:not(:focus) {
          border-color: #d1d5db;
          background-color: #fafbfc;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          section {
            padding: 20px 16px !important;
          }
        }
        @media (max-width: 480px) {
          section {
            padding: 20px 16px !important;
          }
        }
      `}</style>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>👤</div>
          <div>
            <h1 style={styles.headerH1}>Chỉnh sửa hồ sơ cá nhân</h1>
            <p style={styles.headerP}>Cập nhật thông tin tài khoản của bạn</p>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div style={styles.alert(message.includes("❌"))}>
            <span>{message.includes("❌") ? "⚠️" : "✅"}</span>
            <span>{message.replace(/^[❌✅]\s*/, '')}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Section 1: Thông tin cá nhân */}
          <div style={styles.formSection}>
            <div style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>👤</span>
              <h3 style={styles.sectionH3}>Thông tin cá nhân</h3>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label htmlFor="fullName" style={styles.label}>Họ và tên</label>
                <input
                  type="text"
                  id="fullName"
                  style={styles.input}
                  name="fullName"
                  value={user.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên đầy đủ"
                  required
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, { outline: 'none', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', boxShadow: 'none', transform: 'translateY(0)' })}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="email" style={styles.label}>Email</label>
                <input
                  type="email"
                  id="email"
                  style={styles.input}
                  name="email"
                  value={user.email}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ email"
                  required
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, { outline: 'none', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', boxShadow: 'none', transform: 'translateY(0)' })}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="phone" style={styles.label}>Số điện thoại</label>
                <input
                  type="text"
                  id="phone"
                  style={styles.input}
                  name="phone"
                  value={user.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  required
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, { outline: 'none', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', boxShadow: 'none', transform: 'translateY(0)' })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Địa chỉ */}
          <div style={styles.formSection}>
            <div style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📍</span>
              <h3 style={styles.sectionH3}>Địa chỉ</h3>
            </div>
            <div style={styles.formGrid}>
              <div style={{ ...styles.formGroup, ...styles.formGroupFullWidth }}>
                <label htmlFor="address" style={styles.label}>Địa chỉ</label>
                <input
                  type="text"
                  id="address"
                  style={styles.input}
                  name="address"
                  value={user.address}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ đầy đủ"
                  required
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, { outline: 'none', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', boxShadow: 'none', transform: 'translateY(0)' })}
                />
              </div>
              <div style={{ ...styles.formGroup, ...styles.formGroupFullWidth }}>
                <label htmlFor="street" style={styles.label}>Đường/Phố</label>
                <input
                  type="text"
                  id="street"
                  style={styles.input}
                  name="street"
                  value={user.street}
                  onChange={handleChange}
                  placeholder="Nhập tên đường/phố"
                  required
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, { outline: 'none', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', boxShadow: 'none', transform: 'translateY(0)' })}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="district" style={styles.label}>Quận/Huyện</label>
                <input
                  type="text"
                  id="district"
                  style={styles.input}
                  name="district"
                  value={user.district}
                  onChange={handleChange}
                  placeholder="Nhập quận/huyện"
                  required
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, { outline: 'none', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', boxShadow: 'none', transform: 'translateY(0)' })}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="province" style={styles.label}>Tỉnh/Thành phố</label>
                <input
                  type="text"
                  id="province"
                  style={styles.input}
                  name="province"
                  value={user.province}
                  onChange={handleChange}
                  placeholder="Nhập tỉnh/thành phố"
                  required
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, { outline: 'none', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', boxShadow: 'none', transform: 'translateY(0)' })}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.formActions}>
            <button type="submit" style={styles.buttonPrimary} onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}>
              <span>💾</span>
              Lưu thay đổi
            </button>
            <button type="button" style={styles.buttonSecondary} onClick={() => navigate(-1)} onMouseOver={(e) => { e.target.style.backgroundColor = '#e9ecf1'; e.target.style.borderColor = '#0A77E2'; e.target.style.color = '#0A77E2'; e.target.style.transform = 'translateY(-2px)'; }} onMouseOut={(e) => { e.target.style.backgroundColor = '#f0f4f9'; e.target.style.borderColor = '#e5e7eb'; e.target.style.color = '#1f2937'; e.target.style.transform = 'translateY(0)'; }}>
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