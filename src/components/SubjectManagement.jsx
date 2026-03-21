import { useState, useEffect } from 'react';
import { subjectAPI, scheduleAPI, getToken, API_CONFIG } from '../api';
import '../css/SubjectManagement.css';

const SubjectManagement = ({ onSubjectsUpdate, selectedTeacher, teachers = [], onTeacherChange, classrooms = [] }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงรายวิชาจาก API
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.warn('No access token found');
        setLoading(false);
        return;
      }

      let data;

      // ถ้าเลือกครู ให้ดึงเฉพาะรายวิชาของครูนั้น
      if (selectedTeacher) {
        const teacher = teachers.find(t =>
          `${t.titleTh || ''}${t.firstNameTh} ${t.lastNameTh}` === selectedTeacher
        );
        if (teacher?.teacherCode) {
          data = await subjectAPI.getSubjectsByTeacher(teacher.teacherCode, token);
        } else {
          data = await subjectAPI.getSubjects(API_CONFIG.DEFAULT_SCHOOL_ID, token);
        }
      } else {
        data = await subjectAPI.getSubjects(API_CONFIG.DEFAULT_SCHOOL_ID, token);
      }

      console.log('Subjects data received:', data);

      if (data.success && data.data) {
        // ดึงข้อมูล schedule สำหรับแต่ละรายวิชา
        const subjectsWithSchedule = await Promise.all(
          data.data.map(async (subject) => {
            try {
              // ดึง schedule ทั้งหมดของวิชานี้ (ไม่ filter semester/academicYear)
              const scheduleData = await scheduleAPI.getSchedulesBySubject(
                subject.id,
                {},
                token
              );

              if (scheduleData.success && scheduleData.data && scheduleData.data.length > 0) {
                const schedule = scheduleData.data[0];
                // หาชื่อครูจาก teachers array โดยใช้ teacher_code
                const teacher = teachers.find(t => t.teacherCode === schedule.teacher_code);
                const teacherName = teacher
                  ? `${teacher.titleTh || ''}${teacher.firstNameTh} ${teacher.lastNameTh}`
                  : (schedule.teacher_code || '-');
                // หาข้อมูล class จาก classrooms array
                const classroom = classrooms.find(c => c.id === schedule.class_id);
                const classroomName = classroom
                  ? classroom.name
                  : (schedule.class_id ? `ห้อง ${schedule.class_id}` : '-');
                // แปลงวันที่สอน
                const dayNames = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
                const dayName = dayNames[schedule.day_of_week] || '-';

                return {
                  id: subject.id,
                  subjectName: subject.subject_name,
                  subjectCode: subject.subject_code,
                  teacherName,
                  classroomName,
                  dayOfWeek: dayName,
                  period: schedule.period || '-',
                  startTime: schedule.start_time || '-',
                  endTime: schedule.end_time || '-',
                  room: schedule.room || '-',
                  semester: schedule.semester || '-',
                  academicYear: schedule.academic_year || '-'
                };
              }
            } catch (err) {
              console.error('Error fetching schedule for subject:', subject.id, err);
            }

            // ถ้าไม่มี schedule หรือเกิด error - ยังคงแสดงชั้นเรียน/ห้องจาก subject
            const classroomName = subject.description && subject.credits
              ? `${subject.description}/${subject.credits}`
              : '-';
            return {
              id: subject.id,
              subjectName: subject.subject_name,
              subjectCode: subject.subject_code,
              teacherName: '-',
              classroomName,
              dayOfWeek: '-',
              period: '-',
              startTime: '-',
              endTime: '-',
              room: '-',
              semester: '-',
              academicYear: '-'
            };
          })
        );

        console.log('Subjects with schedule:', subjectsWithSchedule);
        setSubjects(subjectsWithSchedule);
      } else {
        console.warn('Invalid data structure:', data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  // ดึงรายวิชาจาก API เมื่อโหลดหน้า หรือเมื่อเปลี่ยนครู
  useEffect(() => {
    fetchSubjects();
  }, [selectedTeacher, teachers, classrooms]);

  // อัพเดต subjects ไปยัง parent component
  useEffect(() => {
    if (onSubjectsUpdate) {
      onSubjectsUpdate(subjects);
    }
  }, [subjects, onSubjectsUpdate]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectCode: '',
    teacherCode: '',
    classId: '',
    dayOfWeek: '',
    period: '',
    startTime: '',
    endTime: '',
    room: '',
    semester: '1',
    academicYear: '2568'
  });

  const days = [
    { value: 1, label: 'จันทร์' },
    { value: 2, label: 'อังคาร' },
    { value: 3, label: 'พุธ' },
    { value: 4, label: 'พฤหัสบดี' },
    { value: 5, label: 'ศุกร์' },
    { value: 6, label: 'เสาร์' },
    { value: 7, label: 'อาทิตย์' }
  ];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.subjectName || !formData.subjectCode) {
      alert('กรุณากรอกข้อมูลรายวิชาให้ครบถ้วน');
      return;
    }

    if (!formData.teacherCode || !formData.classId || !formData.dayOfWeek ||
        !formData.period || !formData.startTime || !formData.endTime) {
      alert('กรุณากรอกข้อมูลตารางสอนให้ครบถ้วน');
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      if (editingSubject) {
        // หา classroom ที่เลือกเพื่อดึง grade และ section
        const selectedClassroom = classrooms.find(c => c.id === parseInt(formData.classId));
        const grade = selectedClassroom?.grade || selectedClassroom?.name?.split('/')[0] || '';
        const section = selectedClassroom?.section || selectedClassroom?.name?.split('/')[1] || '';

        // แก้ไขรายวิชา
        const data = await subjectAPI.updateSubject(editingSubject.id, {
          subject_name: formData.subjectName,
          subject_code: formData.subjectCode,
          credits: parseFloat(section) || 1,
          description: grade
        }, token);

        if (!data.success) {
          alert(`เกิดข้อผิดพลาดในการแก้ไขรายวิชา: ${data.message}`);
          return;
        }

        // อัปเดต schedule ถ้ามี editingScheduleId
        if (editingScheduleId) {
          const scheduleData = await scheduleAPI.updateSchedule(editingScheduleId, {
            teacher_code: formData.teacherCode,
            class_id: parseInt(formData.classId),
            day_of_week: parseInt(formData.dayOfWeek),
            period: parseInt(formData.period),
            start_time: formData.startTime,
            end_time: formData.endTime,
            room: formData.room,
            semester: parseInt(formData.semester),
            academic_year: formData.academicYear
          }, token);

          if (scheduleData.success) {
            alert('แก้ไขข้อมูลรายวิชาและตารางสอนสำเร็จ');
          } else {
            alert(`แก้ไขรายวิชาสำเร็จ แต่เกิดข้อผิดพลาดในการแก้ไขตารางสอน: ${scheduleData.message}`);
          }
        } else if (formData.teacherCode && formData.classId && formData.dayOfWeek && formData.period && formData.startTime && formData.endTime) {
          // ถ้าไม่มี schedule เดิม แต่กรอกข้อมูลตารางสอนมา ให้สร้างใหม่
          const scheduleData = await scheduleAPI.createSchedule({
            school_id: API_CONFIG.DEFAULT_SCHOOL_ID,
            class_id: parseInt(formData.classId),
            subject_id: editingSubject.id,
            teacher_code: formData.teacherCode,
            day_of_week: parseInt(formData.dayOfWeek),
            period: parseInt(formData.period),
            start_time: formData.startTime,
            end_time: formData.endTime,
            room: formData.room,
            semester: parseInt(formData.semester),
            academic_year: formData.academicYear
          }, token);

          if (scheduleData.success) {
            alert('แก้ไขรายวิชาและสร้างตารางสอนสำเร็จ');
          } else {
            alert(`แก้ไขรายวิชาสำเร็จ แต่เกิดข้อผิดพลาดในการสร้างตารางสอน: ${scheduleData.message}`);
          }
        } else {
          alert('แก้ไขข้อมูลรายวิชาสำเร็จ');
        }

        // Refresh subjects data
        await fetchSubjects();
      } else {
        // หา classroom ที่เลือกเพื่อดึง grade และ section
        const selectedClassroom = classrooms.find(c => c.id === parseInt(formData.classId));
        const grade = selectedClassroom?.grade || selectedClassroom?.name?.split('/')[0] || '';
        const section = selectedClassroom?.section || selectedClassroom?.name?.split('/')[1] || '';

        // เพิ่มรายวิชาใหม่
        const subjectData = await subjectAPI.createSubject({
          school_id: API_CONFIG.DEFAULT_SCHOOL_ID,
          subject_code: formData.subjectCode,
          subject_name: formData.subjectName,
          credits: parseFloat(section) || 1,
          description: grade
        }, token);

        if (!subjectData.success) {
          alert(`เกิดข้อผิดพลาดในการสร้างรายวิชา: ${subjectData.message}`);
          return;
        }

        // สร้าง schedule
        const scheduleData = await scheduleAPI.createSchedule({
          school_id: API_CONFIG.DEFAULT_SCHOOL_ID,
          class_id: parseInt(formData.classId),
          subject_id: subjectData.data.id,
          teacher_code: formData.teacherCode,
          day_of_week: parseInt(formData.dayOfWeek),
          period: parseInt(formData.period),
          start_time: formData.startTime,
          end_time: formData.endTime,
          room: formData.room,
          semester: parseInt(formData.semester),
          academic_year: formData.academicYear
        }, token);

        if (scheduleData.success) {
          alert('เพิ่มรายวิชาและตารางสอนสำเร็จ');
        } else {
          alert(`สร้างรายวิชาสำเร็จ แต่เกิดข้อผิดพลาดในการสร้างตารางสอน: ${scheduleData.message}`);
        }
        // Refresh subjects data
        await fetchSubjects();
      }

      setFormData({
        subjectName: '',
        subjectCode: '',
        teacherCode: '',
        classId: '',
        dayOfWeek: '',
        period: '',
        startTime: '',
        endTime: '',
        room: '',
        semester: '1',
        academicYear: '2568'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = async (subject) => {
    setEditingSubject(subject);
    setEditingScheduleId(null);

    // ดึงข้อมูล schedule ของรายวิชานี้จาก API
    try {
      const token = getToken();
      if (token && subject.id) {
        const data = await scheduleAPI.getSchedulesBySubject(subject.id, {}, token);
        console.log('Schedule data for edit:', data);

        if (data.success && data.data && data.data.length > 0) {
          // ใช้ schedule แรกที่เจอ
          const schedule = data.data[0];
          setEditingScheduleId(schedule.id);
          setFormData({
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            teacherCode: schedule.teacher_code || '',
            classId: schedule.class_id?.toString() || '',
            dayOfWeek: schedule.day_of_week?.toString() || '',
            period: schedule.period?.toString() || '',
            startTime: schedule.start_time || '',
            endTime: schedule.end_time || '',
            room: schedule.room || '',
            semester: schedule.semester?.toString() || '1',
            academicYear: schedule.academic_year || '2568'
          });
        } else {
          // ถ้าไม่มี schedule ให้แสดงเฉพาะข้อมูลวิชา
          setFormData({
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            teacherCode: '',
            classId: '',
            dayOfWeek: '',
            period: '',
            startTime: '',
            endTime: '',
            room: '',
            semester: '1',
            academicYear: '2568'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching schedule for edit:', error);
      // ถ้าเกิด error ให้แสดงเฉพาะข้อมูลวิชา
      setFormData({
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        teacherCode: '',
        classId: '',
        dayOfWeek: '',
        period: '',
        startTime: '',
        endTime: '',
        room: '',
        semester: '1',
        academicYear: '2568'
      });
    }

    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบรายวิชานี้?')) {
      try {
        const token = getToken();

        if (!token) {
          alert('กรุณาเข้าสู่ระบบก่อน');
          return;
        }

        const data = await subjectAPI.deleteSubject(id, token);

        if (data.success) {
          // ลบข้อมูลจาก state หลังจากลบใน database สำเร็จ
          setSubjects(subjects.filter(subject => subject.id !== id));
          alert('ลบข้อมูลรายวิชาสำเร็จ');
        } else {
          alert(`เกิดข้อผิดพลาด: ${data.message}`);
        }
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingSubject(null);
    setEditingScheduleId(null);
    setFormData({
      subjectName: '',
      subjectCode: '',
      teacherCode: '',
      classId: '',
      dayOfWeek: '',
      period: '',
      startTime: '',
      endTime: '',
      room: '',
      semester: '1',
      academicYear: '2568'
    });
  };

  return (
    <div className="subject-management">
      <div className="section-header">
        <h2>จัดการข้อมูลรายวิชา</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Teacher Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="teacher-select-subject">ครู:</label>
            <select
              id="teacher-select-subject"
              value={selectedTeacher}
              onChange={(e) => onTeacherChange(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="">-- ทั้งหมด --</option>
              {teachers.map((teacher, index) => (
                <option
                  key={teacher.id || index}
                  value={`${teacher.titleTh || ''}${teacher.firstNameTh} ${teacher.lastNameTh}`}
                >
                  {teacher.titleTh || ''}{teacher.firstNameTh} {teacher.lastNameTh}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-add"
          >
            {showAddForm ? 'ยกเลิก' : '+ เพิ่มรายวิชา'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="subject-form-container">
          <h3>{editingSubject ? 'แก้ไขข้อมูลรายวิชา' : 'เพิ่มข้อมูลรายวิชาและตารางสอน'}</h3>
          <form onSubmit={handleSubmit} className="subject-form">
            {/* ข้อมูลรายวิชา */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>ข้อมูลรายวิชา</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>ชื่อวิชา *</label>
                  <input
                    type="text"
                    name="subjectName"
                    value={formData.subjectName}
                    onChange={handleInputChange}
                    placeholder="เช่น คณิตศาสตร์"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>รหัสวิชา *</label>
                  <input
                    type="text"
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleInputChange}
                    placeholder="เช่น M101"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ข้อมูลตารางสอน */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>ข้อมูลตารางสอน</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>ครูผู้สอน *</label>
                  <select
                    name="teacherCode"
                    value={formData.teacherCode}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- เลือกครู --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.teacherCode}>
                        {teacher.titleTh || ''}{teacher.firstNameTh} {teacher.lastNameTh}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>ชั้นเรียน/ห้อง *</label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- เลือกชั้นเรียน --</option>
                    {classrooms && classrooms.length > 0 ? (
                      classrooms.map((classroom, index) => (
                        <option key={classroom.id || index} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>ไม่พบข้อมูลห้องเรียน</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>วันที่สอน *</label>
                  <select
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- เลือกวัน --</option>
                    {days.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>คาบที่ *</label>
                  <select
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- เลือกคาบ --</option>
                    {periods.map((period) => (
                      <option key={period} value={period}>
                        คาบที่ {period}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>เวลาเริ่ม *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>เวลาสิ้นสุด *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ห้องเรียน</label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    placeholder="เช่น 301"
                  />
                </div>

                <div className="form-group">
                  <label>ภาคเรียน *</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ปีการศึกษา *</label>
                  <input
                    type="text"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    placeholder="เช่น 2568"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                ยกเลิก
              </button>
              <button type="submit" className="btn-submit">
                {editingSubject ? 'บันทึกการแก้ไข' : 'เพิ่มรายวิชาและตารางสอน'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="subjects-list">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="empty-state">
            <p>ยังไม่มีข้อมูลรายวิชา</p>
            <p className="empty-hint">คลิกปุ่ม "+ เพิ่มรายวิชา" เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="subjects-table">
            <table>
              <thead>
                <tr>
                  <th>ชื่อวิชา</th>
                  <th>รหัสวิชา</th>
                  <th>ครูผู้สอน</th>
                  <th>ชั้นเรียน/ห้อง</th>
                  <th>วันที่สอน</th>
                  <th>คาบที่</th>
                  <th>เวลา</th>
                  <th>ห้องเรียน</th>
                  <th>ภาคเรียน</th>
                  <th>ปีการศึกษา</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(subject => (
                  <tr key={subject.id}>
                    <td>{subject.subjectName}</td>
                    <td>{subject.subjectCode}</td>
                    <td>{subject.teacherName}</td>
                    <td>{subject.classroomName}</td>
                    <td>{subject.dayOfWeek}</td>
                    <td>{subject.period}</td>
                    <td>{subject.startTime} - {subject.endTime}</td>
                    <td>{subject.room}</td>
                    <td>{subject.semester}</td>
                    <td>{subject.academicYear}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="btn-edit"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id)}
                          className="btn-delete"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectManagement;
