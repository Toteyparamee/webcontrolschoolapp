import { useState, useEffect } from 'react';
import { scheduleAPI, getToken, API_CONFIG } from '../api';
import '../css/TeacherSchedule.css';

const TeacherSchedule = ({ teachers = [], selectedTeacher, onTeacherChange }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];

  // แปลงเลขวันเป็นชื่อวัน
  const getDayName = (dayOfWeek) => {
    const dayMap = {
      1: 'จันทร์',
      2: 'อังคาร',
      3: 'พุธ',
      4: 'พฤหัสบดี',
      5: 'ศุกร์',
      6: 'เสาร์',
      7: 'อาทิตย์'
    };
    return dayMap[dayOfWeek] || '';
  };

  // คาบเรียน (เหมือนในแอป Flutter)
  const periodSlots = [
    { label: 'คาบ 1', start: '08:30', end: '09:25' },
    { label: 'คาบ 2', start: '09:25', end: '10:20' },
    { label: 'คาบ 3', start: '10:20', end: '11:15' },
    { label: 'คาบ 4', start: '11:15', end: '12:10' },
    { label: 'พักกลางวัน', start: '12:10', end: '13:00', isBreak: true },
    { label: 'คาบ 5', start: '13:00', end: '13:55' },
    { label: 'คาบ 6', start: '13:55', end: '14:50' },
    { label: 'คาบ 7', start: '14:50', end: '15:45' },
    { label: 'คาบ 8', start: '15:45', end: '16:40' },
    { label: 'คาบ 9', start: '16:40', end: '17:35' },
  ];

  const colorPalette = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
    '#14B8A6', '#6366F1', '#EC4899', '#F97316', '#06B6D4'
  ];

  // ดึงตารางสอนเมื่อเลือกครู
  useEffect(() => {
    if (!selectedTeacher) {
      setSchedules([]);
      return;
    }
    fetchTeacherSchedule();
  }, [selectedTeacher, teachers]);

  const fetchTeacherSchedule = async () => {
    const teacher = teachers.find(t =>
      `${t.titleTh || ''}${t.firstNameTh} ${t.lastNameTh}` === selectedTeacher
    );
    if (!teacher?.teacherCode) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) { setLoading(false); return; }

      const data = await scheduleAPI.getSchedulesByTeacher(
        teacher.teacherCode,
        { semester: API_CONFIG.DEFAULT_SEMESTER, academicYear: API_CONFIG.DEFAULT_ACADEMIC_YEAR },
        token
      );

      if (data.success && data.data) {
        setSchedules(data.data);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching teacher schedule:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // แปลงเวลา HH:MM เป็นนาที
  const timeToMinutes = (time) => {
    if (!time) return 0;
    const parts = time.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  // normalize เวลาเป็น HH:MM
  const normalizeTime = (time) => {
    if (!time) return '';
    return time.length >= 5 ? time.substring(0, 5) : time;
  };

  // แปลงข้อมูลเป็น grid format
  const convertToGridFormat = () => {
    const grid = {};
    days.forEach(day => { grid[day] = {}; });

    schedules.forEach(item => {
      const dayName = getDayName(item.day_of_week);
      if (!dayName || !grid[dayName]) return;

      const startTime = normalizeTime(item.start_time || '');
      const endTime = normalizeTime(item.end_time || '');
      const timeKey = `${startTime}-${endTime}`;

      const subject = item.subject || {};
      const classInfo = item.class || {};
      const grade = classInfo.grade?.toString() || '';
      const section = classInfo.section?.toString() || '';
      const className = grade
        ? (grade.startsWith('ม.') ? `${grade}/${section}` : `ม.${grade}/${section}`)
        : '';

      grid[dayName][timeKey] = {
        subject: subject.subject_name || '',
        subjectCode: subject.subject_code || '',
        className,
        room: item.room || '',
      };
    });

    return grid;
  };

  // หาข้อมูลที่ตรงกับ slot (เปรียบเทียบช่วงเวลาที่ overlap)
  const findScheduleForSlot = (daySchedule, slot) => {
    const slotStart = timeToMinutes(slot.start);
    const slotEnd = timeToMinutes(slot.end);

    for (const [timeKey, data] of Object.entries(daySchedule)) {
      const [start, end] = timeKey.split('-');
      const dataStart = timeToMinutes(start);
      const dataEnd = timeToMinutes(end);
      if (dataStart < slotEnd && dataEnd > slotStart) {
        return data;
      }
    }
    return null;
  };

  // สร้าง map สีตามห้องเรียน
  const getClassColors = (grid) => {
    const classNames = new Set();
    Object.values(grid).forEach(daySchedule => {
      Object.values(daySchedule).forEach(slot => {
        if (slot.className) classNames.add(slot.className);
      });
    });
    const colors = {};
    [...classNames].sort().forEach((name, i) => {
      colors[name] = colorPalette[i % colorPalette.length];
    });
    return colors;
  };

  const grid = convertToGridFormat();
  const classColors = getClassColors(grid);

  return (
    <div className="teacher-schedule">
      <div className="schedule-header">
        <h2>ตารางสอน</h2>
      </div>

      {/* Dropdown เลือกครู */}
      <div className="teacher-filter">
        <label htmlFor="teacher-select">เลือกครู:</label>
        <select
          id="teacher-select"
          value={selectedTeacher}
          onChange={(e) => onTeacherChange(e.target.value)}
          className="teacher-dropdown"
        >
          <option value="">-- เลือกครู --</option>
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

      {/* เนื้อหา */}
      {!selectedTeacher ? (
        <div className="schedule-empty-state">
          <div className="empty-icon">📋</div>
          <p>กรุณาเลือกครูเพื่อดูตารางสอน</p>
        </div>
      ) : loading ? (
        <div className="schedule-loading">
          <div className="spinner"></div>
          <p>กำลังโหลดตารางสอน...</p>
        </div>
      ) : (
        <div className="schedule-view-content">
          {/* ชื่อครูที่เลือก */}
          <div className="schedule-teacher-info">
            <span className="teacher-label">ตารางสอนของ:</span>
            <span className="teacher-name-display">{selectedTeacher}</span>
          </div>

          {/* คำอธิบายสีห้องเรียน */}
          {Object.keys(classColors).length > 0 && (
            <div className="schedule-legend">
              {Object.entries(classColors).map(([name, color]) => (
                <div key={name} className="legend-item" style={{ borderColor: color, backgroundColor: `${color}15` }}>
                  <span className="legend-dot" style={{ backgroundColor: color }}></span>
                  <span className="legend-text" style={{ color }}>{name}</span>
                </div>
              ))}
            </div>
          )}

          {/* ตาราง Grid */}
          <div className="schedule-table-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th className="time-column">เวลา</th>
                  {days.map(day => (
                    <th key={day}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periodSlots.map((slot) => (
                  <tr key={slot.label} className={slot.isBreak ? 'lunch-break-row' : ''}>
                    <td className={`time-cell ${slot.isBreak ? 'lunch-time' : ''}`}>
                      <div className="time-label">
                        <span className="period">{slot.label}</span>
                        <span className="time">{slot.start}-{slot.end}</span>
                      </div>
                    </td>
                    {days.map(day => {
                      if (slot.isBreak) {
                        return (
                          <td key={`${day}-break`} className="lunch-cell">
                            พักกลางวัน
                          </td>
                        );
                      }

                      const daySchedule = grid[day] || {};
                      const slotData = findScheduleForSlot(daySchedule, slot);

                      if (slotData) {
                        const color = classColors[slotData.className] || '#6366F1';
                        return (
                          <td key={`${day}-${slot.label}`} className="schedule-cell filled">
                            <div
                              className="scheduled-subject"
                              style={{
                                background: `linear-gradient(135deg, ${color}30, ${color}18)`,
                                borderLeft: `4px solid ${color}`,
                              }}
                            >
                              {slotData.subjectCode && (
                                <div className="subject-code" style={{ color: `${color}CC` }}>
                                  {slotData.subjectCode}
                                </div>
                              )}
                              <div className="subject-name" style={{ color }}>
                                {slotData.className}
                              </div>
                              <div className="subject-detail">{slotData.subject}</div>
                              {slotData.room && (
                                <div className="subject-room" style={{ color: `${color}AA` }}>
                                  ห้อง {slotData.room}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={`${day}-${slot.label}`} className="schedule-cell empty">
                          <div className="empty-cell-text">-</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* สรุปข้อมูล */}
          {schedules.length > 0 && (
            <div className="schedule-summary">
              <div className="summary-item">
                <span className="summary-label">จำนวนคาบสอนทั้งหมด</span>
                <span className="summary-value">{schedules.length} คาบ/สัปดาห์</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">จำนวนห้องที่สอน</span>
                <span className="summary-value">{Object.keys(classColors).length} ห้อง</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;
