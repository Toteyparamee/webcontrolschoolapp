import { useState } from 'react';
import SubjectManagement from './SubjectManagement';
import TeacherSchedule from './TeacherSchedule';
import '../css/ScheduleManagement.css';

const ScheduleManagement = ({ school }) => {
  const [activeSubTab, setActiveSubTab] = useState('schedule');
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Callback เพื่อรับข้อมูล subjects จาก SubjectManagement
  // (ในอนาคตอาจเปลี่ยนเป็น Context หรือ State Management)
  const handleSubjectsUpdate = (updatedSubjects) => {
    setSubjects(updatedSubjects);
  };

  return (
    <div className="schedule-management">
      <div className="schedule-sub-tabs">
        <button
          className={`sub-tab ${activeSubTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('schedule')}
        >
          📅 ตารางสอน
        </button>
        <button
          className={`sub-tab ${activeSubTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('subjects')}
        >
          📚 รายวิชา
        </button>
      </div>

      <div className="schedule-tab-content">
        {activeSubTab === 'schedule' ? (
          <TeacherSchedule
            teachers={school?.teachers || []}
            selectedTeacher={selectedTeacher}
            onTeacherChange={setSelectedTeacher}
          />
        ) : (
          <SubjectManagement
            onSubjectsUpdate={handleSubjectsUpdate}
            selectedTeacher={selectedTeacher}
            teachers={school?.teachers || []}
            onTeacherChange={setSelectedTeacher}
            classrooms={school?.classrooms || []}
          />
        )}
      </div>
    </div>
  );
};

export default ScheduleManagement;
