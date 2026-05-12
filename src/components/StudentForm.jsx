import { useState } from 'react';
import '../css/StudentForm.css';

const emptyForm = {
  // ข้อมูลพื้นฐาน
  studentId: '',
  studentNumber: '',
  nationalId: '',
  titleTh: '',
  firstNameTh: '',
  lastNameTh: '',
  firstNameEn: '',
  lastNameEn: '',
  gender: '',
  birthDate: '',
  bloodType: '',
  nationality: '',
  ethnicity: '',
  religion: '',
  birthProvince: '',
  // ที่อยู่
  houseNumber: '',
  villageNo: '',
  road: '',
  subDistrict: '',
  district: '',
  province: '',
  postalCode: '',
  currentPhone: '',
  // ข้อมูลร่างกาย
  weight: '',
  height: '',
  // การเดินทาง
  distancePavedRoad: '',
  distanceUnpavedRoad: '',
  travelTime: '',
  travelMethod: '',
  // บิดา
  fatherTitle: '',
  fatherFirstName: '',
  fatherLastName: '',
  fatherOccupation: '',
  fatherMonthlyIncome: '',
  fatherPhone: '',
  // มารดา
  motherTitle: '',
  motherFirstName: '',
  motherLastName: '',
  motherOccupation: '',
  motherMonthlyIncome: '',
  motherPhone: '',
  // ผู้ปกครอง
  guardianRelationship: '',
  guardianTitle: '',
  guardianFirstName: '',
  guardianLastName: '',
  guardianOccupation: '',
  guardianMonthlyIncome: '',
  guardianPhone: '',
  // พี่น้อง
  childOrder: '',
  olderBrothers: '',
  youngerBrothers: '',
  olderSisters: '',
  youngerSisters: '',
  parentsMaritalStatus: '',
};

const StudentForm = ({ onSubmit, onCancel, multiMode = false }) => {
  const [formData, setFormData] = useState({ ...emptyForm });
  const [activeSection, setActiveSection] = useState('basic');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      // ข้อมูลพื้นฐาน (camelCase ตามที่ context ใช้)
      studentId: formData.studentId,
      studentNumber: formData.studentNumber ? parseInt(formData.studentNumber) : null,
      nationalId: formData.nationalId,
      titleTh: formData.titleTh,
      firstNameTh: formData.firstNameTh,
      lastNameTh: formData.lastNameTh,
      firstNameEn: formData.firstNameEn,
      lastNameEn: formData.lastNameEn,
      gender: formData.gender,
      birthDate: formData.birthDate || null,
      bloodType: formData.bloodType,
      nationality: formData.nationality,
      ethnicity: formData.ethnicity,
      religion: formData.religion,
      birthProvince: formData.birthProvince,
      // ที่อยู่
      houseNumber: formData.houseNumber,
      villageNo: formData.villageNo,
      road: formData.road,
      subDistrict: formData.subDistrict,
      district: formData.district,
      province: formData.province,
      postalCode: formData.postalCode,
      currentPhone: formData.currentPhone,
      phone: formData.currentPhone,
      // ข้อมูลร่างกาย
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      // การเดินทาง
      distancePavedRoad: formData.distancePavedRoad ? parseFloat(formData.distancePavedRoad) : null,
      distanceUnpavedRoad: formData.distanceUnpavedRoad ? parseFloat(formData.distanceUnpavedRoad) : null,
      travelTime: formData.travelTime ? parseInt(formData.travelTime) : null,
      travelMethod: formData.travelMethod,
      // บิดา
      fatherTitle: formData.fatherTitle,
      fatherFirstName: formData.fatherFirstName,
      fatherLastName: formData.fatherLastName,
      fatherName: formData.fatherFirstName,
      fatherOccupation: formData.fatherOccupation,
      fatherMonthlyIncome: formData.fatherMonthlyIncome ? parseFloat(formData.fatherMonthlyIncome) : null,
      fatherPhone: formData.fatherPhone,
      // มารดา
      motherTitle: formData.motherTitle,
      motherFirstName: formData.motherFirstName,
      motherLastName: formData.motherLastName,
      motherName: formData.motherFirstName,
      motherOccupation: formData.motherOccupation,
      motherMonthlyIncome: formData.motherMonthlyIncome ? parseFloat(formData.motherMonthlyIncome) : null,
      motherPhone: formData.motherPhone,
      // ผู้ปกครอง
      guardianRelationship: formData.guardianRelationship,
      guardianTitle: formData.guardianTitle,
      guardianFirstName: formData.guardianFirstName,
      guardianLastName: formData.guardianLastName,
      guardianOccupation: formData.guardianOccupation,
      guardianMonthlyIncome: formData.guardianMonthlyIncome ? parseFloat(formData.guardianMonthlyIncome) : null,
      guardianPhone: formData.guardianPhone,
      // พี่น้อง
      childOrder: formData.childOrder ? parseInt(formData.childOrder) : null,
      olderBrothers: formData.olderBrothers ? parseInt(formData.olderBrothers) : 0,
      youngerBrothers: formData.youngerBrothers ? parseInt(formData.youngerBrothers) : 0,
      olderSisters: formData.olderSisters ? parseInt(formData.olderSisters) : 0,
      youngerSisters: formData.youngerSisters ? parseInt(formData.youngerSisters) : 0,
      parentsMaritalStatus: formData.parentsMaritalStatus,
    });
    setFormData({ ...emptyForm });
  };

  const sections = [
    { key: 'basic', label: 'ข้อมูลพื้นฐาน' },
    { key: 'address', label: 'ที่อยู่' },
    { key: 'family', label: 'ครอบครัว' },
    { key: 'other', label: 'อื่นๆ' },
  ];

  return (
    <form className="student-form" onSubmit={handleSubmit}>
      <h3>เพิ่มนักเรียน</h3>

      <div className="student-form-tabs">
        {sections.map(s => (
          <button
            key={s.key}
            type="button"
            className={`student-form-tab${activeSection === s.key ? ' active' : ''}`}
            onClick={() => setActiveSection(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ===== ข้อมูลพื้นฐาน ===== */}
      {activeSection === 'basic' && (
        <div className="form-grid">
          <div className="form-group">
            <label>รหัสนักเรียน *</label>
            <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>เลขที่ *</label>
            <input type="number" name="studentNumber" value={formData.studentNumber} onChange={handleChange} required min="1" />
          </div>
          <div className="form-group full-width">
            <label>เลขบัตรประชาชน</label>
            <input type="text" name="nationalId" value={formData.nationalId} onChange={handleChange} placeholder="กรอก 13 หลัก" maxLength={13} />
          </div>
          <div className="form-group">
            <label>คำนำหน้า</label>
            <select name="titleTh" value={formData.titleTh} onChange={handleChange}>
              <option value="">-- เลือก --</option>
              <option>เด็กชาย</option>
              <option>เด็กหญิง</option>
              <option>นาย</option>
              <option>นางสาว</option>
              <option>นาง</option>
            </select>
          </div>
          <div className="form-group">
            <label>เพศ</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">-- เลือก --</option>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
            </select>
          </div>
          <div className="form-group">
            <label>ชื่อ (ไทย) *</label>
            <input type="text" name="firstNameTh" value={formData.firstNameTh} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>นามสกุล (ไทย) *</label>
            <input type="text" name="lastNameTh" value={formData.lastNameTh} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>ชื่อ (อังกฤษ)</label>
            <input type="text" name="firstNameEn" value={formData.firstNameEn} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>นามสกุล (อังกฤษ)</label>
            <input type="text" name="lastNameEn" value={formData.lastNameEn} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>วันเกิด</label>
            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>กรุ๊ปเลือด</label>
            <select name="bloodType" value={formData.bloodType} onChange={handleChange}>
              <option value="">-- เลือก --</option>
              <option>A</option><option>B</option><option>AB</option><option>O</option>
            </select>
          </div>
          <div className="form-group">
            <label>สัญชาติ</label>
            <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="ไทย" />
          </div>
          <div className="form-group">
            <label>เชื้อชาติ</label>
            <input type="text" name="ethnicity" value={formData.ethnicity} onChange={handleChange} placeholder="ไทย" />
          </div>
          <div className="form-group">
            <label>ศาสนา</label>
            <input type="text" name="religion" value={formData.religion} onChange={handleChange} placeholder="พุทธ" />
          </div>
          <div className="form-group">
            <label>จังหวัดที่เกิด</label>
            <input type="text" name="birthProvince" value={formData.birthProvince} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>น้ำหนัก (กก.)</label>
            <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>ส่วนสูง (ซม.)</label>
            <input type="number" step="0.01" name="height" value={formData.height} onChange={handleChange} />
          </div>
        </div>
      )}

      {/* ===== ที่อยู่ ===== */}
      {activeSection === 'address' && (
        <div className="form-grid">
          <div className="form-group">
            <label>บ้านเลขที่</label>
            <input type="text" name="houseNumber" value={formData.houseNumber} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>หมู่</label>
            <input type="text" name="villageNo" value={formData.villageNo} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>ถนน</label>
            <input type="text" name="road" value={formData.road} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>ตำบล</label>
            <input type="text" name="subDistrict" value={formData.subDistrict} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>อำเภอ</label>
            <input type="text" name="district" value={formData.district} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>จังหวัด</label>
            <input type="text" name="province" value={formData.province} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>รหัสไปรษณีย์</label>
            <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} maxLength={5} />
          </div>
          <div className="form-group">
            <label>เบอร์โทรศัพท์</label>
            <input type="tel" name="currentPhone" value={formData.currentPhone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>ระยะทาง (ถนนลาดยาง) กม.</label>
            <input type="number" step="0.01" name="distancePavedRoad" value={formData.distancePavedRoad} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>ระยะทาง (ถนนลูกรัง) กม.</label>
            <input type="number" step="0.01" name="distanceUnpavedRoad" value={formData.distanceUnpavedRoad} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>เวลาเดินทาง (นาที)</label>
            <input type="number" name="travelTime" value={formData.travelTime} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>วิธีการเดินทาง</label>
            <input type="text" name="travelMethod" value={formData.travelMethod} onChange={handleChange} placeholder="เช่น รถยนต์, เดินเท้า" />
          </div>
        </div>
      )}

      {/* ===== ครอบครัว ===== */}
      {activeSection === 'family' && (
        <div className="form-grid">
          <div className="form-group form-section-heading full-width"><strong>ข้อมูลบิดา</strong></div>
          <div className="form-group">
            <label>คำนำหน้า</label>
            <input type="text" name="fatherTitle" value={formData.fatherTitle} onChange={handleChange} placeholder="นาย" />
          </div>
          <div className="form-group">
            <label>ชื่อบิดา</label>
            <input type="text" name="fatherFirstName" value={formData.fatherFirstName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>นามสกุลบิดา</label>
            <input type="text" name="fatherLastName" value={formData.fatherLastName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>อาชีพบิดา</label>
            <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>เบอร์โทรบิดา</label>
            <input type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>รายได้บิดา (บาท/เดือน)</label>
            <input type="number" step="0.01" name="fatherMonthlyIncome" value={formData.fatherMonthlyIncome} onChange={handleChange} />
          </div>

          <div className="form-group form-section-heading full-width"><strong>ข้อมูลมารดา</strong></div>
          <div className="form-group">
            <label>คำนำหน้า</label>
            <input type="text" name="motherTitle" value={formData.motherTitle} onChange={handleChange} placeholder="นาง / นางสาว" />
          </div>
          <div className="form-group">
            <label>ชื่อมารดา</label>
            <input type="text" name="motherFirstName" value={formData.motherFirstName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>นามสกุลมารดา</label>
            <input type="text" name="motherLastName" value={formData.motherLastName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>อาชีพมารดา</label>
            <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>เบอร์โทรมารดา</label>
            <input type="tel" name="motherPhone" value={formData.motherPhone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>รายได้มารดา (บาท/เดือน)</label>
            <input type="number" step="0.01" name="motherMonthlyIncome" value={formData.motherMonthlyIncome} onChange={handleChange} />
          </div>

          <div className="form-group form-section-heading full-width"><strong>ข้อมูลผู้ปกครอง</strong></div>
          <div className="form-group">
            <label>ความสัมพันธ์</label>
            <input type="text" name="guardianRelationship" value={formData.guardianRelationship} onChange={handleChange} placeholder="เช่น บิดา, มารดา, ปู่" />
          </div>
          <div className="form-group">
            <label>คำนำหน้า</label>
            <input type="text" name="guardianTitle" value={formData.guardianTitle} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>ชื่อผู้ปกครอง</label>
            <input type="text" name="guardianFirstName" value={formData.guardianFirstName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>นามสกุลผู้ปกครอง</label>
            <input type="text" name="guardianLastName" value={formData.guardianLastName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>อาชีพผู้ปกครอง</label>
            <input type="text" name="guardianOccupation" value={formData.guardianOccupation} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>เบอร์โทรผู้ปกครอง</label>
            <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>รายได้ผู้ปกครอง (บาท/เดือน)</label>
            <input type="number" step="0.01" name="guardianMonthlyIncome" value={formData.guardianMonthlyIncome} onChange={handleChange} />
          </div>
        </div>
      )}

      {/* ===== อื่นๆ ===== */}
      {activeSection === 'other' && (
        <div className="form-grid">
          <div className="form-group form-section-heading full-width"><strong>ข้อมูลพี่น้อง</strong></div>
          <div className="form-group">
            <label>เป็นบุตรคนที่</label>
            <input type="number" name="childOrder" value={formData.childOrder} onChange={handleChange} min="1" />
          </div>
          <div className="form-group">
            <label>พี่ชาย</label>
            <input type="number" name="olderBrothers" value={formData.olderBrothers} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label>น้องชาย</label>
            <input type="number" name="youngerBrothers" value={formData.youngerBrothers} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label>พี่สาว</label>
            <input type="number" name="olderSisters" value={formData.olderSisters} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label>น้องสาว</label>
            <input type="number" name="youngerSisters" value={formData.youngerSisters} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label>สถานภาพบิดามารดา</label>
            <select name="parentsMaritalStatus" value={formData.parentsMaritalStatus} onChange={handleChange}>
              <option value="">-- เลือก --</option>
              <option value="อยู่ด้วยกัน">อยู่ด้วยกัน</option>
              <option value="หย่าร้าง">หย่าร้าง</option>
              <option value="แยกกันอยู่">แยกกันอยู่</option>
              <option value="บิดาเสียชีวิต">บิดาเสียชีวิต</option>
              <option value="มารดาเสียชีวิต">มารดาเสียชีวิต</option>
              <option value="บิดามารดาเสียชีวิต">บิดามารดาเสียชีวิต</option>
            </select>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-submit">
          {multiMode ? 'บันทึก & เพิ่มต่อ' : 'บันทึก'}
        </button>
        <button type="button" onClick={onCancel} className="btn-cancel">
          {multiMode ? 'ปิด' : 'ยกเลิก'}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
