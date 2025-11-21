import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  createSession: (sessionId) => api.post('/auth/session', { session_id: sessionId }),
  completeSignup: (userData) => api.post('/auth/complete-signup', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const usersAPI = {
  search: (email) => api.get('/users/search', { params: { email } }),
};

export const connectionsAPI = {
  create: (data) => api.post('/connections', data),
  getAll: () => api.get('/connections'),
  update: (id, status) => api.patch(`/connections/${id}`, null, { params: { status } }),
};

export const logbookAPI = {
  createYear: (data) => api.post('/logbook/years', data),
  getYears: (userId) => api.get('/logbook/years', { params: { user_id: userId } }),
  updateYear: (id, data) => api.patch(`/logbook/years/${id}`, data),
  deleteYear: (id) => api.delete(`/logbook/years/${id}`),
  getStats: (logbookId) => api.get(`/logbook/stats/${logbookId}`),
  createEntry: (data) => api.post('/logbook/entries', data),
  getEntries: (userId) => api.get('/logbook/entries', { params: { user_id: userId } }),
  updateEntry: (id, data) => api.patch(`/logbook/entries/${id}`, data),
  deleteEntry: (id) => api.delete(`/logbook/entries/${id}`),
  createSignature: (data) => api.post('/logbook/signatures', data),
  getSignatures: (logbookId) => api.get('/logbook/signatures', { params: { logbook_id: logbookId } }),
  exportPDF: (yearId) => api.get(`/export/logbook/${yearId}`, { responseType: 'blob' }),
};

export const cpdAPI = {
  createYear: (data) => api.post('/cpd/years', data),
  getYears: (userId) => api.get('/cpd/years', { params: { user_id: userId } }),
  createActivity: (data) => api.post('/cpd/activities', data),
  getActivities: (userId) => api.get('/cpd/activities', { params: { user_id: userId } }),
  updateActivity: (id, data) => api.patch(`/cpd/activities/${id}`, data),
  deleteActivity: (id) => api.delete(`/cpd/activities/${id}`),
  createPlan: (data) => api.post('/cpd/plans', data),
  getPlans: (userId, yearId) => api.get('/cpd/plans', { params: { user_id: userId, year_id: yearId } }),
  updatePlan: (id, data) => api.patch(`/cpd/plans/${id}`, data),
  addGoalToPlan: (planId, data) => api.post(`/cpd/plans/${planId}/goals`, data),
  updateGoal: (planId, goalId, data) => api.patch(`/cpd/plans/${planId}/goals/${goalId}`, data),
  addSupervisorComment: (planId, data) => api.post(`/cpd/plans/${planId}/comments`, data),
  createConsultation: (data) => api.post('/cpd/consultations', data),
  getConsultations: (userId) => api.get('/cpd/consultations', { params: { user_id: userId } }),
  updateConsultation: (id, data) => api.patch(`/cpd/consultations/${id}`, data),
  deleteConsultation: (id) => api.delete(`/cpd/consultations/${id}`),
  exportPDF: (yearId) => api.get(`/export/cpd/${yearId}`, { responseType: 'blob' }),
};

export const competenciesAPI = {
  createJournal: (data) => api.post('/competencies/journals', data),
  getJournals: (userId) => api.get('/competencies/journals', { params: { user_id: userId } }),
  updateJournal: (id, data) => api.patch(`/competencies/journals/${id}`, data),
  deleteJournal: (id) => api.delete(`/competencies/journals/${id}`),
};

export const messagesAPI = {
  send: (data) => api.post('/messages', data),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (otherUserId) => api.get('/messages', { params: { other_user_id: otherUserId } }),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};

// Convenience exports for direct import
export default {
  ...api,
  createLogbookYear: logbookAPI.createYear,
  getLogbookYears: logbookAPI.getYears,
  updateLogbookYear: logbookAPI.updateYear,
  deleteLogbookYear: logbookAPI.deleteYear,
  getLogbookStats: logbookAPI.getStats,
  createLogbookEntry: logbookAPI.createEntry,
  getLogbookEntries: logbookAPI.getEntries,
  createCPDYear: cpdAPI.createYear,
  getCPDYears: cpdAPI.getYears,
};
