import { useState, useEffect } from 'react';
import { settingsAPI, getToken, API_CONFIG } from '../api';
import '../css/SemesterSettings.css';

const SemesterSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    academic_year: '',
    semester: 1,
    start_date: '',
    end_date: '',
    is_current: false,
  });

  // โหลดข้อมูลการตั้งค่าเทอม
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('กรุณาเข้าสู่ระบบก่อน');
        setLoading(false);
        return;
      }

      const data = await settingsAPI.getSemesterSettings(API_CONFIG.DEFAULT_SCHOOL_ID);
      if (data.success) {
        setSettings(data.data || []);
      } else {
        setError(data.message || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      console.error('Error fetching semester settings:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // จัดการ form input
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // เปิด form สร้างใหม่
  const handleAddNew = () => {
    const currentYear = new Date().getFullYear() + 543;
    setFormData({
      academic_year: currentYear.toString(),
      semester: 1,
      start_date: '',
      end_date: '',
      is_current: false,
    });
    setEditingId(null);
    setShowForm(true);
  };

  // เปิด form แก้ไข
  const handleEdit = (setting) => {
    setFormData({
      academic_year: setting.academic_year,
      semester: setting.semester,
      start_date: setting.start_date.split('T')[0],
      end_date: setting.end_date.split('T')[0],
      is_current: setting.is_current,
    });
    setEditingId(setting.id);
    setShowForm(true);
  };

  // บันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setError('กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      const payload = {
        school_id: API_CONFIG.DEFAULT_SCHOOL_ID,
        academic_year: formData.academic_year,
        semester: parseInt(formData.semester),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_current: formData.is_current,
      };

      let result;
      if (editingId) {
        result = await settingsAPI.updateSemesterSetting(editingId, payload);
      } else {
        result = await settingsAPI.createSemesterSetting(payload);
      }

      if (result.success) {
        setShowForm(false);
        setEditingId(null);
        fetchSettings();
      } else {
        setError(result.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (err) {
      console.error('Error saving semester setting:', err);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // ลบการตั้งค่า
  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบการตั้งค่าเทอมนี้หรือไม่?')) {
      return;
    }

    try {
      const result = await settingsAPI.deleteSemesterSetting(id);
      if (result.success) {
        fetchSettings();
      } else {
        setError(result.message || 'ไม่สามารถลบข้อมูลได้');
      }
    } catch (err) {
      console.error('Error deleting semester setting:', err);
      setError('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  // ตั้งเป็นเทอมปัจจุบัน
  const handleSetCurrent = async (id) => {
    try {
      const result = await settingsAPI.setCurrentSemester(id);
      if (result.success) {
        fetchSettings();
      } else {
        setError(result.message || 'ไม่สามารถตั้งค่าได้');
      }
    } catch (err) {
      console.error('Error setting current semester:', err);
      setError('เกิดข้อผิดพลาด');
    }
  };

  // แปลงวันที่เป็นรูปแบบไทย
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="semester-settings">
        <div className="loading">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="semester-settings">
      <div className="section-header">
        <h2>ตั้งค่าภาคเรียน</h2>
        <button className="btn-add" onClick={handleAddNew}>
          + เพิ่มการตั้งค่าเทอม
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>x</button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'แก้ไขการตั้งค่าเทอม' : 'เพิ่มการตั้งค่าเทอม'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>ปีการศึกษา (พ.ศ.)</label>
                <input
                  type="text"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  placeholder="เช่น 2568"
                  required
                />
              </div>

              <div className="form-group">
                <label>ภาคเรียน</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  required
                >
                  <option value={1}>ภาคเรียนที่ 1</option>
                  <option value={2}>ภาคเรียนที่ 2</option>
                </select>
              </div>

              <div className="form-group">
                <label>วันเริ่มต้นเทอม</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>วันสิ้นสุดเทอม</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_current"
                    checked={formData.is_current}
                    onChange={handleInputChange}
                  />
                  ตั้งเป็นเทอมปัจจุบัน
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn-submit">
                  {editingId ? 'บันทึก' : 'เพิ่ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Table */}
      <div className="settings-table-container">
        {settings.length === 0 ? (
          <div className="empty-state">
            <p>ยังไม่มีการตั้งค่าภาคเรียน</p>
            <p>กรุณาเพิ่มการตั้งค่าเทอมเพื่อกำหนดช่วงเวลาของแต่ละภาคเรียน</p>
          </div>
        ) : (
          <table className="settings-table">
            <thead>
              <tr>
                <th>ปีการศึกษา</th>
                <th>ภาคเรียน</th>
                <th>วันเริ่มต้น</th>
                <th>วันสิ้นสุด</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.id} className={setting.is_current ? 'current-semester' : ''}>
                  <td>{setting.academic_year}</td>
                  <td>ภาคเรียนที่ {setting.semester}</td>
                  <td>{formatDate(setting.start_date)}</td>
                  <td>{formatDate(setting.end_date)}</td>
                  <td>
                    {setting.is_current ? (
                      <span className="badge badge-current">เทอมปัจจุบัน</span>
                    ) : (
                      <span className="badge badge-inactive">-</span>
                    )}
                  </td>
                  <td className="actions">
                    {!setting.is_current && (
                      <button
                        className="btn-set-current"
                        onClick={() => handleSetCurrent(setting.id)}
                        title="ตั้งเป็นเทอมปัจจุบัน"
                      >
                        ตั้งเป็นปัจจุบัน
                      </button>
                    )}
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(setting)}
                      title="แก้ไข"
                    >
                      แก้ไข
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(setting.id)}
                      title="ลบ"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h4>คำอธิบาย</h4>
        <ul>
          <li><strong>ปีการศึกษา:</strong> ระบุเป็นปี พ.ศ. เช่น 2568</li>
          <li><strong>ภาคเรียน:</strong> เลือกภาคเรียนที่ 1 หรือ 2</li>
          <li><strong>วันเริ่มต้น/สิ้นสุด:</strong> กำหนดช่วงเวลาของภาคเรียน</li>
          <li><strong>เทอมปัจจุบัน:</strong> ระบบจะใช้เทอมที่ตั้งเป็นปัจจุบันในการแสดงข้อมูลตารางเรียน/สอน</li>
        </ul>
      </div>
    </div>
  );
};

export default SemesterSettings;
