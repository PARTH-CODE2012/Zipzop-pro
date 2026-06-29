// client/src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  register,
  login,
  upload,
  createJob,
  getJob,
  previewKineticCaption,
  createKineticCaption,
  upgradePremium,
  getPremiumStatus
} from './api';
import { io } from 'socket.io-client';
import './styles.css';

/**
 * Gaming-themed App with 5 bottom tabs:
 * 1. Trim
 * 2. Captions
 * 3. Templates (CapCut-style)
 * 4. Colors
 * 5. AI Editor
 */

const TABS = {
  TRIM: 'trim',
  CAPTIONS: 'captions',
  TEMPLATES: 'templates',
  COLORS: 'colors',
  AI: 'ai'
};

// Template presets for the Templates tab
const TEMPLATE_PRESETS = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk Glow',
    description: 'Neon violet/blue tracking text with glow and blur',
    style: { font: 'Orbitron', size: 56, color: '&H00FF66FF', outline: 3 },
    preset: 'cyberpunk'
  },
  {
    id: 'esports',
    title: 'Esports Impact',
    description: 'Aggressive uppercase pop-ups for scoring moments',
    style: { font: 'Impact', size: 64, color: '&H00FFFFFF', outline: 4 },
    preset: 'esports'
  },
  {
    id: 'anime',
    title: 'Anime Pop',
    description: 'Springy cartoon style with bounce anims',
    style: { font: 'DejaVu Sans', size: 52, color: '&H00FFFF88', outline: 2 },
    preset: 'anime'
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(null);
  const [jobs, setJobs] = useState({});
  const socketRef = useRef(null);

  // Tab state
  const [currentTab, setCurrentTab] = useState(TABS.TRIM);

  // Trim inputs
  const [trimStart, setTrimStart] = useState(0);
  const [trimDuration, setTrimDuration] = useState(10);

  // Captions inputs
  const [captionText, setCaptionText] = useState('0|4|Hello world');
  const [preset, setPreset] = useState('slide-in');
  const [previewUrl, setPreviewUrl] = useState(null);

  // Templates state
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Color grading
  const [colorPreset, setColorPreset] = useState('vibrant');

  // AI Editor state
  const [aiRunning, setAiRunning] = useState(false);

  // Premium status
  const [premiumStatus, setPremiumStatus] = useState(null);

  useEffect(() => {
    socketRef.current = io(window.location.origin);
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
    if (!token) return alert('Please login first');
    const rsp = await upload(token, file);
    if (rsp.ok) {
      setUploaded(rsp.filename);
      alert('Uploaded: ' + rsp.filename);
    } else {
      alert('Upload failed: ' + JSON.stringify(rsp));
    }
  }

  async function handleCreateTrimJob() {
    if (!uploaded) return alert('Upload a file first');
    if (!token) return alert('Login first');
    const ops = [{ op: 'trim', start: Number(trimStart), duration: Number(trimDuration), reencode: true }];
    const rsp = await createJob(token, uploaded, ops);
    if (rsp.ok) {
      setJobs((prev) => ({ ...prev, [rsp.jobId]: { jobId: rsp.jobId, progress: 0 } }));
      alert('Trim job enqueued: ' + rsp.jobId);
    } else {
      alert('Failed to enqueue trim job: ' + JSON.stringify(rsp));
    }
  }

  // Captions helpers
  function parseCaptionLines(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map((l) => {
      const parts = l.split('|');
      return {
        start: Number(parts[0] || 0),
        end: Number(parts[1] || (Number(parts[0] || 0) + 4)),
        text: parts.slice(2).join('|') || parts[2] || ''
      };
    });
  }

  async function handlePreviewKinetic() {
    if (!uploaded) return alert('Upload first');
    if (!token) return alert('Login first');
    const caps = parseCaptionLines(captionText);
    const payload = { filename: uploaded, captions: caps, preset: selectedTemplate || preset, start: caps[0]?.start || 0, duration: 6 };
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
    if (!token) return alert('Login first');
    const caps = parseCaptionLines(captionText);
    const payload = { filename: uploaded, captions: caps, preset: selectedTemplate || preset, burn: false };
    const rsp = await createKineticCaption(token, payload);
    if (rsp.ok) {
      alert('Caption generated: ' + rsp.ass);
    } else {
      alert('Create caption failed: ' + JSON.stringify(rsp));
    }
  }

  // Colors: apply color grade operation
  async function handleApplyColor() {
    if (!uploaded) return alert('Upload first');
    if (!token) return alert('Login first');
    const ops = [{ op: 'color', preset: colorPreset }];
    const rsp = await createJob(token, uploaded, ops);
    if (rsp.ok) {
      setJobs((prev) => ({ ...prev, [rsp.jobId]: { jobId: rsp.jobId, progress: 0 } }));
      alert('Color grade job enqueued.');
    } else {
      alert('Failed to enqueue color job: ' + JSON.stringify(rsp));
    }
  }

  // AI Editor: call AI waste detector -> enqueue a job (op: ai_cleanup)
  async function handleAiAutoCut() {
    if (!uploaded) return alert('Upload first');
    if (!token) return alert('Login first');
    setAiRunning(true);
    try {
      const ops = [{ op: 'ai_cleanup' }];
      const rsp = await createJob(token, uploaded, ops);
      if (rsp.ok) {
        setJobs((prev) => ({ ...prev, [rsp.jobId]: { jobId: rsp.jobId, progress: 0 } }));
        alert('AI Auto-Cut job enqueued: ' + rsp.jobId);
      } else {
        alert('AI Auto-Cut failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      alert('AI operation error: ' + String(err));
    } finally {
      setAiRunning(false);
    }
  }

  // Templates: select template
  function handleSelectTemplate(id) {
    setSelectedTemplate(id);
    // Keep user on Templates tab so they can apply
  }

  // Simple helper to render job list summary
  function renderJobs() {
    return (
      <div style={{ marginTop: 8 }}>
        <h4>Jobs</h4>
        <div>
          {Object.entries(jobs).length === 0 && <div>No jobs yet</div>}
          {Object.entries(jobs).map(([id, j]) => (
            <div key={id} style={{ marginBottom: 8, padding: 8, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
              <div style={{ fontWeight: '600' }}>{id}</div>
              <div style={{ fontSize: 12 }}>{j.progress ? JSON.stringify(j.progress) : 'n/a'}</div>
              {j.completed && <div style={{ color: '#4caf50' }}>Completed: {j.completed.out}</div>}
              {j.failed && <div style={{ color: '#ff4d4f' }}>Failed: {String(j.failed)}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tab view renderers
  function TrimTab() {
    return (
      <div>
        <h2 style={styles.h2}>✂️ Trim</h2>
        <div style={styles.card}>
          <div style={{ marginBottom: 8 }}>Choose start time (seconds):</div>
          <input type="number" value={trimStart} onChange={(e) => setTrimStart(e.target.value)} style={styles.input} />
          <div style={{ marginTop: 8, marginBottom: 8 }}>Duration (seconds):</div>
          <input type="number" value={trimDuration} onChange={(e) => setTrimDuration(e.target.value)} style={styles.input} />
          <div style={{ marginTop: 12 }}>
            <button style={styles.primaryButton} onClick={handleCreateTrimJob}>Queue Trim</button>{' '}
            <button style={styles.secondaryButton} onClick={() => { setTrimStart(0); setTrimDuration(10); }}>Reset</button>
          </div>
        </div>
        {renderJobs()}
      </div>
    );
  }

  function CaptionsTab() {
    return (
      <div>
        <h2 style={styles.h2}>📝 Captions</h2>
        <div style={styles.card}>
          <div style={{ marginBottom: 6 }}>Enter captions as lines of start|end|text (seconds):</div>
          <textarea rows="5" value={captionText} onChange={(e) => setCaptionText(e.target.value)} style={styles.textarea} />
          <div style={{ marginTop: 8 }}>
            <label style={{ marginRight: 8 }}>Preset:</label>
            <select value={preset} onChange={(e) => setPreset(e.target.value)} style={styles.select}>
              <option value="slide-in">slide-in</option>
              <option value="fade-up">fade-up</option>
              <option value="pop">pop</option>
              <option value="typewriter">typewriter</option>
              <option value="karaoke">karaoke</option>
            </select>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={styles.primaryButton} onClick={() => { /* Normal captions - fallback to kinetic as "normal" */ handleCreateKinetic(); }}>Normal</button>
            <button style={{ ...styles.primaryButton, background: 'linear-gradient(90deg,#7c4dff,#00e5ff)' }} onClick={handleCreateKinetic}>Kinetic</button>
            <button style={styles.ghostButton} onClick={handlePreviewKinetic}>Preview</button>
          </div>
          {previewUrl && <div style={{ marginTop: 12 }}>Preview: <a href={previewUrl} target="_blank" rel="noreferrer">{previewUrl}</a></div>}
        </div>
      </div>
    );
  }

  function TemplatesTab() {
    return (
      <div>
        <h2 style={styles.h2}>🎬 Templates — CapCut-style Presets</h2>
        <div style={{ ...styles.card, paddingBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {TEMPLATE_PRESETS.map((t) => {
              const selected = selectedTemplate === t.id;
              return (
                <div key={t.id} style={{ ...styles.templateCard, boxShadow: selected ? '0 8px 30px rgba(124,77,255,0.35)' : '0 4px 12px rgba(0,0,0,0.35)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.title}</div>
                  <div style={{ fontSize: 13, marginBottom: 12, color: 'rgba(255,255,255,0.8)' }}>{t.description}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Preview</div>
                    <button
                      onClick={() => handleSelectTemplate(t.id)}
                      style={{
                        ...styles.glowButton,
                        background: selected ? 'linear-gradient(90deg,#7c4dff,#00e5ff)' : 'linear-gradient(90deg,#ff7ab6,#7c4dff)',
                        boxShadow: selected ? '0 8px 30px rgba(0,229,255,0.24)' : '0 6px 20px rgba(124,77,255,0.12)'
                      }}>
                      {selected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button
              style={{ ...styles.primaryButton }}
              onClick={() => {
                if (!selectedTemplate) return alert('Pick a template first');
                alert(`Template "${selectedTemplate}" will be applied to Kinetic captions by default.`);
              }}>
              Apply Template to Captions
            </button>
            <button style={styles.ghostButton} onClick={() => { setSelectedTemplate(null); }}>Clear Selection</button>
          </div>
        </div>
      </div>
    );
  }

  function ColorsTab() {
    return (
      <div>
        <h2 style={styles.h2}>🎨 Colors</h2>
        <div style={styles.card}>
          <div style={{ marginBottom: 8 }}>Color Grade Preset</div>
          <select value={colorPreset} onChange={(e) => setColorPreset(e.target.value)} style={styles.select}>
            <option value="vibrant">Vibrant</option>
            <option value="cinematic">Cinematic</option>
            <option value="flat">Flat</option>
            <option value="boost-contrast">Boost Contrast</option>
          </select>
          <div style={{ marginTop: 12 }}>
            <button style={styles.primaryButton} onClick={handleApplyColor}>Apply Grade</button>
          </div>
        </div>
        {renderJobs()}
      </div>
    );
  }

  function AiTab() {
    return (
      <div>
        <h2 style={styles.h2}>🤖 AI Editor</h2>
        <div style={styles.card}>
          <div style={{ marginBottom: 8, fontSize: 14 }}>
            AI Workspace — Auto-cleanup trims silence / idle sections. Use with uploaded footage.
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              style={aiRunning ? styles.primaryButtonDisabled : styles.aiButton}
              onClick={() => {
                if (aiRunning) return;
                handleAiAutoCut();
              }}
            >
              {aiRunning ? 'Running AI...' : 'AI Waste Detector & Auto-Cut'}
            </button>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
            Tip: AI will scan the uploaded file and create a job that removes silence/non-action segments. Results appear in Jobs.
          </div>
        </div>
        {renderJobs()}
      </div>
    );
  }

  // Main content render
  function renderTab() {
    switch (currentTab) {
      case TABS.TRIM:
        return <TrimTab />;
      case TABS.CAPTIONS:
        return <CaptionsTab />;
      case TABS.TEMPLATES:
        return <TemplatesTab />;
      case TABS.COLORS:
        return <ColorsTab />;
      case TABS.AI:
        return <AiTab />;
      default:
        return <div>Unknown tab</div>;
    }
  }

  // Main app layout
  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={{ fontWeight: 800, fontSize: 20 }}>ZipZop — Gaming Studio</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!user && <button style={styles.ghostButton} onClick={handleRegister}>Register</button>}
          {!user && <button style={styles.primaryButton} onClick={handleLogin}>Login</button>}
          {user && <div style={{ alignSelf: 'center' }}>Welcome, {user}</div>}
          <button style={styles.ghostButton} onClick={() => {
            const rsp = upgradePremium(token, 30).then(r => { if (r.ok) { alert('Upgraded (demo)'); setPremiumStatus(r.premium); } else alert(JSON.stringify(r)); });
          }}>Upgrade (demo)</button>
        </div>
      </div>

      <div style={styles.container}>
        <div style={styles.left}>
          {/* Upload area */}
          <div style={styles.card}>
            <strong>Upload</strong>
            <div style={{ marginTop: 8 }}>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} />
              <button style={{ ...styles.primaryButton, marginLeft: 8 }} onClick={handleUpload} disabled={!file || !token}>Upload</button>
            </div>
            <div style={{ marginTop: 8 }}>Uploaded: {uploaded || 'none'}</div>
          </div>

          {/* Active tab content */}
          <div style={{ marginTop: 12 }}>
            {renderTab()}
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.card}>
            <strong>Quick Controls</strong>
            <div style={{ marginTop: 8 }}>
              <div>Selected Template: <span style={{ fontWeight: 700 }}>{selectedTemplate || '—'}</span></div>
              <div style={{ marginTop: 8 }}>Preview: {previewUrl ? <a href={previewUrl} target="_blank" rel="noreferrer">Open</a> : 'none'}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button style={styles.ghostButton} onClick={() => setCurrentTab(TABS.TRIM)}>Go to Trim</button>
              <button style={styles.ghostButton} onClick={() => setCurrentTab(TABS.CAPTIONS)}>Go to Captions</button>
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: 12 }}>
            <strong>Jobs (Live)</strong>
            <div style={{ marginTop: 8 }}>
              {renderJobs()}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fixed tab bar */}
      <div style={styles.bottomBar}>
        <TabButton label="✂️ Trim" active={currentTab === TABS.TRIM} onClick={() => setCurrentTab(TABS.TRIM)} />
        <TabButton label="📝 Captions" active={currentTab === TABS.CAPTIONS} onClick={() => setCurrentTab(TABS.CAPTIONS)} />
        <TabButton label="🎬 Templates" active={currentTab === TABS.TEMPLATES} onClick={() => setCurrentTab(TABS.TEMPLATES)} />
        <TabButton label="🎨 Colors" active={currentTab === TABS.COLORS} onClick={() => setCurrentTab(TABS.COLORS)} />
        <TabButton label="🤖 AI Editor" active={currentTab === TABS.AI} onClick={() => setCurrentTab(TABS.AI)} />
      </div>
    </div>
  );
}

/* Small TabButton component */
function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tabButton,
        background: active ? 'linear-gradient(90deg,#7c4dff,#00e5ff)' : 'rgba(255,255,255,0.02)',
        boxShadow: active ? '0 8px 24px rgba(124,77,255,0.18)' : 'none',
        color: active ? 'white' : 'rgba(255,255,255,0.9)'
      }}
    >
      {label}
    </button>
  );
}

/* Inline styles (keeps look even if styles.css is simple) */
const styles = {
  app: {
    minHeight: '100vh',
    paddingBottom: 76,
    background: 'linear-gradient(180deg,#0f0f12 0%,#07070b 100%)',
    color: 'white',
    fontFamily: 'Inter, Arial, Helvetica, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.03)'
  },
  container: {
    display: 'flex',
    gap: 16,
    padding: 20
  },
  left: { flex: 1, minWidth: 0 },
  right: { width: 340 },
  card: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
    padding: 12,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.03)'
  },
  input: {
    padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', width: '100%', background: 'transparent', color: 'white'
  },
  textarea: {
    width: '100%', borderRadius: 8, padding: 8, minHeight: 120, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: 'white'
  },
  select: {
    padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', color: 'white'
  },
  primaryButton: {
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(90deg,#00e5ff,#7c4dff)',
    color: '#021',
    fontWeight: 700,
    cursor: 'pointer'
  },
  primaryButtonDisabled: {
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(90deg,#444,#666)',
    color: '#aaa',
    fontWeight: 700,
    cursor: 'not-allowed',
    opacity: 0.7
  },
  ghostButton: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'transparent',
    color: 'white',
    cursor: 'pointer'
  },
  glowButton: {
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 700
  },
  aiButton: {
    padding: '12px 16px',
    borderRadius: 12,
    border: 'none',
    color: '#031',
    cursor: 'pointer',
    fontWeight: 800,
    background: 'linear-gradient(90deg,#00ff9d,#00e5ff)',
    boxShadow: '0 12px 40px rgba(0,229,255,0.12)'
  },
  templateCard: {
    padding: 12,
    borderRadius: 12,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))'
  },
  bottomBar: {
    position: 'fixed',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    background: 'rgba(10,10,12,0.6)',
    padding: 8,
    borderRadius: 999,
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    zIndex: 1000
  },
  tabButton: {
    padding: '10px 14px',
    borderRadius: 999,
    border: 'none',
    minWidth: 110,
    cursor: 'pointer',
    fontWeight: 700,
    color: 'white',
    background: 'rgba(255,255,255,0.02)'
  },
  h2: { margin: 0, marginBottom: 12, fontSize: 18 },
};
