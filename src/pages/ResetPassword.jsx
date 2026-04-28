import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api/authApi';
import '../css/Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('ลิงก์ไม่ถูกต้อง — ไม่พบ token');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirm) {
      setError('รหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setSuccess('ตั้งรหัสผ่านใหม่เรียบร้อย กำลังพาไปหน้าเข้าสู่ระบบ...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>ตั้งรหัสผ่านใหม่</h1>
        {email && (
          <p style={{ color: '#666', marginBottom: 16 }}>
            สำหรับบัญชี: <strong>{email}</strong>
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>รหัสผ่านใหม่</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              required
              minLength={6}
              disabled={!token || loading}
            />
          </div>
          <div className="form-group">
            <label>ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              required
              minLength={6}
              disabled={!token || loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div style={{ color: 'green', marginBottom: 12 }}>{success}</div>
          )}
          <button type="submit" disabled={!token || loading}>
            {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="/" style={{ color: '#1976d2' }}>
            กลับไปหน้าเข้าสู่ระบบ
          </a>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
