import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


const BASE_URL = 'http://localhost:8080/api'; 

/**
 * Hàm gọi API Login
 * Gửi username và password đến endpoint /auth/login của backend.
 * * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} Dữ liệu trả về (token, roleName, fullName, v.v.)
 */
import logger from './logger';

export async function loginApi(username, password) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    // Xử lý lỗi HTTP (ví dụ: 400 Bad Request, 404 Not Found)
    if (!response.ok) {
      // Đọc thông báo lỗi từ body của response (do Spring Boot trả về)
      const errorData = await response.json();
      // Ném lỗi để bắt ở use-auth.js và hiển thị trên LoginForm
      // Sử dụng trường 'message' từ body lỗi của backend
      throw new Error(errorData.message || 'Đăng nhập thất bại. Lỗi kết nối hoặc server.');
    }

    const data = await response.json();
    return data; // Trả về LoginResponse DTO
    
  } catch (error) {
    // Xử lý lỗi mạng (Network error, CORS error)
    logger.error("Lỗi khi gọi API login:", error);
    // Ném lại lỗi để xử lý thông báo trên UI
    throw new Error(`Không thể kết nối đến máy chủ: ${error.message}`);
  }
}

/**
 * Hàm gọi API Register (Đăng ký)
 * @param {object} registerData - Dữ liệu đăng ký (username, password, email, phone, fullName)
 * @returns {Promise<object>} Dữ liệu tài khoản đã tạo (nếu thành công)
 */
export async function registerApi(registerData) {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Ném lỗi từ backend (ví dụ: username/email đã tồn tại)
      throw new Error(errorData.message || 'Đăng ký thất bại. Lỗi kết nối hoặc server.');
    }

    const data = await response.json();
    return data; // Trả về thông tin Account đã tạo
    
  } catch (error) {
    logger.error("Lỗi khi gọi API register:", error);
    throw new Error(`Không thể kết nối đến máy chủ: ${error.message}`);
  }
}