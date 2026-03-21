import { useState, useEffect } from 'react';
import '../css/ClassroomForm.css';

const ClassroomForm = ({ onSubmit, onCancel, teachers, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    homeroomTeacherId: null
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        homeroomTeacherId: initialData.homeroomTeacherId || null
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'homeroomTeacherId' ? (value === '' ? null : parseInt(value)) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    if (!initialData) {
      setFormData({
        name: '',
        homeroomTeacherId: null
      });
    }
  };

  return (
    <form className="classroom-form" onSubmit={handleSubmit}>
      <h3>{initialData ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียน'}</h3>

      <div className="form-grid">
        <div className="form-group">
          <label>ชื่อห้องเรียน *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="เช่น ม.1/1"
            required
          />
        </div>

        <div className="form-group">
          <label>ครูประจำชั้น</label>
          <select
            name="homeroomTeacherId"
            value={formData.homeroomTeacherId || ''}
            onChange={handleChange}
            className="teacher-select"
          >
            <option value="">-- เลือกครูประจำชั้น --</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstNameTh} {teacher.lastNameTh} ({teacher.subject || ''})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit">
          {initialData ? 'บันทึกการแก้ไข' : 'เพิ่มห้องเรียน'}
        </button>
        <button type="button" onClick={onCancel} className="btn-cancel">
          ยกเลิก
        </button>
      </div>
    </form>
  );
};

export default ClassroomForm;
