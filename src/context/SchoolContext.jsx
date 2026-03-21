import { createContext, useContext, useState, useEffect } from 'react';
import { schoolAPI, personnelAPI, classAPI } from '../services/api';
import { useAuth } from './AuthContext';

const SchoolContext = createContext(null);

export const SchoolProvider = ({ children }) => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getValidToken, logout } = useAuth();

  // ดึงข้อมูลจาก database เมื่อ component mount
  useEffect(() => {
    fetchSchoolsData();
  }, []);

  const fetchSchoolsData = async () => {
    try {
      const token = await getValidToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // ดึงข้อมูลโรงเรียนจาก API
      const schoolsResponse = await schoolAPI.getSchools(token);

      if (schoolsResponse.success && schoolsResponse.data) {
        // แปลงข้อมูลจาก API เป็นรูปแบบที่ frontend ใช้
        const transformedSchools = await Promise.all(
          schoolsResponse.data.map(async (school) => {
            let classrooms = [];

            try {
              // ดึงข้อมูล classes จาก API
              const classesResponse = await classAPI.getClasses(token, school.id);
              console.log(`📚 Classes for school ${school.id}:`, classesResponse);

              if (classesResponse.success && classesResponse.data) {
                // แปลง classes เป็น classrooms พร้อมดึงนักเรียนแต่ละห้อง
                classrooms = await Promise.all(
                  classesResponse.data.map(async (classData) => {
                    try {
                      // ดึงนักเรียนในชั้นนี้
                      const studentsResponse = await classAPI.getClassStudents(classData.id, token);

                      let students = [];
                      if (studentsResponse.success && studentsResponse.data && studentsResponse.data.students) {
                        students = studentsResponse.data.students.map(student => ({
                          id: student.id,
                          studentId: student.student_code,
                          studentNumber: 0,
                          firstNameTh: student.first_name_th,
                          lastNameTh: student.last_name_th,
                          firstNameEn: student.first_name_en || '',
                          lastNameEn: student.last_name_en || '',
                          phone: student.current_phone || student.father_phone || student.mother_phone || '',
                          address: student.house_number || '',
                          fatherName: student.father_first_name || '',
                          motherName: student.mother_first_name || ''
                        }));
                      }

                      return {
                        id: classData.id,
                        name: `${classData.grade}/${classData.section}`,
                        grade: classData.grade,
                        section: classData.section,
                        students: students
                      };
                    } catch (error) {
                      console.error(`Failed to fetch students for class ${classData.id}:`, error);
                      return {
                        id: classData.id,
                        name: `${classData.grade}/${classData.section}`,
                        grade: classData.grade,
                        section: classData.section,
                        students: []
                      };
                    }
                  })
                );
              }
            } catch (error) {
              console.error(`Failed to fetch classes for school ${school.id}:`, error);
            }

            // ดึงข้อมูลครูของโรงเรียน
            let teachers = [];
            try {
              const teachersResponse = await personnelAPI.getTeachers(token, school.id);
              console.log(`👨‍🏫 Teachers for school ${school.id}:`, teachersResponse);

              if (teachersResponse.success && teachersResponse.data) {
                teachers = teachersResponse.data.map(teacher => ({
                  id: teacher.id,
                  teacherCode: teacher.teacher_code,
                  titleTh: teacher.title_th,
                  firstNameTh: teacher.first_name_th,
                  lastNameTh: teacher.last_name_th,
                  firstNameEn: teacher.first_name_en || '',
                  lastNameEn: teacher.last_name_en || '',
                  subject: teacher.subject || '',
                  address: teacher.address || '',
                  phone: teacher.phone || '',
                  homeroomClass: teacher.homeroom_class || ''
                }));
              }
            } catch (error) {
              console.error(`Failed to fetch teachers for school ${school.id}:`, error);
            }

            return {
              id: school.id,
              name: school.name,
              address: school.address,
              classrooms: classrooms,
              teachers: teachers
            };
          })
        );

        setSchools(transformedSchools);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch schools data:', error);
      setLoading(false);
    }
  };

  const addSchool = async (school) => {
    try {
      const token = await getValidToken();
      if (!token) {
        throw new Error('No token found');
      }

      // เรียก API เพื่อสร้างโรงเรียนใหม่
      const response = await schoolAPI.createSchool(school, token);

      if (response.success && response.data) {
        // เพิ่มโรงเรียนใหม่ในระบบ
        const newSchool = {
          id: response.data.id,
          name: response.data.name,
          address: response.data.address,
          classrooms: [],
          teachers: []
        };
        setSchools([...schools, newSchool]);
      }
    } catch (error) {
      console.error('Failed to add school:', error);
      throw error;
    }
  };

  const deleteSchool = async (schoolId) => {
    try {
      const token = await getValidToken();
      if (!token) {
        throw new Error('No token found');
      }

      // เรียก API เพื่อลบโรงเรียน
      await schoolAPI.deleteSchool(schoolId, token);

      // ลบโรงเรียนออกจาก state
      setSchools(schools.filter(school => school.id !== schoolId));
    } catch (error) {
      console.error('Failed to delete school:', error);
      throw error;
    }
  };

  const addStudent = async (schoolId, classroomId, student) => {
    try {
      const token = await getValidToken();

      // Call API to save student to database
      if (token) {
        await personnelAPI.createStudent(student, token);
      }

      // Update local state
      setSchools(schools.map(school => {
        if (school.id === schoolId) {
          return {
            ...school,
            classrooms: school.classrooms.map(classroom => {
              if (classroom.id === classroomId) {
                const newStudent = {
                  ...student,
                  id: classroom.students.length > 0
                    ? Math.max(...classroom.students.map(s => s.id)) + 1
                    : 1
                };
                return {
                  ...classroom,
                  students: [...classroom.students, newStudent]
                };
              }
              return classroom;
            })
          };
        }
        return school;
      }));
    } catch (error) {
      console.error('Failed to add student:', error);
      throw error;
    }
  };

  const addStudentsBatch = async (schoolId, file, onProgress) => {
    console.log('🚀 addStudentsBatch called with:', {
      schoolId,
      file: file ? { name: file.name, size: file.size } : null,
      hasProgressCallback: !!onProgress
    });

    try {
      const token = await getValidToken();
      console.log('🔑 Token found:', !!token);

      // Call API to upload file to database
      if (token) {
        console.log('📡 Calling personnelAPI.uploadStudentsFile...');
        const result = await personnelAPI.uploadStudentsFile(file, schoolId, token, onProgress);
        console.log('✅ Upload result:', result);
        console.log('✅ Upload result.data:', result.data);

        // แสดงผลลัพธ์การอัพโหลด
        if (result && result.data) {
          const uploadData = result.data;
          console.log('📊 Upload data details:', uploadData);

          const totalRows = uploadData.total_rows || uploadData.TotalRows || 0;
          const successCount = uploadData.imported_rows || uploadData.success_count || uploadData.SuccessCount || 0;
          const failureCount = uploadData.error_rows || uploadData.failure_count || uploadData.FailureCount || 0;
          const duplicateCount = uploadData.duplicate_rows || uploadData.DuplicateRows || 0;
          const errors = uploadData.errors || uploadData.Errors || [];

          console.log('📈 Parsed counts:', { totalRows, successCount, failureCount, duplicateCount, errors });

          let message = `อัพโหลดสำเร็จ ${successCount} คน จาก ${totalRows} คน`;

          if (duplicateCount > 0) {
            message += `\nข้ามข้อมูลซ้ำ: ${duplicateCount} คน`;
          }

          if (failureCount > 0) {
            console.warn('Upload completed with errors:', errors);
            message += `\nข้อผิดพลาด: ${failureCount} คน`;
            if (errors.length > 0) {
              message += `\n\nรายละเอียด:\n${errors.slice(0, 10).join('\n')}`;
              if (errors.length > 10) {
                message += `\n... และอีก ${errors.length - 10} รายการ`;
              }
            }
          }

          alert(message);
        } else {
          console.warn('⚠️ No data in result:', result);
          alert('อัพโหลดเสร็จสิ้น แต่ไม่สามารถแสดงผลลัพธ์ได้');
        }

        // Reload students data from API to update local state
        console.log('🔄 Refreshing students data...');
        await fetchSchoolsData();
      }
    } catch (error) {
      console.error('Failed to upload students file:', error);
      throw error;
    }
  };

  const deleteStudent = (schoolId, classroomId, studentId) => {
    setSchools(schools.map(school => {
      if (school.id === schoolId) {
        return {
          ...school,
          classrooms: school.classrooms.map(classroom => {
            if (classroom.id === classroomId) {
              return {
                ...classroom,
                students: classroom.students.filter(s => s.id !== studentId)
              };
            }
            return classroom;
          })
        };
      }
      return school;
    }));
  };

  const addTeacher = async (schoolId, teacher) => {
    try {
      const token = await getValidToken();

      // Call API to save teacher to database
      if (token) {
        const response = await personnelAPI.createTeacher(teacher, token);
        console.log('✅ Teacher created:', response);

        if (response.success && response.data) {
          // Transform teacher data to match frontend format
          const transformedTeacher = {
            id: response.data.id,
            teacherId: response.data.teacher_id,
            titleTh: response.data.title_th,
            firstNameTh: response.data.first_name_th,
            lastNameTh: response.data.last_name_th,
            firstNameEn: response.data.first_name_en || '',
            lastNameEn: response.data.last_name_en || '',
            subject: response.data.subject || '',
            address: response.data.address || '',
            phone: response.data.phone || '',
            homeroomClass: response.data.homeroom_class || ''
          };

          // Update local state with transformed teacher data
          setSchools(schools.map(school => {
            if (school.id === schoolId) {
              return {
                ...school,
                teachers: [...school.teachers, transformedTeacher]
              };
            }
            return school;
          }));

          alert('บันทึกข้อมูลครูสำเร็จ');
        }
      }
    } catch (error) {
      console.error('Failed to add teacher:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลครู: ' + error.message);
      throw error;
    }
  };

  const updateTeacher = async (schoolId, teacherData) => {
    try {
      const token = await getValidToken();

      // Call API to update teacher in database
      if (token) {
        const response = await personnelAPI.updateTeacher(teacherData.id, teacherData, token);
        console.log('✅ Teacher updated:', response);

        if (response.success && response.data) {
          // Transform teacher data to match frontend format
          const transformedTeacher = {
            id: response.data.id,
            teacherId: response.data.teacher_id,
            titleTh: response.data.title_th,
            firstNameTh: response.data.first_name_th,
            lastNameTh: response.data.last_name_th,
            firstNameEn: response.data.first_name_en || '',
            lastNameEn: response.data.last_name_en || '',
            subject: response.data.subject || '',
            address: response.data.address || '',
            phone: response.data.phone || '',
            homeroomClass: response.data.homeroom_class || ''
          };

          // Update local state with transformed teacher data
          setSchools(schools.map(school => {
            if (school.id === schoolId) {
              return {
                ...school,
                teachers: school.teachers.map(t =>
                  t.id === teacherData.id ? transformedTeacher : t
                )
              };
            }
            return school;
          }));

          alert('อัพเดตข้อมูลครูสำเร็จ');
        }
      }
    } catch (error) {
      console.error('Failed to update teacher:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดตข้อมูลครู: ' + error.message);
      throw error;
    }
  };

  const deleteTeacher = async (schoolId, teacherId) => {
    try {
      const token = await getValidToken();

      // Call API to delete teacher from database
      if (token) {
        await personnelAPI.deleteTeacher(teacherId, token);
        console.log('✅ Teacher deleted');

        // Update local state
        setSchools(schools.map(school => {
          if (school.id === schoolId) {
            return {
              ...school,
              teachers: school.teachers.filter(t => t.id !== teacherId)
            };
          }
          return school;
        }));

        alert('ลบข้อมูลครูสำเร็จ');
      }
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูลครู: ' + error.message);
      throw error;
    }
  };

  const addClassroom = (schoolId, classroom) => {
    setSchools(schools.map(school => {
      if (school.id === schoolId) {
        const newClassroom = {
          ...classroom,
          id: school.classrooms.length > 0
            ? Math.max(...school.classrooms.map(c => c.id)) + 1
            : 1,
          students: []
        };
        return {
          ...school,
          classrooms: [...school.classrooms, newClassroom]
        };
      }
      return school;
    }));
  };

  const updateClassroom = (schoolId, classroomId, updatedData) => {
    setSchools(schools.map(school => {
      if (school.id === schoolId) {
        return {
          ...school,
          classrooms: school.classrooms.map(classroom => {
            if (classroom.id === classroomId) {
              return {
                ...classroom,
                ...updatedData
              };
            }
            return classroom;
          })
        };
      }
      return school;
    }));
  };

  return (
    <SchoolContext.Provider value={{
      schools,
      addSchool,
      deleteSchool,
      addStudent,
      addStudentsBatch,
      deleteStudent,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      addClassroom,
      updateClassroom
    }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within SchoolProvider');
  }
  return context;
};
