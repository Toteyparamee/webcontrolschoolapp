import { useState, useCallback, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import StudentForm from '../components/StudentForm';
import StudentDetailModal from '../components/StudentDetailModal';
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

  const { schools, addStudent, addStudentsBatch, deleteStudent, updateStudent, addTeacher, deleteTeacher, addClassroom, updateClassroom, deleteClassroom } = useSchool();
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
  const [viewStudentId, setViewStudentId] = useState(null);
  const [editNumberStudent, setEditNumberStudent] = useState(null); // { classroomId, studentId, currentNumber }
  const [editNumberValue, setEditNumberValue] = useState('');
  const editNumberRef = useRef(null);

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

  const handleEditClassroom = async (classroomData) => {
    if (selectedSchool && editingClassroom) {
      try {
        await updateClassroom(selectedSchool, editingClassroom.id, classroomData);
        setEditingClassroom(null);
      } catch (err) {
        alert('แก้ไขห้องเรียนไม่สำเร็จ: ' + (err.message || err));
      }
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

  const [deleteStudentDialog, setDeleteStudentDialog] = useState(null);

  const handleDeleteStudent = (classroomId, studentId) => {
    setDeleteStudentDialog({ classroomId, studentId });
  };

  const confirmDeleteStudent = async (deleteUser) => {
    const { classroomId, studentId } = deleteStudentDialog;
    setDeleteStudentDialog(null);
    try {
      await deleteStudent(selectedSchool, classroomId, studentId, deleteUser);
    } catch (err) {
      alert('ลบนักเรียนไม่สำเร็จ: ' + (err.message || err));
    }
  };

  const handleDeleteTeacher = (teacherId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบครูท่านนี้?') && selectedSchool) {
      deleteTeacher(selectedSchool, teacherId);
    }
  };

  const handleSaveStudentNumber = async (classroomId, studentId) => {
    const num = parseInt(editNumberValue);
    if (isNaN(num) || num < 1) { alert('กรุณากรอกเลขที่ที่ถูกต้อง'); return; }
    try {
      await updateStudent(selectedSchool, classroomId, studentId, { student_number: num });
      setEditNumberStudent(null);
    } catch (err) {
      alert('แก้เลขที่ไม่สำเร็จ: ' + (err.message || err));
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
      <StudentDetailModal
        isOpen={!!viewStudentId}
        onClose={() => setViewStudentId(null)}
        studentId={viewStudentId}
        onUpdate={async (body) => {
          if (viewStudentId) {
            const s = school?.classrooms.flatMap(c => c.students).find(s => s.id === viewStudentId);
            if (s) {
              const cls = school.classrooms.find(c => c.students.some(st => st.id === viewStudentId));
              await updateStudent(selectedSchool, cls?.id, viewStudentId, body);
            }
          }
        }}
      />
      {deleteStudentDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '28px 32px',
            minWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>ลบนักเรียน</h3>
            <p style={{ margin: '0 0 24px', color: '#555', fontSize: 14 }}>
              ต้องการลบอะไรบ้าง?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => confirmDeleteStudent(false)}
                style={{
                  padding: '10px 0', background: '#ff9800', color: '#fff',
                  border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                ลบเฉพาะนักเรียน
              </button>
              <button
                onClick={() => confirmDeleteStudent(true)}
                style={{
                  padding: '10px 0', background: '#f44336', color: '#fff',
                  border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                ลบนักเรียน + บัญชีผู้ใช้
              </button>
              <button
                onClick={() => setDeleteStudentDialog(null)}
                style={{
                  padding: '10px 0', background: '#eee', color: '#555',
                  border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14,
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
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
                          <button
                            className="btn-remove-student"
                            title="ลบห้องเรียน"
                            onClick={() => {
                              if (window.confirm(`ลบห้องเรียน "${classroom.name}" และนักเรียนทั้งหมดในห้อง?`)) {
                                deleteClassroom(selectedSchool, classroom.id);
                              }
                            }}
                          >
                            ✕
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
                                  {editNumberStudent?.studentId === student.id ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <input
                                        ref={editNumberRef}
                                        type="number"
                                        min="1"
                                        value={editNumberValue}
                                        onChange={e => setEditNumberValue(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleSaveStudentNumber(classroom.id, student.id);
                                          if (e.key === 'Escape') setEditNumberStudent(null);
                                        }}
                                        style={{ width: 60, padding: '2px 6px', borderRadius: 4, border: '1px solid #667eea', fontSize: 14 }}
                                        autoFocus
                                      />
                                      <button onClick={() => handleSaveStudentNumber(classroom.id, student.id)} style={{ padding: '2px 8px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>✓</button>
                                      <button onClick={() => setEditNumberStudent(null)} style={{ padding: '2px 8px', background: '#9e9e9e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>✕</button>
                                    </span>
                                  ) : (
                                    <>{student.studentNumber}. </>
                                  )}
                                  {student.firstNameTh} {student.lastNameTh}
                                </div>
                                <div className="person-detail">รหัส: {student.studentId}</div>
                                <div className="person-detail">
                                  {student.firstNameEn} {student.lastNameEn}
                                </div>
                                <div className="person-detail">Tel: {student.phone}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button
                                  onClick={() => setViewStudentId(student.id)}
                                  className="btn-view-student"
                                >
                                  ดูข้อมูล
                                </button>
                                {isAdmin && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditNumberStudent({ classroomId: classroom.id, studentId: student.id });
                                        setEditNumberValue(student.studentNumber ?? '');
                                      }}
                                      className="btn-edit-number"
                                    >
                                      แก้เลขที่
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudent(classroom.id, student.id)}
                                      className="btn-delete"
                                    >
                                      ลบ
                                    </button>
                                  </>
                                )}
                              </div>
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
                    existingTeacherCodes={school.teachers.map(t => t.teacherCode || t.teacherId || '').filter(Boolean)}
                    schoolId={selectedSchool}
                  />
                )}

                <div className="teachers-grid">
                  {school.teachers.map((teacher) => {
                    return (
                      <div key={teacher.id} className="teacher-card">
                        <div className="person-info">
                          <h4>{teacher.titleTh} {teacher.firstNameTh} {teacher.lastNameTh}</h4>
                          <p className="person-detail">รหัส: {teacher.teacherCode || '-'}</p>
                          <p className="person-name-en">{teacher.firstNameEn} {teacher.lastNameEn}</p>
                          {teacher.address && (
                            <p className="person-detail">ที่อยู่: {teacher.address}</p>
                          )}
                          {teacher.phone && (
                            <p className="person-detail">Tel: {teacher.phone}</p>
                          )}
                          {teacher.homeroomClass && (
                            <p className="person-detail">👨‍🏫 ห้องประจำชั้น: {teacher.homeroomClass}</p>
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
