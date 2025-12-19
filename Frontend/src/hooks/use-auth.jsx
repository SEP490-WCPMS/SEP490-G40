import React, { createContext, useContext, useState } from 'react';
import { loginApi } from '../lib/utils'; // Giả định đã import hàm loginApi từ utils

const AuthContext = createContext(null);

// Khởi tạo trạng thái ban đầu từ localStorage (để duy trì đăng nhập sau khi refresh)
const getInitialAuthState = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    try {
      return {
        isAuthenticated: true,
        token: token,
        // Chuyển chuỗi JSON thành đối tượng
        user: JSON.parse(user),
        loading: false
      };
    } catch (e) {
      // Nếu có lỗi parsing, xóa dữ liệu cũ
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  return { isAuthenticated: false, token: null, user: null, loading: false };
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(getInitialAuthState);

  // Hàm xử lý logic đăng nhập
  const login = async (username, password) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const data = await loginApi(username, password);

      // Lọc thông tin cần thiết và lưu vào localStorage
      const userInfo = {
        id: data.id,
        username: data.username,
        fullName: data.fullName,
        phone: data.phone,
        roleName: data.roleName,
        department: data.department
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userInfo));

      setAuthState({
        isAuthenticated: true,
        token: data.token,
        user: userInfo,
        loading: false
      });
      return true;

    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      // Ném lỗi để Login.jsx có thể hiển thị thông báo
      throw error;
    }
  };

  // Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({ isAuthenticated: false, token: null, user: null, loading: false });
  };

  const value = {
    ...authState,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook để các Component sử dụng
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};