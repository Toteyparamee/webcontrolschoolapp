import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      path: '/dashboard',
      icon: '🏠',
      label: 'หน้าหลัก',
      roles: ['admin', 'editor', 'viewer']
    },
    {
      path: '/personnel',
      icon: '👥',
      label: 'จัดการบุคลากร',
      roles: ['admin', 'editor']
    },
    {
      path: '/users',
      icon: '👤',
      label: 'จัดการผู้ใช้',
      roles: ['admin']
    },
    {
      path: '/news',
      icon: '📰',
      label: 'จัดการข่าวสาร',
      roles: ['admin', 'editor']
    },
    {
      path: '/settings',
      icon: '⚙️',
      label: 'ตั้งค่าระบบ',
      roles: ['admin', 'editor']
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const canAccess = (roles) => {
    return roles.includes(user?.role);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>ระบบจัดการโรงเรียน</h2>
        <div className="user-info">
          <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : user?.role === 'editor' ? 'ผู้แก้ไข' : 'ผู้ดู'}</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          if (!canAccess(item.roles)) return null;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="btn-logout">
          <span className="nav-icon">🚪</span>
          <span className="nav-label">ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
