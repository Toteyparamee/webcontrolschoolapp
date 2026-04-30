// EmergencyDashboard — หน้าหลักสำหรับ admin/รปภ. เห็น live map ระหว่างเหตุฉุกเฉิน
//
// State machine:
//   - NO_ACTIVE  → แสดง history + ปุ่ม "trigger" (admin/รปภ. กดได้)
//   - ACTIVE     → แสดง live map + sidebar นับจำนวน + ปุ่ม "ปลดเหตุ"
//
// Polling: เช็ค active alert ทุก 30s (เผื่อ user เปิดหน้านี้ระหว่างเหตุการณ์)
// WebSocket: connect ตอน active ขึ้น, disconnect ตอน resolved

import { useEffect, useMemo, useState } from 'react';
import { emergencyAPI } from '../api';
import EmergencyMap from '../components/EmergencyMap';
import EmergencyWS from '../services/emergencyWS';

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
        setUsers((prev) => prev.map((u) =>
          u.user_id === data.user_id ? { ...u, status: data.status } : u
        ));
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
    if (!confirm(falseAlarm ? 'ยืนยันยกเลิก (false alarm)?' : 'ยืนยันปลดเหตุการณ์?')) return;
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

  if (loading) return <div className="p-8">กำลังโหลด...</div>;

  if (!active) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">ระบบแจ้งเหตุฉุกเฉิน</h1>
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
          <span className="text-green-700 font-semibold">✓ ไม่มีเหตุฉุกเฉินขณะนี้</span>
        </div>
        <h2 className="text-lg font-semibold mb-2">ประวัติ (100 รายการล่าสุด)</h2>
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">เวลา</th>
                <th className="px-3 py-2 text-left">ประเภท</th>
                <th className="px-3 py-2 text-left">รายละเอียด</th>
                <th className="px-3 py-2 text-left">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500">— ยังไม่มีประวัติ —</td></tr>
              ) : history.map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="px-3 py-2">{new Date(h.created_at).toLocaleString('th-TH')}</td>
                  <td className="px-3 py-2">{labelType(h.alert_type)}</td>
                  <td className="px-3 py-2">{h.note}</td>
                  <td className="px-3 py-2">{labelStatus(h.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ACTIVE state
  return (
    <div className="flex h-screen">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-[1000] bg-red-600 text-white px-4 py-2 rounded shadow">
          🚨 {labelType(active.alert_type)} — {active.note || '(ไม่มีรายละเอียด)'}
        </div>
        <EmergencyMap users={users} />
      </div>
      <aside className="w-80 border-l bg-white p-4 flex flex-col">
        <div className="text-sm text-gray-500 mb-1">สรุปสถานะ</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Stat label="ทั้งหมด" value={counts.total} />
          <Stat label="ปลอดภัย" value={counts.safe} color="green" />
          <Stat label="ขอความช่วยเหลือ" value={counts.need_help} color="red" />
          <Stat label="ยังไม่ตอบ" value={counts.no_response} color="amber" />
        </div>
        <div className="text-xs text-gray-500 mb-4">
          ออฟไลน์ (>60s ไม่ส่ง GPS): {counts.offline}
        </div>
        <div className="text-xs text-gray-500 mb-4">
          เริ่มเหตุการณ์: {new Date(active.created_at).toLocaleTimeString('th-TH')}
        </div>
        <div className="mt-auto space-y-2">
          <button
            onClick={() => handleResolve(false)}
            disabled={resolving}
            className="w-full py-3 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            ✓ ปลดเหตุ — กลับสู่ปกติ
          </button>
          <button
            onClick={() => handleResolve(true)}
            disabled={resolving}
            className="w-full py-2 rounded border text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            ยกเลิก (false alarm)
          </button>
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value, color }) {
  const colors = {
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
  };
  return (
    <div className="bg-gray-50 rounded p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${colors[color] || ''}`}>{value}</div>
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
  return { fire: '🔥 ไฟไหม้', earthquake: '🌍 แผ่นดินไหว', terrorist: '⚠️ ผู้บุกรุก' }[t] || t;
}

function labelStatus(s) {
  return { ACTIVE: 'กำลังดำเนินการ', RESOLVED: 'คลี่คลาย', FALSE_ALARM: 'false alarm' }[s] || s;
}
