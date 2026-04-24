import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../css/AdminDashboard.css';

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

const AdminDashboard = () => {
  const { user } = useAuth();
  const { schools, addSchool, deleteSchool } = useSchool();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', address: '' });

  const isAdmin = user?.role === 'admin';
  const editorSchoolId = !isAdmin ? getSchoolIdFromToken() : null;
  const visibleSchools = isAdmin
    ? schools
    : schools.filter((s) => s.id === editorSchoolId);


  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (newSchool.name && newSchool.address) {
      try {
        await addSchool(newSchool);
        setNewSchool({ name: '', address: '' });
        setShowAddForm(false);
      } catch (error) {
        alert('ไม่สามารถเพิ่มโรงเรียนได้: ' + error.message);
      }
    }
  };

  const handleDeleteSchool = async (schoolId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบโรงเรียนนี้?')) {
      try {
        await deleteSchool(schoolId);
      } catch (error) {
        alert('ไม่สามารถลบโรงเรียนได้: ' + error.message);
      }
    }
  };

  const handleViewSchool = (schoolId) => {
    navigate(`/school/${schoolId}`);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-container">
          <div className="page-header-simple">
            <h1>รายการโรงเรียน</h1>
          </div>

          <div className="dashboard-content">
            <div className="section-header">
              <h2>รายการโรงเรียนทั้งหมด</h2>
              {user?.role === 'admin' && (
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn-add">
                  {showAddForm ? 'ยกเลิก' : '+ เพิ่มโรงเรียน'}
                </button>
              )}
            </div>

        {showAddForm && (
          <div className="add-form-container">
            <form onSubmit={handleAddSchool} className="add-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="ชื่อโรงเรียน"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="ที่อยู่"
                  value={newSchool.address}
                  onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                  required
                />
                <button type="submit" className="btn-submit">บันทึก</button>
              </div>
            </form>
          </div>
        )}

        <div className="schools-grid">
          {visibleSchools.map((school) => (
            <div key={school.id} className="school-card">
              <div className="school-info">
                <h3>{school.name}</h3>
                <p className="school-address">{school.address}</p>
                <p className="school-stats">
                  {school.classrooms.length} ห้องเรียน | {' '}
                  {school.classrooms.reduce((sum, c) => sum + c.students.length, 0)} นักเรียน
                </p>
              </div>
              <div className="school-actions">
                <button onClick={() => handleViewSchool(school.id)} className="btn-view">
                  ดูรายละเอียด
                </button>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDeleteSchool(school.id)} className="btn-delete">
                    ลบ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {visibleSchools.length === 0 && (
          <div className="empty-state">
            <p>ยังไม่มีโรงเรียนในระบบ</p>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
