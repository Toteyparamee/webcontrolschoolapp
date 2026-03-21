import { useState } from 'react';
import '../css/ClassroomFullForm.css';

const ClassroomFullForm = ({ onSubmit, onCancel, teachers }) => {
  const [classroomData, setClassroomData] = useState({
    name: '',
    homeroomTeacherId: null
  });

  const [students, setStudents] = useState([]);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [currentStudent, setCurrentStudent] = useState({
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

  const [newTeachers, setNewTeachers] = useState([]);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState({
    firstNameTh: '',
    lastNameTh: '',
    firstNameEn: '',
    lastNameEn: '',
    address: '',
    phone: '',
    subjects: ''
  });

  const handleClassroomChange = (e) => {
    const { name, value } = e.target;
    setClassroomData(prev => ({
      ...prev,
      [name]: name === 'homeroomTeacherId' ? (value === '' ? null : parseInt(value)) : value
    }));
  };

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setCurrentStudent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTeacherChange = (e) => {
    const { name, value } = e.target;
    setCurrentTeacher(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    const newStudent = {
      ...currentStudent,
      id: Date.now(),
      studentNumber: parseInt(currentStudent.studentNumber)
    };
    setStudents([...students, newStudent]);
    setCurrentStudent({
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
    setShowStudentForm(false);
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    const newTeacher = {
      ...currentTeacher,
      id: Date.now(),
      subjects: currentTeacher.subjects.split(',').map(s => s.trim()).filter(s => s)
    };
    setNewTeachers([...newTeachers, newTeacher]);
    setCurrentTeacher({
      firstNameTh: '',
      lastNameTh: '',
      firstNameEn: '',
      lastNameEn: '',
      address: '',
      phone: '',
      subjects: ''
    });
    setShowTeacherForm(false);
  };

  const handleRemoveStudent = (studentId) => {
    setStudents(students.filter(s => s.id !== studentId));
  };

  const handleRemoveTeacher = (teacherId) => {
    setNewTeachers(newTeachers.filter(t => t.id !== teacherId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      classroom: classroomData,
      students: students,
      teachers: newTeachers
    });
  };

  return (
    <form className="classroom-full-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3 className="section-title">📚 ข้อมูลห้องเรียน</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>ครูประจำชั้น</label>
            <select
              name="homeroomTeacherId"
              value={classroomData.homeroomTeacherId || ''}
              onChange={handleClassroomChange}
              className="teacher-select"
            >
              <option value="">-- เลือกครูประจำชั้น --</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstNameTh} {teacher.lastNameTh} ({teacher.subject || ''})
                </option>
              ))}
              {newTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstNameTh} {teacher.lastNameTh} ({teacher.subject || ''})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <h3 className="section-title">👨‍🏫 เพิ่มครูใหม่ ({newTeachers.length} คน)</h3>
          <button
            type="button"
            onClick={() => setShowTeacherForm(!showTeacherForm)}
            className="btn-add-student"
          >
            {showTeacherForm ? 'ยกเลิก' : '+ เพิ่มครู'}
          </button>
        </div>

        {showTeacherForm && (
          <div className="student-form-container">
            <div className="form-grid">
              <div className="form-group">
                <label>ชื่อ (ไทย) *</label>
                <input
                  type="text"
                  name="firstNameTh"
                  value={currentTeacher.firstNameTh}
                  onChange={handleTeacherChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>นามสกุล (ไทย) *</label>
                <input
                  type="text"
                  name="lastNameTh"
                  value={currentTeacher.lastNameTh}
                  onChange={handleTeacherChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>ชื่อ (อังกฤษ) *</label>
                <input
                  type="text"
                  name="firstNameEn"
                  value={currentTeacher.firstNameEn}
                  onChange={handleTeacherChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>นามสกุล (อังกฤษ) *</label>
                <input
                  type="text"
                  name="lastNameEn"
                  value={currentTeacher.lastNameEn}
                  onChange={handleTeacherChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>ที่อยู่ *</label>
                <textarea
                  name="address"
                  value={currentTeacher.address}
                  onChange={handleTeacherChange}
                  rows="2"
                  required
                />
              </div>

              <div className="form-group">
                <label>เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  name="phone"
                  value={currentTeacher.phone}
                  onChange={handleTeacherChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>วิชาที่สอน * (คั่นด้วยเครื่องหมาย ,)</label>
                <input
                  type="text"
                  name="subjects"
                  value={currentTeacher.subjects}
                  onChange={handleTeacherChange}
                  placeholder="เช่น คณิตศาสตร์, วิทยาศาสตร์"
                  required
                />
              </div>
            </div>

            <div className="student-form-actions">
              <button type="button" onClick={handleAddTeacher} className="btn-save-student">
                ✓ เพิ่มครูนี้
              </button>
            </div>
          </div>
        )}

        <div className="students-list">
          {newTeachers.length === 0 && !showTeacherForm && (
            <p className="empty-message">ยังไม่มีครูที่เพิ่มใหม่</p>
          )}
          {newTeachers.map((teacher) => (
            <div key={teacher.id} className="student-item">
              <div className="student-info">
                <div className="student-name">
                  {teacher.firstNameTh} {teacher.lastNameTh}
                </div>
                <div className="student-detail">
                  {teacher.firstNameEn} {teacher.lastNameEn}
                </div>
                <div className="student-detail">
                  วิชาที่สอน: {teacher.subject || ''}
                </div>
                <div className="student-detail">Tel: {teacher.phone}</div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveTeacher(teacher.id)}
                className="btn-remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <h3 className="section-title">👨‍🎓 รายชื่อนักเรียน ({students.length} คน)</h3>
          <button
            type="button"
            onClick={() => setShowStudentForm(!showStudentForm)}
            className="btn-add-student"
          >
            {showStudentForm ? 'ยกเลิก' : '+ เพิ่มนักเรียน'}
          </button>
        </div>

        {showStudentForm && (
          <div className="student-form-container">
            <div className="form-grid">
              <div className="form-group">
                <label>รหัสนักเรียน *</label>
                <input
                  type="text"
                  name="studentId"
                  value={currentStudent.studentId}
                  onChange={handleStudentChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>เลขที่ *</label>
                <input
                  type="number"
                  name="studentNumber"
                  value={currentStudent.studentNumber}
                  onChange={handleStudentChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>ชื่อ (ไทย) *</label>
                <input
                  type="text"
                  name="firstNameTh"
                  value={currentStudent.firstNameTh}
                  onChange={handleStudentChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>นามสกุล (ไทย) *</label>
                <input
                  type="text"
                  name="lastNameTh"
                  value={currentStudent.lastNameTh}
                  onChange={handleStudentChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>ชื่อ (อังกฤษ) *</label>
                <input
                  type="text"
                  name="firstNameEn"
                  value={currentStudent.firstNameEn}
                  onChange={handleStudentChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>นามสกุล (อังกฤษ) *</label>
                <input
                  type="text"
                  name="lastNameEn"
                  value={currentStudent.lastNameEn}
                  onChange={handleStudentChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>ที่อยู่ *</label>
                <textarea
                  name="address"
                  value={currentStudent.address}
                  onChange={handleStudentChange}
                  rows="2"
                  required
                />
              </div>

              <div className="form-group">
                <label>เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  name="phone"
                  value={currentStudent.phone}
                  onChange={handleStudentChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>ชื่อบิดา *</label>
                <input
                  type="text"
                  name="fatherName"
                  value={currentStudent.fatherName}
                  onChange={handleStudentChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>ชื่อมารดา *</label>
                <input
                  type="text"
                  name="motherName"
                  value={currentStudent.motherName}
                  onChange={handleStudentChange}
                  required
                />
              </div>
            </div>

            <div className="student-form-actions">
              <button type="button" onClick={handleAddStudent} className="btn-save-student">
                ✓ เพิ่มนักเรียนนี้
              </button>
            </div>
          </div>
        )}

        <div className="students-list">
          {students.length === 0 && !showStudentForm && (
            <p className="empty-message">ยังไม่มีนักเรียนในห้องนี้</p>
          )}
          {students.map((student) => (
            <div key={student.id} className="student-item">
              <div className="student-info">
                <div className="student-name">
                  {student.studentNumber}. {student.firstNameTh} {student.lastNameTh}
                </div>
                <div className="student-detail">รหัส: {student.studentId}</div>
                <div className="student-detail">
                  {student.firstNameEn} {student.lastNameEn}
                </div>
                <div className="student-detail">Tel: {student.phone}</div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveStudent(student.id)}
                className="btn-remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit">
          ✓ บันทึกห้องเรียน
        </button>
        <button type="button" onClick={onCancel} className="btn-cancel">
          ยกเลิก
        </button>
      </div>
    </form>
  );
};

export default ClassroomFullForm;
