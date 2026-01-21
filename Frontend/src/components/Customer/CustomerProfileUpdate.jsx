import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const looksLikeIdentityNumber = (value) => {
  if (value == null) return false;
  const s = String(value).trim();
  // VN CMND: 9 digits, CCCD: 12 digits
  return /^\d{9}$|^\d{12}$/.test(s);
};

const normalizeProfileIdentityNumber = (profile, localUser) => {
  const data = { ...(profile || {}) };

  // Prefer explicit identityNumber from API if it looks valid.
  let identityNumber = looksLikeIdentityNumber(data.identityNumber) ? String(data.identityNumber).trim() : "";

  // Fallback to other possible BE field names if any.
  if (!identityNumber) {
    const candidates = [data.cccd, data.citizenId, data.nationalId, data.identity_card, data.identity_no];
    const found = candidates.find(looksLikeIdentityNumber);
    if (found) identityNumber = String(found).trim();
  }

  // Fallback to localStorage user.identityNumber ONLY if it looks valid.
  if (!identityNumber && localUser && looksLikeIdentityNumber(localUser.identityNumber)) {
    identityNumber = String(localUser.identityNumber).trim();
  }

  // Defensive: if BE accidentally swaps address <-> identityNumber, avoid showing address-like text in CCCD.
  // If address looks like a valid CCCD/CMND and identityNumber does not, use address as identityNumber.
  if (!looksLikeIdentityNumber(data.identityNumber) && looksLikeIdentityNumber(data.address) && !identityNumber) {
    identityNumber = String(data.address).trim();
  }

  return { ...data, identityNumber };
};

const CustomerProfileUpdate = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!currentUser || !currentUser.id || !token) {
      navigate("/login");
      return;
    }

    const fetchProfileData = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/profile/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const normalized = normalizeProfileIdentityNumber(response.data, currentUser);
        setUser(normalized);
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

    const trimmedIdentityNumber = (user.identityNumber ?? "").toString().trim();

    // --- SỬA: Chỉ validate các trường còn hiển thị ---
    if (!user.fullName || !user.phone || !trimmedIdentityNumber) {
      setMessage("❌ Vui lòng điền đầy đủ thông tin (Họ tên, SĐT, CCCD).");
      return;
    }

    // Validate định dạng CCCD/CMND để tránh trường hợp bị fill nhầm từ địa chỉ
    if (!looksLikeIdentityNumber(trimmedIdentityNumber)) {
      setMessage("❌ CCCD/CMND không hợp lệ (chỉ 9 hoặc 12 chữ số).");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("❌ Lỗi xác thực. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      // Vẫn gửi toàn bộ object user (bao gồm cả địa chỉ cũ) để tránh mất dữ liệu phía BE
      // Xử lý địa chỉ null nếu backend yêu cầu @NotBlank
      const updatedData = {
        ...user,
        identityNumber: trimmedIdentityNumber,
        address: user.address || "Chưa cập nhật",
        street: user.street || "Chưa cập nhật",
        district: user.district || "Chưa cập nhật",
        province: user.province || "Chưa cập nhật"
      };

      const res = await axios.put(`http://localhost:8080/api/profile/update/${user.id}`, updatedData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage("✅ Cập nhật thông tin thành công! Đang quay lại trang chủ...");

      // Cập nhật lại localStorage với thông tin MỚI NHẤT (bao gồm CCCD)
      const currentUserData = JSON.parse(localStorage.getItem("user"));
      const updatedUser = {
        ...currentUserData,
        ...res.data.user,
        identityNumber: trimmedIdentityNumber // ĐẢM BẢO GHI ĐÈ CCCD MỚI VÀO
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // --- SỬA: QUAY VỀ HOMEPAGE VÀ RELOAD TRANG ---
      setTimeout(() => {
        // Dùng window.location.href để Reload lại App -> HomePage sẽ đọc được user mới từ localStorage
        window.location.href = "/";
      }, 1500);
      // ---------------------------------------------

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || "Lỗi hệ thống";
      // Xử lý hiển thị lỗi validation từ backend (nếu có map)
      if (typeof msg === 'object') {
        const firstError = Object.values(msg)[0];
        setMessage(`❌ Cập nhật thất bại: ${firstError}`);
      } else {
        setMessage(`❌ Cập nhật thất bại: ${msg}`);
      }
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải hồ sơ...</div>;
  }

  if (!user) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{message || "Không thể tải hồ sơ."}</div>;
  }

  // --- STYLES ---
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
      maxWidth: '800px', // Thu nhỏ width lại một chút cho cân đối vì bớt field
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
      marginBottom: '20px', // Giảm margin bottom vì chỉ còn 1 section
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
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '24px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
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
      marginTop: '30px',
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
  };

  return (
    <section style={styles.section}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #6b7280; opacity: 0.6; }
        input:hover:not(:focus) { border-color: #d1d5db; background-color: #fafbfc; }
        button:hover:not(:disabled) { transform: translateY(-2px); }
        @media (max-width: 768px) {
          section { padding: 20px 16px !important; }
          .profile-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>👤</div>
          <div>
            <h1 style={styles.headerH1}>Chỉnh sửa hồ sơ cá nhân</h1>
            <p style={styles.headerP}>Cập nhật thông tin liên hệ của bạn</p>
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
              <span style={styles.sectionIcon}>📝</span>
              <h3 style={styles.sectionH3}>Thông tin liên hệ</h3>
            </div>
            <div className="profile-form-grid" style={styles.formGrid}>
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

              {/* Ô nhập CCCD */}
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label htmlFor="identityNumber" style={styles.label}>CCCD/Mã số thuế (*)</label>
                <input
                  type="text"
                  id="identityNumber"
                  style={{ ...styles.input, borderColor: !user.identityNumber ? '#ef4444' : '#e5e7eb' }}
                  name="identityNumber"
                  value={user.identityNumber || ''}
                  onChange={handleChange}
                  placeholder="Nhập số CCCD/Mã số thuế"
                  required
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, { outline: 'none', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', boxShadow: 'none', transform: 'translateY(0)' })}
                />
                {!user.identityNumber && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>Bắt buộc nhập</span>}
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