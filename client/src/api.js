const API_BASE = (import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : 'http://localhost:3000';

export async function register(username, password) {
  const res = await fetch(`${API_BASE}/api/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function upload(token, file) {
  const fd = new FormData();
  fd.append('video', file);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: fd
  });
  return res.json();
}

export async function createJob(token, filename, operations) {
  const res = await fetch(`${API_BASE}/api/jobs`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, operations })
  });
  return res.json();
}

export async function getJob(token, id) {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function previewKineticCaption(token, payload) {
  const res = await fetch(`${API_BASE}/api/captions/kinetic/preview`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function createKineticCaption(token, payload) {
  const res = await fetch(`${API_BASE}/api/captions/kinetic/create`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function upgradePremium(token, days = 30) {
  const res = await fetch(`${API_BASE}/api/premium/upgrade`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ days })
  });
  return res.json();
}

export async function getPremiumStatus(token) {
  const res = await fetch(`${API_BASE}/api/premium/status`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}
