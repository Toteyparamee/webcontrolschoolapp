import { useState } from 'react';
import StudentForm from './StudentForm';
import TeacherForm from './TeacherForm';
import StudentBatchUploadForm from './StudentBatchUploadForm';
import StudentDetailModal from './StudentDetailModal';
import TeacherDetailModal from './TeacherDetailModal';
import ScheduleManagement from './ScheduleManagement';
import BehaviorManagement from './BehaviorManagement';
import '../css/PersonnelManagement.css';

const emptyStudent = () => ({
  studentId: '',
  studentNumber: '',
  firstNameTh: '',
  lastNameTh: '',
  firstNameEn: '',
  lastNameEn: '',
  address: '',
  phone: '',
  fatherName: '',
  motherName: '',
});

const PersonnelManagement = ({
  school,
  onAddStudent,
  onAddStudentsBatch,
  onUpdateStudent,
  onDeleteStudent,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onAddClassroom,
  onDeleteClassroom,
}) => {
  const [activeTab, setActiveTab] = useState('students');
  const [showAddStudentForm, setShowAddStudentForm] = useState(null);
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [showBatchUploadForm, setShowBatchUploadForm] = useState(false);
  const [showManualAddForm, setShowManualAddForm] = useState(false);
  const [manualAddClassroomId, setManualAddClassroomId] = useState('');
  const [showAddStudentMenu, setShowAddStudentMenu] = useState(false);
  const [showNewClassroomFlow, setShowNewClassroomFlow] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [newClassroomStudents, setNewClassroomStudents] = useState([emptyStudent()]);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null); // { studentId, classroomId }
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [deleteStudentDialog, setDeleteStudentDialog] = useState(null); // { classroomId, studentId }

  const confirmDeleteStudent = async (deleteUser) => {
    const { classroomId, studentId } = deleteStudentDialog;
    setDeleteStudentDialog(null);
    try {
      await onDeleteStudent(classroomId, studentId, deleteUser);
    } catch (err) {
      alert('ลบนักเรียนไม่สำเร็จ: ' + (err.message || err));
    }
  };

  const handleAddStudent = (studentData, classroomId) => {
    onAddStudent(classroomId, studentData);
    setShowAddStudentForm(null);
  };

  const handleStudentUpdate = (body) => {
    if (!selectedStudent) return Promise.resolve();
    return onUpdateStudent(selectedStudent.classroomId, selectedStudent.dbId, body);
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

  const handleTeacherDetailUpdate = async (teacherData) => {
    await onUpdateTeacher(teacherData);
    // sync local selection so modal reflects new values immediately
    setSelectedTeacher((prev) => (prev ? {
      ...prev,
      teacherId: teacherData.teacher_id,
      titleTh: teacherData.title_th,
      firstNameTh: teacherData.first_name_th,
      lastNameTh: teacherData.last_name_th,
      firstNameEn: teacherData.first_name_en,
      lastNameEn: teacherData.last_name_en,
      address: teacherData.address,
      phone: teacherData.phone,
      subject: teacherData.subject,
      homeroomClass: teacherData.homeroom_class,
    } : prev));
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
            <p style={{ margin: '0 0 24px', color: '#555', fontSize: 14 }}>ต้องการลบอะไรบ้าง?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => confirmDeleteStudent(false)} style={{ padding: '10px 0', background: '#ff9800', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                ลบเฉพาะนักเรียน
              </button>
              <button onClick={() => confirmDeleteStudent(true)} style={{ padding: '10px 0', background: '#f44336', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                ลบนักเรียน + บัญชีผู้ใช้
              </button>
              <button onClick={() => setDeleteStudentDialog(null)} style={{ padding: '10px 0', background: '#eee', color: '#555', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 }}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
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
                        setShowManualAddForm(true);
                        setShowNewClassroomFlow(false);
                        setShowBatchUploadForm(false);
                        setManualAddClassroomId(school.classrooms[0]?.id?.toString() || '');
                        setShowAddStudentMenu(false);
                      }}
                      className="dropdown-item"
                    >
                      กรอกข้อมูลเอง
                    </button>
                    <button
                      onClick={() => {
                        setShowNewClassroomFlow(true);
                        setShowManualAddForm(false);
                        setShowBatchUploadForm(false);
                        setNewClassroomName('');
                        setNewClassroomStudents([emptyStudent()]);
                        setShowAddStudentMenu(false);
                      }}
                      className="dropdown-item"
                    >
                      สร้างห้องเรียนใหม่ + เพิ่มนักเรียน
                    </button>
                    <button
                      onClick={() => {
                        setShowBatchUploadForm(true);
                        setShowManualAddForm(false);
                        setShowNewClassroomFlow(false);
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

          {showManualAddForm && (
            <div className="manual-add-wrapper">
              {school.classrooms.length === 0 ? (
                <div className="no-classroom-notice">
                  <p>ยังไม่มีห้องเรียน กรุณาเลือก "สร้างห้องเรียนใหม่ + เพิ่มนักเรียน" แทน</p>
                  <div className="no-classroom-actions">
                    <button
                      className="btn-submit"
                      onClick={() => {
                        setShowManualAddForm(false);
                        setShowNewClassroomFlow(true);
                        setNewClassroomName('');
                        setNewClassroomStudents([emptyStudent()]);
                      }}
                    >
                      สร้างห้องเรียนใหม่
                    </button>
                    <button className="btn-cancel" onClick={() => setShowManualAddForm(false)}>
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group manual-add-classroom-select">
                    <label>ห้องเรียน</label>
                    <select
                      value={manualAddClassroomId}
                      onChange={(e) => setManualAddClassroomId(e.target.value)}
                      className="classroom-select"
                    >
                      {school.classrooms.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <StudentForm
                    onSubmit={(data) => {
                      if (!manualAddClassroomId) return;
                      handleAddStudent(data, parseInt(manualAddClassroomId));
                    }}
                    onCancel={() => setShowManualAddForm(false)}
                    multiMode
                  />
                </>
              )}
            </div>
          )}

          {showNewClassroomFlow && (
            <div className="manual-add-wrapper">
              <h3 style={{ marginBottom: 12 }}>สร้างห้องเรียนใหม่ + เพิ่มนักเรียน</h3>

              <div className="form-group manual-add-classroom-select">
                <label>ชื่อห้องเรียน *</label>
                <input
                  type="text"
                  value={newClassroomName}
                  onChange={(e) => setNewClassroomName(e.target.value)}
                  placeholder="เช่น ม.1/1"
                  className="classroom-select"
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  รายชื่อนักเรียน
                </label>
                {newClassroomStudents.map((student, index) => (
                  <div key={index} className="new-classroom-student-row">
                    <span className="student-row-number">คนที่ {index + 1}</span>
                    <div className="student-row-fields">
                      <input
                        type="text"
                        placeholder="รหัสนักเรียน *"
                        value={student.studentId}
                        onChange={(e) => {
                          const updated = [...newClassroomStudents];
                          updated[index] = { ...updated[index], studentId: e.target.value };
                          setNewClassroomStudents(updated);
                        }}
                      />
                      <input
                        type="number"
                        placeholder="เลขที่ *"
                        value={student.studentNumber}
                        onChange={(e) => {
                          const updated = [...newClassroomStudents];
                          updated[index] = { ...updated[index], studentNumber: e.target.value };
                          setNewClassroomStudents(updated);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="ชื่อ (ไทย) *"
                        value={student.firstNameTh}
                        onChange={(e) => {
                          const updated = [...newClassroomStudents];
                          updated[index] = { ...updated[index], firstNameTh: e.target.value };
                          setNewClassroomStudents(updated);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="นามสกุล (ไทย) *"
                        value={student.lastNameTh}
                        onChange={(e) => {
                          const updated = [...newClassroomStudents];
                          updated[index] = { ...updated[index], lastNameTh: e.target.value };
                          setNewClassroomStudents(updated);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="ชื่อ (อังกฤษ)"
                        value={student.firstNameEn}
                        onChange={(e) => {
                          const updated = [...newClassroomStudents];
                          updated[index] = { ...updated[index], firstNameEn: e.target.value };
                          setNewClassroomStudents(updated);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="นามสกุล (อังกฤษ)"
                        value={student.lastNameEn}
                        onChange={(e) => {
                          const updated = [...newClassroomStudents];
                          updated[index] = { ...updated[index], lastNameEn: e.target.value };
                          setNewClassroomStudents(updated);
                        }}
                      />
                      <input
                        type="tel"
                        placeholder="เบอร์โทรศัพท์"
                        value={student.phone}
                        onChange={(e) => {
                          const updated = [...newClassroomStudents];
                          updated[index] = { ...updated[index], phone: e.target.value };
                          setNewClassroomStudents(updated);
                        }}
                      />
                    </div>
                    {newClassroomStudents.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-student"
                        onClick={() => setNewClassroomStudents(newClassroomStudents.filter((_, i) => i !== index))}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-row"
                  onClick={() => setNewClassroomStudents([...newClassroomStudents, emptyStudent()])}
                >
                  + เพิ่มนักเรียนอีกคน
                </button>
              </div>

              <div className="form-actions" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={async () => {
                    if (!newClassroomName.trim()) {
                      alert('กรุณากรอกชื่อห้องเรียน');
                      return;
                    }
                    try {
                      const created = await onAddClassroom({ name: newClassroomName.trim() });
                      console.log('🏫 created from onAddClassroom:', created);
                      if (created?.id) {
                        const validStudents = newClassroomStudents.filter(s => s.studentId && s.firstNameTh && s.lastNameTh);
                        for (const s of validStudents) {
                          await onAddStudent(created.id, { ...s, studentNumber: parseInt(s.studentNumber) || 0 }, created.grade, created.section);
                        }
                      }
                      setShowNewClassroomFlow(false);
                      setNewClassroomName('');
                      setNewClassroomStudents([emptyStudent()]);
                    } catch (err) {
                      alert('เกิดข้อผิดพลาด: ' + err.message);
                    }
                  }}
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowNewClassroomFlow(false);
                    setNewClassroomName('');
                    setNewClassroomStudents([emptyStudent()]);
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge">{classroom.students.length} คน</span>
                      <button
                        className="btn-remove-student"
                        title="ลบห้องเรียน"
                        onClick={() => {
                          const studentCount = classroom.students.length;
                          const msg = studentCount > 0
                            ? `ห้องเรียน "${classroom.name}" มีนักเรียน ${studentCount} คน\n\nต้องการลบห้องเรียนและนักเรียนทั้งหมดในห้องหรือไม่?`
                            : `ต้องการลบห้องเรียน "${classroom.name}" หรือไม่?`;
                          if (window.confirm(msg)) {
                            onDeleteClassroom(classroom.id, studentCount > 0);
                          }
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {homeroomTeacher && (
                    <div className="homeroom-teacher-info">
                      <strong>👨‍🏫 ครูประจำชั้น:</strong> {homeroomTeacher.titleTh} {homeroomTeacher.firstNameTh} {homeroomTeacher.lastNameTh}
                    </div>
                  )}

                  <div className="students-list">
                    {classroom.students.map((student) => (
                      <div key={student.id} className="person-item">
                        <div
                          className="person-info"
                          onClick={() => setSelectedStudent({ studentId: student.studentId, dbId: student.id, classroomId: classroom.id })}
                          style={{ cursor: 'pointer' }}
                        >
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
                          onClick={() => setSelectedStudent({ studentId: student.studentId, dbId: student.id, classroomId: classroom.id })}
                          className="btn-edit"
                          style={{ marginRight: 4 }}
                        >
                          ดูข้อมูล
                        </button>
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
                          onClick={() => setDeleteStudentDialog({ classroomId: classroom.id, studentId: student.id })}
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
                <div
                  className="person-info teacher-name-link"
                  onClick={() => setSelectedTeacher(teacher)}
                  style={{ cursor: 'pointer' }}
                >
                  <h4>{teacher.titleTh} {teacher.firstNameTh} {teacher.lastNameTh}</h4>
                  <p className="person-detail">รหัส: {teacher.teacherCode || '-'}</p>
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
                    onClick={() => setSelectedTeacher(teacher)}
                    className="btn-edit"
                  >
                    ดูข้อมูล
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
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        studentId={selectedStudent?.dbId}
        onUpdate={handleStudentUpdate}
      />

      <TeacherDetailModal
        isOpen={!!selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
        teacher={selectedTeacher}
        classrooms={school.classrooms || []}
        schoolId={school.id}
        schoolName={school.name}
        onUpdate={handleTeacherDetailUpdate}
      />
    </div>
  );
};

export default PersonnelManagement;
