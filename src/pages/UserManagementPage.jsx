import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, schoolAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../css/UserManagementPage.css';

const UserManagementPage = () => {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student',
    schoolId: '',
    schoolName: ''
  });
  const [filterRole, setFilterRole] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchSchools();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers(token);
      setUsers(response.data || response);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('ไม่สามารถโหลดข้อมูลผู้ใช้ได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await schoolAPI.getSchools(token);
      setSchools(response.data || response);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userAPI.updateUser(editingUser.id, formData, token);
        alert('แก้ไขข้อมูลผู้ใช้สำเร็จ');
      } else {
        await userAPI.createUser(formData, token);
        alert('เพิ่มผู้ใช้สำเร็จ');
      }
      setShowAddForm(false);
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'student',
        schoolId: '',
        schoolName: ''
      });
      fetchUsers();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      schoolId: user.schoolId || '',
      schoolName: user.schoolName || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
      try {
        await userAPI.deleteUser(userId, token);
        alert('ลบผู้ใช้สำเร็จ');
        fetchUsers();
      } catch (error) {
        alert('ไม่สามารถลบผู้ใช้ได้: ' + error.message);
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'student',
      schoolId: '',
      schoolName: ''
    });
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterClass !== 'all' && u.className !== filterClass) return false;
    if (searchText) {
      const search = searchText.toLowerCase();
      return (
        u.username?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.firstName?.toLowerCase().includes(search) ||
        u.lastName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Get unique class names from users
  const classNames = [...new Set(users.filter(u => u.className).map(u => u.className))].sort();

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'role-badge role-admin';
      case 'teacher':
        return 'role-badge role-teacher';
      case 'editor':
        return 'role-badge role-editor';
      case 'student':
      default:
        return 'role-badge role-student';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'teacher':
        return 'ครู';
      case 'editor':
        return 'ผู้แก้ไข';
      case 'student':
      default:
        return 'นักเรียน';
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="page-container">
            <div className="page-header-simple">
              <h1>จัดการผู้ใช้</h1>
            </div>
            <div className="loading-state">กำลังโหลด...</div>
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
            <h1>จัดการผู้ใช้</h1>
            <div className="header-info">
              <span>ผู้ใช้งานทั้งหมด: {users.length} คน {filterRole !== 'all' || filterClass !== 'all' || searchText ? `(แสดง ${filteredUsers.length} คน)` : ''}</span>
            </div>
          </div>

      <div className="user-content">
        <div className="section-header">
          <h2>รายชื่อผู้ใช้งานระบบ</h2>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (showAddForm) handleCancel();
              }}
              className="btn-add"
            >
              {showAddForm ? 'ยกเลิก' : '+ เพิ่มผู้ใช้'}
            </button>
          )}
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <label>ค้นหา</label>
            <input
              type="text"
              placeholder="ชื่อผู้ใช้, อีเมล..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>บทบาท</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="filter-select">
              <option value="all">ทั้งหมด</option>
              <option value="admin">ผู้ดูแลระบบ</option>
              <option value="teacher">ครู</option>
              <option value="student">นักเรียน</option>
              <option value="editor">ผู้แก้ไข</option>
            </select>
          </div>
          {classNames.length > 0 && (
            <div className="filter-group">
              <label>ห้องเรียน</label>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="filter-select">
                <option value="all">ทั้งหมด</option>
                {classNames.map((cn) => (
                  <option key={cn} value={cn}>{cn}</option>
                ))}
              </select>
            </div>
          )}
          {(filterRole !== 'all' || filterClass !== 'all' || searchText) && (
            <button
              className="btn-clear-filter"
              onClick={() => { setFilterRole('all'); setFilterClass('all'); setSearchText(''); }}
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="add-form-container">
            <h3>{editingUser ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h3>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>ชื่อผู้ใช้ *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ชื่อผู้ใช้"
                    required
                    disabled={!!editingUser}
                  />
                </div>

                <div className="form-group">
                  <label>อีเมล *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>รหัสผ่าน {editingUser ? '(เว้นว่างหากไม่ต้องการเปลี่ยน)' : '*'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="รหัสผ่าน"
                    required={!editingUser}
                  />
                </div>

                <div className="form-group">
                  <label>บทบาท *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="student">นักเรียน</option>
                    <option value="teacher">ครู</option>
                    <option value="editor">ผู้แก้ไข</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>โรงเรียน (ถ้ามี)</label>
                  <select
                    value={formData.schoolId || ''}
                    onChange={(e) => {
                      const selectedSchoolId = e.target.value;
                      const selectedSchool = schools.find(s => s.id === parseInt(selectedSchoolId));
                      setFormData({
                        ...formData,
                        schoolId: selectedSchoolId,
                        schoolName: selectedSchool ? selectedSchool.name : ''
                      });
                    }}
                  >
                    <option value="">-- เลือกโรงเรียน --</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
                </button>
                <button type="button" onClick={handleCancel} className="btn-cancel">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="users-grid">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-header">
                <div className="user-title">
                  <h3>{user.username}</h3>
                  <span className={getRoleBadgeClass(user.role)}>
                    {getRoleText(user.role)}
                  </span>
                </div>
                {currentUser?.role === 'admin' && currentUser?.id !== user.id && (
                  <div className="user-actions">
                    <button
                      onClick={() => handleEdit(user)}
                      className="btn-edit"
                      title="แก้ไข"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="btn-delete"
                      title="ลบ"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <div className="user-info">
                <div className="info-row">
                  <span className="info-label">อีเมล:</span>
                  <span className="info-value">{user.email}</span>
                </div>
                {user.schoolName && (
                  <div className="info-row">
                    <span className="info-label">โรงเรียน:</span>
                    <span className="info-value">{user.schoolName}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">สร้างเมื่อ:</span>
                  <span className="info-value">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}
                  </span>
                </div>
              </div>

              {currentUser?.id === user.id && (
                <div className="current-user-badge">
                  คุณ
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>{users.length === 0 ? 'ยังไม่มีผู้ใช้ในระบบ' : 'ไม่พบผู้ใช้ตามเงื่อนไขที่เลือก'}</p>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
