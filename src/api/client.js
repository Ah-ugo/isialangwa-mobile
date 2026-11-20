import axios from 'axios';
import { getToken, removeToken } from '../utils/storage';
import { EventEmitter } from 'events';

export const authEvents = new EventEmitter();

const client = axios.create({
  baseURL: 'https://apcbe.vercel.app/api/mobile',
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Bearer token
client.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await removeToken();
      authEvents.emit('unauthorized');
    }
    return Promise.reject(error);
  }
);

export default client;
