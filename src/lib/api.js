import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 600000,  // 默认10分钟超时
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error?.response?.data;
    const message = data?.message || error.message || "请求失败";
    return Promise.reject(new Error(message));
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const login = (payload) => api.post("/auth/login", payload);
export const register = (payload) => api.post("/auth/register", payload);
export const getCurrentUser = () => api.get("/auth/me");
export const sendEmailCode = (payload) => api.post("/auth/send-email", payload);
export const loginWithEmailCode = (payload) => api.post("/auth/login-email", payload);
export const registerWithEmailCode = (payload) => api.post("/auth/register-email", payload);

// 经历管理 - 转换字段名以匹配后端
export const getExperiences = (params = {}) => api.get("/experiences", { params });

export const createExperience = (payload) => {
  const data = {
    type: payload.type,
    company: payload.company,
    role: payload.role,
    start_date: payload.startDate,
    end_date: payload.endDate,
    description: payload.description,
    skills: payload.skills,
  };
  return api.post("/experiences", data);
};

export const updateExperience = (id, payload) => {
  const data = {
    company: payload.company,
    role: payload.role,
    start_date: payload.startDate,
    end_date: payload.endDate,
    description: payload.description,
    skills: payload.skills,
  };
  return api.put(`/experiences/${id}`, data);
};

export const deleteExperience = (id) => api.delete(`/experiences/${id}`);
export const getExperienceQuestions = (id) => api.get(`/experiences/${id}`);
export const parseResume = (formData) => api.post("/experiences/parse-resume", formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 120000,
});

// 语音识别
export const transcribeAudio = (formData) => api.post("/speech/transcribe", formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 600000,  // 10分钟，首次加载模型需要时间
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// LLM 相关接口 - 需要更长超时时间
export const parseJD = (payload) => api.post("/resume/parse-jd", payload, { timeout: 300000 });
export const matchExperiences = (payload) => api.post("/resume/match", payload, { timeout: 300000 });
export const generateResume = (payload) => api.post("/resume/generate", payload, { timeout: 300000 });
export const analyzeInterview = (payload) => api.post("/interview/analyze", payload, { timeout: 300000 });
export const saveReview = (payload) => api.post("/review/save", payload, { timeout: 60000 });
export const listReviews = (params = {}) => api.get("/review", { params });
export const submitReview = (payload) => api.post("/review/submit-text", payload);

export default api;