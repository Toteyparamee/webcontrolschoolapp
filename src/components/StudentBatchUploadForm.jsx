import { useState } from 'react';
import * as XLSX from 'xlsx';
import '../css/StudentBatchUploadForm.css';

const StudentBatchUploadForm = ({ onSubmit, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setError('กรุณาอัพโหลดไฟล์ Excel (.xlsx, .xls) หรือ CSV เท่านั้น');
      return;
    }

    setSelectedFile(file);
    setError('');
    parseFile(file);
  };

  const parseFile = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const students = jsonData.map((row, index) => ({
          studentId: row['รหัสนักเรียน'] || row['studentId'] || '',
          studentNumber: parseInt(row['เลขที่'] || row['studentNumber'] || index + 1),
          firstNameTh: row['ชื่อ (ไทย)'] || row['firstNameTh'] || '',
          lastNameTh: row['นามสกุล (ไทย)'] || row['lastNameTh'] || '',
          firstNameEn: row['ชื่อ (อังกฤษ)'] || row['firstNameEn'] || '',
          lastNameEn: row['นามสกุล (อังกฤษ)'] || row['lastNameEn'] || '',
          address: row['ที่อยู่'] || row['address'] || '',
          phone: row['เบอร์โทร'] || row['phone'] || '',
          fatherName: row['ชื่อบิดา'] || row['fatherName'] || '',
          motherName: row['ชื่อมารดา'] || row['motherName'] || '',
          username: row['Username'] || row['username'] || '',
          password: row['Password'] || row['password'] || '12345678'
        }));

        setPreviewData(students);
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 Form submit triggered');

    if (!selectedFile) {
      console.warn('❌ No file selected');
      setError('กรุณาเลือกไฟล์');
      return;
    }

    if (previewData.length === 0) {
      console.warn('❌ No preview data');
      setError('ไม่มีข้อมูลนักเรียนในไฟล์');
      return;
    }

    console.log('✅ Submitting file:', {
      fileName: selectedFile.name,
      previewCount: previewData.length,
      onSubmitType: typeof onSubmit
    });

    // ส่งไฟล์จริงแทน JSON
    if (typeof onSubmit === 'function') {
      console.log('🔥 Calling onSubmit...', {
        functionName: onSubmit.name,
        functionString: onSubmit.toString().substring(0, 100)
      });

      setIsUploading(true);
      setUploadProgress(0);
      setError('');

      try {
        const result = await onSubmit({
          file: selectedFile,
          previewCount: previewData.length,
          onProgress: (progress) => {
            console.log('📊 Upload progress:', progress);
            setUploadProgress(progress);
          }
        });

        console.log('✅ onSubmit completed, result:', result);
        setUploadProgress(100);
      } catch (err) {
        console.error('💥 onSubmit error:', err);
        setError('เกิดข้อผิดพลาดในการอัพโหลด: ' + err.message);
      } finally {
        setIsUploading(false);
      }
    } else {
      console.error('❌ onSubmit is not a function!', onSubmit);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'รหัสนักเรียน': '65001',
        'เลขที่': 1,
        'ชื่อ (ไทย)': 'สมชาย',
        'นามสกุล (ไทย)': 'ใจดี',
        'ชื่อ (อังกฤษ)': 'Somchai',
        'นามสกุล (อังกฤษ)': 'Jaidee',
        'ที่อยู่': '123 ถ.พระราม 4 กรุงเทพฯ',
        'เบอร์โทร': '0812345678',
        'ชื่อบิดา': 'สมศักดิ์ ใจดี',
        'ชื่อมารดา': 'สมหญิง ใจดี',
        'Username': 'somchai65001',
        'Password': '12345678'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_template.xlsx');
  };

  return (
    <div className="batch-upload-form">
      <div className="form-header">
        <h3>อัพโหลดข้อมูลนักเรียนจากไฟล์</h3>
        <button
          type="button"
          onClick={downloadTemplate}
          className="btn-download-template"
        >
          ดาวน์โหลดไฟล์ตัวอย่าง
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-group">
            <label>เลือกไฟล์ Excel หรือ CSV *</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              required
              className="file-input"
            />
            {selectedFile && (
              <div className="file-info">
                ไฟล์ที่เลือก: {selectedFile.name}
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          {isUploading && (
            <div className="upload-progress-section">
              <div className="progress-label">
                กำลังอัพโหลด... {uploadProgress}%
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {previewData.length > 0 && (
          <div className="preview-section">
            <h4>ข้อมูลที่จะนำเข้า ({previewData.length} คน)</h4>
            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>เลขที่</th>
                    <th>รหัสนักเรียน</th>
                    <th>ชื่อ-นามสกุล (ไทย)</th>
                    <th>ชื่อ-นามสกุล (อังกฤษ)</th>
                    <th>เบอร์โทร</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((student, index) => (
                    <tr key={index}>
                      <td>{student.studentNumber}</td>
                      <td>{student.studentId}</td>
                      <td>{student.firstNameTh} {student.lastNameTh}</td>
                      <td>{student.firstNameEn} {student.lastNameEn}</td>
                      <td>{student.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn-submit"
            disabled={previewData.length === 0 || isUploading}
          >
            {isUploading ? `กำลังอัพโหลด... ${uploadProgress}%` : `นำเข้าข้อมูล (${previewData.length} คน)`}
          </button>
          <button type="button" onClick={onCancel} className="btn-cancel" disabled={isUploading}>
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentBatchUploadForm;
