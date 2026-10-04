import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const analyzeDecision = async (userText) => {
  const response = await api.post('/api/analyze', { user_text: userText });
  return response.data;
};

export const reflectOnAnswers = async (reasoningMap, userAnswers) => {
  const response = await api.post('/api/reflect', {
    reasoning_map: reasoningMap,
    user_answers: userAnswers,
  });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await api.post('/api/auth/register', { name, email, password });
  return response.data;
};

export const fetchCurrentUser = async (token) => {
  const response = await api.get(`/api/auth/me?token=${token}`);
  return response.data;
};

export default api;

