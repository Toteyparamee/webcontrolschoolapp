import { useState, useCallback, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import StudentForm from '../components/StudentForm';
import TeacherForm from '../components/TeacherForm';
import ClassroomForm from '../components/ClassroomForm';
import ClassroomFullForm from '../components/ClassroomFullForm';
import StudentBatchUploadForm from '../components/StudentBatchUploadForm';
import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';
import '../css/PersonnelManagementPage.css';

// ดึง school_id จาก JWT payload
const getSchoolIdFromToken = () => {
  const token = sessionStorage.getItem('access_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.school_id ?? null;
  } catch {
    return null;
  }
};

const PersonnelManagementPage = () => {
  console.log('🏫 PersonnelManagementPage rendered');

  const { schools, addStudent, addStudentsBatch, deleteStudent, addTeacher, deleteTeacher, addClassroom, updateClassroom } = useSchool();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const editorSchoolId = !isAdmin ? getSchoolIdFromToken() : null;
  const [activeTab, setActiveTab] = useState('students');
  const [selectedSchool, setSelectedSchool] = useState(
    !isAdmin && editorSchoolId ? editorSchoolId : schools[0]?.id || null
  );

  // สำหรับ editor — ล็อค school ให้เป็นของตัวเองเสมอ (กรณี schools โหลดทีหลัง)
  useEffect(() => {
    if (!isAdmin && editorSchoolId && selectedSchool !== editorSchoolId) {
      setSelectedSchool(editorSchoolId);
    }
  }, [isAdmin, editorSchoolId, selectedSchool]);
  const [showAddClassroomForm, setShowAddClassroomForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(null);
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [showBatchUploadForm, setShowBatchUploadForm] = useState(false);
  const [selectedClassroomForUpload, setSelectedClassroomForUpload] = useState(null);

  const school = schools.find(s => s.id === selectedSchool);

  const handleAddClassroom = (data) => {
    if (selectedSchool) {
      // เพิ่มครูใหม่ทั้งหมดก่อน
      data.teachers.forEach(teacher => {
        addTeacher(selectedSchool, teacher);
      });

      // สร้างชื่อห้องเรียนอัตโนมัติ
      const newClassroomId = school.classrooms.length > 0
        ? Math.max(...school.classrooms.map(c => c.id)) + 1
        : 1;

      const classroomName = `ห้อง ${newClassroomId}`;

      // เพิ่มห้องเรียนโดยใส่ชื่อห้องอัตโนมัติ
      addClassroom(selectedSchool, {
        ...data.classroom,
        name: classroomName
      });

      // เพิ่มนักเรียนทั้งหมดในห้องนี้
      data.students.forEach(student => {
        // ใช้ setTimeout เพื่อให้ห้องเรียนถูกสร้างก่อน
        setTimeout(() => {
          addStudent(selectedSchool, newClassroomId, student);
        }, 100);
      });

      setShowAddClassroomForm(false);
    }
  };

  const handleEditClassroom = (classroomData) => {
    if (selectedSchool && editingClassroom) {
      updateClassroom(selectedSchool, editingClassroom.id, classroomData);
      setEditingClassroom(null);
    }
  };

  const handleAddStudent = (studentData, classroomId) => {
    if (selectedSchool) {
      addStudent(selectedSchool, classroomId, studentData);
      setShowAddStudentForm(null);
    }
  };

  const handleBatchUpload = useCallback(async (data) => {
    console.log('📋📋📋 handleBatchUpload ENTERED!', {
      data,
      selectedSchool,
      selectedClassroomForUpload,
      hasFile: !!data?.file,
      hasProgressCallback: !!data?.onProgress,
      timestamp: new Date().toISOString()
    });

    try {
      if (selectedSchool && selectedClassroomForUpload && data.file) {
        console.log('✅ Conditions met, calling addStudentsBatch...');
        await addStudentsBatch(selectedSchool, selectedClassroomForUpload, data.file, data.onProgress);
        console.log('🎉 addStudentsBatch completed!');
        setShowBatchUploadForm(false);
        setSelectedClassroomForUpload(null);
      } else {
        console.warn('❌ Conditions not met:', {
          selectedSchool: !!selectedSchool,
          selectedClassroomForUpload: !!selectedClassroomForUpload,
          hasFile: !!data?.file
        });
      }
    } catch (error) {
      console.error('💥 Failed to upload students:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดข้อมูล: ' + error.message);
    }
  }, [selectedSchool, selectedClassroomForUpload, addStudentsBatch]);

  const handleAddTeacher = (teacherData) => {
    if (selectedSchool) {
      addTeacher(selectedSchool, teacherData);
      setShowAddTeacherForm(false);
    }
  };

  const handleDeleteStudent = (classroomId, studentId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบนักเรียนคนนี้?') && selectedSchool) {
      deleteStudent(selectedSchool, classroomId, studentId);
    }
  };

  const handleDeleteTeacher = (teacherId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบครูท่านนี้?') && selectedSchool) {
      deleteTeacher(selectedSchool, teacherId);
    }
  };

  if (!school) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="page-container">
            <div className="page-header-simple">
              <h1>จัดการบุคลากร</h1>
            </div>
            <div className="empty-state">
              <p>ไม่พบข้อมูลโรงเรียนในระบบ</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-container">
          <div className="page-header-simple">
            <h1>จัดการบุคลากร</h1>
            {isAdmin && schools.length > 1 && (
              <div className="school-selector">
                <label>เลือกโรงเรียน:</label>
                <select
                  value={selectedSchool || ''}
                  onChange={(e) => setSelectedSchool(parseInt(e.target.value))}
                  className="school-select"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

      <div className="school-info-banner">
        <h2>{school.name}</h2>
        <p>{school.address}</p>
        <div className="stats">
          <span className="stat-item">
            <strong>{school.classrooms.length}</strong> ห้องเรียน
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-item">
            <strong>{school.classrooms.reduce((sum, c) => sum + c.students.length, 0)}</strong> นักเรียน
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-item">
            <strong>{school.teachers.length}</strong> ครู
          </span>
        </div>
      </div>

      <div className="personnel-content">
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
        </div>

        {activeTab === 'students' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>ห้องเรียน</h2>
              <button
                onClick={() => {
                  setShowAddClassroomForm(true);
                  setEditingClassroom(null);
                }}
                className="btn-add"
              >
                + เพิ่มห้องเรียน
              </button>
            </div>

            <Modal
              isOpen={showAddClassroomForm}
              onClose={() => setShowAddClassroomForm(false)}
              title="🏫 เพิ่มห้องเรียนใหม่"
              size="large"
            >
              <ClassroomFullForm
                onSubmit={handleAddClassroom}
                onCancel={() => setShowAddClassroomForm(false)}
                teachers={school.teachers}
              />
            </Modal>

            <Modal
              isOpen={!!editingClassroom}
              onClose={() => setEditingClassroom(null)}
              title="✏️ แก้ไขห้องเรียน"
              size="medium"
            >
              <ClassroomForm
                onSubmit={handleEditClassroom}
                onCancel={() => setEditingClassroom(null)}
                teachers={school.teachers}
                initialData={editingClassroom}
              />
            </Modal>

            <Modal
              isOpen={showBatchUploadForm}
              onClose={() => {
                setShowBatchUploadForm(false);
                setSelectedClassroomForUpload(null);
              }}
              title="📤 อัพโหลดข้อมูลนักเรียนจากไฟล์"
              size="large"
            >
              <StudentBatchUploadForm
                onSubmit={handleBatchUpload}
                onCancel={() => {
                  setShowBatchUploadForm(false);
                  setSelectedClassroomForUpload(null);
                }}
              />
            </Modal>

            <div className="classrooms-grid">
              {school.classrooms.map((classroom) => {
                const homeroomTeacher = school.teachers.find(t => t.id === classroom.homeroomTeacherId);
                return (
                  <div key={classroom.id} className="classroom-card">
                    <div className="classroom-header">
                      <div className="classroom-title">
                        <h3>{classroom.name}</h3>
                        <span className="badge">{classroom.students.length} คน</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingClassroom(classroom);
                          setShowAddClassroomForm(false);
                        }}
                        className="btn-edit"
                        title="แก้ไขห้องเรียน"
                      >
                        ✏️ แก้ไข
                      </button>
                    </div>

                    {homeroomTeacher && (
                      <div className="homeroom-teacher-info">
                        <span className="teacher-label">👨‍🏫 ครูประจำชั้น:</span>
                        <span className="teacher-name">
                          {homeroomTeacher.firstNameTh} {homeroomTeacher.lastNameTh}
                        </span>
                      </div>
                    )}
                    {!homeroomTeacher && (
                      <div className="homeroom-teacher-info no-teacher">
                        <span className="teacher-label">👨‍🏫 ครูประจำชั้น:</span>
                        <span className="no-teacher-text">ยังไม่ได้กำหนด</span>
                      </div>
                    )}

                  <div className="students-list">
                    {classroom.students.map((student) => (
                      <div key={student.id} className="person-item">
                        <div className="person-info">
                          <div className="person-name">
                            {student.studentNumber}. {student.firstNameTh} {student.lastNameTh}
                          </div>
                          <div className="person-detail">รหัส: {student.studentId}</div>
                          <div className="person-detail">
                            {student.firstNameEn} {student.lastNameEn}
                          </div>
                          <div className="person-detail">Tel: {student.phone}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteStudent(classroom.id, student.id)}
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
                    <div className="classroom-actions">
                      <button
                        onClick={() => setShowAddStudentForm(classroom.id)}
                        className="btn-add-person"
                      >
                        + เพิ่มนักเรียน
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClassroomForUpload(classroom.id);
                          setShowBatchUploadForm(true);
                        }}
                        className="btn-upload"
                        title="อัพโหลดไฟล์ Excel/CSV"
                      >
                        📤 อัพโหลดไฟล์
                      </button>
                    </div>
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
                onClick={() => setShowAddTeacherForm(!showAddTeacherForm)}
                className="btn-add"
              >
                {showAddTeacherForm ? 'ยกเลิก' : '+ เพิ่มครู'}
              </button>
            </div>

            {showAddTeacherForm && (
              <TeacherForm
                onSubmit={handleAddTeacher}
                onCancel={() => setShowAddTeacherForm(false)}
                classrooms={school.classrooms}
              />
            )}

            <div className="teachers-grid">
              {school.teachers.map((teacher) => {
                return (
                  <div key={teacher.id} className="teacher-card">
                    <div className="person-info">
                      <h4>{teacher.title_th || ''} {teacher.first_name_th} {teacher.last_name_th}</h4>
                      <p className="person-name-en">{teacher.first_name_en} {teacher.last_name_en}</p>
                      <p className="person-detail">รหัส: {teacher.teacher_id}</p>
                      {teacher.address && (
                        <p className="person-detail">ที่อยู่: {teacher.address}</p>
                      )}
                      {teacher.phone && (
                        <p className="person-detail">Tel: {teacher.phone}</p>
                      )}
                      {teacher.homeroom_class && (
                        <p className="person-detail">👨‍🏫 ห้องประจำชั้น: {teacher.homeroom_class}</p>
                      )}
                      {teacher.subject && (
                        <div className="subjects-section">
                          <strong>วิชาที่สอน:</strong>
                          <div className="subjects-tags">
                            <span className="subject-tag">{teacher.subject}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.id)}
                      className="btn-delete"
                    >
                      ลบ
                    </button>
                  </div>
                );
              })}
            </div>

            {school.teachers.length === 0 && (
              <div className="empty-state">
                <p>ยังไม่มีครูในโรงเรียนนี้</p>
              </div>
            )}
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelManagementPage;
