// ตรวจสอบว่าใช้ Kong Gateway หรือเรียก Backend โดยตรง
const USE_KONG = import.meta.env.VITE_USE_KONG === 'true';
const KONG_GATEWAY_URL = import.meta.env.VITE_KONG_GATEWAY_URL || 'http://localhost:8000';
const LOGIN_API_URL = import.meta.env.VITE_LOGIN_API_URL || 'http://localhost:8080';
const PERSONNEL_API_URL = import.meta.env.VITE_PERSONNEL_API_URL || 'http://localhost:8082';

// ถ้าใช้ Kong = ทุก request ผ่าน Gateway
// ถ้าไม่ใช้ Kong = เรียก Backend โดยตรง
const API_BASE_URL = {
  LOGIN: USE_KONG ? KONG_GATEWAY_URL : LOGIN_API_URL,
  PERSONNEL: USE_KONG ? KONG_GATEWAY_URL : PERSONNEL_API_URL
};

console.log('🔧 API Configuration:', {
  USE_KONG,
  LOGIN: API_BASE_URL.LOGIN,
  PERSONNEL: API_BASE_URL.PERSONNEL
});

// Helper function: สร้าง URL ตาม environment
// Development: http://localhost:8080/server/login
// Production (Kong): http://localhost:8000/login-service/server/login
const buildURL = (service, path) => {
  if (USE_KONG) {
    // เมื่อใช้ Kong ต้องเพิ่ม service prefix
    const servicePrefix = service === 'LOGIN' ? 'login-service' : 'personnel-service';
    return `${API_BASE_URL[service]}/${servicePrefix}${path}`;
  }
  // Development: เรียกตรง
  return `${API_BASE_URL[service]}${path}`;
};

export const authAPI = {
  async login(username, password) {
    const response = await fetch(buildURL('LOGIN', '/server/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  },

  async getProfile(token) {
    const response = await fetch(buildURL('LOGIN', '/server/profile'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get profile');
    }

    return data;
  },

  async refreshToken(refreshToken) {
    const response = await fetch(buildURL('LOGIN', '/server/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    return data;
  },
};

export const personnelAPI = {
  async getStudents(token) {
    const response = await fetch(buildURL('PERSONNEL', '/api/v1/students'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get students');
    }

    return data;
  },

  async createStudent(studentData, token) {
    const response = await fetch(buildURL('PERSONNEL', '/api/v1/students'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create student');
    }

    return data;
  },

  async uploadStudentsFile(file, schoolId, token, onProgress) {
    console.log('📤 uploadStudentsFile called with:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      schoolId: schoolId,
      hasToken: !!token
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('school_id', schoolId);

    const url = buildURL('PERSONNEL', '/api/v1/students/upload');
    console.log('📍 Upload URL:', url);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          console.log('📊 Upload progress:', percentComplete, '%');
          onProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        console.log('📥 Upload response:', {
          status: xhr.status,
          statusText: xhr.statusText,
          ok: xhr.status >= 200 && xhr.status < 300
        });

        try {
          const data = JSON.parse(xhr.responseText);
          console.log('📦 Upload data:', data);

          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('✅ Upload successful:', {
              totalRows: data.data?.TotalRows,
              successCount: data.data?.SuccessCount,
              failureCount: data.data?.FailureCount,
              errors: data.data?.Errors
            });
            resolve(data);
          } else {
            const errorMsg = data.message || data.error || 'Failed to upload students file';
            console.error('❌ Upload failed:', errorMsg);
            reject(new Error(errorMsg));
          }
        } catch (err) {
          console.error('❌ Failed to parse response:', err);
          reject(new Error('Failed to parse server response'));
        }
      });

      // Handle network errors
      xhr.addEventListener('error', () => {
        console.error('❌ Network error during upload');
        reject(new Error('Network error during upload'));
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        console.error('❌ Upload aborted');
        reject(new Error('Upload aborted'));
      });

      // Open and send request
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },

  async deleteStudent(id, token) {
    const response = await fetch(buildURL('PERSONNEL', `/api/v1/students/${id}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete student');
    }

    return data;
  },

  async getPersonnel(token) {
    const response = await fetch(buildURL('PERSONNEL', '/api/personnel'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get personnel');
    }

    return data;
  },

  async getPersonnelById(id, token) {
    const response = await fetch(buildURL('PERSONNEL', `/api/personnel/${id}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get personnel details');
    }

    return data;
  },

  async createPersonnel(personnelData, token) {
    const response = await fetch(buildURL('PERSONNEL', '/api/personnel'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personnelData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create personnel');
    }

    return data;
  },

  async updatePersonnel(id, personnelData, token) {
    const response = await fetch(buildURL('PERSONNEL', `/api/personnel/${id}`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personnelData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update personnel');
    }

    return data;
  },

  async deletePersonnel(id, token) {
    const response = await fetch(buildURL('PERSONNEL', `/api/personnel/${id}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete personnel');
    }

    return data;
  },

  async getTeachers(token, schoolId) {
    const url = buildURL('PERSONNEL', `/api/v1/teachers${schoolId ? `?school_id=${schoolId}` : ''}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch teachers');
    }

    return data;
  },

  async createTeacher(teacherData, token) {
    const response = await fetch(buildURL('PERSONNEL', '/api/v1/teachers'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teacherData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create teacher');
    }

    return data;
  },

  async updateTeacher(id, teacherData, token) {
    const response = await fetch(buildURL('PERSONNEL', `/api/v1/teachers/${id}`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teacherData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update teacher');
    }

    return data;
  },

  async deleteTeacher(id, token) {
    const response = await fetch(buildURL('PERSONNEL', `/api/v1/teachers/${id}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete teacher');
    }

    return data;
  },
};

export const classAPI = {
  async getClasses(token, schoolId) {
    const url = buildURL('PERSONNEL', `/api/v1/classes${schoolId ? `?school_id=${schoolId}` : ''}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get classes');
    }

    return data;
  },

  async getClassStudents(classId, token) {
    const response = await fetch(buildURL('PERSONNEL', `/api/v1/classes/${classId}/students`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get class students');
    }

    return data;
  },
};

export const schoolAPI = {
  async getSchools(token) {
    const response = await fetch(buildURL('PERSONNEL', '/api/v1/schools'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get schools');
    }

    return data;
  },

  async getSchool(id, token) {
    const response = await fetch(buildURL('PERSONNEL', `/api/v1/schools/${id}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get school');
    }

    return data;
  },

  async createSchool(schoolData, token) {
    const response = await fetch(buildURL('PERSONNEL', '/api/v1/schools'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schoolData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create school');
    }

    return data;
  },

  async updateSchool(id, schoolData, token) {
    const response = await fetch(buildURL('PERSONNEL', `/api/v1/schools/${id}`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schoolData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update school');
    }

    return data;
  },

  async deleteSchool(id, token) {
    const response = await fetch(buildURL('PERSONNEL', `/api/v1/schools/${id}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete school');
    }

    return data;
  },
};

export const userAPI = {
  async getUsers(token) {
    const response = await fetch(buildURL('LOGIN', '/server/users'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get users');
    }

    return data;
  },

  async createUser(userData, token) {
    const response = await fetch(buildURL('LOGIN', '/server/users'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create user');
    }

    return data;
  },

  async updateUser(id, userData, token) {
    const response = await fetch(buildURL('LOGIN', `/server/users/${id}`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user');
    }

    return data;
  },

  async deleteUser(id, token) {
    const response = await fetch(buildURL('LOGIN', `/server/users/${id}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete user');
    }

    return data;
  },
};

export default authAPI;
