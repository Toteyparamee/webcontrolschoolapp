import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { newsAPI } from '../api/newsApi';
import '../css/NewsManagementPage.css';

const COLOR_OPTIONS = [
  { key: 'blue', hex: '#2196F3' },
  { key: 'purple', hex: '#9C27B0' },
  { key: 'orange', hex: '#FF9800' },
  { key: 'green', hex: '#4CAF50' },
  { key: 'red', hex: '#F44336' },
  { key: 'pink', hex: '#E91E63' },
  { key: 'teal', hex: '#009688' },
  { key: 'indigo', hex: '#3F51B5' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
  color: 'blue',
  is_published: true,
  show_title: true,
  show_description: true,
  show_date: true,
  show_image: true,
  image_url: null,
};

const NewsManagementPage = () => {
  const { getValidToken } = useAuth();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      const res = await newsAPI.getNews(token);
      setNewsList(res.news || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getValidToken]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      date: item.date || '',
      color: item.color || 'blue',
      is_published: item.is_published ?? true,
      show_title: item.show_title ?? true,
      show_description: item.show_description ?? true,
      show_date: item.show_date ?? true,
      show_image: item.show_image ?? true,
      image_url: item.image_url || null,
    });
    setShowForm(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = await getValidToken();
      const res = await newsAPI.uploadImage(file, token);
      setForm((f) => ({ ...f, image_url: res.url }));
    } catch (err) {
      alert('อัปโหลดรูปล้มเหลว: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getValidToken();
      if (editingId) {
        await newsAPI.updateNews(editingId, form, token);
      } else {
        await newsAPI.createNews(form, token);
      }
      setShowForm(false);
      await loadNews();
    } catch (err) {
      alert('บันทึกล้มเหลว: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const label = item.title || '(ไม่มีหัวข้อ)';
    if (!window.confirm(`ลบ "${label}" ใช่หรือไม่?`)) return;
    try {
      const token = await getValidToken();
      await newsAPI.deleteNews(item.id, token);
      await loadNews();
    } catch (err) {
      alert('ลบล้มเหลว: ' + err.message);
    }
  };

  const handleTogglePublish = async (item) => {
    try {
      const token = await getValidToken();
      await newsAPI.updateNews(item.id, { is_published: !item.is_published }, token);
      await loadNews();
    } catch (err) {
      alert('อัปเดตล้มเหลว: ' + err.message);
    }
  };

  const colorHex = (key) => COLOR_OPTIONS.find((c) => c.key === key)?.hex || '#2196F3';

  return (
    <div className="news-management-page">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>จัดการข่าวสารและประกาศ</h1>
          <p>สร้าง แก้ไข และจัดการข่าวสารสำหรับแสดงในแอปนักเรียนและครู</p>
        </div>

        <div className="toolbar">
          <button className="btn-primary" onClick={openAdd}>+ เพิ่มข่าวสาร</button>
          <button className="btn-secondary" onClick={loadNews} disabled={loading}>
            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
        </div>

        {error && <div className="error-banner">เกิดข้อผิดพลาด: {error}</div>}

        {loading ? (
          <div className="loading-state">กำลังโหลด...</div>
        ) : newsList.length === 0 ? (
          <div className="empty-state">ยังไม่มีข่าวสาร กดปุ่ม + เพื่อเพิ่ม</div>
        ) : (
          <div className="news-grid">
            {newsList.map((item) => {
              const imgSrc = newsAPI.resolveImageUrl(item.image_url);
              const showTitle = item.show_title ?? true;
              const showDescription = item.show_description ?? true;
              const showDate = item.show_date ?? true;
              const showImage = item.show_image ?? true;
              const c = colorHex(item.color);
              const hasImage = showImage && imgSrc;
              const hasGradient = showImage && !imgSrc;
              return (
                <div key={item.id} className="news-card">
                  {hasImage && (
                    <div className="news-card-image">
                      <img src={imgSrc} alt="" />
                      {!item.is_published && <span className="badge-unpublished">ไม่เผยแพร่</span>}
                    </div>
                  )}
                  {hasGradient && (
                    <div
                      className="news-card-gradient"
                      style={{ background: `linear-gradient(135deg, ${c}, ${c}b3)` }}
                    >
                      <span className="news-card-article-icon">📰</span>
                      {!item.is_published && <span className="badge-unpublished">ไม่เผยแพร่</span>}
                    </div>
                  )}
                  <div className="news-card-body">
                    {showTitle && item.title && <h3 className="news-title">{item.title}</h3>}
                    {showDescription && item.description && (
                      <p className="news-desc">{item.description}</p>
                    )}
                    {showDate && item.date && (
                      <div className="news-date" style={{ color: c }}>
                        <span className="date-icon">📅</span>
                        <span>{item.date}</span>
                      </div>
                    )}
                    <div className="news-card-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleTogglePublish(item)}
                        title={item.is_published ? 'ซ่อน' : 'เผยแพร่'}
                        style={{ color: item.is_published ? '#4CAF50' : '#FF9800' }}
                      >
                        {item.is_published ? '👁️' : '🚫'}
                      </button>
                      <button className="btn-icon" onClick={() => openEdit(item)} title="แก้ไข">✏️</button>
                      <button className="btn-icon btn-danger" onClick={() => handleDelete(item)} title="ลบ">🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => !saving && setShowForm(false)}
        title={editingId ? 'แก้ไขข่าวสาร' : 'เพิ่มข่าวสารใหม่'}
        size="medium"
      >
        <form className="news-form" onSubmit={handleSubmit}>
            <label>
              <div className="field-row">
                <span>หัวข้อข่าว</span>
                <label className="toggle-inline">
                  <input
                    type="checkbox"
                    checked={form.show_title}
                    onChange={(e) => setForm({ ...form, show_title: e.target.checked })}
                  />
                  <span>แสดง</span>
                </label>
              </div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="เช่น ประกาศวันหยุด"
              />
            </label>

            <label>
              <div className="field-row">
                <span>รายละเอียด</span>
                <label className="toggle-inline">
                  <input
                    type="checkbox"
                    checked={form.show_description}
                    onChange={(e) => setForm({ ...form, show_description: e.target.checked })}
                  />
                  <span>แสดง</span>
                </label>
              </div>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>

            <label>
              <div className="field-row">
                <span>วันที่</span>
                <label className="toggle-inline">
                  <input
                    type="checkbox"
                    checked={form.show_date}
                    onChange={(e) => setForm({ ...form, show_date: e.target.checked })}
                  />
                  <span>แสดง</span>
                </label>
              </div>
              <input
                type="text"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder="เช่น 15 สิงหาคม 2567"
              />
            </label>

            <div className="field-row">
              <span>รูปภาพ</span>
              <label className="toggle-inline">
                <input
                  type="checkbox"
                  checked={form.show_image}
                  onChange={(e) => setForm({ ...form, show_image: e.target.checked })}
                />
                <span>แสดง</span>
              </label>
            </div>
            {form.image_url ? (
              <div className="image-preview">
                <img src={newsAPI.resolveImageUrl(form.image_url)} alt="preview" />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => setForm({ ...form, image_url: null })}
                >
                  ลบรูป
                </button>
              </div>
            ) : (
              <div className="image-placeholder">ไม่มีรูปภาพ</div>
            )}
            <label className="btn-upload">
              {uploading ? 'กำลังอัปโหลด...' : form.image_url ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพ'}
              <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} hidden />
            </label>

            <div className="field-row">
              <span>สี</span>
            </div>
            <div className="color-picker">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`color-swatch ${form.color === c.key ? 'active' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => setForm({ ...form, color: c.key })}
                  title={c.key}
                />
              ))}
            </div>

            <label className="toggle-inline">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              <span>เผยแพร่</span>
            </label>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary" disabled={saving || uploading}>
              {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึก' : 'เพิ่ม'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NewsManagementPage;
