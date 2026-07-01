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
 * AI ZipZop Studio - Dual-Layer Viral Subtitle Editor
 * Features:
 * - Dynamic Google Fonts (Rubik One + Inter)
 * - Center Viral Caption Layer (massive, neon color wheel)
 * - Bottom Context Bar Layer (rolling sentence context)
 * - Simplified Start Time + Duration Caption System
 * - Real-time word-by-word synchronized playback
 * - AI ZipZop Co-Pilot with 5 gaming profiles
 * - Dynamic animations (snappy pop, shake, spin)
 * - AI Asset Library: Trigger cutout images on keyword matches (CapCut-style)
 * - Full localStorage persistence
 * - Professional dark-mode cyberpunk aesthetic
 */

const AI_ZIPZOP_MODES = [
  {
    id: 'esports_montage',
    title: '👑 Esports Montage',
    description: 'Fast cuts, heavy contrast, neon captions',
    color: '#ffd200',
    animation: 'zipzopSnappyPop',
    fontSize: 68,
    textStroke: 4,
    sampleCaptions: [
      { id: 1, word: 'OMG', start: 0, duration: 1 },
      { id: 2, word: 'KILL', start: 1, duration: 1 },
      { id: 3, word: 'STREAK', start: 2, duration: 1 },
      { id: 4, word: '🔥', start: 3, duration: 1 }
    ]
  },
  {
    id: 'funny_moments',
    title: '🤣 Funny Moments',
    description: 'Shake animations, bright colors',
    color: '#00ffcc',
    animation: 'zipzopShake',
    fontSize: 68,
    textStroke: 3,
    sampleCaptions: [
      { id: 1, word: 'WAIT', start: 0, duration: 1 },
      { id: 2, word: 'WHAT', start: 1, duration: 1 },
      { id: 3, word: '😂', start: 2, duration: 1 },
      { id: 4, word: 'LMAO', start: 3, duration: 1 }
    ]
  },
  {
    id: 'cinematic_story',
    title: '📖 Cinematic',
    description: 'Minimal, elegant, fade effect',
    color: '#ffffff',
    animation: 'zipzopFade',
    fontSize: 60,
    textStroke: 2,
    sampleCaptions: [
      { id: 1, word: 'Cinematic', start: 0, duration: 2 },
      { id: 2, word: 'Storytelling', start: 2, duration: 2 },
      { id: 3, word: '✨', start: 4, duration: 2 }
    ]
  },
  {
    id: 'clutch_fail',
    title: '🤫 Clutch or Fail',
    description: 'Aggressive, fast text',
    color: '#ff6b6b',
    animation: 'zipzopSnappyPop',
    fontSize: 68,
    textStroke: 4,
    sampleCaptions: [
      { id: 1, word: 'CLUTCH', start: 0, duration: 0.5 },
      { id: 2, word: 'OR', start: 0.5, duration: 0.5 },
      { id: 3, word: 'FAIL', start: 1, duration: 0.5 },
      { id: 4, word: '❌', start: 1.5, duration: 0.5 }
    ]
  },
  {
    id: 'viral_retention',
    title: '📈 Viral Retention',
    description: 'Flashing, colorful, eye-catching',
    color: '#00ff9d',
    animation: 'zipzopSnappyPop',
    fontSize: 68,
    textStroke: 3,
    sampleCaptions: [
      { id: 1, word: 'WATCH', start: 0, duration: 1 },
      { id: 2, word: 'THIS', start: 1, duration: 1 },
      { id: 3, word: 'NOW', start: 2, duration: 1 },
      { id: 4, word: '⚡', start: 3, duration: 1 }
    ]
  }
];

const VIRAL_NEON_COLORS = ['#ffd200', '#00ff9d', '#ff1493', '#00e5ff'];

const STORAGE_KEYS = {
  TOKEN: 'zipzop_token',
  USERNAME: 'zipzop_username',
  UPLOADED_FILENAME: 'zipzop_uploaded_filename',
  SELECTED_AI_MODE: 'zipzop_selected_ai_mode',
  CAPTION_LINES: 'zipzop_caption_lines',
  COLOR_PRESET: 'zipzop_color_preset',
  AI_ASSET_LIBRARY: 'zipzop_ai_asset_library'
};

export default function App() {
  // ========== DYNAMIC GOOGLE FONTS ==========
  useEffect(() => {
    const fontId = 'zipzop-google-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Rubik+One&family=Inter:wght@300;400;600;800&display=swap';
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
        @keyframes zipzopSnappyPop {
          0% { transform: scale(0.5) translateY(20px); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
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
        @keyframes zipzopAssetPop {
          0% { 
            transform: scale(0.3) translateY(30px); 
            opacity: 0; 
          }
          70% { 
            transform: scale(1.12); 
          }
          100% { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
          }
        }
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
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
  const [uploadStatus, setUploadStatus] = useState('idle');

  // Toast state
  const [toast, setToast] = useState(null);

  // AI Co-Pilot state
  const [selectedAiMode, setSelectedAiMode] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Caption Lines with Start + Duration
  const [captionLines, setCaptionLines] = useState([
    { id: 1, word: 'OMG', start: 0, duration: 1 },
    { id: 2, word: 'THIS', start: 1, duration: 1 },
    { id: 3, word: 'IS', start: 2, duration: 1 },
    { id: 4, word: 'AMAZING', start: 3, duration: 1 }
  ]);

  // Caption overlay state
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [activeCaption, setActiveCaption] = useState(null);
  const [activeCaptionIndex, setActiveCaptionIndex] = useState(-1);
  const [captionStyle, setCaptionStyle] = useState(null);

  // Manual editor state
  const [colorPreset, setColorPreset] = useState('#ffd200');
  const [currentTab, setCurrentTab] = useState('ai-copilot');
  const [captionTextInput, setCaptionTextInput] = useState('');
  const [transcriptInput, setTranscriptInput] = useState('');

  // AI Asset Library state
  const [aiAssetLibrary, setAiAssetLibrary] = useState([]);
  const [assetLibraryTab, setAssetLibraryTab] = useState('library');
  const [assetUploadInput, setAssetUploadInput] = useState('');
  const [assetKeywordInput, setAssetKeywordInput] = useState('');
  const assetFileInputRef = useRef(null);

  // Rehydrate from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
    const savedAiMode = localStorage.getItem(STORAGE_KEYS.SELECTED_AI_MODE);
    const savedCaptions = localStorage.getItem(STORAGE_KEYS.CAPTION_LINES);
    const savedColor = localStorage.getItem(STORAGE_KEYS.COLOR_PRESET);
    const savedAssets = localStorage.getItem(STORAGE_KEYS.AI_ASSET_LIBRARY);

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
    }
    if (savedAiMode) setSelectedAiMode(savedAiMode);
    if (savedCaptions) {
      try {
        setCaptionLines(JSON.parse(savedCaptions));
      } catch (e) {
        console.error('Failed to parse saved captions:', e);
      }
    }
    if (savedColor) setColorPreset(savedColor);
    if (savedAssets) {
      try {
        setAiAssetLibrary(JSON.parse(savedAssets));
      } catch (e) {
        console.error('Failed to parse saved assets:', e);
      }
    }
  }, []);

  // Persist captions to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAPTION_LINES, JSON.stringify(captionLines));
  }, [captionLines]);

  // Persist AI mode to localStorage
  useEffect(() => {
    if (selectedAiMode) localStorage.setItem(STORAGE_KEYS.SELECTED_AI_MODE, selectedAiMode);
  }, [selectedAiMode]);

  // Persist color preset to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLOR_PRESET, colorPreset);
  }, [colorPreset]);

  // Persist AI assets to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AI_ASSET_LIBRARY, JSON.stringify(aiAssetLibrary));
  }, [aiAssetLibrary]);

  // Parse captions from "start | duration | word" format
  function parseCaptions(text) {
    if (!text.trim()) return [];
    const lines = text.split('\n').filter((line) => line.trim());
    const captions = [];

    lines.forEach((line, idx) => {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 3) {
        const start = parseFloat(parts[0]);
        const duration = parseFloat(parts[1]);
        const word = parts.slice(2).join('|');

        if (!isNaN(start) && !isNaN(duration) && word) {
          captions.push({
            id: Date.now() + idx,
            word: word,
            start: start,
            duration: duration
          });
        }
      }
    });

    return captions;
  }

  // Video time update handler
  function handleVideoTimeUpdate(e) {
    const time = e.target.currentTime;
    setCurrentVideoTime(time);

    const active = captionLines.find(
      (cap) => time >= cap.start && time <= cap.start + cap.duration
    );

    if (active) {
      const idx = captionLines.findIndex((cap) => cap.id === active.id);
      setActiveCaption(active);
      setActiveCaptionIndex(idx);
    } else {
      setActiveCaption(null);
      setActiveCaptionIndex(-1);
    }
  }

  // Toast helper
  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  // Auth handlers - using real apiRegister from imports
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

  // Login handler - using real apiLogin from imports
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

  // Logout handler
  function handleLogout() {
    setToken('');
    setUsername(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    showToast('info', 'Logged out');
  }

  // File upload handlers
  function handleChooseClick() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  // File selected handler - using real apiUpload from imports
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

    setTimeout(() => {
      setCaptionLines(mode.sampleCaptions);
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

  // Reset handler
  function handleReset() {
    if (window.confirm('Reset all captions and settings?')) {
      setCaptionLines([
        { id: 1, word: 'OMG', start: 0, duration: 1 },
        { id: 2, word: 'THIS', start: 1, duration: 1 },
        { id: 3, word: 'IS', start: 2, duration: 1 },
        { id: 4, word: 'AMAZING', start: 3, duration: 1 }
      ]);
      setColorPreset('#ffd200');
      setSelectedAiMode(null);
      setCaptionStyle(null);
      setCurrentVideoTime(0);
      setActiveCaption(null);
      setActiveCaptionIndex(-1);
      if (videoRef.current) videoRef.current.currentTime = 0;
      showToast('info', 'Reset');
    }
  }

  // Manual caption editing
  function handleAutoSyncCaptions() {
    if (!transcriptInput.trim()) {
      showToast('error', 'Enter transcript first');
      return;
    }

    const words = transcriptInput.trim().split(/\s+/);
    const durationPerWord = 0.5;

    const newCaptions = words.map((word, idx) => ({
      id: Date.now() + idx,
      word: word,
      start: idx * durationPerWord,
      duration: durationPerWord
    }));

    setCaptionLines(newCaptions);
    setTranscriptInput('');
    showToast('success', `Auto-synced ${words.length} words. Adjust timings in the textarea.`);
  }

  function handleApplyCaptionText() {
    const parsed = parseCaptions(captionTextInput);
    if (parsed.length === 0) {
      showToast('error', 'No valid captions found. Use format: start | duration | word');
      return;
    }

    setCaptionLines(parsed);
    showToast('success', `Loaded ${parsed.length} captions`);
  }

  function handleUpdateCaption(captionId, field, value) {
    setCaptionLines(
      captionLines.map((cap) =>
        cap.id === captionId
          ? {
              ...cap,
              [field]: field === 'word' ? value : parseFloat(value) || 0
            }
          : cap
      )
    );
  }

  function handleDeleteCaption(captionId) {
    setCaptionLines(captionLines.filter((cap) => cap.id !== captionId));
    showToast('info', 'Caption removed');
  }

  function handleAddCaptionRow() {
    const newId = Date.now();
    const lastCaption = captionLines[captionLines.length - 1];
    const nextStart = lastCaption ? lastCaption.start + lastCaption.duration : 0;

    setCaptionLines([
      ...captionLines,
      {
        id: newId,
        word: 'New Word',
        start: nextStart,
        duration: 0.5
      }
    ]);
  }

  function handleCaptionRowClick(caption) {
    if (videoRef.current) {
      videoRef.current.currentTime = caption.start;
    }
  }

  // AI Asset Library Handlers
  function handleAssetFileClick() {
    if (assetFileInputRef.current) assetFileInputRef.current.click();
  }

  function handleAssetFileSelected(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAssetUploadInput(event.target.result);
      showToast('info', 'Image loaded. Now add keyword and save.');
    };
    reader.readAsDataURL(f);
  }

  function handleAddAssetToLibrary() {
    if (!assetUploadInput || !assetKeywordInput.trim()) {
      showToast('error', 'Need both image and keyword');
      return;
    }

    const newAsset = {
      id: Date.now(),
      triggerKeyword: assetKeywordInput.toUpperCase(),
      imageUrl: assetUploadInput,
      active: true
    };

    setAiAssetLibrary([...aiAssetLibrary, newAsset]);
    setAssetUploadInput('');
    setAssetKeywordInput('');
    showToast('success', `Asset "${newAsset.triggerKeyword}" added to library`);
  }

  function handleRemoveAsset(assetId) {
    setAiAssetLibrary(aiAssetLibrary.filter((asset) => asset.id !== assetId));
    showToast('info', 'Asset removed');
  }

  function handleToggleAsset(assetId) {
    setAiAssetLibrary(
      aiAssetLibrary.map((asset) =>
        asset.id === assetId ? { ...asset, active: !asset.active } : asset
      )
    );
  }

  // Find matching asset for active caption
  function getMatchingAsset() {
    if (!activeCaption) return null;

    const activeWord = activeCaption.word.toUpperCase();
    const matchedAsset = aiAssetLibrary.find(
      (asset) => asset.active && activeWord.includes(asset.triggerKeyword)
    );

    return matchedAsset || null;
  }

  // Get rolling window of 5 words around active caption
  function getContextWindow() {
    if (activeCaptionIndex === -1) return [];

    const windowSize = 5;
    const startIdx = Math.max(0, activeCaptionIndex - Math.floor(windowSize / 2));
    const endIdx = Math.min(captionLines.length, startIdx + windowSize);

    return captionLines.slice(startIdx, endIdx);
  }

  // Get viral neon color based on caption index
  function getViralColor(idx) {
    if (idx === -1) return '#ffd200';
    return VIRAL_NEON_COLORS[idx % VIRAL_NEON_COLORS.length];
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
              <button style={styles.ghostBtn} onClick={handleRegister}>
                Register
              </button>
              <button style={styles.primaryBtn} onClick={handleLogin}>
                Login
              </button>
            </div>
          ) : (
            <div style={styles.authRow}>
              <span style={styles.welcome}>Welcome, {username}</span>
              <button style={styles.ghostBtn} onClick={handleLogout}>
                Logout
              </button>
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

              {/* AI Asset Overlay */}
              {getMatchingAsset() && (
                <div style={styles.assetOverlayContainer}>
                  <img
                    key={`asset-${getMatchingAsset().id}-${activeCaption.start}`}
                    src={getMatchingAsset().imageUrl}
                    alt={getMatchingAsset().triggerKeyword}
                    style={{
                      ...styles.assetImage,
                      animation: 'zipzopAssetPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                </div>
              )}

              {/* CENTER LAYER: Massive Viral Pop-up Word */}
              {activeCaption && (
                <div
                  key={`center-${activeCaption.start}-${activeCaption.word}-${activeCaption.id}`}
                  style={{
                    ...styles.centerCaptionLayer,
                    color: getViralColor(activeCaptionIndex),
                    fontSize: `${captionStyle?.fontSize || 68}px`,
                    animation: `${captionStyle?.animation || 'zipzopSnappyPop'} 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)`
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Rubik One', sans-serif",
                      fontWeight: 900,
                      letterSpacing: 3,
                      textTransform: 'uppercase',
                      textShadow: `-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 0 30px rgba(0,0,0,0.9)`,
                      filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
                    }}
                  >
                    {activeCaption.word}
                  </div>
                </div>
              )}

              {/* BOTTOM LAYER: Context Bar with rolling sentence */}
              {activeCaption && (
                <div style={styles.bottomContextLayer}>
                  <div style={styles.contextBarContainer}>
                    {getContextWindow().map((caption, idx) => {
                      const isActive = caption.id === activeCaption.id;
                      return (
                        <div
                          key={`context-${caption.id}`}
                          style={{
                            ...styles.contextWord,
                            ...(isActive ? styles.contextWordActive : {})
                          }}
                        >
                          {caption.word}
                        </div>
                      );
                    })}
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
              ⏱️ Simple Timing
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(currentTab === 'assets' ? styles.tabBtnActive : {})
              }}
              onClick={() => setCurrentTab('assets')}
            >
              🎯 AI Assets
            </button>
            <div style={{ flex: 1 }} />
            <button style={styles.resetBtn} onClick={handleReset}>
              Reset
            </button>
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
                        {isSelected && (
                          <div style={{ ...styles.modeCheckmark, color: mode.color }}>✓</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : currentTab === 'manual' ? (
              // Manual Editor
              <div>
                <h3 style={styles.sectionTitle}>⏱️ Simple Caption Timing Editor</h3>

                {/* Auto-Sync Section */}
                <div style={styles.autoSyncSection}>
                  <div style={styles.field}>
                    <label style={styles.label}>Paste Full Transcript (for auto-sync)</label>
                    <textarea
                      style={styles.textarea}
                      placeholder="Paste your entire speech here..."
                      value={transcriptInput}
                      onChange={(e) => setTranscriptInput(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <button style={styles.syncBtn} onClick={handleAutoSyncCaptions}>
                    🔄 Auto-Sync Captions
                  </button>
                </div>

                {/* Manual Text Input Section */}
                <div style={styles.manualInputSection}>
                  <div style={styles.field}>
                    <label style={styles.label}>Or Enter Captions Manually</label>
                    <div style={styles.formatGuide}>
                      Format: <code>start | duration | word</code>
                    </div>
                    <div style={styles.formatExample}>
                      Example: <code>1.2 | 3 | HELLO</code> (Starts at 1.2s and stays for 3 seconds)
                    </div>
                    <textarea
                      style={styles.textarea}
                      placeholder={`0 | 1 | OMG\n1 | 2 | THIS\n3 | 1.5 | IS\n4.5 | 2 | AMAZING`}
                      value={captionTextInput}
                      onChange={(e) => setCaptionTextInput(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <button style={styles.applyBtn} onClick={handleApplyCaptionText}>
                    ✅ Apply Captions
                  </button>
                </div>

                {/* Color Preset */}
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

                {/* Caption Timeline Table */}
                <div style={styles.timelineTableContainer}>
                  <div style={styles.timelineTableHeader}>
                    <div style={{ ...styles.timelineCell, flex: 2 }}>Word</div>
                    <div style={{ ...styles.timelineCell, flex: 1 }}>Start (s)</div>
                    <div style={{ ...styles.timelineCell, flex: 1 }}>Duration (s)</div>
                    <div style={{ ...styles.timelineCell, flex: 0.8 }}>Action</div>
                  </div>

                  <div style={styles.timelineTableBody}>
                    {captionLines.map((caption, idx) => (
                      <div
                        key={caption.id}
                        onClick={() => handleCaptionRowClick(caption)}
                        style={{
                          ...styles.timelineRow,
                          ...(activeCaption?.id === caption.id ? styles.timelineRowActive : {})
                        }}
                      >
                        <input
                          type="text"
                          value={caption.word}
                          onChange={(e) =>
                            handleUpdateCaption(caption.id, 'word', e.target.value)
                          }
                          style={{ ...styles.timelineCell, flex: 2 }}
                          placeholder="Word"
                        />
                        <input
                          type="number"
                          value={caption.start.toFixed(2)}
                          onChange={(e) =>
                            handleUpdateCaption(caption.id, 'start', e.target.value)
                          }
                          step="0.1"
                          style={{ ...styles.timelineCell, flex: 1 }}
                        />
                        <input
                          type="number"
                          value={caption.duration.toFixed(2)}
                          onChange={(e) =>
                            handleUpdateCaption(caption.id, 'duration', e.target.value)
                          }
                          step="0.1"
                          style={{ ...styles.timelineCell, flex: 1 }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCaption(caption.id);
                          }}
                          style={styles.deleteBtn}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Row & Preview */}
                <div style={styles.editorActions}>
                  <button style={styles.addRowBtn} onClick={handleAddCaptionRow}>
                    ➕ Add Caption Row
                  </button>

                  <div style={styles.previewBox}>
                    <div style={styles.previewLabel}>Live Preview</div>
                    <div
                      style={{
                        fontFamily: "'Rubik One', sans-serif",
                        fontSize: 32,
                        fontWeight: 900,
                        color: getViralColor(activeCaptionIndex),
                        textShadow: `-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000`,
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                        minHeight: 40
                      }}
                    >
                      {activeCaption?.word || captionLines[0]?.word || 'Preview'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // AI Assets Tab
              <div>
                <div style={styles.assetTabSelector}>
                  <button
                    style={{
                      ...styles.assetTabBtn,
                      ...(assetLibraryTab === 'library' ? styles.assetTabBtnActive : {})
                    }}
                    onClick={() => setAssetLibraryTab('library')}
                  >
                    📦 Library ({aiAssetLibrary.length})
                  </button>
                  <button
                    style={{
                      ...styles.assetTabBtn,
                      ...(assetLibraryTab === 'add' ? styles.assetTabBtnActive : {})
                    }}
                    onClick={() => setAssetLibraryTab('add')}
                  >
                    ➕ Add Asset
                  </button>
                </div>

                {assetLibraryTab === 'library' ? (
                  <div style={styles.assetLibraryContainer}>
                    {aiAssetLibrary.length === 0 ? (
                      <div style={styles.emptyState}>
                        <div style={styles.emptyStateText}>No assets yet</div>
                        <div style={styles.emptyStateSubtext}>
                          Add a cutout image to get started
                        </div>
                      </div>
                    ) : (
                      aiAssetLibrary.map((asset) => (
                        <div key={asset.id} style={styles.assetCard}>
                          <img
                            src={asset.imageUrl}
                            alt={asset.triggerKeyword}
                            style={styles.assetCardImage}
                          />
                          <div style={styles.assetCardInfo}>
                            <div style={styles.assetCardKeyword}>{asset.triggerKeyword}</div>
                            <div style={styles.assetCardActions}>
                              <button
                                style={{
                                  ...styles.assetToggleBtn,
                                  ...(asset.active ? styles.assetToggleBtnActive : {})
                                }}
                                onClick={() => handleToggleAsset(asset.id)}
                              >
                                {asset.active ? '✓ Active' : 'Inactive'}
                              </button>
                              <button
                                style={styles.assetDeleteBtn}
                                onClick={() => handleRemoveAsset(asset.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={styles.field}>
                      <label style={styles.label}>
                        Select Image (PNG with transparent background)
                      </label>
                      <button style={styles.chooseBtn} onClick={handleAssetFileClick}>
                        📸 Choose Image
                      </button>
                      <input
                        ref={assetFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAssetFileSelected}
                        style={{ display: 'none' }}
                      />
                    </div>

                    {assetUploadInput && (
                      <div style={styles.previewBox}>
                        <div style={styles.previewLabel}>Image Preview</div>
                        <img
                          src={assetUploadInput}
                          alt="preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 150,
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}

                    <div style={styles.field}>
                      <label style={styles.label}>Trigger Keyword (e.g., "LAMBORGHINI")</label>
                      <input
                        type="text"
                        placeholder="Enter keyword"
                        value={assetKeywordInput}
                        onChange={(e) => setAssetKeywordInput(e.target.value)}
                        style={styles.textInput}
                      />
                      <div style={styles.inputHint}>
                        This word in captions will trigger the image to pop up
                      </div>
                    </div>

                    <button style={styles.primaryBtn} onClick={handleAddAssetToLibrary}>
                      💾 Add to Library
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div style={styles.statusBar}>
            <span>⏱️ {currentVideoTime.toFixed(2)}s</span>
            <span>📝 {captionLines.length} captions</span>
            {selectedAiMode && (
              <span>
                🤖 Mode: {AI_ZIPZOP_MODES.find((m) => m.id === selectedAiMode)?.title}
              </span>
            )}
            {activeCaption && (
              <span>
                ▶️ Playing: <strong>{activeCaption.word}</strong> ({activeCaption.start.toFixed(2)}s)
              </span>
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

  mainLayout: { display: 'flex', flex: 1, overflow: 'hidden', gap: 0 },

  videoSection: {
    flex: 0.5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    overflow: 'hidden'
  },

  uploadBox: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
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

  videoPlayerWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  },
  videoPlayer: { width: '100%', height: '100%', objectFit: 'contain' },

  assetOverlayContainer: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 60,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  assetImage: {
    maxWidth: 250,
    maxHeight: 250,
    objectFit: 'contain',
    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.6))'
  },

  centerCaptionLayer: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 50,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    lineHeight: 1
  },

  bottomContextLayer: {
    position: 'absolute',
    bottom: '12%',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 49,
    pointerEvents: 'none',
    width: '90%',
    maxWidth: 800
  },
  contextBarContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 16px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    flexWrap: 'wrap'
  },
  contextWord: {
    fontSize: 14,
    fontFamily: "'Inter', -apple-system, sans-serif",
    color: '#fff',
    fontWeight: 400,
    letterSpacing: 0.5,
    padding: '4px 8px',
    borderRadius: 4,
    transition: 'all 0.2s ease'
  },
  contextWordActive: {
    color: '#ffd200',
    background: 'rgba(255, 210, 0, 0.2)',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: 6,
    boxShadow: '0 0 12px rgba(255, 210, 0, 0.4)'
  },

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

  controlPanel: {
    flex: 0.5,
    display: 'flex',
    flexDirection: 'column',
    background: '#111',
    borderLeft: '1px solid rgba(255,255,255,0.04)',
    overflow: 'hidden'
  },

  tabSelector: {
    display: 'flex',
    gap: 8,
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    alignItems: 'center',
    flexShrink: 0,
    overflowX: 'auto'
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
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
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

  tabContent: {
    flex: 1,
    overflow: 'auto',
    padding: '12px 14px'
  },

  sectionTitle: { margin: '0 0 12px 0', fontSize: 16, fontWeight: 800, color: '#ffd200' },

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

  autoSyncSection: {
    marginBottom: 12,
    padding: 12,
    background: 'rgba(76,175,80,0.08)',
    borderRadius: 8,
    border: '1px solid rgba(76,175,80,0.2)'
  },
  manualInputSection: {
    marginBottom: 12,
    padding: 12,
    background: 'rgba(255,210,0,0.08)',
    borderRadius: 8,
    border: '1px solid rgba(255,210,0,0.2)'
  },
  formatGuide: {
    fontSize: 11,
    color: '#ffd200',
    fontWeight: 600,
    marginBottom: 4,
    padding: '6px 8px',
    background: 'rgba(255,210,0,0.1)',
    borderRadius: 4,
    fontFamily: 'monospace'
  },
  formatExample: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
    padding: '6px 8px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    fontFamily: 'monospace',
    borderLeft: '3px solid #ffd200'
  },
  syncBtn: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'linear-gradient(90deg, #4caf50, #66bb6a)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    marginTop: 8,
    transition: 'all 0.2s'
  },
  applyBtn: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'linear-gradient(90deg, #ffd200, #ffed4e)',
    color: '#000',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    marginTop: 8,
    transition: 'all 0.2s'
  },

  timelineTableContainer: {
    marginTop: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.3)'
  },
  timelineTableHeader: {
    display: 'flex',
    background: 'rgba(255,210,0,0.1)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    padding: '8px 0',
    fontWeight: 700,
    fontSize: 11,
    color: '#ffd200'
  },
  timelineCell: {
    padding: '8px 10px',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center'
  },
  timelineTableBody: {
    maxHeight: 300,
    overflow: 'auto'
  },
  timelineRow: {
    display: 'flex',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
    transition: 'background 0.2s',
    padding: '4px 0'
  },
  timelineRowActive: {
    background: 'rgba(255,210,0,0.15)'
  },

  editorActions: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  addRowBtn: {
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(76,175,80,0.1)',
    color: '#4caf50',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  deleteBtn: {
    padding: '6px 8px',
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 12,
    margin: '8px 6px'
  },

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
  textInput: {
    padding: '8px 10px',
    borderRadius: 6,
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 12
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

  assetTabSelector: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: 8
  },
  assetTabBtn: {
    padding: '6px 10px',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    transition: 'all 0.2s'
  },
  assetTabBtnActive: {
    background: 'rgba(255,210,0,0.08)',
    border: '1px solid rgba(255,210,0,0.6)',
    color: '#ffd200'
  },
  assetLibraryContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 10
  },
  assetCard: {
    padding: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6
  },
  assetCardImage: {
    width: 80,
    height: 80,
    objectFit: 'contain',
    borderRadius: 4
  },
  assetCardInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    width: '100%'
  },
  assetCardKeyword: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ffd200',
    textAlign: 'center',
    wordBreak: 'break-word'
  },
  assetCardActions: {
    display: 'flex',
    gap: 4,
    width: '100%'
  },
  assetToggleBtn: {
    flex: 1,
    padding: '4px 6px',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  assetToggleBtnActive: {
    background: 'rgba(76,175,80,0.2)',
    border: '1px solid rgba(76,175,80,0.6)',
    color: '#4caf50'
  },
  assetDeleteBtn: {
    padding: '4px 6px',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 10
  },
  emptyState: {
    textAlign: 'center',
    padding: '20px',
    color: 'rgba(255,255,255,0.5)'
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)'
  },
  inputHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    fontStyle: 'italic'
  },

  statusBar: {
    display: 'flex',
    gap: 12,
    padding: '10px 12px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    flexShrink: 0,
    overflowX: 'auto'
  },

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
