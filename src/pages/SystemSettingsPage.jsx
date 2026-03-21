import Sidebar from '../components/Sidebar';
import SemesterSettings from '../components/SemesterSettings';
import '../css/SystemSettingsPage.css';

const SystemSettingsPage = () => {
  return (
    <div className="system-settings-page">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>ตั้งค่าระบบ</h1>
          <p>จัดการการตั้งค่าต่างๆ ของระบบ</p>
        </div>

        <div className="settings-sections">
          {/* Semester Settings Section */}
          <div className="settings-section">
            <SemesterSettings />
          </div>

          {/* สามารถเพิ่ม section อื่นๆ ได้ในอนาคต */}
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
