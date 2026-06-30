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
 * Professional Full-Screen Studio Layout:
 * - Token persistence (login survives refresh)
 * - Top half: sticky video player with loading overlay
 * - Bottom half: scrollable workspace tabs
 * - Real HTML5 video player with spinner/checkmark on processing
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

// localStorage keys
const STORAGE_KEYS = {
  TOKEN: 'zipzop_token',
  USERNAME: 'zipzop_username',
  UPLOADED_FILENAME: 'zipzop_uploaded_filename',
  CURRENT_TAB: 'zipzop_current_tab',
  CAPTION_TEXT: 'zipzop_caption_text',
  SELECTED_TEMPLATE: 'zipzop_selected_template',
  COLOR_PRESET: 'zipzop_color_preset',
  START_TIME: 'zipzop_start_time',
  DURATION: 'zipzop_duration'
};

export default function App() {
  // Load Inter font
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
  const videoRef = useRef(null);
  const [localFile, setLocalFile] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | uploaded | error

  // Toast/feedback state
  const [toast, setToast] = useState(null);
  const [processingJobs, setProcessingJobs] = useState({});

  // Processing overlay state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);

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

  // Rehydrate from localStorage on mount (including token/auth)
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
    const savedFilename = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILENAME);
    const savedTab = localStorage.getItem(STORAGE_KEYS.CURRENT_TAB);
    const savedCaption = localStorage.getItem(STORAGE_KEYS.CAPTION_TEXT);
    const savedTemplate = localStorage.getItem(STORAGE_KEYS.SELECTED_TEMPLATE);
    const savedColor = localStorage.getItem(STORAGE_KEYS.COLOR_PRESET);
    const savedStartTime = localStorage.getItem(STORAGE_KEYS.START_TIME);
    const savedDuration = localStorage.getItem(STORAGE_KEYS.DURATION);

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
    }

    if (savedFilename) setUploadedFilename(savedFilename);
    if (savedTab) setCurrentTab(savedTab);
    if (savedCaption) setCaptionText(savedCaption);
    if (savedTemplate) setSelectedTemplate(savedTemplate);
    if (savedColor) setColorPreset(savedColor);
    if (savedStartTime) setStartTime(savedStartTime);
    if (savedDuration) setDuration(savedDuration);
  }, []);

  // Persist state to localStorage (non-auth)
  useEffect(() => {
    if (uploadedFilename) localStorage.setItem(STORAGE_KEYS.UPLOADED_FILENAME, uploadedFilename);
  }, [uploadedFilename]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TAB, currentTab);
  }, [currentTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAPTION_TEXT, captionText);
  }, [captionText]);

  useEffect(() => {
    if (selectedTemplate) localStorage.setItem(STORAGE_KEYS.SELECTED_TEMPLATE, selectedTemplate);
  }, [selectedTemplate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLOR_PRESET, colorPreset);
  }, [colorPreset]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.START_TIME, startTime);
  }, [startTime]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DURATION, duration);
  }, [duration]);

  // Update processing state based on active jobs
  useEffect(() => {
    const hasProcessing = Object.values(processingJobs).some((j) => j.status === 'processing' || j.status === 'queued');
    setIsProcessing(hasProcessing);
  }, [processingJobs]);

  // Toast helper
  function showToast(type, message) {
    const id = Date.now();
    setToast({ type, message, id });
    setTimeout(() => setToast(null), 3500);
  }

  // Clear workspace (video & settings, but keep token)
  function handleResetWorkspace() {
    if (window.confirm('Clear all uploaded files and workspace state? (You will stay logged in)')) {
      setUploadedFilename(null);
      setUploadedVideoUrl(null);
      setLocalFile(null);
      setUploadStatus('idle');
      setProcessingJobs({});
      setProcessingComplete(false);
      setCaptionText('0|4|Hello world');
      setSelectedTemplate(null);
      setStartTime('00:00:00');
      setDuration('30');
      setColorPreset('vibrant');
      setCurrentTab(TABS.TRIM);
      // Clear localStorage (except token/username)
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        if (key !== 'TOKEN' && key !== 'USERNAME') {
          localStorage.removeItem(storageKey);
        }
      });
      showToast('info', 'Workspace cleared');
    }
  }

  // Logout
  function handleLogout() {
    setToken('');
    setUsername(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    handleResetWorkspace();
    showToast('info', 'Logged out');
  }

  // ----- Auth handlers -----
  async function handleRegister() {
    const u = prompt('username?') || `user${Math.floor(Math.random() * 1000)}`;
    const p = prompt('password?') || 'pass';
    try {
      const r = await apiRegister(u, p);
      if (r && r.id) {
        showToast('success', 'Registered: ' + r.username);
      } else {
        showToast('error', 'Register failed: ' + JSON.stringify(r));
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Register error: ' + String(err));
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
        // Persist to localStorage
        localStorage.setItem(STORAGE_KEYS.TOKEN, r.token);
        localStorage.setItem(STORAGE_KEYS.USERNAME, r.username || u);
        showToast('success', 'Logged in as ' + (r.username || u));
      } else {
        showToast('error', 'Login failed: ' + JSON.stringify(r));
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Login error: ' + String(err));
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

    // If new file, clear old uploaded state
    if (uploadedFilename) {
      setUploadedFilename(null);
      setUploadedVideoUrl(null);
      localStorage.removeItem(STORAGE_KEYS.UPLOADED_FILENAME);
      setProcessingJobs({});
      setProcessingComplete(false);
    }

    // Auto-upload flow
    if (!token) {
      showToast('error', 'Login required to upload');
      return;
    }

    // Start upload
    try {
      setUploadStatus('uploading');
      const rsp = await apiUpload(token, f);
      if (rsp && rsp.ok) {
        const fn = rsp.filename || f.name;
        // Create local video URL for preview
        const videoUrl = URL.createObjectURL(f);
        setUploadedFilename(fn);
        setUploadedVideoUrl(videoUrl);
        setUploadStatus('uploaded');
        showToast('success', 'Video uploaded: ' + fn);
      } else {
        console.warn('Upload response', rsp);
        setUploadStatus('error');
        showToast('error', 'Upload failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error('Upload error', err);
      setUploadStatus('error');
      showToast('error', 'Upload error: ' + String(err));
    }
  }

  // ----- Trim action -----
  async function handleTrimVideo() {
    if (!uploadedFilename) {
      showToast('error', 'Please upload a video first');
      return;
    }
    if (!token) {
      showToast('error', 'Please login first');
      return;
    }
    try {
      const ops = [{ op: 'trim', start: startTime, duration: Number(duration), reencode: true }];
      const rsp = await createJob(token, uploadedFilename, ops);
      if (rsp && rsp.ok) {
        const jobId = rsp.jobId || rsp.id || 'unknown';
        setProcessingJobs((prev) => ({ ...prev, [jobId]: { status: 'queued', progress: 0 } }));
        setProcessingComplete(false);
        showToast('success', 'Trim job queued');
      } else {
        showToast('error', 'Trim failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Trim error: ' + String(err));
    }
  }

  // ----- Captions actions -----
  async function handleGenerateNormalCaptions() {
    if (!uploadedFilename) {
      showToast('error', 'Please upload a video first');
      return;
    }
    if (!token) {
      showToast('error', 'Please login first');
      return;
    }
    try {
      const ops = [{ op: 'auto_caption' }];
      const rsp = await createJob(token, uploadedFilename, ops);
      if (rsp && rsp.ok) {
        const jobId = rsp.jobId || rsp.id || 'unknown';
        setProcessingJobs((prev) => ({ ...prev, [jobId]: { status: 'processing', progress: 0 } }));
        setProcessingComplete(false);
        showToast('success', 'Generating normal captions...');
      } else {
        showToast('error', 'Failed to queue captions: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error: ' + String(err));
    }
  }

  async function handleCreateKineticCaptions() {
    if (!uploadedFilename) {
      showToast('error', 'Please upload a video first');
      return;
    }
    if (!token) {
      showToast('error', 'Please login first');
      return;
    }

    const caps = captionText.split('\n').map((l) => {
      const parts = l.split('|');
      return { start: Number(parts[0] || 0), end: Number(parts[1] || (Number(parts[0] || 0) + 4)), text: parts.slice(2).join('|') };
    });

    try {
      const payload = { filename: uploadedFilename, captions: caps, preset: selectedTemplate || 'slide-in', burn: false };
      const rsp = await createKineticCaption(token, payload);
      if (rsp && rsp.ok) {
        showToast('success', 'Kinetic captions created');
      } else {
        showToast('error', 'Failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error: ' + String(err));
    }
  }

  async function handlePreviewKineticCaptions() {
    if (!uploadedFilename) {
      showToast('error', 'Please upload a video first');
      return;
    }
    if (!token) {
      showToast('error', 'Please login first');
      return;
    }

    const caps = captionText.split('\n').map((l) => {
      const parts = l.split('|');
      return { start: Number(parts[0] || 0), end: Number(parts[1] || (Number(parts[0] || 0) + 4)), text: parts.slice(2).join('|') };
    });

    try {
      showToast('info', 'Generating preview...');
      const payload = { filename: uploadedFilename, captions: caps, preset: selectedTemplate || 'slide-in', start: caps[0]?.start || 0, duration: 6 };
      const rsp = await previewKineticCaption(token, payload);
      if (rsp && rsp.ok && rsp.preview) {
        showToast('success', 'Preview ready');
        window.open(rsp.preview, '_blank');
      } else {
        showToast('error', 'Preview failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Preview error: ' + String(err));
    }
  }

  // ----- Colors action -----
  async function handleApplyColorGrade() {
    if (!uploadedFilename) {
      showToast('error', 'Please upload a video first');
      return;
    }
    if (!token) {
      showToast('error', 'Please login first');
      return;
    }
    try {
      const ops = [{ op: 'color', preset: colorPreset }];
      const rsp = await createJob(token, uploadedFilename, ops);
      if (rsp && rsp.ok) {
        const jobId = rsp.jobId || rsp.id || 'unknown';
        setProcessingJobs((prev) => ({ ...prev, [jobId]: { status: 'processing', progress: 0 } }));
        setProcessingComplete(false);
        showToast('success', 'Color grade job queued');
      } else {
        showToast('error', 'Failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error: ' + String(err));
    }
  }

  // ----- Templates action -----
  function handleSelectTemplate(templateId) {
    setSelectedTemplate(templateId);
    showToast('info', 'Template selected');
  }

  // ----- AI editor action -----
  async function handleAiAutoCut() {
    if (!uploadedFilename) {
      showToast('error', 'Please upload a video first');
      return;
    }
    if (!token) {
      showToast('error', 'Please login first');
      return;
    }
    setAiRunning(true);
    try {
      const ops = [{ op: 'ai_cleanup' }];
      const rsp = await createJob(token, uploadedFilename, ops);
      if (rsp && rsp.ok) {
        const jobId = rsp.jobId || rsp.id || 'unknown';
        setProcessingJobs((prev) => ({ ...prev, [jobId]: { status: 'processing', progress: 0 } }));
        setProcessingComplete(false);
        showToast('success', 'AI Auto-Cut job started');
      } else {
        showToast('error', 'Failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'AI error: ' + String(err));
    } finally {
      setAiRunning(false);
    }
  }

  // Simulate processing complete (in real app, socket.io would trigger this)
  useEffect(() => {
    if (Object.keys(processingJobs).length > 0 && !processingComplete) {
      const timer = setTimeout(() => {
        setProcessingComplete(true);
        setTimeout(() => {
          setProcessingJobs({});
          setProcessingComplete(false);
        }, 2000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [processingJobs, processingComplete]);

  // Render
  return (
    <div style={styles.appContainer}>
      {/* Toast notification */}
      {toast && (
        <div style={{ ...styles.toast, ...styles[`toast_${toast.type}`] }}>
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✕ '}
          {toast.type === 'info' && 'ℹ '}
          {toast.message}
        </div>
      )}

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
              <div style={styles.authRow}>
                <div style={styles.welcome}>Welcome, <strong>{username}</strong></div>
                <button style={styles.ghostButton} onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
          <div style={styles.subheadline}>AI Waste Detector, Color Grader, Caption Creator & Relighter</div>
        </div>
      </header>

      {/* Main studio container */}
      <div style={styles.studioContainer}>
        {/* Top Half: Sticky Video Player */}
        <div style={styles.videoPlayerSection}>
          {uploadStatus !== 'uploaded' ? (
            // Upload box
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
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelected}
                      style={{ display: 'none' }}
                    />
                    <div style={{ height: 12 }} />
                    {uploadStatus === 'error' && (
                      <div style={styles.errorNote}>✕ Upload failed. Please try again.</div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            // Video player with overlay
            <div style={styles.videoPlayerWrapper}>
              <video
                ref={videoRef}
                style={styles.videoElement}
                controls
                src={uploadedVideoUrl}
              />

              {/* Processing overlay */}
              {isProcessing && (
                <div style={styles.processingOverlay}>
                  {!processingComplete ? (
                    <>
                      <div style={styles.spinner} />
                      <div style={styles.processingText}>Processing...</div>
                    </>
                  ) : (
                    <>
                      <div style={styles.checkmark}>✓</div>
                      <div style={styles.processingText}>Complete</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Half: Scrollable Workspace */}
        <div style={styles.workspaceSection}>
          <section style={styles.tabCard}>
            {/* Tab navigation */}
            <nav style={styles.tabNav}>
              <TabHeader label="✂️ Trim" active={currentTab === TABS.TRIM} onClick={() => setCurrentTab(TABS.TRIM)} />
              <TabHeader label="📝 Captions" active={currentTab === TABS.CAPTIONS} onClick={() => setCurrentTab(TABS.CAPTIONS)} />
              <TabHeader label="🎨 Colors" active={currentTab === TABS.COLORS} onClick={() => setCurrentTab(TABS.COLORS)} />
              <TabHeader label="📋 Templates" active={currentTab === TABS.TEMPLATES} onClick={() => setCurrentTab(TABS.TEMPLATES)} />
              <TabHeader label="🤖 AI Editor" active={currentTab === TABS.AI} onClick={() => setCurrentTab(TABS.AI)} />
              <div style={{ flex: 1 }} />
              <button style={styles.resetButton} onClick={handleResetWorkspace}>Reset</button>
            </nav>

            {/* Tab content */}
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
                    <label style={styles.label}>Duration (seconds)</label>
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 12 }}>
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
                            background: selected ? 'rgba(255,210,0,0.05)' : 'rgba(255,255,255,0.02)'
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{t.title}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{t.description}</div>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 10, color: selected ? '#ffd200' : 'rgba(255,255,255,0.6)' }}>
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
        </div>
      </div>
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
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    background: '#0b0b0c',
    color: '#fff',
    fontFamily: "'Inter', Roboto, Arial, sans-serif",
    overflow: 'hidden'
  },

  // Toast styles
  toast: { position: 'fixed', top: 20, right: 20, padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, zIndex: 9999, animation: 'slideIn 0.3s ease-out' },
  toast_success: { background: '#4caf50', color: '#fff' },
  toast_error: { background: '#ff6b6b', color: '#fff' },
  toast_info: { background: '#2196f3', color: '#fff' },

  // Header
  header: { borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 18px', background: '#0a0a0a', flexShrink: 0 },
  headerInner: { maxWidth: '100%', margin: '0 auto' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 10 },
  controllerEmoji: { fontSize: 20 },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: '#ffd200', letterSpacing: 0.2 },
  subheadline: { color: 'rgba(255,255,255,0.6)', marginTop: 4, fontSize: 12, fontWeight: 500 },
  authRow: { display: 'flex', gap: 8, alignItems: 'center' },
  welcome: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },

  // Studio container
  studioContainer: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },

  // Video player section (top half)
  videoPlayerSection: { flex: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.04)' },

  uploadBox: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  uploadInner: { textAlign: 'center' },
  uploadingText: { color: '#ffd200', fontWeight: 700, fontSize: 18 },
  uploadTitle: { color: '#ffd200', fontSize: 32, fontWeight: 800, marginBottom: 4 },
  uploadSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 500, marginBottom: 14 },
  chooseButton: { background: '#ffd200', color: '#080808', padding: '14px 30px', borderRadius: 30, border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer' },
  errorNote: { color: '#ff6b6b', marginTop: 8 },

  videoPlayerWrapper: { position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  videoElement: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },

  processingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  spinner: {
    width: 60,
    height: 60,
    border: '4px solid rgba(255,255,255,0.1)',
    borderTop: '4px solid #ffd200',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  checkmark: { fontSize: 60, fontWeight: 800, color: '#4caf50', animation: 'scaleIn 0.4s ease-out' },
  processingText: { marginTop: 16, fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600 },

  // Workspace section (bottom half)
  workspaceSection: { flex: 0.5, display: 'flex', flexDirection: 'column', overflow: 'hidden' },

  tabCard: { display: 'flex', flexDirection: 'column', height: '100%', background: '#111214', border: '1px solid rgba(255,255,255,0.03)' },
  tabNav: { display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', alignItems: 'center', flexShrink: 0, overflowX: 'auto' },
  tabHeader: { paddingBottom: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.75)', fontWeight: 600, position: 'relative', whiteSpace: 'nowrap', fontSize: 13 },
  tabHeaderActive: { color: '#ffd200' },
  activeUnderline: { height: 2, background: '#ffd200', width: '100%', marginTop: 6, borderRadius: 2 },
  resetButton: { padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 11, fontWeight: 600 },

  tabContent: { flex: 1, overflow: 'auto', padding: '12px 14px' },
  sectionTitle: { margin: 0, fontSize: 18, color: '#ffd200', fontWeight: 800, marginBottom: 6 },
  helperText: { color: 'rgba(255,255,255,0.6)', marginBottom: 12, fontSize: 13 },

  field: { marginBottom: 10, display: 'flex', flexDirection: 'column' },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  input: { padding: '10px 12px', borderRadius: 6, background: '#161617', border: '1px solid rgba(255,255,255,0.04)', color: 'white', fontSize: 13 },

  trimButton: { width: '100%', padding: '12px 14px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  captionButton: { width: '100%', padding: '10px 12px', background: '#ffd200', color: '#080808', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  captionButtonOutline: { width: '100%', padding: '10px 12px', background: 'transparent', color: '#ffd200', border: '1px solid rgba(255,210,0,0.16)', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' },

  select: { padding: '8px 10px', borderRadius: 6, background: '#0f0f10', color: '#fff', border: '1px solid rgba(255,255,255,0.04)', fontSize: 12 },
  applyColorButton: { background: '#ffd200', color: '#080808', border: 'none', padding: '8px 12px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', width: '100%', fontSize: 13 },

  templateCard: { padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease', cursor: 'pointer' },

  aiButton: { padding: '12px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(90deg,#00ff9d,#00e5ff)', color: '#021', fontWeight: 800, cursor: 'pointer', width: '100%', fontSize: 13 },
  aiButtonDisabled: { padding: '12px 14px', borderRadius: 8, border: 'none', background: '#444', color: '#999', fontWeight: 800, cursor: 'default', width: '100%', fontSize: 13 },

  ghostButton: { padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  primaryButton: { padding: '8px 12px', borderRadius: 6, border: 'none', background: 'linear-gradient(90deg,#00e5ff,#7c4dff)', color: '#021', fontWeight: 700, cursor: 'pointer', fontSize: 12 }
};

// Add CSS animations to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes scaleIn {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes slideIn {
      0% { transform: translateX(100%); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
          }
