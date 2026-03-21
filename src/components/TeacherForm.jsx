import { useState, useEffect } from 'react';
import '../css/TeacherForm.css';

const TeacherForm = ({ onSubmit, onCancel, classrooms = [], schoolId, editingTeacher }) => {
  // รายการคำนำหน้า
  const titleOptions = ['นาย', 'นาง', 'นางสาว', 'ผศ.', 'อ.', 'ดร.'];

  // รายการวิชาที่ใช้ในโรงเรียน
  const availableSubjects = [
    'คณิตศาสตร์',
    'วิทยาศาสตร์',
    'ภาษาไทย',
    'ภาษาอังกฤษ',
    'สังคมศึกษา',
    'ประวัติศาสตร์',
    'สุขศึกษาและพลศึกษา',
    'ศิลปะ',
    'ดนตรี',
    'การงานอาชีพ',
    'คอมพิวเตอร์',
    'ภาษาจีน',
    'ภาษาญี่ปุ่น',
    'ภาษาฝรั่งเศส',
    'แนะแนว',
    'กิจกรรมพัฒนาผู้เรียน'
  ];

  const [formData, setFormData] = useState({
    teacher_id: '',
    title_th: '',
    first_name_th: '',
    last_name_th: '',
    first_name_en: '',
    last_name_en: '',
    address: '',
    phone: '',
    subject: '',
    homeroom_class: '',
    school_id: schoolId
  });

  // Update school_id เมื่อ schoolId prop เปลี่ยน
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      school_id: schoolId
    }));
  }, [schoolId]);

  // Load data เมื่อแก้ไขครู
  useEffect(() => {
    if (editingTeacher) {
      setFormData({
        teacher_id: editingTeacher.teacherId || '',
        title_th: editingTeacher.titleTh || '',
        first_name_th: editingTeacher.firstNameTh || '',
        last_name_th: editingTeacher.lastNameTh || '',
        first_name_en: editingTeacher.firstNameEn || '',
        last_name_en: editingTeacher.lastNameEn || '',
        address: editingTeacher.address || '',
        phone: editingTeacher.phone || '',
        subject: editingTeacher.subject || '',
        homeroom_class: editingTeacher.homeroomClass || '',
        school_id: schoolId
      });
    }
  }, [editingTeacher, schoolId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ตรวจสอบว่าเลือกวิชา
    if (!formData.subject) {
      alert('กรุณาเลือกวิชาที่สอน');
      return;
    }

    // ส่งข้อมูลพร้อม id ถ้าเป็นการแก้ไข
    if (editingTeacher) {
      onSubmit({ ...formData, id: editingTeacher.id });
    } else {
      onSubmit(formData);
    }

    // Reset form
    setFormData({
      teacher_id: '',
      title_th: '',
      first_name_th: '',
      last_name_th: '',
      first_name_en: '',
      last_name_en: '',
      address: '',
      phone: '',
      subject: '',
      homeroom_class: '',
      school_id: schoolId
    });
  };

  return (
    <form className="teacher-form" onSubmit={handleSubmit}>
      <h3>{editingTeacher ? 'แก้ไขข้อมูลครู' : 'เพิ่มครู'}</h3>

      <div className="form-grid">
        <div className="form-group">
          <label>รหัสครู *</label>
          <input
            type="text"
            name="teacher_id"
            value={formData.teacher_id}
            onChange={handleChange}
            placeholder="เช่น T001"
            required
          />
        </div>

        <div className="form-group">
          <label>คำนำหน้า</label>
          <select
            name="title_th"
            value={formData.title_th}
            onChange={handleChange}
          >
            <option value="">-- เลือกคำนำหน้า --</option>
            {titleOptions.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>ชื่อ (ไทย) *</label>
          <input
            type="text"
            name="first_name_th"
            value={formData.first_name_th}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>นามสกุล (ไทย) *</label>
          <input
            type="text"
            name="last_name_th"
            value={formData.last_name_th}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>ชื่อ (อังกฤษ)</label>
          <input
            type="text"
            name="first_name_en"
            value={formData.first_name_en}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>นามสกุล (อังกฤษ)</label>
          <input
            type="text"
            name="last_name_en"
            value={formData.last_name_en}
            onChange={handleChange}
          />
        </div>

        <div className="form-group full-width">
          <label>ที่อยู่</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="2"
          />
        </div>

        <div className="form-group">
          <label>เบอร์โทรศัพท์</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>วิชาที่สอน *</label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
          >
            <option value="">-- เลือกวิชา --</option>
            {availableSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>ห้องเรียนที่ปรึกษา</label>
          <select
            name="homeroom_class"
            value={formData.homeroom_class}
            onChange={handleChange}
          >
            <option value="">ไม่มีห้องประจำชั้น</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.name}>
                {classroom.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit">บันทึก</button>
        <button type="button" onClick={onCancel} className="btn-cancel">ยกเลิก</button>
      </div>
    </form>
  );
};

export default TeacherForm;
