import React, { useState, useEffect, useRef } from 'react';
import { register, login, upload, createJob, getJob, previewKineticCaption, createKineticCaption, upgradePremium, getPremiumStatus } from './api';
import { io } from 'socket.io-client';
import './styles.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(null);
  const [jobs, setJobs] = useState({});
  const socketRef = useRef(null);

  const [captionText, setCaptionText] = useState('0|4|Hello world');
  const [preset, setPreset] = useState('slide-in');
  const [previewUrl, setPreviewUrl] = useState(null);

  const [premiumStatus, setPremiumStatus] = useState(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_BASE || 'http://localhost:3000');
    socketRef.current.on('connect', () => console.log('socket connected', socketRef.current.id));
    socketRef.current.on('job:progress', (payload) => {
      setJobs((prev) => ({ ...prev, [payload.jobId]: { ...(prev[payload.jobId] || {}), progress: payload.data } }));
    });
    socketRef.current.on('job:completed', (payload) => {
      setJobs((prev) => ({ ...prev, [payload.jobId]: { ...(prev[payload.jobId] || {}), completed: payload.returnvalue } }));
    });
    socketRef.current.on('job:failed', (payload) => {
      setJobs((prev) => ({ ...prev, [payload.jobId]: { ...(prev[payload.jobId] || {}), failed: payload.failedReason } }));
    });
    return () => socketRef.current.disconnect();
  }, []);

  async function handleRegister() {
    const username = prompt('username?') || 'user';
    const password = prompt('password?') || 'pass';
    const rsp = await register(username, password);
    alert(JSON.stringify(rsp));
  }

  async function handleLogin() {
    const username = prompt('username?') || 'user';
    const password = prompt('password?') || 'pass';
    const rsp = await login(username, password);
    if (rsp.ok) {
      setToken(rsp.token);
      setUser(rsp.username);
      const status = await getPremiumStatus(rsp.token);
      if (status.ok) setPremiumStatus(status.status);
    } else {
      alert('login failed: ' + JSON.stringify(rsp));
    }
  }

  async function handleUpload() {
    if (!file) return alert('Pick a file first');
    const rsp = await upload(token, file);
    if (rsp.ok) {
      setUploaded(rsp.filename);
      alert('Uploaded: ' + rsp.filename);
    } else {
      alert('Upload failed: ' + JSON.stringify(rsp));
    }
  }

  async function handleCreateJob() {
    if (!uploaded) return alert('Upload first');
    const ops = [
      { op: 'trim', start: 0, duration: 30, reencode: true },
      { op: 'color', preset: 'vibrant' },
      { op: 'auto_caption' }
    ];
    const rsp = await createJob(token, uploaded, ops);
    if (rsp.ok) {
      setJobs((prev) => ({ ...prev, [rsp.jobId]: { jobId: rsp.jobId, progress: 0 } }));
    } else {
      alert('Create job failed: ' + JSON.stringify(rsp));
    }
  }

  // Kinetic caption helpers
  function parseCaptionLines(text) {
    // expect lines of "start|end|text"
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map(l => {
      const parts = l.split('|');
      return { start: Number(parts[0]||0), end: Number(parts[1]|| (Number(parts[0]||0)+4)), text: parts.slice(2).join('|') || parts[2] || '' };
    });
  }

  async function handlePreviewKinetic() {
    if (!uploaded) return alert('Upload first');
    const caps = parseCaptionLines(captionText);
    const payload = { filename: uploaded, captions: caps, preset, start: caps[0]?.start || 0, duration: 6 };
    const rsp = await previewKineticCaption(token, payload);
    if (rsp.ok) {
      setPreviewUrl(rsp.preview);
      alert('Preview ready: ' + rsp.preview);
    } else {
      alert('Preview failed: ' + JSON.stringify(rsp));
    }
  }

  async function handleCreateKinetic() {
    if (!uploaded) return alert('Upload first');
    const caps = parseCaptionLines(captionText);
    const payload = { filename: uploaded, captions: caps, preset, burn: false };
    const rsp = await createKineticCaption(token, payload);
    if (rsp.ok) {
      alert('Caption generated: ' + rsp.ass);
    } else {
      alert('Create caption failed: ' + JSON.stringify(rsp));
    }
  }

  async function handleUpgradePremium() {
    if (!token) return alert('Login first');
    const rsp = await upgradePremium(token, 30);
    if (rsp.ok) {
      alert('Upgraded to premium until ' + rsp.premium.premium_expires);
      setPremiumStatus({ is_premium: true, premium_expires: rsp.premium.premium_expires });
    } else {
      alert('Upgrade failed: ' + JSON.stringify(rsp));
    }
  }

  return (
    <div className="container">
      <h1>ZipZop Pro Studio — Demo Client</h1>

      <div className="card">
        <strong>User</strong> {user ? `: ${user}` : '(not logged in)'} <br />
        <button onClick={handleRegister}>Register</button>{' '}
        <button onClick={handleLogin}>Login</button>
        {premiumStatus && <div>Premium: {premiumStatus.is_premium ? `YES (expires ${premiumStatus.premium_expires})` : 'No'}</div>}
        <button onClick={handleUpgradePremium} disabled={!token}>Upgrade to Premium (demo)</button>
      </div>

      <div className="card">
        <strong>Upload</strong><br />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handleUpload} disabled={!token}>Upload</button>
        <div>Uploaded file: {uploaded}</div>
      </div>

      <div className="card">
        <strong>Create Job</strong><br />
        <button onClick={handleCreateJob} disabled={!uploaded || !token}>Create Example Job (trim+grade+auto)</button>
      </div>

      <div className="card">
        <strong>Kinetic Caption Editor (simple)</strong><br />
        <div>Enter lines as start|end|text (seconds). Example: 0|4|Hello world</div>
        <textarea rows="4" cols="60" value={captionText} onChange={(e)=>setCaptionText(e.target.value)} />
        <div>
          <label>Preset: </label>
          <select value={preset} onChange={(e)=>setPreset(e.target.value)}>
            <option value="slide-in">slide-in</option>
            <option value="fade-up">fade-up</option>
            <option value="pop">pop</option>
            <option value="typewriter">typewriter</option>
            <option value="karaoke">karaoke</option>
          </select>
        </div>
        <button onClick={handlePreviewKinetic} disabled={!uploaded || !token}>Preview Kinetic Caption</button>
        <button onClick={handleCreateKinetic} disabled={!uploaded || !token}>Generate ASS (no burn)</button>
        {previewUrl && <div>Preview: <a href={previewUrl} target="_blank" rel="noreferrer">{previewUrl}</a></div>}
      </div>

      <div className="card">
        <strong>Jobs</strong>
        <div>
          {Object.entries(jobs).map(([id, j]) => (
            <div key={id} style={{ marginBottom: 8 }}>
              <div><b>{id}</b></div>
              <div>Progress: {j.progress ? JSON.stringify(j.progress) : 'n/a'}</div>
              {j.completed && <div>Completed: <a href={j.completed.out} target="_blank" rel="noreferrer">{j.completed.out}</a></div>}
              {j.failed && <div style={{ color: 'red' }}>Failed: {j.failed}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
                         }
