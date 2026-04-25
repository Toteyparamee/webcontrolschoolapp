import { useParams, useNavigate } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import PersonnelManagement from '../components/PersonnelManagement';
import '../css/SchoolDetail.css';

const SchoolDetail = () => {
  const { schoolId } = useParams();
  const { schools, addStudent, addStudentsBatch, updateStudent, deleteStudent, addTeacher, updateTeacher, deleteTeacher, addClassroom } = useSchool();
  const navigate = useNavigate();

  const school = schools.find(s => s.id === parseInt(schoolId));

  if (!school) {
    return (
      <div className="error-page">
        <h2>ไม่พบข้อมูลโรงเรียน</h2>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  const handleAddStudent = (classroomId, studentData) => {
    addStudent(school.id, classroomId, studentData);
  };

  const handleDeleteStudent = (classroomId, studentId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบนักเรียนคนนี้?')) {
      deleteStudent(school.id, classroomId, studentId);
    }
  };

  const handleUpdateStudent = (classroomId, studentId, body) => {
    return updateStudent(school.id, classroomId, studentId, body);
  };

  const handleAddTeacher = (teacherData) => {
    addTeacher(school.id, teacherData);
  };

  const handleUpdateTeacher = (teacherData) => {
    updateTeacher(school.id, teacherData);
  };

  const handleDeleteTeacher = (teacherId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบครูท่านนี้?')) {
      deleteTeacher(school.id, teacherId);
    }
  };

  const handleAddStudentsBatch = async (file) => {
    await addStudentsBatch(school.id, file);
  };

  return (
    <div className="school-detail-container">
      <div className="detail-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← กลับ
        </button>
        <div className="header-info">
          <h1>{school.name}</h1>
          <p>{school.address}</p>
        </div>
      </div>

      <div className="detail-content">
        <PersonnelManagement
          school={school}
          onAddStudent={handleAddStudent}
          onAddStudentsBatch={handleAddStudentsBatch}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          onAddTeacher={handleAddTeacher}
          onUpdateTeacher={handleUpdateTeacher}
          onDeleteTeacher={handleDeleteTeacher}
        />
      </div>
    </div>
  );
};

export default SchoolDetail;
