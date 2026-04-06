import { useState, useEffect } from 'react';
import Modal from './Modal';
import { studentAPI } from '../api/personnelApi';
import { userAPI } from '../api/authApi';
import { getToken } from '../api/config';
import '../css/StudentDetailModal.css';

const StudentDetailModal = ({ isOpen, onClose, studentId }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Password tab state
  const [userAccount, setUserAccount] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudent();
    }
    if (!isOpen) {
      setStudent(null);
      setActiveTab('general');
      setUserAccount(null);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg(null);
    }
  }, [isOpen, studentId]);

  const fetchStudent = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await studentAPI.getStudent(studentId, token);
      setStudent(res.data || res);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลนักเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatAge = (age) => {
    if (!age) return '-';
    const parts = [];
    if (age.years) parts.push(`${age.years} ปี`);
    if (age.months) parts.push(`${age.months} เดือน`);
    if (age.days) parts.push(`${age.days} วัน`);
    return parts.length > 0 ? parts.join(' ') : '-';
  };

  const formatAddress = (s) => {
    if (!s) return '-';
    const parts = [];
    if (s.house_number) parts.push(`${s.house_number}`);
    if (s.village_no) parts.push(`หมู่ ${s.village_no}`);
    if (s.road) parts.push(`ถ.${s.road}`);
    if (s.sub_district) parts.push(`ต.${s.sub_district}`);
    if (s.district) parts.push(`อ.${s.district}`);
    if (s.province) parts.push(`จ.${s.province}`);
    if (s.postal_code) parts.push(s.postal_code);
    return parts.length > 0 ? parts.join(' ') : '-';
  };

  const fetchUserAccount = async () => {
    if (!student?.student_code) return;
    setUserLoading(true);
    try {
      const token = getToken();
      const res = await userAPI.getUsers(token);
      const users = res.data || res;
      const found = users.find(u => u.username === student.student_code || u.student_code === student.student_code);
      setUserAccount(found || null);
    } catch (err) {
      console.error('Failed to fetch user account:', err);
      setUserAccount(null);
    } finally {
      setUserLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'password' && !userAccount && student) {
      fetchUserAccount();
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'รหัสผ่านไม่ตรงกัน' });
      return;
    }

    setPasswordSaving(true);
    try {
      const token = getToken();
      if (userAccount) {
        await userAPI.updateUser(userAccount.id, { password: newPassword }, token);
        setPasswordMsg({ type: 'success', text: 'เปลี่ยนรหัสผ่า���สำเร็จ' });
      } else {
        await userAPI.createUser({
          username: student.student_code,
          password: newPassword,
          email: `${student.student_code}@student.local`,
          role: 'student',
          first_name: student.first_name_th,
          last_name: student.last_name_th,
          student_code: student.student_code,
        }, token);
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
    <div className="sdm-info-row">
      <span className="sdm-label">{label}</span>
      <span className="sdm-value">{value || '-'}</span>
    </div>
  );

  const renderGeneralTab = () => (
    <div className="sdm-section">
      <h3 className="sdm-section-title">ข้อมูลส่วนตัว</h3>
      {renderInfoRow('ชื่อ-นามสกุล (ไทย)', `${student.title_th || ''} ${student.first_name_th || ''} ${student.last_name_th || ''}`.trim())}
      {renderInfoRow('ชื่อ-นามสกุล (อังกฤษ)', `${student.first_name_en || ''} ${student.last_name_en || ''}`.trim() || '-')}
      {renderInfoRow('รหัสนักเรียน', student.student_code)}
      {renderInfoRow('เพศ', student.gender)}
      {renderInfoRow('วันเกิด', formatDate(student.birth_date))}
      {renderInfoRow('อายุ', formatAge(student.age))}
      {renderInfoRow('กรุ๊ปเลือด', student.blood_type)}
      {renderInfoRow('สัญชาติ', student.nationality)}
      {renderInfoRow('เชื้อชาติ', student.ethnicity)}
      {renderInfoRow('ศาสนา', student.religion)}
      {renderInfoRow('จังหวัดที่เกิด', student.birth_province)}
      {renderInfoRow('เบอร์โทรศัพท์', student.current_phone)}

      <h3 className="sdm-section-title">ข้อมูลการศึกษา</h3>
      {renderInfoRow('ชั้น/ห้อง', `${student.grade || '-'}/${student.section || '-'}`)}
      {renderInfoRow('น้ำหนัก', student.weight ? `${student.weight} กก.` : '-')}
      {renderInfoRow('ส่วนสูง', student.height ? `${student.height} ซม.` : '-')}
    </div>
  );

  const renderAddressTab = () => (
    <div className="sdm-section">
      <h3 className="sdm-section-title">ที่อยู่ตามทะเบียนบ้าน</h3>
      {renderInfoRow('ที่อยู่', formatAddress(student))}
      {renderInfoRow('เบอร์โทรศัพท์', student.current_phone)}

      <h3 className="sdm-section-title">ข้อมูลการเดินทาง</h3>
      {renderInfoRow('ระยะทาง (ถนนลาดยาง)', student.distance_paved_road ? `${student.distance_paved_road} กม.` : '-')}
      {renderInfoRow('ระยะทาง (ถนนลูกรัง)', student.distance_unpaved_road ? `${student.distance_unpaved_road} กม.` : '-')}
      {renderInfoRow('เวลาเดินทาง', student.travel_time ? `${student.travel_time} นาที` : '-')}
      {renderInfoRow('วิธีการเดินทาง', student.travel_method)}
    </div>
  );

  const renderFamilyTab = () => (
    <div className="sdm-section">
      <h3 className="sdm-section-title">ข้อมูลบิดา</h3>
      {renderInfoRow('ชื่อ-นามสกุล', `${student.father_title || ''} ${student.father_first_name || ''} ${student.father_last_name || ''}`.trim() || '-')}
      {renderInfoRow('อาชีพ', student.father_occupation)}
      {renderInfoRow('เบอร์โทรศัพท์', student.father_phone)}
      {renderInfoRow('รายได้ต่อเดือน', student.father_monthly_income ? `${student.father_monthly_income.toLocaleString()} บาท` : '-')}

      <h3 className="sdm-section-title">ข้อมูลมารดา</h3>
      {renderInfoRow('ชื่อ-นามสกุล', `${student.mother_title || ''} ${student.mother_first_name || ''} ${student.mother_last_name || ''}`.trim() || '-')}
      {renderInfoRow('อาชีพ', student.mother_occupation)}
      {renderInfoRow('เบอร์โทรศัพท์', student.mother_phone)}

      <h3 className="sdm-section-title">ข้อมูลผู้ปกครอง</h3>
      {renderInfoRow('ชื่อ-นามสกุล', `${student.guardian_title || ''} ${student.guardian_first_name || ''} ${student.guardian_last_name || ''}`.trim() || '-')}
      {renderInfoRow('ความสัมพันธ์', student.guardian_relationship)}
      {renderInfoRow('อาชีพ', student.guardian_occupation)}
      {renderInfoRow('เบอร์โทรศัพท์', student.guardian_phone)}
      {renderInfoRow('รายได้ต่อเดือน', student.guardian_monthly_income ? `${student.guardian_monthly_income.toLocaleString()} บาท` : '-')}

      <h3 className="sdm-section-title">ข้อมูลพี่น้อง</h3>
      {renderInfoRow('เป็นบุตรคนที่', student.child_order || '-')}
      {renderInfoRow('พี่ชาย', student.older_brothers ?? '-')}
      {renderInfoRow('น้องชาย', student.younger_brothers ?? '-')}
      {renderInfoRow('พี่สาว', student.older_sisters ?? '-')}
      {renderInfoRow('น้องสาว', student.younger_sisters ?? '-')}
      {renderInfoRow('สถานภาพบิดามารดา', student.parents_marital_status)}
    </div>
  );

  const renderPasswordTab = () => {
    if (userLoading) {
      return (
        <div className="sdm-loading">
          <div className="sdm-spinner"></div>
          <p>กำลังตรวจสอบบัญชีผู้ใช้...</p>
        </div>
      );
    }

    return (
      <div className="sdm-section">
        <div className="sdm-account-status">
          {userAccount ? (
            <div className="sdm-account-found">
              <div className="sdm-account-icon">&#10003;</div>
              <div>
                <p className="sdm-account-title">มีบัญชีผู้ใช้แล้ว</p>
                <p className="sdm-account-detail">Username: <strong>{userAccount.username}</strong></p>
                <p className="sdm-account-detail">Email: {userAccount.email}</p>
              </div>
            </div>
          ) : (
            <div className="sdm-account-not-found">
              <div className="sdm-account-icon">!</div>
              <div>
                <p className="sdm-account-title">ยังไม่มีบัญชีผู้ใช้</p>
                <p className="sdm-account-detail">ระบบจะสร้างบัญชีใหม่โดยใช้รหัสนักเรียน <strong>{student.student_code}</strong> เป็น Username</p>
              </div>
            </div>
          )}
        </div>

        <h3 className="sdm-section-title">
          {userAccount ? 'เปลี่ยนรหัสผ่าน' : 'สร้างบัญชีและตั้งรหัสผ่าน'}
        </h3>

        <form onSubmit={handleSetPassword} className="sdm-password-form">
          <div className="sdm-form-group">
            <label>รหัสผ่านใหม่</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่"
              required
              minLength={4}
            />
          </div>
          <div className="sdm-form-group">
            <label>ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              required
              minLength={4}
            />
          </div>

          {passwordMsg && (
            <div className={`sdm-password-msg ${passwordMsg.type}`}>
              {passwordMsg.text}
            </div>
          )}

          <button
            type="submit"
            className="sdm-save-btn"
            disabled={passwordSaving}
          >
            {passwordSaving ? 'กำลังบันทึก...' : userAccount ? 'เปลี่ยนรหัสผ่าน' : 'สร้างบัญชีผู้ใช้'}
          </button>
        </form>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ข้อมูลนักเรียน" size="medium">
      {loading && (
        <div className="sdm-loading">
          <div className="sdm-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {error && (
        <div className="sdm-error">
          <p>{error}</p>
          <button onClick={fetchStudent} className="sdm-retry-btn">ลองอีกครั้ง</button>
        </div>
      )}

      {student && !loading && (
        <>
          <div className="sdm-profile-header">
            <div className="sdm-avatar">
              {student.first_name_th?.charAt(0) || '?'}
            </div>
            <div className="sdm-profile-info">
              <h3>{student.title_th} {student.first_name_th} {student.last_name_th}</h3>
              <p className="sdm-student-code">รหัส: {student.student_code}</p>
              <p className="sdm-student-class">ชั้น {student.grade}/{student.section}</p>
            </div>
          </div>

          <div className="sdm-tabs">
            <button
              className={`sdm-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => handleTabChange('general')}
            >
              ข้อมูลทั่วไป
            </button>
            <button
              className={`sdm-tab ${activeTab === 'address' ? 'active' : ''}`}
              onClick={() => handleTabChange('address')}
            >
              ที่อยู่
            </button>
            <button
              className={`sdm-tab ${activeTab === 'family' ? 'active' : ''}`}
              onClick={() => handleTabChange('family')}
            >
              ครอบครัว
            </button>
            <button
              className={`sdm-tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => handleTabChange('password')}
            >
              ตั้งรหัสผ่าน
            </button>
          </div>

          <div className="sdm-tab-content">
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'address' && renderAddressTab()}
            {activeTab === 'family' && renderFamilyTab()}
            {activeTab === 'password' && renderPasswordTab()}
          </div>
        </>
      )}
    </Modal>
  );
};

export default StudentDetailModal;
