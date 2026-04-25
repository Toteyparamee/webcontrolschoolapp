import { useState } from 'react';
import StudentForm from './StudentForm';
import TeacherForm from './TeacherForm';
import StudentBatchUploadForm from './StudentBatchUploadForm';
import StudentDetailModal from './StudentDetailModal';
import ScheduleManagement from './ScheduleManagement';
import BehaviorManagement from './BehaviorManagement';
import '../css/PersonnelManagement.css';

const PersonnelManagement = ({
  school,
  onAddStudent,
  onAddStudentsBatch,
  onUpdateStudent,
  onDeleteStudent,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher
}) => {
  const [activeTab, setActiveTab] = useState('students');
  const [showAddStudentForm, setShowAddStudentForm] = useState(null);
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [showBatchUploadForm, setShowBatchUploadForm] = useState(false);
  const [showAddStudentMenu, setShowAddStudentMenu] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const handleAddStudent = (studentData, classroomId) => {
    onAddStudent(classroomId, studentData);
    setShowAddStudentForm(null);
  };

  const handleAddTeacher = (teacherData) => {
    if (editingTeacher) {
      // แก้ไขครู
      onUpdateTeacher(teacherData);
    } else {
      // เพิ่มครูใหม่
      onAddTeacher(teacherData);
    }
    setShowAddTeacherForm(false);
    setEditingTeacher(null);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setShowAddTeacherForm(true);
  };

  const handleBatchUpload = async (data) => {
    console.log('📋 PersonnelManagement handleBatchUpload called with:', data);
    try {
      if (data.file && onAddStudentsBatch) {
        console.log('✅ Calling onAddStudentsBatch with file:', data.file.name);
        // ส่ง file (schoolId และ classroomId ไม่จำเป็นสำหรับ API)
        await onAddStudentsBatch(data.file);
        console.log('🎉 Upload completed!');
      } else {
        console.warn('❌ Missing required data:', {
          hasFile: !!data.file,
          hasOnAddStudentsBatch: !!onAddStudentsBatch
        });
      }
      setShowBatchUploadForm(false);
    } catch (error) {
      console.error('Failed to upload students:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดข้อมูล: ' + error.message);
    }
  };

  return (
    <div className="personnel-management">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          นักเรียน ({school.classrooms.reduce((sum, c) => sum + c.students.length, 0)} คน)
        </button>
        <button
          className={`tab ${activeTab === 'teachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('teachers')}
        >
          ครู ({school.teachers.length} คน)
        </button>
        <button
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          ระบบจัดการตารางสอน
        </button>
        <button
          className={`tab ${activeTab === 'behavior' ? 'active' : ''}`}
          onClick={() => setActiveTab('behavior')}
        >
          คะแนนพฤติกรรม
        </button>
      </div>

      {activeTab === 'students' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>ห้องเรียน</h2>
            <div className="header-actions">
              <div className="student-add-dropdown">
                <button
                  onClick={() => setShowAddStudentMenu(!showAddStudentMenu)}
                  className="btn-add btn-add-student"
                >
                  + เพิ่มนักเรียน
                </button>
                {showAddStudentMenu && (
                  <div className="dropdown-menu">
                    <button
                      onClick={() => {
                        setShowBatchUploadForm(true);
                        setShowAddStudentMenu(false);
                      }}
                      className="dropdown-item"
                    >
                      อัพโหลดไฟล์ (Excel/CSV)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showBatchUploadForm && (
            <StudentBatchUploadForm
              onSubmit={handleBatchUpload}
              onCancel={() => setShowBatchUploadForm(false)}
            />
          )}

          <div className="classrooms-grid">
            {school.classrooms.map((classroom) => {
              // หาครูประจำชั้นจาก homeroom_class
              const homeroomTeacher = school.teachers.find(
                teacher => teacher.homeroomClass === classroom.name
              );

              return (
                <div key={classroom.id} className="classroom-card">
                  <div className="classroom-header">
                    <h3>{classroom.name}</h3>
                    <span className="badge">{classroom.students.length} คน</span>
                  </div>

                  {homeroomTeacher && (
                    <div className="homeroom-teacher-info">
                      <strong>👨‍🏫 ครูประจำชั้น:</strong> {homeroomTeacher.titleTh} {homeroomTeacher.firstNameTh} {homeroomTeacher.lastNameTh}
                    </div>
                  )}

                  <div className="students-list">
                  {classroom.students.map((student) => (
                    <div key={student.id} className="person-item">
                      <div className="person-info" onClick={() => setSelectedStudentId(student.id)} style={{ cursor: 'pointer' }}>
                        <div className="person-name student-name-link">
                          {student.studentNumber ?? '-'}. {student.firstNameTh} {student.lastNameTh}
                        </div>
                        <div className="person-detail">รหัส: {student.studentId}</div>
                        <div className="person-detail">
                          {student.firstNameEn} {student.lastNameEn}
                        </div>
                        <div className="person-detail">Tel: {student.phone}</div>
                      </div>
                      <button
                        onClick={async () => {
                          const current = student.studentNumber ?? '';
                          const input = window.prompt(
                            `แก้เลขที่นักเรียน "${student.firstNameTh} ${student.lastNameTh}"\n(ใส่เลขจำนวนเต็ม หรือว่างเพื่อล้าง)`,
                            String(current)
                          );
                          if (input === null) return; // user cancelled
                          const trimmed = input.trim();
                          let value = null;
                          if (trimmed !== '') {
                            const n = parseInt(trimmed, 10);
                            if (isNaN(n) || n < 1) {
                              alert('กรุณาใส่เลขจำนวนเต็มที่มากกว่า 0');
                              return;
                            }
                            value = n;
                          }
                          try {
                            await onUpdateStudent(classroom.id, student.id, { student_number: value });
                          } catch (err) {
                            alert('แก้ไขเลขที่ล้มเหลว: ' + (err.message || err));
                          }
                        }}
                        className="btn-edit"
                        style={{ marginRight: 4 }}
                      >
                        แก้เลขที่
                      </button>
                      <button
                        onClick={() => onDeleteStudent(classroom.id, student.id)}
                        className="btn-delete"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}

                  {classroom.students.length === 0 && (
                    <p className="empty-message">ยังไม่มีนักเรียนในห้องนี้</p>
                  )}
                </div>

                {showAddStudentForm === classroom.id ? (
                  <StudentForm
                    onSubmit={(data) => handleAddStudent(data, classroom.id)}
                    onCancel={() => setShowAddStudentForm(null)}
                  />
                ) : (
                  <button
                    onClick={() => setShowAddStudentForm(classroom.id)}
                    className="btn-add-person"
                  >
                    + เพิ่มนักเรียน
                  </button>
                )}
              </div>
              );
            })}
          </div>

          {school.classrooms.length === 0 && (
            <div className="empty-state">
              <p>ยังไม่มีห้องเรียนในโรงเรียนนี้</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>รายชื่อครู</h2>
            <button
              onClick={() => {
                setShowAddTeacherForm(!showAddTeacherForm);
                setEditingTeacher(null);
              }}
              className="btn-add"
            >
              {showAddTeacherForm ? 'ยกเลิก' : '+ เพิ่มครู'}
            </button>
          </div>

          {showAddTeacherForm && (
            <TeacherForm
              onSubmit={handleAddTeacher}
              onCancel={() => {
                setShowAddTeacherForm(false);
                setEditingTeacher(null);
              }}
              classrooms={school.classrooms || []}
              schoolId={school.id}
              editingTeacher={editingTeacher}
            />
          )}

          <div className="teachers-grid">
            {school.teachers.map((teacher) => (
              <div key={teacher.id} className="teacher-card">
                <div className="person-info">
                  <h4>{teacher.firstNameTh} {teacher.lastNameTh}</h4>
                  <p className="person-name-en">{teacher.firstNameEn} {teacher.lastNameEn}</p>
                  <p className="person-detail">ที่อยู่: {teacher.address}</p>
                  <p className="person-detail">Tel: {teacher.phone}</p>
                  {teacher.subject && (
                    <div className="subjects-section">
                      <strong>วิชาที่สอน:</strong>
                      <div className="subjects-tags">
                        <span className="subject-tag">{teacher.subject}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="teacher-actions">
                  <button
                    onClick={() => handleEditTeacher(teacher)}
                    className="btn-edit"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => onDeleteTeacher(teacher.id)}
                    className="btn-delete"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>

          {school.teachers.length === 0 && (
            <div className="empty-state">
              <p>ยังไม่มีครูในโรงเรียนนี้</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="tab-content">
          <ScheduleManagement school={school} />
        </div>
      )}

      {activeTab === 'behavior' && (
        <div className="tab-content">
          <BehaviorManagement />
        </div>
      )}

      <StudentDetailModal
        isOpen={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        studentId={selectedStudentId}
      />
    </div>
  );
};

export default PersonnelManagement;
