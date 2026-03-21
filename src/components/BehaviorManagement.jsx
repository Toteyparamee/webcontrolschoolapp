import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { categoryAPI, behaviorAPI } from '../api/behaviorApi';
import '../css/BehaviorScorePage.css';

const severityCategories = ['ทั้งหมด', 'low', 'medium', 'high'];
const severityLabelMap = { low: 'เบา', medium: 'ปานกลาง', high: 'รุนแรง' };

const getStatus = (score) => {
  if (score >= 80) return { label: 'ดี', color: '#4caf50', icon: '✅' };
  if (score >= 50) return { label: 'เตือน', color: '#ff9800', icon: '⚠️' };
  return { label: 'อันตราย', color: '#f44336', icon: '🚨' };
};

const BehaviorManagement = () => {
  const { token } = useAuth();

  // Students state
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentRecords, setStudentRecords] = useState([]);
  const [studentScore, setStudentScore] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('ทั้งหมด');
  const [classrooms, setClassrooms] = useState(['ทั้งหมด']);

  // Deduction items (categories) state
  const [deductionItems, setDeductionItems] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', default_points: '', severity: 'medium', description: '' });
  const [settingsCategory, setSettingsCategory] = useState('ทั้งหมด');

  // Deduct modal state
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [deductPoints, setDeductPoints] = useState('');
  const [deductReason, setDeductReason] = useState('');
  const [selectedDeductionItem, setSelectedDeductionItem] = useState(null);

  // Loading state
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // ===== Fetch data =====

  const fetchStudents = useCallback(async () => {
    if (!token) return;
    setLoadingStudents(true);
    try {
      const res = await behaviorAPI.getAllStudents(token);
      if (res.success) {
        setStudents(res.data || []);
        // สร้างรายชื่อห้องเรียนจากข้อมูลจริง
        const rooms = [...new Set((res.data || []).map(s => s.classroom))].sort();
        setClassrooms(['ทั้งหมด', ...rooms]);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoadingStudents(false);
    }
  }, [token]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setLoadingCategories(true);
    try {
      const res = await categoryAPI.getCategories(token, false);
      if (res.success) {
        setDeductionItems(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, [token]);

  const fetchStudentDetail = useCallback(async (studentId) => {
    if (!token || !studentId) return;
    setLoadingDetail(true);
    try {
      const res = await behaviorAPI.getStudentDetail(studentId, token);
      if (res.success) {
        setStudentScore(res.data.score);
        setStudentRecords(res.data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch student detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStudents();
    fetchCategories();
  }, [fetchStudents, fetchCategories]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetail(selectedStudent.student_code);
    } else {
      setStudentRecords([]);
      setStudentScore(null);
    }
  }, [selectedStudent, fetchStudentDetail]);

  // ===== Filter students =====

  const filteredStudents = students.filter(s => {
    const matchClass = selectedClassroom === 'ทั้งหมด' || s.classroom === selectedClassroom;
    const matchSearch = searchText === '' ||
      `${s.first_name} ${s.last_name}`.includes(searchText) ||
      String(s.student_number).includes(searchText) ||
      s.student_code.includes(searchText);
    return matchClass && matchSearch;
  });

  // ===== Deduction item handlers (Settings) =====

  const handleSelectDeductionItem = (item) => {
    if (selectedDeductionItem?.id === item.id) {
      setSelectedDeductionItem(null);
      setDeductPoints('');
      setDeductReason('');
    } else {
      setSelectedDeductionItem(item);
      setDeductPoints(String(item.default_points));
      setDeductReason(item.name);
    }
  };

  const handleDeduct = async () => {
    const points = parseInt(deductPoints);
    if (!points || points <= 0) {
      alert('กรุณาระบุจำนวนคะแนนที่ถูกต้อง');
      return;
    }
    if (!deductReason.trim()) {
      alert('กรุณาระบุเหตุผล');
      return;
    }

    setSaving(true);
    try {
      const res = await behaviorAPI.createRecord({
        student_code: selectedStudent.student_code,
        student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
        deducted_points: points,
        reason: deductReason.trim(),
        category: selectedDeductionItem?.name || '',
        date: new Date().toISOString().split('T')[0],
      }, token);

      if (res.success) {
        // รีเฟรชข้อมูลนักเรียนและรายละเอียด
        await fetchStudents();
        await fetchStudentDetail(selectedStudent.student_code);
        setDeductPoints('');
        setDeductReason('');
        setSelectedDeductionItem(null);
        setShowDeductModal(false);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ===== Category CRUD =====

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) {
      alert('กรุณาระบุชื่อรายการ');
      return;
    }
    const points = parseInt(itemForm.default_points);
    if (!points || points <= 0) {
      alert('กรุณาระบุคะแนนที่ถูกต้อง');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: itemForm.name.trim(),
        default_points: points,
        severity: itemForm.severity,
        description: itemForm.description.trim(),
      };

      if (editingItem) {
        const res = await categoryAPI.updateCategory(editingItem.id, data, token);
        if (res.success) {
          await fetchCategories();
          resetItemForm();
        }
      } else {
        const res = await categoryAPI.createCategory(data, token);
        if (res.success) {
          await fetchCategories();
          resetItemForm();
        }
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      default_points: String(item.default_points),
      severity: item.severity,
      description: item.description || '',
    });
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('ต้องการลบรายการนี้หรือไม่?')) return;
    try {
      const res = await categoryAPI.deleteCategory(id, token);
      if (res.success) {
        await fetchCategories();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemForm({ name: '', default_points: '', severity: 'medium', description: '' });
  };

  const filteredDeductionItems = deductionItems.filter(item =>
    settingsCategory === 'ทั้งหมด' || item.severity === settingsCategory
  );

  const activeDeductionItems = deductionItems.filter(item => item.is_active);

  // ===== Summary =====

  const currentScore = studentScore?.current_score ?? selectedStudent?.current_score ?? 100;

  const summary = {
    total: filteredStudents.length,
    good: filteredStudents.filter(s => s.current_score >= 80).length,
    warning: filteredStudents.filter(s => s.current_score >= 50 && s.current_score < 80).length,
    danger: filteredStudents.filter(s => s.current_score < 50).length,
  };

  return (
    <div className="behavior-management">
      {/* Summary Cards */}
      <div className="behavior-summary-cards">
        <div className="summary-card total">
          <div className="summary-icon">👥</div>
          <div className="summary-info">
            <div className="summary-number">{summary.total}</div>
            <div className="summary-label">นักเรียนทั้งหมด</div>
          </div>
        </div>
        <div className="summary-card good">
          <div className="summary-icon">✅</div>
          <div className="summary-info">
            <div className="summary-number">{summary.good}</div>
            <div className="summary-label">พฤติกรรมดี</div>
          </div>
        </div>
        <div className="summary-card warning">
          <div className="summary-icon">⚠️</div>
          <div className="summary-info">
            <div className="summary-number">{summary.warning}</div>
            <div className="summary-label">ต้องเฝ้าระวัง</div>
          </div>
        </div>
        <div className="summary-card danger">
          <div className="summary-icon">🚨</div>
          <div className="summary-info">
            <div className="summary-number">{summary.danger}</div>
            <div className="summary-label">อันตราย</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="behavior-content">
        {/* Left Panel - Student List */}
        <div className="student-list-panel">
          <div className="panel-header">
            <h2>รายชื่อนักเรียน</h2>
            <button className="btn-settings" onClick={() => setShowSettingsModal(true)}>
              ตั้งค่ารายการตัดคะแนน
            </button>
          </div>

          {/* Filters */}
          <div className="behavior-filters">
            <div className="filter-group">
              <input
                type="text"
                placeholder="ค้นหานักเรียน..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="filter-select"
              >
                {classrooms.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student List */}
          <div className="student-list">
            {loadingStudents ? (
              <div className="empty-state">
                <p>กำลังโหลดข้อมูล...</p>
              </div>
            ) : (
              <>
                {filteredStudents.map(student => {
                  const status = getStatus(student.current_score);
                  return (
                    <div
                      key={student.student_code}
                      className={`student-item ${selectedStudent?.student_code === student.student_code ? 'selected' : ''}`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="student-avatar" style={{ borderColor: status.color }}>
                        {student.first_name.charAt(0)}
                      </div>
                      <div className="student-info">
                        <div className="student-name">{student.first_name} {student.last_name}</div>
                        <div className="student-meta">{student.classroom} | เลขที่ {student.student_number}</div>
                      </div>
                      <div className="student-score-badge" style={{ backgroundColor: status.color }}>
                        {student.current_score}
                      </div>
                    </div>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <div className="empty-state">
                    <span className="empty-icon">🔍</span>
                    <p>ไม่พบนักเรียน</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Student Detail */}
        <div className="student-detail-panel">
          {selectedStudent ? (
            <>
              {/* Student Profile */}
              <div className="detail-profile">
                <div className="profile-avatar" style={{ borderColor: getStatus(currentScore).color }}>
                  <span className="avatar-text">{selectedStudent.first_name.charAt(0)}</span>
                </div>
                <div className="profile-info">
                  <h2>{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                  <div className="profile-tags">
                    <span className="tag">📚 {selectedStudent.classroom}</span>
                    <span className="tag"># เลขที่ {selectedStudent.student_number}</span>
                  </div>
                </div>
              </div>

              {/* Score Card */}
              <div className="score-card">
                <div className="score-header">คะแนนพฤติกรรม</div>
                <div className="score-display">
                  <span className="score-value" style={{ color: getStatus(currentScore).color }}>
                    {currentScore}
                  </span>
                  <span className="score-total">/ 100</span>
                </div>
                <div className="score-bar-container">
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${currentScore}%`,
                      backgroundColor: getStatus(currentScore).color
                    }}
                  />
                </div>
                <div className="score-status" style={{
                  color: getStatus(currentScore).color,
                  borderColor: getStatus(currentScore).color,
                  backgroundColor: `${getStatus(currentScore).color}15`
                }}>
                  {getStatus(currentScore).icon} สถานะ: {getStatus(currentScore).label}
                </div>
              </div>

              {/* Deduct Button */}
              <button className="btn-deduct" onClick={() => setShowDeductModal(true)}>
                ➖ ตัดคะแนนพฤติกรรม
              </button>

              {/* Records */}
              <div className="records-section">
                <div className="records-header">
                  <h3>ประวัติการตัดคะแนน</h3>
                  <span className="records-count">{studentRecords.length} รายการ</span>
                </div>

                {loadingDetail ? (
                  <div className="records-empty">
                    <p>กำลังโหลด...</p>
                  </div>
                ) : studentRecords.length === 0 ? (
                  <div className="records-empty">
                    <span className="empty-icon">😊</span>
                    <p>ไม่มีประวัติการตัดคะแนน</p>
                    <span className="empty-sub">นักเรียนมีพฤติกรรมดีเยี่ยม!</span>
                  </div>
                ) : (
                  <div className="records-list">
                    {studentRecords.map(record => (
                      <div key={record.id} className="record-card">
                        <div className="record-points">
                          <span className="points-icon">➖</span>
                          <span className="points-value">-{record.deducted_points}</span>
                        </div>
                        <div className="record-details">
                          <div className="record-reason">{record.reason}</div>
                          <div className="record-meta">
                            <span>👤 {record.teacher_name}</span>
                            <span>📅 {record.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <span className="no-selection-icon">👈</span>
              <h3>เลือกนักเรียน</h3>
              <p>กรุณาเลือกนักเรียนจากรายชื่อด้านซ้ายเพื่อดูรายละเอียด</p>
            </div>
          )}
        </div>
      </div>

      {/* Deduct Modal */}
      {showDeductModal && (
        <div className="modal-overlay" onClick={() => setShowDeductModal(false)}>
          <div className="deduct-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➖ ตัดคะแนนพฤติกรรม</h3>
              <button className="modal-close" onClick={() => setShowDeductModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="modal-student-info">
                นักเรียน: <strong>{selectedStudent?.first_name} {selectedStudent?.last_name}</strong>
                <span className="current-score">คะแนนปัจจุบัน: {currentScore}/100</span>
              </div>

              {/* เลือกรายการตัดคะแนนจาก preset */}
              <div className="form-group">
                <label>เลือกรายการตัดคะแนน</label>
                <div className="deduction-preset-list">
                  {activeDeductionItems.map(item => (
                    <div
                      key={item.id}
                      className={`deduction-preset-item ${selectedDeductionItem?.id === item.id ? 'active' : ''}`}
                      onClick={() => handleSelectDeductionItem(item)}
                    >
                      <div className="preset-item-info">
                        <span className="preset-item-name">{item.name}</span>
                        <span className="preset-item-category">{severityLabelMap[item.severity] || item.severity}</span>
                      </div>
                      <span className="preset-item-points">-{item.default_points}</span>
                    </div>
                  ))}
                  {activeDeductionItems.length === 0 && (
                    <div className="records-empty" style={{ padding: '12px' }}>
                      <p>ยังไม่มีรายการตัดคะแนน กรุณาเพิ่มในตั้งค่า</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="deduct-divider">
                <span>หรือระบุเอง</span>
              </div>

              <div className="form-group">
                <label>จำนวนคะแนนที่ตัด</label>
                <input
                  type="number"
                  min="1"
                  placeholder="ระบุจำนวนคะแนน"
                  value={deductPoints}
                  onChange={(e) => { setDeductPoints(e.target.value); setSelectedDeductionItem(null); }}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>เหตุผล</label>
                <textarea
                  placeholder="ระบุเหตุผลในการตัดคะแนน"
                  rows={3}
                  value={deductReason}
                  onChange={(e) => { setDeductReason(e.target.value); setSelectedDeductionItem(null); }}
                  className="form-textarea"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeductModal(false)}>ยกเลิก</button>
              <button className="btn-confirm" onClick={handleDeduct} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - ตั้งค่ารายการตัดคะแนน */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => { setShowSettingsModal(false); resetItemForm(); }}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ตั้งค่ารายการตัดคะแนน</h3>
              <button className="modal-close" onClick={() => { setShowSettingsModal(false); resetItemForm(); }}>&times;</button>
            </div>
            <div className="modal-body">
              {/* ฟอร์มเพิ่ม/แก้ไขรายการ */}
              <div className="settings-form">
                <h4>{editingItem ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h4>
                <div className="settings-form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>ชื่อรายการ</label>
                    <input
                      type="text"
                      placeholder="รายการตัดคะแนน"
                      value={itemForm.name}
                      onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>คะแนนที่ตัด</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="คะแนน"
                      value={itemForm.default_points}
                      onChange={(e) => setItemForm(prev => ({ ...prev, default_points: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>ความรุนแรง</label>
                    <select
                      value={itemForm.severity}
                      onChange={(e) => setItemForm(prev => ({ ...prev, severity: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="low">เบา</option>
                      <option value="medium">ปานกลาง</option>
                      <option value="high">รุนแรง</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>คำอธิบาย (ไม่บังคับ)</label>
                  <input
                    type="text"
                    placeholder="คำอธิบายเพิ่มเติม"
                    value={itemForm.description}
                    onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="settings-form-actions">
                  {editingItem && (
                    <button className="btn-cancel" onClick={resetItemForm}>ยกเลิก</button>
                  )}
                  <button className="btn-confirm" onClick={handleSaveItem} disabled={saving}>
                    {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
                  </button>
                </div>
              </div>

              {/* ตัวกรองความรุนแรง */}
              <div className="settings-filter">
                <label>กรองตามความรุนแรง:</label>
                <div className="category-tabs">
                  {severityCategories.map(cat => (
                    <button
                      key={cat}
                      className={`category-tab ${settingsCategory === cat ? 'active' : ''}`}
                      onClick={() => setSettingsCategory(cat)}
                    >
                      {cat === 'ทั้งหมด' ? cat : severityLabelMap[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* รายการทั้งหมด */}
              <div className="settings-items-list">
                {loadingCategories ? (
                  <div className="records-empty">
                    <p>กำลังโหลด...</p>
                  </div>
                ) : filteredDeductionItems.length === 0 ? (
                  <div className="records-empty">
                    <p>ไม่มีรายการในหมวดหมู่นี้</p>
                  </div>
                ) : (
                  filteredDeductionItems.map(item => (
                    <div key={item.id} className="settings-item">
                      <div className="settings-item-info">
                        <span className="settings-item-name">{item.name}</span>
                        <span className="settings-item-category">{severityLabelMap[item.severity] || item.severity}</span>
                      </div>
                      <div className="settings-item-points">-{item.default_points} คะแนน</div>
                      <div className="settings-item-actions">
                        <button className="btn-edit-item" onClick={() => handleEditItem(item)}>แก้ไข</button>
                        <button className="btn-delete-item" onClick={() => handleDeleteItem(item.id)}>ลบ</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BehaviorManagement;
