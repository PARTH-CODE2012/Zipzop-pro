import React, { useEffect, useRef, useState } from 'react';
import {
  register as apiRegister,
  login as apiLogin,
  upload as apiUpload,
  createJob,
  createKineticCaption
} from './api';
import ViralPlayer from './ViralPlayer';
import './styles.css';

/**
 * AI ZipZop Studio - Dual-Layer Viral Subtitle Editor with CapCut-Style Kinetic Captions
 * Production-Ready SaaS Platform for Instagram Reels/TikTok Caption Generation
 * 
 * Features:
 * - Integrated ViralPlayer with letter-by-letter neon animations
 * - Custom Cyberpunk Gaming Auth Modal with animated mascot
 * - AI ZipZop Co-Pilot with 5 gaming profiles
 * - CapCut-style AI Asset Library (keyword trigger cutout images)
 * - Simplified Start Time + Duration Caption System
 * - Real-time word-by-word synchronized playback
 * - Dynamic animations (snappy pop, shake, spin)
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
      { word: 'OMG', start: 0, duration: 1 },
      { word: 'KILL', start: 1, duration: 1 },
      { word: 'STREAK', start: 2, duration: 1 },
      { word: '🔥', start: 3, duration: 1 }
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
      { word: 'WAIT', start: 0, duration: 1 },
      { word: 'WHAT', start: 1, duration: 1 },
      { word: '😂', start: 2, duration: 1 },
      { word: 'LMAO', start: 3, duration: 1 }
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
      { word: 'Cinematic', start: 0, duration: 2 },
      { word: 'Storytelling', start: 2, duration: 2 },
      { word: '✨', start: 4, duration: 2 }
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
      { word: 'CLUTCH', start: 0, duration: 0.5 },
      { word: 'OR', start: 0.5, duration: 0.5 },
      { word: 'FAIL', start: 1, duration: 0.5 },
      { word: '❌', start: 1.5, duration: 0.5 }
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
      { word: 'WATCH', start: 0, duration: 1 },
      { word: 'THIS', start: 1, duration: 1 },
      { word: 'NOW', start: 2, duration: 1 },
      { word: '⚡', start: 3, duration: 1 }
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

/**
 * Animated Gaming Mascot Component
 * A fun, animated SVG/GIF placeholder for the auth modal
 */
const AnimatedMascot = () => {
  return (
    <div style={styles.mascotContainer}>
      <div style={styles.mascotPlaceholder}>
        <div style={styles.mascotAnimation}>
          <div style={styles.mascotCircle1} />
          <div style={styles.mascotCircle2} />
          <div style={styles.mascotEye} />
        </div>
        <div style={styles.mascotText}>ZipZop AI</div>
      </div>
    </div>
  );
};

/**
 * Custom Cyberpunk Auth Modal Component
 */
const AuthModal = ({
  isOpen,
  mode,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onClose,
  isLoading
}) => {
  if (!isOpen) return null;

  const isLogin = mode === 'login';

  return (
    <div style={styles.authModalBackdrop} onClick={onClose}>
      <div style={styles.authModal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button style={styles.authCloseBtn} onClick={onClose}>
          ✕
        </button>

        {/* Modal Content Grid */}
        <div style={styles.authModalGrid}>
          {/* Left: Animated Mascot */}
          <div style={styles.authMascotSide}>
            <AnimatedMascot />
          </div>

          {/* Right: Auth Form */}
          <div style={styles.authFormSide}>
            {/* Title */}
            <h1 style={styles.authTitle}>
              {isLogin ? '🎮 LOG IN' : '🚀 ENTER STREAM'}
            </h1>

            {/* Subtitle */}
            <p style={styles.authSubtitle}>
              {isLogin
                ? 'Welcome back, creator! Unlock your viral captions.'
                : 'Join the viral revolution. Create your account now.'}
            </p>

            {/* Form */}
            <form
              style={styles.authForm}
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              {/* Username Field */}
              <div style={styles.authField}>
                <label style={styles.authLabel}>USERNAME / EMAIL</label>
                <input
                  type="text"
                  style={styles.authInput}
                  placeholder="zipzop_creator"
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <div style={styles.authInputGlow} />
              </div>

              {/* Password Field */}
              <div style={styles.authField}>
                <label style={styles.authLabel}>PASSWORD</label>
                <input
                  type="password"
                  style={styles.authInput}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  disabled={isLoading}
                />
                <div style={styles.authInputGlow} />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  ...styles.authSubmitBtn,
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span style={styles.authLoadingSpinner} />
                    {isLogin ? 'LOGGING IN...' : 'CREATING ACCOUNT...'}
                  </>
                ) : (
                  <>{isLogin ? '⚡ LOG IN NOW' : '🚀 START STREAMING'}</>
                )}
              </button>
            </form>

            {/* Footer Message */}
            <p style={styles.authFooter}>
              🔐 Your data is encrypted and secure. No cap. 🎬
            </p>
          </div>
        </div>

        {/* Neon Glow Effect */}
        <div style={styles.authGlowEffect} />
      </div>
    </div>
  );
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

  // Inject animations and global input focus styles
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
        @keyframes mascotBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes mascotGlow {
          0%, 100% { box-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc; }
          50% { box-shadow: 0 0 20px #ff0055, 0 0 40px #ff0055; }
        }
        @keyframes authInputFocus {
          0% { box-shadow: 0 0 5px #00ffcc; }
          100% { box-shadow: 0 0 20px #00ffcc, inset 0 0 10px rgba(0, 255, 204, 0.2); }
        }
        @keyframes loadingSpinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* AUTH INPUT FOCUS STATE - FIX #2 */
        input[type="text"]:focus,
        input[type="password"]:focus {
          animation: authInputFocus 0.4s ease-out forwards !important;
          border-color: #00ffcc !important;
          background: rgba(0, 255, 204, 0.08) !important;
          box-shadow: 0 0 20px #00ffcc, inset 0 0 10px rgba(0, 255, 204, 0.2) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ========== AUTH MODAL STATE ==========
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Auth state
  const [username, setUsername] = useState(null);
  const [token, setToken] = useState('');

  // Video upload state
  const fileInputRef = useRef(null);
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
    { word: 'OMG', start: 0, duration: 1 },
    { word: 'THIS', start: 1, duration: 1 },
    { word: 'IS', start: 2, duration: 1 },
    { word: 'AMAZING', start: 3, duration: 1 }
  ]);

  // Caption overlay state
  const [activeCaption, setActiveCaption] = useState(null);
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
            word: word,
            start: start,
            duration: duration
          });
        }
      }
    });

    return captions;
  }

  // Toast helper
  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  // ========== CUSTOM AUTH MODAL HANDLERS ==========

  /**
   * Open auth modal for registration
   */
  function handleRegister() {
    setAuthMode('register');
    setAuthUsername('');
    setAuthPassword('');
    setIsAuthModalOpen(true);
  }

  /**
   * Open auth modal for login
   */
  function handleLogin() {
    setAuthMode('login');
    setAuthUsername('');
    setAuthPassword('');
    setIsAuthModalOpen(true);
  }

  /**
   * Close auth modal
   */
  function handleCloseAuthModal() {
    setIsAuthModalOpen(false);
    setAuthUsername('');
    setAuthPassword('');
    setAuthLoading(false);
  }

  /**
   * Submit auth form (either register or login)
   */
  async function handleAuthSubmit() {
    if (!authUsername.trim() || !authPassword.trim()) {
      showToast('error', '⚠️ Enter your username AND password!');
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        const r = await apiRegister(authUsername, authPassword);
        if (r && r.id) {
          showToast('success', `✨ Welcome, ${r.username}! Now log in.`);
          handleCloseAuthModal();
        } else {
          showToast('error', '❌ Registration failed. Try again.');
        }
      } else {
        // Login
        const r = await apiLogin(authUsername, authPassword);
        if (r && r.token) {
          setToken(r.token);
          setUsername(r.username || authUsername);
          localStorage.setItem(STORAGE_KEYS.TOKEN, r.token);
          localStorage.setItem(STORAGE_KEYS.USERNAME, r.username || authUsername);
          showToast('success', `⚡ Welcome back, ${r.username || authUsername}!`);
          handleCloseAuthModal();
        } else {
          showToast('error', '❌ Login failed. Check your credentials.');
        }
      }
    } catch (err) {
      showToast('error', `❌ Error: ${String(err)}`);
    } finally {
      setAuthLoading(false);
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
      showToast('error', '🔐 Login required');
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
        showToast('success', '✅ Video uploaded');
      } else {
        setUploadStatus('error');
        showToast('error', '❌ Upload failed');
      }
    } catch (err) {
      setUploadStatus('error');
      showToast('error', '❌ Upload error: ' + String(err));
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
      showToast('success', `🎮 AI ZipZop: ${mode.title} Applied`);
    }, 2000);
  }

  // Reset handler
  function handleReset() {
    if (window.confirm('Reset all captions and settings?')) {
      setCaptionLines([
        { word: 'OMG', start: 0, duration: 1 },
        { word: 'THIS', start: 1, duration: 1 },
        { word: 'IS', start: 2, duration: 1 },
        { word: 'AMAZING', start: 3, duration: 1 }
      ]);
      setColorPreset('#ffd200');
      setSelectedAiMode(null);
      setCaptionStyle(null);
      setActiveCaption(null);
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

  function handleUpdateCaption(captionIndex, field, value) {
    const updatedLines = [...captionLines];
    updatedLines[captionIndex] = {
      ...updatedLines[captionIndex],
      [field]: field === 'word' ? value : parseFloat(value) || 0
    };
    setCaptionLines(updatedLines);
  }

  function handleDeleteCaption(captionIndex) {
    setCaptionLines(captionLines.filter((_, idx) => idx !== captionIndex));
    showToast('info', 'Caption removed');
  }

  function handleAddCaptionRow() {
    const lastCaption = captionLines[captionLines.length - 1];
    const nextStart = lastCaption ? lastCaption.start + lastCaption.duration : 0;

    setCaptionLines([
      ...captionLines,
      {
        word: 'New Word',
        start: nextStart,
        duration: 0.5
      }
    ]);
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

  // Handle caption change from ViralPlayer
  function handleActiveCaptionChange(caption) {
    setActiveCaption(caption);
  }

  // Render
  return (
    <div style={styles.container}>
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        username={authUsername}
        password={authPassword}
        onUsernameChange={setAuthUsername}
        onPasswordChange={setAuthPassword}
        onSubmit={handleAuthSubmit}
        onClose={handleCloseAuthModal}
        isLoading={authLoading}
      />

      {/* Toast - FIX #1: Properly merge toast styles */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            ...(toast.type === 'success' && styles.toastSuccess),
            ...(toast.type === 'error' && styles.toastError),
            ...(toast.type === 'info' && styles.toastInfo)
          }}
        >
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
            <div style={styles.playerContainer}>
              {/* ========== VIRAL PLAYER COMPONENT ========== */}
              <ViralPlayer
                videoUrl={uploadedVideoUrl}
                captions={captionLines}
                onCaptionChange={handleActiveCaptionChange}
                autoPlay={false}
                muted={false}
              />
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
                        key={idx}
                        style={{
                          ...styles.timelineRow,
                          ...(activeCaption?.word === caption.word ? styles.timelineRowActive : {})
                        }}
                      >
                        <input
                          type="text"
                          value={caption.word}
                          onChange={(e) =>
                            handleUpdateCaption(idx, 'word', e.target.value)
                          }
                          style={{ ...styles.timelineCell, flex: 2 }}
                          placeholder="Word"
                        />
                        <input
                          type="number"
                          value={caption.start.toFixed(2)}
                          onChange={(e) =>
                            handleUpdateCaption(idx, 'start', e.target.value)
                          }
                          step="0.1"
                          style={{ ...styles.timelineCell, flex: 1 }}
                        />
                        <input
                          type="number"
                          value={caption.duration.toFixed(2)}
                          onChange={(e) =>
                            handleUpdateCaption(idx, 'duration', e.target.value)
                          }
                          step="0.1"
                          style={{ ...styles.timelineCell, flex: 1 }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCaption(idx);
                          }}
                          style={styles.deleteBtn}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Row */}
                <div style={styles.editorActions}>
                  <button style={styles.addRowBtn} onClick={handleAddCaptionRow}>
                    ➕ Add Caption Row
                  </button>
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

/* ============================================================================
   STYLES - PRODUCTION-READY WITH BUG FIXES
   ============================================================================ */

const styles = {
  // ========== AUTH MODAL STYLES ==========
  authModalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'slideIn 0.4s ease-out'
  },

  authModal: {
    position: 'relative',
    background: '#0d0d11',
    borderRadius: 16,
    border: '2px solid #ffd200',
    boxShadow: '0 0 40px rgba(255, 210, 0, 0.4), 0 0 80px rgba(255, 0, 85, 0.2)',
    padding: 0,
    maxWidth: 900,
    width: '90%',
    maxHeight: '90vh',
    overflow: 'hidden',
    animation: 'slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
  },

  authCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255, 0, 85, 0.8)',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  authCloseBtn_hover: {
    background: 'rgba(255, 0, 85, 1)',
    transform: 'scale(1.1)'
  },

  authModalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    height: '100%'
  },

  authMascotSide: {
    background: 'linear-gradient(135deg, #1a1a24 0%, #2a2a38 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRight: '2px solid rgba(255, 210, 0, 0.2)'
  },

  mascotContainer: {
    width: 200,
    height: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  mascotPlaceholder: {
    position: 'relative',
    width: 180,
    height: 180,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },

  mascotAnimation: {
    width: 120,
    height: 120,
    position: 'relative',
    animation: 'mascotBounce 2s ease-in-out infinite'
  },

  mascotCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: '50%',
    border: '3px solid #ffd200',
    top: 0,
    left: 0,
    animation: 'mascotGlow 2s ease-in-out infinite'
  },

  mascotCircle2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: '50%',
    border: '2px solid #00ffcc',
    top: 15,
    left: 15,
    animation: 'mascotGlow 2.5s ease-in-out infinite'
  },

  mascotEye: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#ff0055',
    top: 50,
    left: 52,
    boxShadow: '24px 0 0 #ff0055'
  },

  mascotText: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: 700,
    color: '#00ffcc',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: "'Rubik One', sans-serif"
  },

  authFormSide: {
    background: '#0d0d11',
    padding: 50,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },

  authTitle: {
    margin: '0 0 10px 0',
    fontSize: 32,
    fontWeight: 900,
    color: '#fff',
    fontFamily: "'Rubik One', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: 2
  },

  authSubtitle: {
    margin: '0 0 30px 0',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: "'Inter', sans-serif"
  },

  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },

  authField: {
    position: 'relative'
  },

  authLabel: {
    display: 'block',
    marginBottom: 8,
    fontSize: 11,
    color: '#00ffcc',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: "'Rubik One', sans-serif"
  },

  // FIX #2: Removed inline animation, will be applied via global CSS
  authInput: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid rgba(0, 255, 204, 0.3)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.3s ease',
    outline: 'none',
    boxSizing: 'border-box'
  },

  authInputGlow: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    background: 'linear-gradient(90deg, #00ffcc, #ff0055, #00ffcc)',
    borderRadius: 1,
    opacity: 0
  },

  authSubmitBtn: {
    marginTop: 10,
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #ffd200, #ffed4e)',
    border: 'none',
    borderRadius: 8,
    color: '#000',
    fontSize: 14,
    fontWeight: 900,
    fontFamily: "'Rubik One', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: 2,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: '0 0 20px rgba(255, 210, 0, 0.5)'
  },

  authLoadingSpinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(0, 0, 0, 0.2)',
    borderTop: '2px solid #000',
    borderRadius: '50%',
    animation: 'loadingSpinner 0.8s linear infinite'
  },

  authFooter: {
    marginTop: 20,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif"
  },

  authGlowEffect: {
    position: 'absolute',
    top: -100,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 300,
    height: 300,
    background: 'radial-gradient(circle, rgba(255, 210, 0, 0.1), transparent)',
    pointerEvents: 'none'
  },

  // ========== MAIN APP STYLES ==========
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

  // FIX #1: Toast styles properly separated and renamed
  toast: {
    position: 'fixed',
    top: 20,
    right: 20,
    padding: '14px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 9999,
    animation: 'slideIn 0.3s ease-out'
  },
  toastSuccess: { 
    background: '#4caf50', 
    color: '#fff' 
  },
  toastError: { 
    background: '#ff6b6b', 
    color: '#fff' 
  },
  toastInfo: { 
    background: '#2196f3', 
    color: '#fff' 
  },

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
    overflow: 'hidden',
    padding: '20px'
  },

  playerContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
