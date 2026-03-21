// API Index - Export ทุก API modules จากที่เดียว

// Config
export { default as API_CONFIG, buildURL, getHeaders, getToken, apiRequest } from './config';

// Auth & User
export { authAPI, userAPI } from './authApi';

// Personnel (Students, Teachers, Classes)
export { studentAPI, teacherAPI, personnelAPI, classAPI } from './personnelApi';

// Schedule (Subjects, Schedules)
export { subjectAPI, scheduleAPI, scheduleClassAPI } from './scheduleApi';

// School
export { schoolAPI } from './schoolApi';

// Settings (Semester Settings)
export { default as settingsAPI } from './settingsApi';

// Behavior (คะแนนพฤติกรรม)
export { categoryAPI, behaviorAPI } from './behaviorApi';
