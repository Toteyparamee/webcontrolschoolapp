import { useState } from 'react';
import '../css/StudentForm.css';

const StudentForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    studentNumber: '',
    firstNameTh: '',
    lastNameTh: '',
    firstNameEn: '',
    lastNameEn: '',
    address: '',
    phone: '',
    fatherName: '',
    motherName: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      studentNumber: parseInt(formData.studentNumber)
    });
    setFormData({
      studentId: '',
      studentNumber: '',
      firstNameTh: '',
      lastNameTh: '',
      firstNameEn: '',
      lastNameEn: '',
      address: '',
      phone: '',
      fatherName: '',
      motherName: ''
    });
  };

  return (
    <form className="student-form" onSubmit={handleSubmit}>
      <h3>เพิ่มนักเรียน</h3>

      <div className="form-grid">
        <div className="form-group">
          <label>รหัสนักเรียน *</label>
          <input
            type="text"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>เลขที่ *</label>
          <input
            type="number"
            name="studentNumber"
            value={formData.studentNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>ชื่อ (ไทย) *</label>
          <input
            type="text"
            name="firstNameTh"
            value={formData.firstNameTh}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>นามสกุล (ไทย) *</label>
          <input
            type="text"
            name="lastNameTh"
            value={formData.lastNameTh}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>ชื่อ (อังกฤษ) *</label>
          <input
            type="text"
            name="firstNameEn"
            value={formData.firstNameEn}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>นามสกุล (อังกฤษ) *</label>
          <input
            type="text"
            name="lastNameEn"
            value={formData.lastNameEn}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group full-width">
          <label>ที่อยู่ *</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="2"
            required
          />
        </div>

        <div className="form-group">
          <label>เบอร์โทรศัพท์ *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>ชื่อบิดา *</label>
          <input
            type="text"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>ชื่อมารดา *</label>
          <input
            type="text"
            name="motherName"
            value={formData.motherName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit">บันทึก</button>
        <button type="button" onClick={onCancel} className="btn-cancel">ยกเลิก</button>
      </div>
    </form>
  );
};

export default StudentForm;
