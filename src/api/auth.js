import client from './client';
import { saveToken, removeToken, saveUser, removeUser, getToken } from '../utils/storage';

export async function login(identifier, password) {
  const response = await client.post('/auth/login', { identifier, password });
  const payload = response.data?.data || response.data || {};
  const token = payload.token || response.data?.token;
  const user = payload.user || response.data?.user;
  if (!token) throw new Error('No token returned from server');
  await saveToken(token);
  if (user) await saveUser(user);
  return { token, user };
}

export async function logout() {
  await removeToken();
  await removeUser();
}

export { getToken };

export async function isLoggedIn() {
  const token = await getToken();
  return !!token;
}
