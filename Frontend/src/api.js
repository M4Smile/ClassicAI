const configuredApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_URL = configuredApiUrl.replace(/\/+$/, '');

export function apiUrl(path) {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

