// client/src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  register as apiRegister,
  login as apiLogin,
  upload as apiUpload,
  createJob,
  previewKineticCaption,
  createKineticCaption
} from './api';
import './styles.css';

/**
 * Updated UI: Professional, non-gaming-specific
 * - Clean upload section with "अपलोड वीडियो" + "जिपजॉप एआई एडिटर"
 * - 5 tabs: Trim, Captions, Colors, Templates, AI Editor
 */

const TABS = { TRIM: 'trim', CAPTIONS: 'captions', COLORS: 'colors', TEMPLATES: 'templates', AI: 'ai' };

const TEMPLATE_PRESETS = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk Glow',
    description: 'Neon violet/blue tracking text with glow',
    style: { font: 'Orbitron', size: 56, color: '&H00FF66FF', outline: 3 },
    preset: 'cyberpunk'
  },
  {
    id: 'esports',
    title: 'Esports Impact',
    description: 'Aggressive uppercase pop-ups for highlights',
    style: { font: 'Impact', size: 64, color: '&H00FFFFFF', outline: 4 },
    preset: 'esports'
  },
  {
    id: 'anime',
    title: 'Anime Pop',
    description: 'Springy cartoon style with bounce animations',
    style: { font: 'DejaVu Sans', size: 52, color: '&H00FFFF88', outline: 2 },
    preset: 'anime'
  },
  {
    id: 'minimal',
    title: 'Minimal Clean',
    description: 'Simple, elegant sans-serif captions',
    style: { font: 'DejaVu Sans', size: 44, color: '&H00FFFFFF', outline: 1 },
    preset: 'minimal'
  }
];

export default function App() {
  // load Inter for premium typography
  useEffect(() => {
    const id = 'zipzop-inter-font';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Auth
  const [username, setUsername] = useState(null);
  const [token, setToken] = useState('');

  // File / upload state
  const fileInputRef = useRef(null);
  const [localFile, setLocalFile] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | uploaded | error

  // Tab & content states
  const [currentTab, setCurrentTab] = useState(TABS.TRIM);

  // Trim
  const [startTime, setStartTime] = useState('00:00:00');
  const [duration, setDuration] = useState('30');

  // Captions
  const [captionText, setCaptionText] = useState('0|4|Hello world');

  // Colors
  const [colorPreset, setColorPreset] = useState('vibrant');

  // Templates
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // AI running
  const [aiRunning, setAiRunning] = useState(false);

  // ----- Auth handlers -----
  async function handleRegister() {
    const u = prompt('username?') || `user${Math.floor(Math.random() * 1000)}`;
    const p = prompt('password?') || 'pass';
    try {
      const r = await apiRegister(u, p);
      if (r && r.id) {
        alert('Registered: ' + r.username);
      } else {
        alert('Register response: ' + JSON.stringify(r));
      }
    } catch (err) {
      console.error(err);
      alert('Register error: ' + String(err));
    }
  }

  async function handleLogin() {
    const u = prompt('username?') || 'user';
    const p = prompt('password?') || 'pass';
    try {
      const r = await apiLogin(u, p);
      if (r && r.token) {
        setToken(r.token);
        setUsername(r.username || u);
        alert('Logged in as ' + (r.username || u));
      } else {
        alert('Login failed: ' + JSON.stringify(r));
      }
    } catch (err) {
      console.error(err);
      alert('Login error: ' + String(err));
    }
  }

  // ----- File selection & auto-upload -----
  function handleChooseClick() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  async function handleFileSelected(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setLocalFile(f);

    // Auto-upload flow
    if (!token) {
      const ok = window.confirm('You must be logged in to upload. Login now?');
      if (ok) {
        await handleLogin();
        if (!token) {
          setUploadStatus('error');
          alert('Upload cancelled: not logged in');
          return;
        }
      } else {
        setUploadStatus('error');
        alert('Upload cancelled: login required');
        return;
      }
    }

    // Start upload
    try {
      setUploadStatus('uploading');
      const rsp = await apiUpload(token, f);
      if (rsp && rsp.ok) {
        const fn = rsp.filename || f.name;
        setUploadedFilename(fn);
        setUploadStatus('uploaded');
      } else {
        console.warn('Upload response', rsp);
        setUploadStatus('error');
        alert('Upload failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error('Upload error', err);
      setUploadStatus('error');
      alert('Upload error: ' + String(err));
    }
  }

  // ----- Trim action -----
  async function handleTrimVideo() {
    if (!uploadedFilename) return alert('Please upload a video first');
    if (!token) return alert('Please login first');
    try {
      const ops = [{ op: 'trim', start: startTime, duration: Number(duration), reencode: true }];
      const rsp = await createJob(token, uploadedFilename, ops);
      if (rsp && rsp.ok) {
        alert('Trim job queued: ' + (rsp.jobId || rsp.id || 'unknown'));
      } else {
        alert('Trim failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      alert('Trim error: ' + String(err));
    }
  }

  // ----- Captions actions -----
  async function handleGenerateNormalCaptions() {
    if (!uploadedFilename) return alert('Please upload a video first');
    if (!token) return alert('Please login first');
    try {
      const ops = [{ op: 'auto_caption' }];
      const rsp = await createJob(token, uploadedFilename, ops);
      if (rsp && rsp.ok) alert('Normal captions job queued: ' + (rsp.jobId || rsp.id));
      else alert('Failed to queue captions: ' + JSON.stringify(rsp));
    } catch (err) {
      console.error(err);
      alert('Error: ' + String(err));
    }
  }

  async function handleCreateKineticCaptions() {
    if (!uploadedFilename) return alert('Please upload a video first');
    if (!token) return alert('Please login first');

    const caps = captionText.split('\n').map((l) => {
      const parts = l.split('|');
      return { start: Number(parts[0] || 0), end: Number(parts[1] || (Number(parts[0] || 0) + 4)), text: parts.slice(2).join('|') };
    });

    try {
      const payload = { filename: uploadedFilename, captions: caps, preset: selectedTemplate || 'slide-in', burn: false };
      const rsp = await createKineticCaption(token, payload);
      if (rsp && rsp.ok) alert('Kinetic created: ' + (rsp.ass || 'ok'));
      else alert('Failed: ' + JSON.stringify(rsp));
    } catch (err) {
      console.error(err);
      alert('Error: ' + String(err));
    }
  }

  async function handlePreviewKineticCaptions() {
    if (!uploadedFilename) return alert('Please upload a video first');
    if (!token) return alert('Please login first');

    const caps = captionText.split('\n').map((l) => {
      const parts = l.split('|');
      return { start: Number(parts[0] || 0), end: Number(parts[1] || (Number(parts[0] || 0) + 4)), text: parts.slice(2).join('|') };
    });

    try {
      const payload = { filename: uploadedFilename, captions: caps, preset: selectedTemplate || 'slide-in', start: caps[0]?.start || 0, duration: 6 };
      const rsp = await previewKineticCaption(token, payload);
      if (rsp && rsp.ok && rsp.preview) {
        window.open(rsp.preview, '_blank');
      } else {
        alert('Preview failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      alert('Preview error: ' + String(err));
    }
  }

  // ----- Colors action -----
  async function handleApplyColorGrade() {
    if (!uploadedFilename) return alert('Please upload a video first');
    if (!token) return alert('Please login first');
    try {
      const ops = [{ op: 'color', preset: colorPreset }];
      const rsp = await createJob(token, uploadedFilename, ops);
      if (rsp && rsp.ok) alert('Color job queued: ' + (rsp.jobId || rsp.id));
      else alert('Failed: ' + JSON.stringify(rsp));
    } catch (err) {
      console.error(err);
      alert('Error: ' + String(err));
    }
  }

  // ----- Templates action -----
  function handleSelectTemplate(templateId) {
    setSelectedTemplate(templateId);
  }

  // ----- AI editor action -----
  async function handleAiAutoCut() {
    if (!uploadedFilename) return alert('Please upload a video first');
    if (!token) return alert('Please login first');
    setAiRunning(true);
    try {
      const ops = [{ op: 'ai_cleanup' }];
      const rsp = await createJob(token, uploadedFilename, ops);
      if (rsp && rsp.ok) alert('AI Auto-Cut job queued: ' + (rsp.jobId || rsp.id));
      else alert('Failed: ' + JSON.stringify(rsp));
    } catch (err) {
      console.error(err);
      alert('AI error: ' + String(err));
    } finally {
      setAiRunning(false);
    }
  }

  // Render
  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.titleRow}>
            <span style={styles.controllerEmoji}>🎮</span>
            <h1 style={styles.title}>ZipZop Pro Video Studio</h1>
            <div style={{ flex: 1 }} />
            {/* Auth controls */}
            {!username ? (
              <div style={styles.authRow}>
                <button style={styles.ghostButton} onClick={handleRegister}>Register</button>
                <button style={styles.primaryButton} onClick={handleLogin}>Login</button>
              </div>
            ) : (
              <div style={styles.welcome}>Welcome, <strong>{username}</strong></div>
            )}
          </div>
          <div style={styles.subheadline}>AI Waste Detector, Color Grader, Caption Creator & Relighter</div>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        {/* Upload box */}
        <div style={styles.uploadBox}>
          <div style={styles.uploadInner}>
            {uploadStatus === 'uploading' ? (
              <div style={styles.uploadingText}>Uploading video...</div>
            ) : (
              <>
                <div style={styles.uploadTitle}>अपलोड वीडियो</div>
                <div style={styles.uploadSubtitle}>जिपजॉप एआई एडिटर</div>
                <div style={{ height: 18 }} />
                <button style={styles.chooseButton} onClick={handleChooseClick}>
                  Choose Video File
                </button>
                {/* Hidden input triggers auto upload onChange */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelected}
                  style={{ display: 'none' }}
                />
                <div style={{ height: 12 }} />
                {uploadStatus === 'uploaded' && (
                  <div style={styles.uploadedNote}>Uploaded: {uploadedFilename}</div>
                )}
                {uploadStatus === 'error' && (
                  <div style={styles.errorNote}>Upload failed. Please try again.</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tabs card */}
        <section style={styles.tabCard}>
          <nav style={styles.tabNav}>
            <TabHeader label="✂️ Trim" active={currentTab === TABS.TRIM} onClick={() => setCurrentTab(TABS.TRIM)} />
            <TabHeader label="📝 Captions" active={currentTab === TABS.CAPTIONS} onClick={() => setCurrentTab(TABS.CAPTIONS)} />
            <TabHeader label="🎨 Colors" active={currentTab === TABS.COLORS} onClick={() => setCurrentTab(TABS.COLORS)} />
            <TabHeader label="📋 Templates" active={currentTab === TABS.TEMPLATES} onClick={() => setCurrentTab(TABS.TEMPLATES)} />
            <TabHeader label="🤖 AI Editor" active={currentTab === TABS.AI} onClick={() => setCurrentTab(TABS.AI)} />
          </nav>

          <div style={styles.tabContent}>
            {currentTab === TABS.TRIM && (
              <div>
                <h3 style={styles.sectionTitle}>Video Trimming</h3>
                <p style={styles.helperText}>Set the start time and duration for your trim.</p>

                <div style={styles.field}>
                  <label style={styles.label}>Start Time (HH:MM:SS)</label>
                  <input style={styles.input} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Duration (seconds) - Leave empty for full video</label>
                  <input style={styles.input} value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>

                <div style={{ marginTop: 16 }}>
                  <button style={styles.trimButton} onClick={handleTrimVideo}>✂️ Trim Video</button>
                </div>
              </div>
            )}

            {currentTab === TABS.CAPTIONS && (
              <div>
                <h3 style={styles.sectionTitle}>Captions</h3>
                <p style={styles.helperText}>Generate and preview captions for your video.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  <button style={styles.captionButton} onClick={handleGenerateNormalCaptions}>Generate Normal Captions</button>
                  <button style={styles.captionButton} onClick={handleCreateKineticCaptions}>Create Kinetic Captions</button>
                  <button style={styles.captionButtonOutline} onClick={handlePreviewKineticCaptions}>Preview Kinetic Style</button>
                </div>
              </div>
            )}

            {currentTab === TABS.COLORS && (
              <div>
                <h3 style={styles.sectionTitle}>Colors</h3>
                <p style={styles.helperText}>Apply quick color grades to enhance your footage.</p>

                <div style={{ marginTop: 12 }}>
                  <select value={colorPreset} onChange={(e) => setColorPreset(e.target.value)} style={styles.select}>
                    <option value="vibrant">Vibrant</option>
                    <option value="cinematic">Cinematic</option>
                    <option value="flat">Flat</option>
                    <option value="boost-contrast">Boost Contrast</option>
                  </select>
                </div>

                <div style={{ marginTop: 14 }}>
                  <button style={styles.applyColorButton} onClick={handleApplyColorGrade}>Apply Color Grade</button>
                </div>
              </div>
            )}

            {currentTab === TABS.TEMPLATES && (
              <div>
                <h3 style={styles.sectionTitle}>Caption Templates</h3>
                <p style={styles.helperText}>Choose a preset style for your captions.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 12 }}>
                  {TEMPLATE_PRESETS.map((t) => {
                    const selected = selectedTemplate === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTemplate(t.id)}
                        style={{
                          ...styles.templateCard,
                          boxShadow: selected ? '0 8px 24px rgba(255,210,0,0.2)' : '0 4px 12px rgba(0,0,0,0.3)',
                          border: selected ? '2px solid #ffd200' : '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          background: selected ? 'rgba(255,210,0,0.05)' : 'rgba(255,255,255,0.02)'
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{t.description}</div>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: 11, color: selected ? '#ffd200' : 'rgba(255,255,255,0.6)' }}>
                            {selected ? '✓ Selected' : 'Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentTab === TABS.AI && (
              <div>
                <h3 style={styles.sectionTitle}>AI Workspace</h3>
                <p style={styles.helperText}>AI Waste Detector & Auto-Cut to remove silent/idle sections.</p>

                <div style={{ marginTop: 12 }}>
                  <button style={aiRunning ? styles.aiButtonDisabled : styles.aiButton} onClick={() => { if (!aiRunning) handleAiAutoCut(); }} disabled={aiRunning}>
                    {aiRunning ? 'Running AI...' : 'AI Waste Detector & Auto-Cut'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/* small components */
function TabHeader({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{ ...styles.tabHeader, ...(active ? styles.tabHeaderActive : {}) }}>
      <span>{label}</span>
      {active && <div style={styles.activeUnderline} />}
    </div>
  );
}

/* styles */
const styles = {
  app: { fontFamily: "'Inter', Roboto, Arial, sans-serif", background: '#0b0b0c', color: '#fff', minHeight: '100vh', paddingBottom: 24 },
  header: { borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '14px 18px', background: '#0a0a0a' },
  headerInner: { maxWidth: 980, margin: '0 auto' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 10 },
  controllerEmoji: { fontSize: 22 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: '#ffd200', letterSpacing: 0.2 },
  subheadline: { color: 'rgba(255,255,255,0.6)', marginTop: 6, fontSize: 13, fontWeight: 500 },
  authRow: { display: 'flex', gap: 8, alignItems: 'center' },
  welcome: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  main: { maxWidth: 980, margin: '20px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 18 },
  uploadBox: { background: '#000', borderRadius: 12, border: '4px dashed rgba(255,255,255,0.06)', minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 },
  uploadInner: { textAlign: 'center' },
  uploadingText: { color: '#ffd200', fontWeight: 700, fontSize: 18 },
  uploadTitle: { color: '#ffd200', fontSize: 32, fontWeight: 800, marginBottom: 4 },
  uploadSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 500, marginBottom: 14 },
  chooseButton: { background: '#ffd200', color: '#080808', padding: '14px 30px', borderRadius: 30, border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer' },
  uploadedNote: { color: 'rgba(255,255,255,0.85)', marginTop: 8 },
  errorNote: { color: '#ff6b6b', marginTop: 8 },
  tabCard: { background: '#111214', borderRadius: 12, padding: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.03)' },
  tabNav: { display: 'flex', gap: 18, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10, alignItems: 'center', overflowX: 'auto' },
  tabHeader: { paddingBottom: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.75)', fontWeight: 600, position: 'relative', whiteSpace: 'nowrap' },
  tabHeaderActive: { color: '#ffd200' },
  activeUnderline: { height: 3, background: '#ffd200', width: '100%', marginTop: 8, borderRadius: 3 },
  tabContent: { paddingTop: 14 },
  sectionTitle: { margin: 0, fontSize: 20, color: '#ffd200', fontWeight: 800, marginBottom: 6 },
  helperText: { color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  field: { marginBottom: 12, display: 'flex', flexDirection: 'column' },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  input: { padding: '12px 14px', borderRadius: 8, background: '#161617', border: '1px solid rgba(255,255,255,0.04)', color: 'white', fontSize: 14 },
  trimButton: { width: '100%', padding: '14px 16px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer' },
  captionButton: { width: '100%', padding: '12px 14px', background: '#ffd200', color: '#080808', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  captionButtonOutline: { width: '100%', padding: '12px 14px', background: 'transparent', color: '#ffd200', border: '1px solid rgba(255,210,0,0.16)', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  select: { padding: '10px 12px', borderRadius: 8, background: '#0f0f10', color: '#fff', border: '1px solid rgba(255,255,255,0.04)' },
  applyColorButton: { marginTop: 12, background: '#ffd200', color: '#080808', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', width: '100%' },
  templateCard: { padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease' },
  aiButton: { padding: '14px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(90deg,#00ff9d,#00e5ff)', color: '#021', fontWeight: 800, cursor: 'pointer', width: '100%' },
  aiButtonDisabled: { padding: '14px 18px', borderRadius: 12, border: 'none', background: '#444', color: '#999', fontWeight: 800, cursor: 'default', width: '100%' },
  ghostButton: { padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'white', cursor: 'pointer' },
  primaryButton: { padding: '8px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(90deg,#00e5ff,#7c4dff)', color: '#021', fontWeight: 700, cursor: 'pointer' }
};
