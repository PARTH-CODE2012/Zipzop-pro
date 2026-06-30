// client/src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  register as apiRegister,
  login as apiLogin,
  upload as apiUpload,
  createJob,
  createKineticCaption
} from './api';
import './styles.css';

/**
 * AI ZipZop Studio - Real-time Caption Overlay Video Editor
 * Features:
 * - Real-time word-by-word caption overlay synchronized with video playback
 * - AI ZipZop Co-Pilot with 5 gaming profiles
 * - Dynamic animations (pop-bounce, shake, spin)
 * - Full localStorage persistence
 * - Professional dark-mode UI
 */

const AI_ZIPZOP_MODES = [
  {
    id: 'esports_montage',
    title: '👑 Esports Montage',
    description: 'Fast cuts, heavy contrast, neon captions',
    color: '#ffd200',
    animation: 'zipzopPopBounce',
    fontSize: 56,
    textStroke: 3,
    sampleCaptions: '0|1|OMG|1|2|KILL|2|3|STREAK|3|4|🔥'
  },
  {
    id: 'funny_moments',
    title: '🤣 Funny Moments',
    description: 'Shake animations, bright colors',
    color: '#00ffcc',
    animation: 'zipzopShake',
    fontSize: 48,
    textStroke: 2,
    sampleCaptions: '0|1|WAIT|1|2|WHAT|2|3|😂|3|4|LMAO'
  },
  {
    id: 'cinematic_story',
    title: '📖 Cinematic',
    description: 'Minimal, elegant, fade effect',
    color: '#ffffff',
    animation: 'zipzopFade',
    fontSize: 40,
    textStroke: 1,
    sampleCaptions: '0|2|Cinematic|2|4|Storytelling|4|6|✨'
  },
  {
    id: 'clutch_fail',
    title: '🤫 Clutch or Fail',
    description: 'Aggressive, fast text',
    color: '#ff6b6b',
    animation: 'zipzopPopBounce',
    fontSize: 52,
    textStroke: 3,
    sampleCaptions: '0|0.5|CLUTCH|0.5|1|OR|1|1.5|FAIL|1.5|2|❌'
  },
  {
    id: 'viral_retention',
    title: '📈 Viral Retention',
    description: 'Flashing, colorful, eye-catching',
    color: '#00ff9d',
    animation: 'zipzopFlash',
    fontSize: 54,
    textStroke: 2,
    sampleCaptions: '0|1|WATCH|1|2|THIS|2|3|NOW|3|4|⚡'
  }
];

const STORAGE_KEYS = {
  TOKEN: 'zipzop_token',
  USERNAME: 'zipzop_username',
  UPLOADED_FILENAME: 'zipzop_uploaded_filename',
  SELECTED_AI_MODE: 'zipzop_selected_ai_mode',
  CAPTION_TEXT: 'zipzop_caption_text',
  COLOR_PRESET: 'zipzop_color_preset'
};

export default function App() {
  // Load fonts
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

  // Inject animations
  useEffect(() => {
    const styleId = 'zipzop-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes zipzopPopBounce {
          0% { transform: scale(0.8) translateY(10px); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes zipzopShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-8px) rotate(-1deg); }
          50% { transform: translateX(8px) rotate(1deg); }
          75% { transform: translateX(-4px) rotate(-0.5deg); }
        }
        @keyframes zipzopFade {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
        @keyframes zipzopFlash {
          0%, 100% { opacity: 1; text-shadow: 0 0 10px currentColor; }
          50% { opacity: 0.6; text-shadow: 0 0 30px currentColor; }
        }
        @keyframes zipzopSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Auth state
  const [username, setUsername] = useState(null);
  const [token, setToken] = useState('');

  // Video upload state
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | uploaded | error

  // Toast state
  const [toast, setToast] = useState(null);

  // AI Co-Pilot state
  const [selectedAiMode, setSelectedAiMode] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Caption overlay state
  const [captionLines, setCaptionLines] = useState([]);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [activeCaption, setActiveCaption] = useState(null);
  const [captionStyle, setCaptionStyle] = useState(null);

  // Manual editor state
  const [captionText, setCaptionText] = useState('0|1|OMG|1|2|THIS|2|3|IS|3|4|AMAZING');
  const [colorPreset, setColorPreset] = useState('#ffd200');
  const [currentTab, setCurrentTab] = useState('ai-copilot');

  // Rehydrate from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
    const savedAiMode = localStorage.getItem(STORAGE_KEYS.SELECTED_AI_MODE);
    const savedCaption = localStorage.getItem(STORAGE_KEYS.CAPTION_TEXT);
    const savedColor = localStorage.getItem(STORAGE_KEYS.COLOR_PRESET);

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
    }
    if (savedAiMode) setSelectedAiMode(savedAiMode);
    if (savedCaption) setCaptionText(savedCaption);
    if (savedColor) setColorPreset(savedColor);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (selectedAiMode) localStorage.setItem(STORAGE_KEYS.SELECTED_AI_MODE, selectedAiMode);
  }, [selectedAiMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAPTION_TEXT, captionText);
  }, [captionText]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLOR_PRESET, colorPreset);
  }, [colorPreset]);

  // Parse caption lines from text format
  function parseCaptions(text) {
    if (!text) return [];
    return text.split('|').reduce((acc, val, idx) => {
      if (idx % 3 === 0) {
        acc.push({
          start: parseFloat(val),
          end: parseFloat(text.split('|')[idx + 1]) || 0,
          word: text.split('|')[idx + 2] || ''
        });
      }
      return acc;
    }, []);
  }

  // Update captions when caption text changes
  useEffect(() => {
    const parsed = parseCaptions(captionText);
    setCaptionLines(parsed);
  }, [captionText]);

  // Video time update listener
  function handleVideoTimeUpdate(e) {
    const time = e.target.currentTime;
    setCurrentVideoTime(time);

    // Find active caption
    const active = captionLines.find((cap) => time >= cap.start && time < cap.end);
    if (active) {
      setActiveCaption(active);
    } else {
      setActiveCaption(null);
    }
  }

  // Toast helper
  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  // Auth handlers
  async function handleRegister() {
    const u = prompt('username?') || `user${Math.floor(Math.random() * 1000)}`;
    const p = prompt('password?') || 'pass';
    try {
      const r = await apiRegister(u, p);
      if (r && r.id) {
        showToast('success', 'Registered: ' + r.username);
      } else {
        showToast('error', 'Register failed');
      }
    } catch (err) {
      showToast('error', 'Error: ' + String(err));
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
        localStorage.setItem(STORAGE_KEYS.TOKEN, r.token);
        localStorage.setItem(STORAGE_KEYS.USERNAME, r.username || u);
        showToast('success', 'Logged in');
      } else {
        showToast('error', 'Login failed');
      }
    } catch (err) {
      showToast('error', 'Error: ' + String(err));
    }
  }

  function handleLogout() {
    setToken('');
    setUsername(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    showToast('info', 'Logged out');
  }

  // File upload
  function handleChooseClick() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  async function handleFileSelected(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    if (!token) {
      showToast('error', 'Login required');
      return;
    }

    try {
      setUploadStatus('uploading');
      const rsp = await apiUpload(token, f);
      if (rsp && rsp.ok) {
        const videoUrl = URL.createObjectURL(f);
        setUploadedVideoUrl(videoUrl);
        setUploadedFilename(rsp.filename || f.name);
        setUploadStatus('uploaded');
        showToast('success', 'Video uploaded');
      } else {
        setUploadStatus('error');
        showToast('error', 'Upload failed');
      }
    } catch (err) {
      setUploadStatus('error');
      showToast('error', 'Upload error: ' + String(err));
    }
  }

  // Apply AI Mode
  async function handleApplyAiMode(modeId) {
    const mode = AI_ZIPZOP_MODES.find((m) => m.id === modeId);
    if (!mode) return;

    setSelectedAiMode(modeId);
    setAiLoading(true);

    // Simulate AI configuration
    setTimeout(() => {
      setCaptionText(mode.sampleCaptions);
      setColorPreset(mode.color);
      setCaptionStyle({
        color: mode.color,
        animation: mode.animation,
        fontSize: mode.fontSize,
        textStroke: mode.textStroke
      });
      setAiLoading(false);
      showToast('success', `AI ZipZop: ${mode.title} Applied`);
    }, 2000);
  }

  function handleReset() {
    if (window.confirm('Reset all captions and settings?')) {
      setCaptionText('0|1|OMG|1|2|THIS|2|3|IS|3|4|AMAZING');
      setColorPreset('#ffd200');
      setSelectedAiMode(null);
      setCaptionStyle(null);
      setCurrentVideoTime(0);
      setActiveCaption(null);
      if (videoRef.current) videoRef.current.currentTime = 0;
      showToast('info', 'Reset');
    }
  }

  // Render
  return (
    <div style={styles.container}>
      {/* Toast */}
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
          <h1 style={styles.title}>🎮 AI ZipZop Studio</h1>
          <div style={{ flex: 1 }} />
          {!username ? (
            <div style={styles.authRow}>
              <button style={styles.ghostBtn} onClick={handleRegister}>Register</button>
              <button style={styles.primaryBtn} onClick={handleLogin}>Login</button>
            </div>
          ) : (
            <div style={styles.authRow}>
              <span style={styles.welcome}>Welcome, {username}</span>
              <button style={styles.ghostBtn} onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div style={styles.mainLayout}>
        {/* Top: Video Player Section */}
        <div style={styles.videoSection}>
          {uploadStatus !== 'uploaded' ? (
            <div style={styles.uploadBox}>
              <div style={styles.uploadInner}>
                {uploadStatus === 'uploading' ? (
                  <div style={styles.uploadingText}>Uploading...</div>
                ) : (
                  <>
                    <div style={styles.uploadTitle}>Upload Video</div>
                    <div style={styles.uploadDesc}>ZipZop AI Editor</div>
                    <button style={styles.chooseBtn} onClick={handleChooseClick}>
                      Choose Video File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelected}
                      style={{ display: 'none' }}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.videoPlayerWrapper}>
              <video
                ref={videoRef}
                style={styles.videoPlayer}
                controls
                src={uploadedVideoUrl}
                onTimeUpdate={handleVideoTimeUpdate}
              />

              {/* Caption Overlay */}
              {activeCaption && (
                <div
                  key={`${activeCaption.start}-${activeCaption.word}`}
                  style={{
                    ...styles.captionOverlay,
                    color: captionStyle?.color || colorPreset,
                    fontSize: `${captionStyle?.fontSize || 56}px`,
                    animation: `${captionStyle?.animation || 'zipzopPopBounce'} 0.4s ease-out`
                  }}
                >
                  <div
                    style={{
                      textShadow: `
                        -${captionStyle?.textStroke || 2}px -${captionStyle?.textStroke || 2}px 0 #000,
                        ${captionStyle?.textStroke || 2}px -${captionStyle?.textStroke || 2}px 0 #000,
                        -${captionStyle?.textStroke || 2}px ${captionStyle?.textStroke || 2}px 0 #000,
                        ${captionStyle?.textStroke || 2}px ${captionStyle?.textStroke || 2}px 0 #000,
                        0 0 20px rgba(0,0,0,0.8)
                      `,
                      fontWeight: 900,
                      letterSpacing: 2,
                      textTransform: 'uppercase'
                    }}
                  >
                    {activeCaption.word}
                  </div>
                </div>
              )}

              {/* AI Loading Overlay */}
              {aiLoading && (
                <div style={styles.aiLoadingOverlay}>
                  <div style={styles.aiSpinner} />
                  <div style={styles.aiLoadingText}>AI Configuration...</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Control Panel */}
        <div style={styles.controlPanel}>
          {/* Tab Selector */}
          <div style={styles.tabSelector}>
            <button
              style={{
                ...styles.tabBtn,
                ...(currentTab === 'ai-copilot' ? styles.tabBtnActive : {})
              }}
              onClick={() => setCurrentTab('ai-copilot')}
            >
              🤖 AI Co-Pilot
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(currentTab === 'manual' ? styles.tabBtnActive : {})
              }}
              onClick={() => setCurrentTab('manual')}
            >
              ✨ Manual
            </button>
            <div style={{ flex: 1 }} />
            <button style={styles.resetBtn} onClick={handleReset}>Reset</button>
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>
            {currentTab === 'ai-copilot' ? (
              // AI Co-Pilot Grid
              <div>
                <h3 style={styles.sectionTitle}>Select AI ZipZop Mode</h3>
                <div style={styles.modeGrid}>
                  {AI_ZIPZOP_MODES.map((mode) => {
                    const isSelected = selectedAiMode === mode.id;
                    return (
                      <div
                        key={mode.id}
                        onClick={() => handleApplyAiMode(mode.id)}
                        style={{
                          ...styles.modeCard,
                          borderColor: isSelected ? mode.color : 'rgba(255,255,255,0.1)',
                          background: isSelected ? `${mode.color}15` : 'rgba(255,255,255,0.03)',
                          cursor: aiLoading ? 'not-allowed' : 'pointer',
                          opacity: aiLoading ? 0.6 : 1
                        }}
                      >
                        <div style={{ ...styles.modeCardTitle, color: mode.color }}>
                          {mode.title}
                        </div>
                        <div style={styles.modeCardDesc}>{mode.description}</div>
                        {isSelected && <div style={{ ...styles.modeCheckmark, color: mode.color }}>✓</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Manual Editor
              <div>
                <h3 style={styles.sectionTitle}>Manual Caption Editor</h3>
                <div style={styles.field}>
                  <label style={styles.label}>Captions (format: start|end|word)</label>
                  <textarea
                    style={styles.textarea}
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    rows={4}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Text Color</label>
                  <div style={styles.colorInputRow}>
                    <input
                      type="color"
                      value={colorPreset}
                      onChange={(e) => setColorPreset(e.target.value)}
                      style={styles.colorInput}
                    />
                    <input
                      type="text"
                      value={colorPreset}
                      onChange={(e) => setColorPreset(e.target.value)}
                      style={styles.colorTextInput}
                    />
                  </div>
                </div>

                <div style={styles.previewBox}>
                  <div style={styles.previewLabel}>Live Preview</div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 900,
                      color: colorPreset,
                      textShadow: `-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000`,
                      textTransform: 'uppercase',
                      letterSpacing: 2
                    }}
                  >
                    {captionLines[0]?.word || 'Preview'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div style={styles.statusBar}>
            <span>⏱️ {currentVideoTime.toFixed(2)}s</span>
            <span>📝 {captionLines.length} captions</span>
            {selectedAiMode && (
              <span>🤖 Mode: {AI_ZIPZOP_MODES.find((m) => m.id === selectedAiMode)?.title}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* STYLES */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    background: '#0a0a0a',
    color: '#fff',
    fontFamily: "'Inter', -apple-system, sans-serif",
    overflow: 'hidden'
  },

  // Toast
  toast: {
    position: 'fixed',
    top: 20,
    right: 20,
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 9999,
    animation: 'slideIn 0.3s ease-out'
  },
  toast_success: { background: '#4caf50', color: '#fff' },
  toast_error: { background: '#ff6b6b', color: '#fff' },
  toast_info: { background: '#2196f3', color: '#fff' },

  // Header
  header: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    padding: '12px 20px',
    background: '#000',
    flexShrink: 0
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    maxWidth: 1400,
    margin: '0 auto',
    gap: 16
  },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: '#ffd200' },
  authRow: { display: 'flex', gap: 10, alignItems: 'center' },
  welcome: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  // Main Layout
  mainLayout: { display: 'flex', flex: 1, overflow: 'hidden', gap: 0 },

  // Video Section (Top)
  videoSection: {
    flex: 0.5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    overflow: 'hidden'
  },

  uploadBox: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  uploadInner: { textAlign: 'center' },
  uploadingText: { color: '#ffd200', fontWeight: 700, fontSize: 18 },
  uploadTitle: { fontSize: 32, fontWeight: 800, color: '#ffd200', marginBottom: 4 },
  uploadDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 20 },
  chooseBtn: {
    padding: '12px 28px',
    borderRadius: 30,
    border: 'none',
    background: '#ffd200',
    color: '#000',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer'
  },

  videoPlayerWrapper: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' },
  videoPlayer: { width: '100%', height: '100%', objectFit: 'contain' },

  // Caption Overlay
  captionOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 50,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    lineHeight: 1
  },

  // AI Loading Overlay
  aiLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  aiSpinner: {
    width: 50,
    height: 50,
    border: '4px solid rgba(255,255,255,0.1)',
    borderTop: '4px solid #ffd200',
    borderRadius: '50%',
    animation: 'zipzopSpin 1s linear infinite'
  },
  aiLoadingText: { marginTop: 12, fontSize: 14, color: '#ffd200', fontWeight: 600 },

  // Control Panel (Bottom)
  controlPanel: {
    flex: 0.5,
    display: 'flex',
    flexDirection: 'column',
    background: '#111',
    borderLeft: '1px solid rgba(255,255,255,0.04)',
    overflow: 'hidden'
  },

  // Tab Selector
  tabSelector: {
    display: 'flex',
    gap: 8,
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    alignItems: 'center',
    flexShrink: 0
  },
  tabBtn: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    transition: 'all 0.2s'
  },
  tabBtnActive: {
    background: 'rgba(255,210,0,0.1)',
    border: '1px solid #ffd200',
    color: '#ffd200'
  },
  resetBtn: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600
  },

  // Tab Content
  tabContent: {
    flex: 1,
    overflow: 'auto',
    padding: '12px 14px'
  },

  sectionTitle: { margin: '0 0 12px 0', fontSize: 16, fontWeight: 800, color: '#ffd200' },

  // Mode Grid
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: 10
  },
  modeCard: {
    padding: 12,
    borderRadius: 10,
    border: '2px solid',
    background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  modeCardTitle: { fontWeight: 700, fontSize: 12, marginBottom: 4 },
  modeCardDesc: { fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 },
  modeCheckmark: { marginTop: 6, fontSize: 14, fontWeight: 800 },

  // Manual Fields
  field: { marginBottom: 12, display: 'flex', flexDirection: 'column' },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontWeight: 600 },
  textarea: {
    padding: '8px 10px',
    borderRadius: 6,
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    resize: 'none'
  },

  colorInputRow: { display: 'flex', gap: 8 },
  colorInput: { width: 50, height: 36, borderRadius: 6, border: 'none', cursor: 'pointer' },
  colorTextInput: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 6,
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 12
  },

  previewBox: {
    padding: 12,
    background: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    marginTop: 8
  },
  previewLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },

  // Status Bar
  statusBar: {
    display: 'flex',
    gap: 12,
    padding: '10px 12px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    flexShrink: 0
  },

  // Buttons
  primaryBtn: {
    padding: '8px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'linear-gradient(90deg, #00e5ff, #7c4dff)',
    color: '#000',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 12
  },
  ghostBtn: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600
  }
};
