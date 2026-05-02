import { useState, useEffect } from 'react';
import Modal from './Modal';
import { userAPI } from '../api/authApi';
import { getToken } from '../api/config';
import '../css/TeacherDetailModal.css';

const titleOptions = ['นาย', 'นาง', 'นางสาว', 'ผศ.', 'อ.', 'ดร.'];

const availableSubjects = [
  'คณิตศาสตร์', 'วิทยาศาสตร์', 'ภาษาไทย', 'ภาษาอังกฤษ',
  'สังคมศึกษา', 'ประวัติศาสตร์', 'สุขศึกษาและพลศึกษา',
  'ศิลปะ', 'ดนตรี', 'การงานอาชีพ', 'คอมพิวเตอร์',
  'ภาษาจีน', 'ภาษาญี่ปุ่น', 'ภาษาฝรั่งเศส',
  'แนะแนว', 'กิจกรรมพัฒนาผู้เรียน',
];

const TeacherDetailModal = ({
  isOpen,
  onClose,
  teacher,
  classrooms = [],
  schoolId,
  schoolName,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Password tab state
  const [userAccount, setUserAccount] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (isOpen && teacher) {
      setFormData({
        teacher_id: teacher.teacherId || teacher.teacherCode || '',
        title_th: teacher.titleTh || '',
        first_name_th: teacher.firstNameTh || '',
        last_name_th: teacher.lastNameTh || '',
        first_name_en: teacher.firstNameEn || '',
        last_name_en: teacher.lastNameEn || '',
        address: teacher.address || '',
        phone: teacher.phone || '',
        subject: teacher.subject || '',
        homeroom_class: teacher.homeroomClass || '',
      });
    }
    if (!isOpen) {
      setActiveTab('general');
      setIsEditing(false);
      setUserAccount(null);
      setUsername('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setPasswordMsg(null);
    }
  }, [isOpen, teacher]);

  const fetchUserAccount = async () => {
    const code = teacher?.teacherCode || teacher?.teacherId;
    if (!code) return;
    setUserLoading(true);
    try {
      const token = getToken();
      const res = await userAPI.getUsers(token);
      const users = res.data || res;
      const found = users.find(
        (u) => u.username === code || u.teacher_code === code
      );
      setUserAccount(found || null);
      setUsername(found?.username || code);
    } catch (err) {
      console.error('Failed to fetch user account:', err);
      setUserAccount(null);
      setUsername(code);
    } finally {
      setUserLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'password' && !userAccount && teacher) {
      fetchUserAccount();
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData({
      teacher_id: teacher.teacherId || teacher.teacherCode || '',
      title_th: teacher.titleTh || '',
      first_name_th: teacher.firstNameTh || '',
      last_name_th: teacher.lastNameTh || '',
      first_name_en: teacher.firstNameEn || '',
      last_name_en: teacher.lastNameEn || '',
      address: teacher.address || '',
      phone: teacher.phone || '',
      subject: teacher.subject || '',
      homeroom_class: teacher.homeroomClass || '',
    });
    setIsEditing(false);
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!formData.first_name_th?.trim() || !formData.last_name_th?.trim()) {
      alert('กรุณากรอกชื่อและนามสกุล (ไทย)');
      return;
    }
    if (!formData.subject) {
      alert('กรุณาเลือกวิชาที่สอน');
      return;
    }
    if (!onUpdate) return;

    setSaving(true);
    try {
      await onUpdate({ ...formData, id: teacher.id });
      setIsEditing(false);
    } catch (err) {
      alert('บันทึกล้มเหลว: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    const trimmedUsername = (username || '').trim();
    if (!trimmedUsername) {
      setPasswordMsg({ type: 'error', text: 'กรุณากรอก Username' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'รหัสผ่านไม่ตรงกัน' });
      return;
    }

    const code = teacher?.teacherCode || teacher?.teacherId;

    setPasswordSaving(true);
    try {
      const token = getToken();
      if (userAccount) {
        const body = { password: newPassword };
        if (trimmedUsername !== userAccount.username) {
          body.username = trimmedUsername;
        }
        const res = await userAPI.updateUser(userAccount.id, body, token);
        const updated = res?.data || res;
        if (updated && typeof updated === 'object') {
          setUserAccount((prev) => ({ ...(prev || {}), ...updated, username: trimmedUsername }));
        } else {
          setUserAccount((prev) => prev ? { ...prev, username: trimmedUsername } : prev);
        }
        setPasswordMsg({ type: 'success', text: 'อัปเดตบัญชีและรหัสผ่านสำเร็จ' });
      } else {
        await userAPI.createUser(
          {
            username: trimmedUsername,
            password: newPassword,
            email: `${trimmedUsername}@teacher.local`,
            role: 'teacher',
            first_name: teacher.firstNameTh,
            last_name: teacher.lastNameTh,
            teacher_code: code,
            schoolId: schoolId != null ? String(schoolId) : '',
            schoolName: schoolName || '',
          },
          token
        );
        setPasswordMsg({ type: 'success', text: 'สร้างบัญชีผู้ใช้และตั้งรหัสผ่านสำเร็จ' });
        fetchUserAccount();
      }
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const renderInfoRow = (label, value) => (
    <div className="tdm-info-row">
      <span className="tdm-label">{label}</span>
      <span className="tdm-value">{value || '-'}</span>
    </div>
  );

  const renderEditRow = (label, key, type = 'text') => (
    <div className="tdm-info-row" key={key}>
      <span className="tdm-label">{label}</span>
      <input
        type={type}
        className="tdm-edit-input"
        value={formData[key] ?? ''}
        onChange={(e) => handleFieldChange(key, e.target.value)}
      />
    </div>
  );

  const renderSelectRow = (label, key, options, allowEmpty = true) => (
    <div className="tdm-info-row" key={key}>
      <span className="tdm-label">{label}</span>
      <select
        className="tdm-edit-input"
        value={formData[key] ?? ''}
        onChange={(e) => handleFieldChange(key, e.target.value)}
      >
        {allowEmpty && <option value="">-- เลือก --</option>}
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  );

  const renderGeneralTab = () => {
    if (isEditing) {
      return (
        <div className="tdm-section">
          <h3 className="tdm-section-title">ข้อมูลส่วนตัว</h3>
          {renderEditRow('รหัสครู', 'teacher_id')}
          {renderSelectRow('คำนำหน้า', 'title_th', titleOptions)}
          {renderEditRow('ชื่อ (ไทย) *', 'first_name_th')}
          {renderEditRow('นามสกุล (ไทย) *', 'last_name_th')}
          {renderEditRow('ชื่อ (อังกฤษ)', 'first_name_en')}
          {renderEditRow('นามสกุล (อังกฤษ)', 'last_name_en')}

          <h3 className="tdm-section-title">ข้อมูลติดต่อ</h3>
          {renderEditRow('เบอร์โทรศัพท์', 'phone', 'tel')}
          {renderEditRow('ที่อยู่', 'address')}

          <h3 className="tdm-section-title">ข้อมูลการสอน</h3>
          {renderSelectRow('วิชาที่สอน *', 'subject', availableSubjects)}
          {renderSelectRow(
            'ห้องเรียนที่ปรึกษา',
            'homeroom_class',
            classrooms.map((c) => ({ value: c.name, label: c.name }))
          )}
        </div>
      );
    }
    return (
      <div className="tdm-section">
        <h3 className="tdm-section-title">ข้อมูลส่วนตัว</h3>
        {renderInfoRow('รหัสครู', teacher.teacherCode || teacher.teacherId)}
        {renderInfoRow(
          'ชื่อ-นามสกุล (ไทย)',
          `${teacher.titleTh || ''} ${teacher.firstNameTh || ''} ${teacher.lastNameTh || ''}`.trim()
        )}
        {renderInfoRow(
          'ชื่อ-นามสกุล (อังกฤษ)',
          `${teacher.firstNameEn || ''} ${teacher.lastNameEn || ''}`.trim() || '-'
        )}

        <h3 className="tdm-section-title">ข้อมูลติดต่อ</h3>
        {renderInfoRow('เบอร์โทรศัพท์', teacher.phone)}
        {renderInfoRow('ที่อยู่', teacher.address)}

        <h3 className="tdm-section-title">ข้อมูลการสอน</h3>
        {renderInfoRow('วิชาที่สอน', teacher.subject)}
        {renderInfoRow('ห้องเรียนที่ปรึกษา', teacher.homeroomClass || 'ไม่มี')}
      </div>
    );
  };

  const renderPasswordTab = () => {
    if (userLoading) {
      return (
        <div className="tdm-loading">
          <div className="tdm-spinner"></div>
          <p>กำลังตรวจสอบบัญชีผู้ใช้...</p>
        </div>
      );
    }

    const code = teacher?.teacherCode || teacher?.teacherId;

    return (
      <div className="tdm-section">
        <div className="tdm-account-status">
          {userAccount ? (
            <div className="tdm-account-found">
              <div className="tdm-account-icon">&#10003;</div>
              <div>
                <p className="tdm-account-title">มีบัญชีผู้ใช้แล้ว</p>
                <p className="tdm-account-detail">
                  Username: <strong>{userAccount.username}</strong>
                </p>
                {userAccount.email && (
                  <p className="tdm-account-detail">Email: {userAccount.email}</p>
                )}
                {userAccount.role && (
                  <p className="tdm-account-detail">Role: {userAccount.role}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="tdm-account-not-found">
              <div className="tdm-account-icon">!</div>
              <div>
                <p className="tdm-account-title">ยังไม่มีบัญชีผู้ใช้</p>
                <p className="tdm-account-detail">
                  ระบบจะสร้างบัญชีใหม่โดยใช้รหัสครู <strong>{code || '-'}</strong> เป็น Username
                </p>
              </div>
            </div>
          )}
        </div>

        <h3 className="tdm-section-title">
          {userAccount ? 'แก้ไขบัญชีและรหัสผ่าน' : 'สร้างบัญชีและตั้งรหัสผ่าน'}
        </h3>

        <form onSubmit={handleSetPassword} className="tdm-password-form">
          <div className="tdm-form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอก username"
              required
            />
          </div>
          <div className="tdm-form-group">
            <label>รหัสผ่านใหม่</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่"
              required
              minLength={4}
            />
          </div>
          <div className="tdm-form-group">
            <label>ยืนยันรหัสผ่าน</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              required
              minLength={4}
            />
          </div>

          <label className="tdm-show-password">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            แสดงรหัสผ่าน
          </label>

          {passwordMsg && (
            <div className={`tdm-password-msg ${passwordMsg.type}`}>{passwordMsg.text}</div>
          )}

          <button type="submit" className="tdm-save-btn" disabled={passwordSaving}>
            {passwordSaving
              ? 'กำลังบันทึก...'
              : userAccount
              ? 'บันทึกการเปลี่ยนแปลง'
              : 'สร้างบัญชีผู้ใช้'}
          </button>
        </form>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ข้อมูลครู" size="medium">
      {teacher && (
        <>
          <div className="tdm-profile-header">
            <div className="tdm-avatar">
              <span>{teacher.firstNameTh?.charAt(0) || '?'}</span>
            </div>
            <div className="tdm-profile-info">
              <h3>
                {teacher.titleTh} {teacher.firstNameTh} {teacher.lastNameTh}
              </h3>
              <p className="tdm-teacher-code">
                รหัส: {teacher.teacherCode || teacher.teacherId || '-'}
              </p>
              {teacher.subject && (
                <p className="tdm-teacher-subject">วิชา: {teacher.subject}</p>
              )}
            </div>
            {activeTab !== 'password' && (
              <div className="tdm-header-actions">
                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="tdm-save-btn"
                    style={{ background: '#1976d2' }}
                  >
                    แก้ไข
                  </button>
                ) : (
                  <>
                    <button onClick={handleSave} className="tdm-save-btn" disabled={saving}>
                      {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="tdm-save-btn"
                      style={{ background: '#9e9e9e' }}
                      disabled={saving}
                    >
                      ยกเลิก
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="tdm-tabs">
            <button
              className={`tdm-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => handleTabChange('general')}
            >
              ข้อมูลทั่วไป
            </button>
            <button
              className={`tdm-tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => handleTabChange('password')}
            >
              บัญชี & รหัสผ่าน
            </button>
          </div>

          <div className="tdm-tab-content">
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'password' && renderPasswordTab()}
          </div>
        </>
      )}
    </Modal>
  );
};

export default TeacherDetailModal;
