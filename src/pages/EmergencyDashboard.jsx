// EmergencyDashboard — หน้าหลักสำหรับ admin/รปภ. เห็น live map ระหว่างเหตุฉุกเฉิน
//
// State machine:
//   - NO_ACTIVE  → แสดง history + sidebar
//   - ACTIVE     → live map + sidebar นับจำนวน + ปุ่ม "ปลดเหตุ"
//
// Polling: เช็ค active alert ทุก 30s
// WebSocket: connect ตอน active ขึ้น, disconnect ตอน resolved

import { useEffect, useMemo, useState } from 'react';
import { emergencyAPI } from '../api';
import Sidebar from '../components/Sidebar';
import EmergencyMap from '../components/EmergencyMap';
import EmergencyWS from '../services/emergencyWS';
import '../css/EmergencyDashboard.css';

export default function EmergencyDashboard() {
  const [active, setActive] = useState(null);
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  // initial load + polling
  useEffect(() => {
    let timer;
    const tick = async () => {
      try {
        const res = await emergencyAPI.getActive();
        setActive(res.data ?? null);
      } catch (e) {
        console.error('getActive', e);
      } finally {
        setLoading(false);
      }
    };
    tick();
    timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  // history
  useEffect(() => {
    emergencyAPI.history().then((r) => setHistory(r.data ?? [])).catch(() => {});
  }, [active]);

  // WS connect เมื่อมี active alert
  useEffect(() => {
    if (!active) return;
    const ws = new EmergencyWS(emergencyAPI.liveURL(active.id));
    ws.on('snapshot', (data) => setUsers(data.users || []))
      .on('userUpdate', (data) => {
        setUsers((prev) => upsertUser(prev, data));
      })
      .on('statusUpdate', (data) => {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === data.user_id ? { ...u, status: data.status } : u
          )
        );
      })
      .on('resolved', () => setActive(null));
    ws.connect();
    return () => ws.close();
  }, [active]);

  const counts = useMemo(() => {
    const c = { total: users.length, safe: 0, need_help: 0, no_response: 0, offline: 0 };
    users.forEach((u) => {
      if (!u.online) c.offline += 1;
      else if (u.status === 'SAFE') c.safe += 1;
      else if (u.status === 'NEED_HELP') c.need_help += 1;
      else c.no_response += 1;
    });
    return c;
  }, [users]);

  const handleResolve = async (falseAlarm = false) => {
    if (!active) return;
    if (
      !confirm(falseAlarm ? 'ยืนยันยกเลิก (false alarm)?' : 'ยืนยันปลดเหตุการณ์?')
    )
      return;
    setResolving(true);
    try {
      await emergencyAPI.resolve(active.id, '', falseAlarm);
      setActive(null);
      setUsers([]);
    } catch (e) {
      alert(`ปลดเหตุไม่สำเร็จ: ${e.message}`);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="emergency-page">
        <Sidebar />
        <div className="emergency-main">
          <div className="emergency-loading">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  // ── INACTIVE ──
  if (!active) {
    return (
      <div className="emergency-page">
        <Sidebar />
        <div className="emergency-main">
          <div className="emergency-idle">
            <h1>🚨 ระบบแจ้งเหตุฉุกเฉิน</h1>

            <div className="emergency-status-ok">
              ✓ ไม่มีเหตุฉุกเฉินขณะนี้
            </div>

            <div className="emergency-history-card">
              <h2>ประวัติ (100 รายการล่าสุด)</h2>
              <table>
                <thead>
                  <tr>
                    <th>เวลา</th>
                    <th>ประเภท</th>
                    <th>รายละเอียด</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan={4}>— ยังไม่มีประวัติ —</td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h.id}>
                        <td>{new Date(h.created_at).toLocaleString('th-TH')}</td>
                        <td>{labelType(h.alert_type)}</td>
                        <td>{h.note || '-'}</td>
                        <td>{labelStatus(h.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE ──
  return (
    <div className="emergency-page">
      <Sidebar />
      <div className="emergency-main">
        <div className="emergency-active">
          <div className="emergency-map-area">
            <div className="emergency-banner">
              🚨 {labelType(active.alert_type)} — {active.note || '(ไม่มีรายละเอียด)'}
            </div>
            <EmergencyMap users={users} />
          </div>

          <aside className="emergency-sidebar">
            <div className="emergency-sidebar-label">สรุปสถานะ</div>
            <div className="emergency-stats-grid">
              <Stat label="ทั้งหมด" value={counts.total} />
              <Stat label="ปลอดภัย" value={counts.safe} color="green" />
              <Stat label="ขอความช่วยเหลือ" value={counts.need_help} color="red" />
              <Stat label="ยังไม่ตอบ" value={counts.no_response} color="amber" />
            </div>
            <div className="emergency-meta">
              ออฟไลน์ (&gt;60s ไม่ส่ง GPS): {counts.offline}
            </div>
            <div className="emergency-meta">
              เริ่มเหตุการณ์: {new Date(active.created_at).toLocaleTimeString('th-TH')}
            </div>

            <div className="emergency-actions">
              <button
                className="btn-resolve"
                onClick={() => handleResolve(false)}
                disabled={resolving}
              >
                ✓ ปลดเหตุ — กลับสู่ปกติ
              </button>
              <button
                className="btn-false-alarm"
                onClick={() => handleResolve(true)}
                disabled={resolving}
              >
                ยกเลิก (false alarm)
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="emergency-stat">
      <div className="emergency-stat-label">{label}</div>
      <div className={`emergency-stat-value ${color || ''}`}>{value}</div>
    </div>
  );
}

function upsertUser(prev, update) {
  const idx = prev.findIndex((u) => u.user_id === update.user_id);
  if (idx === -1) {
    return [...prev, { ...update, online: true }];
  }
  const next = [...prev];
  next[idx] = { ...next[idx], ...update, online: true };
  return next;
}

function labelType(t) {
  return (
    {
      fire: '🔥 ไฟไหม้',
      earthquake: '🌍 แผ่นดินไหว',
      terrorist: '⚠️ ผู้บุกรุก',
    }[t] || t
  );
}

function labelStatus(s) {
  return (
    {
      ACTIVE: 'กำลังดำเนินการ',
      RESOLVED: 'คลี่คลาย',
      FALSE_ALARM: 'false alarm',
    }[s] || s
  );
}
