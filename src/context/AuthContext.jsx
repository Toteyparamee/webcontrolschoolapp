import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// ตรวจสอบว่า JWT token หมดอายุหรือยัง
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp เป็น unix timestamp (วินาที), Date.now() เป็น ms
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // ถ้า parse ไม่ได้ ถือว่าหมดอายุ
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // โหลด user จาก sessionStorage เมื่อเริ่มต้น
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('access_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    // บอกว่าโหลดเสร็จแล้ว ก่อนที่ ProtectedRoute จะตัดสินใจ
    setIsInitialized(true);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(username, password);

      if (response.success) {
        const userData = response.data;
        const tokens = response.tokens;

        // เก็บข้อมูลใน state
        setUser(userData);
        setToken(tokens.access_token);

        // เก็บข้อมูลใน sessionStorage
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('access_token', tokens.access_token);
        sessionStorage.setItem('refresh_token', tokens.refresh_token);

        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, message: response.message };
    } catch (err) {
      setLoading(false);
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  };

  // คืน access_token ที่ยังใช้งานได้ — refresh อัตโนมัติถ้าหมดอายุ
  const getValidToken = async () => {
    const currentToken = sessionStorage.getItem('access_token');
    if (!currentToken) return null;

    // ถ้า token ยังไม่หมดอายุ คืนค่าทันที
    if (!isTokenExpired(currentToken)) return currentToken;

    // token หมดอายุ → ลองใช้ refresh_token
    const storedRefreshToken = sessionStorage.getItem('refresh_token');
    if (!storedRefreshToken) {
      logout();
      return null;
    }

    try {
      const response = await authAPI.refreshToken(storedRefreshToken);
      const newAccessToken = response.tokens?.access_token || response.access_token;
      const newRefreshToken = response.tokens?.refresh_token || response.refresh_token;

      if (!newAccessToken) throw new Error('No access token in refresh response');

      // อัพเดต sessionStorage และ state
      sessionStorage.setItem('access_token', newAccessToken);
      if (newRefreshToken) sessionStorage.setItem('refresh_token', newRefreshToken);
      setToken(newAccessToken);

      return newAccessToken;
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, error, isInitialized, getValidToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};