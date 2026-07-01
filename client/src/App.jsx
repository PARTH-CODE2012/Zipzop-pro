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
 * AI ZipZop Studio - Premium Automated AI Captioning Platform
 * 100% AI-Powered Viral Short Generator
 * 
 * Architecture:
 * - Pure CSS custom symbols (NO standard emojis)
 * - Siri-inspired cyberpunk glowing AI circle loader
 * - Smart word-grouping (2-4 words per phrase, no character splitting)
 * - Flawless mouse + touch dragging with position persistence
 * - Premium AI silence cutter & jump-trimmer
 * - Full automation workflow
 */

const VIRAL_NEON_COLORS = ['#FF0055', '#00FFCC', '#9900FF', '#FFCC00', '#00FF66'];

const STORAGE_KEYS = {
  TOKEN: 'zipzop_token',
  USERNAME: 'zipzop_username',
  UPLOADED_FILENAME: 'zipzop_uploaded_filename',
  CAPTION_LINES: 'zipzop_caption_lines',
  CAPTION_POSITION: 'zipzop_caption_position'
};

/**
 * Siri-Inspired Glowing AI Circle
 * Multi-layered cyberpunk energy ball with dynamic animations
 */
const SiriAICircle = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div style={styles.siriCircleContainer}>
      {/* Outer pulsating ring */}
      <div style={styles.siriRingOuter} />
      {/* Middle glow layer */}
      <div style={styles.siriRingMiddle} />
      {/* Core energy ball */}
      <div style={styles.siriRingCore} />
      {/* Inner pulse */}
      <div style={styles.siriPulseInner} />
    </div>
  );
};

/**
 * Futuristic AI Loading Overlay
 * Pure CSS symbols, no standard emojis
 */
const AILoadingOverlay = ({ isLoading, currentStep }) => {
  if (!isLoading) return null;

  const steps = [
    { text: 'Analyzing vocal frequencies...', symbol: '◆' },
    { text: 'Detecting speech patterns...', symbol: '▼' },
    { text: 'Generating neon styles...', symbol: '✦' },
    { text: 'Syncing word timelines...', symbol: '◈' },
    { text: 'Finalizing captions...', symbol: '✤' }
  ];

  const currentStepData = steps[currentStep % steps.length];

  return (
    <div style={styles.aiLoadingOverlay}>
      <div style={styles.aiLoadingContent}>
        <SiriAICircle isActive={true} />

        <h2 style={styles.aiLoadingTitle}>AI ZipZop Processing</h2>

        <div style={styles.aiStepContainer}>
          <span style={styles.aiStepSymbol}>{currentStepData.symbol}</span>
          <p style={styles.aiLoadingStep}>{currentStepData.text}</p>
        </div>

        <div style={styles.aiLoadingBar}>
          <div
            style={{
              ...styles.aiLoadingBarFill,
              width: `${((currentStep + 1) / steps.length) * 100}%`
            }}
          />
        </div>

        <p style={styles.aiLoadingSubtext}>
          Your video is being transformed into viral gold
        </p>
      </div>
    </div>
  );
};

/**
 * Custom Auth Modal with Siri-style AI circle
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
        <button style={styles.authCloseBtn} onClick={onClose}>
          ✕
        </button>

        <div style={styles.authModalGrid}>
          <div style={styles.authMascotSide}>
            <SiriAICircle isActive={true} />
            <div style={styles.authMascotLabel}>AI ZipZop</div>
          </div>

          <div style={styles.authFormSide}>
            <h1 style={styles.authTitle}>
              {isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}
            </h1>

            <p style={styles.authSubtitle}>
              {isLogin
                ? 'Return to your viral creation studio'
                : 'Join the premium AI captioning platform'}
            </p>

            <form
              style={styles.authForm}
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <div style={styles.authField}>
                <label style={styles.authLabel}>USERNAME</label>
                <input
                  type="text"
                  style={styles.authInput}
                  placeholder="creator_name"
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

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
              </div>

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
                    {isLogin ? 'LOGGING IN' : 'CREATING'}
                  </>
                ) : (
                  <>{isLogin ? 'ENTER STUDIO' : 'START CREATING'}</>
                )}
              </button>
            </form>

            <p style={styles.authFooter}>
              Bank-grade encryption. Your data is secure.
            </p>
          </div>
        </div>

        <div style={styles.authGlowEffect} />
      </div>
    </div>
  );
};

/**
 * Draggable Caption Container with Touch + Mouse Support
 * Words kept intact (not split by character) for proper font rendering
 */
const DraggableCaptionBox = ({
  activePhrase,
  position,
  onPositionChange
}) => {
  const containerRef = useRef(null);
  const dragStateRef = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });

  const handleMouseDown = (e) => {
    dragStateRef.current.isDragging = true;
    dragStateRef.current.offsetX = e.clientX - position.x;
    dragStateRef.current.offsetY = e.clientY - position.y;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (dragStateRef.current.isDragging) {
      const newX = e.clientX - dragStateRef.current.offsetX;
      const newY = e.clientY - dragStateRef.current.offsetY;
      onPositionChange({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    dragStateRef.current.isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      dragStateRef.current.isDragging = true;
      dragStateRef.current.offsetX = touch.clientX - position.x;
      dragStateRef.current.offsetY = touch.clientY - position.y;
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
  };

  const handleTouchMove = (e) => {
    if (dragStateRef.current.isDragging && e.touches.length > 0) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStateRef.current.offsetX;
      const newY = touch.clientY - dragStateRef.current.offsetY;
      onPositionChange({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    dragStateRef.current.isDragging = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  if (!activePhrase) return null;

  return (
    <div
      ref={containerRef}
      style={{
        ...styles.draggableCaptionBox,
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: dragStateRef.current.isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Word-by-word rendering (NOT character splitting) */}
      <div style={styles.captionWordsContainer}>
        {activePhrase.phrase.split(' ').map((word, wordIdx) => {
          const randomColor =
            VIRAL_NEON_COLORS[Math.floor(Math.random() * VIRAL_NEON_COLORS.length)];
          const delay = wordIdx * 0.1;

          return (
            <div
              key={`${activePhrase.phrase}-word-${wordIdx}-${activePhrase.start}`}
              style={{
                color: randomColor,
                animation: `popBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards`,
                display: 'inline-block',
                marginRight: '8px',
                fontFamily: "'Rubik One', 'Arial Black', sans-serif",
                fontSize: '56px',
                fontWeight: 900,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                WebkitTextStroke: '3px #000',
                textStroke: '3px #000',
                textShadow: `
                  -4px -4px 0 #000,
                  4px -4px 0 #000,
                  -4px 4px 0 #000,
                  4px 4px 0 #000,
                  0 0 40px rgba(0, 0, 0, 0.9),
                  0 0 50px ${randomColor}
                `,
                filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))',
                textAlign: 'center'
              }}
            >
              {word}
            </div>
          );
        })}
      </div>

      {/* Drag indicator */}
      <div style={styles.dragIndicator}>:: DRAG TO MOVE ::</div>
    </div>
  );
};

/**
 * Smart Caption Grouping Function
 * Groups 2-4 consecutive words if spoken rapidly (< 0.4s gap)
 * Preserves word structure for proper font rendering
 */
function groupCaptions(captions, maxGapSeconds = 0.4) {
  if (!captions || captions.length === 0) return [];

  const phrases = [];
  let currentPhrase = {
    words: [captions[0].word],
    start: captions[0].start,
    end: captions[0].start + captions[0].duration
  };

  for (let i = 1; i < captions.length; i++) {
    const caption = captions[i];
    const gap = caption.start - currentPhrase.end;

    if (gap <= maxGapSeconds && currentPhrase.words.length < 4) {
      // Continue the phrase
      currentPhrase.words.push(caption.word);
      currentPhrase.end = caption.start + caption.duration;
    } else {
      // Start a new phrase
      if (currentPhrase.words.length > 0) {
        phrases.push({
          phrase: currentPhrase.words.join(' '),
          start: currentPhrase.start,
          end: currentPhrase.end
        });
      }
      currentPhrase = {
        words: [caption.word],
        start: caption.start,
        end: caption.start + caption.duration
      };
    }
  }

  // Add the last phrase
  if (currentPhrase.words.length > 0) {
    phrases.push({
      phrase: currentPhrase.words.join(' '),
      start: currentPhrase.start,
      end: currentPhrase.end
    });
  }

  return phrases;
}

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

  // ========== INJECT GLOBAL ANIMATIONS ==========
  useEffect(() => {
    const styleId = 'zipzop-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes popBounce {
          0% { 
            transform: scale(0.2) translateY(30px) rotate(-15deg); 
            opacity: 0; 
          }
          30% { 
            transform: scale(1.4) rotate(8deg); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.15) rotate(-3deg); 
          }
          70% { 
            transform: scale(1.05) rotate(1deg); 
          }
          100% { 
            transform: scale(1) translateY(0) rotate(0deg); 
            opacity: 1; 
          }
        }

        @keyframes siriPulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.8;
          }
          50% { 
            transform: scale(1.08); 
            opacity: 1;
          }
        }

        @keyframes siriRingPulse {
          0%, 100% { 
            box-shadow: 0 0 15px #00ffcc, 0 0 30px #00ffcc; 
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 30px #ffd200, 0 0 60px #ff0055; 
            transform: scale(1.05);
          }
        }

        @keyframes siriGlow {
          0%, 100% { 
            box-shadow: 0 0 20px #ffd200, 0 0 40px #00ffcc, inset 0 0 20px rgba(255, 210, 0, 0.3); 
          }
          50% { 
            box-shadow: 0 0 40px #ff0055, 0 0 80px #00ffcc, inset 0 0 40px rgba(255, 0, 85, 0.5); 
          }
        }

        @keyframes loadingSpinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes loadingBarProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        @keyframes slideInFade {
          from { 
            transform: translateY(20px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }

        @keyframes authInputFocus {
          0% { box-shadow: 0 0 5px #00ffcc; }
          100% { box-shadow: 0 0 20px #00ffcc, inset 0 0 10px rgba(0, 255, 204, 0.2); }
        }

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

  // ========== AUTH STATE ==========
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [username, setUsername] = useState(null);
  const [token, setToken] = useState('');

  // ========== VIDEO & CAPTIONS STATE ==========
  const fileInputRef = useRef(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');

  // ========== AI GENERATION STATE ==========
  const [aiGenerationLoading, setAiGenerationLoading] = useState(false);
  const [aiGenerationStep, setAiGenerationStep] = useState(0);
  const [captionLines, setCaptionLines] = useState([]);

  // ========== TRIM STATE ==========
  const [aiTrimLoading, setAiTrimLoading] = useState(false);

  // ========== CAPTION POSITION STATE ==========
  const [captionPosition, setCaptionPosition] = useState({ x: 120, y: 150 });

  // ========== ACTIVE CAPTION STATE ==========
  const [activeCaption, setActiveCaption] = useState(null);

  // ========== TOAST STATE ==========
  const [toast, setToast] = useState(null);

  // Rehydrate from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
    const savedPosition = localStorage.getItem(STORAGE_KEYS.CAPTION_POSITION);
    const savedCaptions = localStorage.getItem(STORAGE_KEYS.CAPTION_LINES);

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
    }
    if (savedPosition) {
      try {
        setCaptionPosition(JSON.parse(savedPosition));
      } catch (e) {
        console.error('Failed to parse position:', e);
      }
    }
    if (savedCaptions) {
      try {
        setCaptionLines(JSON.parse(savedCaptions));
      } catch (e) {
        console.error('Failed to parse captions:', e);
      }
    }
  }, []);

  // Persist position
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAPTION_POSITION, JSON.stringify(captionPosition));
  }, [captionPosition]);

  // Persist captions
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAPTION_LINES, JSON.stringify(captionLines));
  }, [captionLines]);

  // Toast helper
  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  // ========== AUTH HANDLERS ==========

  function handleRegister() {
    setAuthMode('register');
    setAuthUsername('');
    setAuthPassword('');
    setIsAuthModalOpen(true);
  }

  function handleLogin() {
    setAuthMode('login');
    setAuthUsername('');
    setAuthPassword('');
    setIsAuthModalOpen(true);
  }

  function handleCloseAuthModal() {
    setIsAuthModalOpen(false);
    setAuthUsername('');
    setAuthPassword('');
    setAuthLoading(false);
  }

  async function handleAuthSubmit() {
    if (!authUsername.trim() || !authPassword.trim()) {
      showToast('error', 'Enter username and password');
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        const r = await apiRegister(authUsername, authPassword);
        if (r && r.id) {
          showToast('success', `Account created. Welcome, ${r.username}!`);
          handleCloseAuthModal();
        } else {
          showToast('error', 'Registration failed');
        }
      } else {
        const r = await apiLogin(authUsername, authPassword);
        if (r && r.token) {
          setToken(r.token);
          setUsername(r.username || authUsername);
          localStorage.setItem(STORAGE_KEYS.TOKEN, r.token);
          localStorage.setItem(STORAGE_KEYS.USERNAME, r.username || authUsername);
          showToast('success', `Welcome back, ${r.username || authUsername}!`);
          handleCloseAuthModal();
        } else {
          showToast('error', 'Login failed');
        }
      }
    } catch (err) {
      showToast('error', `Error: ${String(err)}`);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setToken('');
    setUsername(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    showToast('info', 'Logged out');
  }

  // ========== VIDEO UPLOAD HANDLERS ==========

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
        setCaptionLines([]);
        showToast('success', 'Video uploaded');
      } else {
        setUploadStatus('error');
        showToast('error', 'Upload failed');
      }
    } catch (err) {
      setUploadStatus('error');
      showToast('error', `Upload error: ${String(err)}`);
    }
  }

  // ========== 1-CLICK AI AUTO-CAPTIONING ==========

  async function handleGenerateViralCaptions() {
    if (!uploadedVideoUrl) {
      showToast('error', 'Upload a video first');
      return;
    }

    if (!token) {
      showToast('error', 'Login required');
      return;
    }

    setAiGenerationLoading(true);
    setAiGenerationStep(0);

    const stepInterval = setInterval(() => {
      setAiGenerationStep((prev) => (prev + 1) % 5);
    }, 1400);

    try {
      const jobResult = await createJob(token, {
        videoUrl: uploadedVideoUrl,
        filename: uploadedFilename,
        mode: 'viral_retention'
      });

      clearInterval(stepInterval);

      if (jobResult && jobResult.captions) {
        const rawCaptions = jobResult.captions.map((cap) => ({
          word: cap.word || cap.text,
          start: cap.start,
          duration: cap.duration || (cap.end - cap.start)
        }));

        setCaptionLines(rawCaptions);
        showToast('success', `Generated ${rawCaptions.length} captions`);
      } else {
        showToast('error', 'Failed to generate captions');
      }
    } catch (err) {
      clearInterval(stepInterval);
      showToast('error', `Error: ${String(err)}`);
    } finally {
      setAiGenerationLoading(false);
      setAiGenerationStep(0);
    }
  }

  // ========== AI SILENCE CUTTER ==========

  async function handleAiSmartTrim() {
    if (!uploadedVideoUrl) {
      showToast('error', 'Upload a video first');
      return;
    }

    if (!token) {
      showToast('error', 'Login required');
      return;
    }

    setAiTrimLoading(true);

    try {
      const trimResult = await createKineticCaption(token, {
        videoUrl: uploadedVideoUrl,
        filename: uploadedFilename,
        action: 'trim_silence'
      });

      if (trimResult && trimResult.trimmedUrl) {
        setUploadedVideoUrl(trimResult.trimmedUrl);
        setCaptionLines([]);
        showToast('success', 'Silence removed. Video trimmed.');
      } else {
        showToast('error', 'Trim failed');
      }
    } catch (err) {
      showToast('error', `Trim error: ${String(err)}`);
    } finally {
      setAiTrimLoading(false);
    }
  }

  // Handle active caption from ViralPlayer
  function handleActiveCaptionChange(caption) {
    setActiveCaption(caption);
  }

  // Get grouped phrases
  const groupedPhrases = groupCaptions(captionLines);
  const activePhrase = groupedPhrases.find(
    (phrase) =>
      activeCaption &&
      activeCaption.start >= phrase.start &&
      activeCaption.start < phrase.end
  );

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

      {/* AI Loading Overlay */}
      <AILoadingOverlay isLoading={aiGenerationLoading} currentStep={aiGenerationStep} />

      {/* Toast */}
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
          <h1 style={styles.title}>AI ZIPZOP STUDIO</h1>
          <div style={{ flex: 1 }} />
          {!username ? (
            <div style={styles.authRow}>
              <button style={styles.ghostBtn} onClick={handleRegister}>
                SIGN UP
              </button>
              <button style={styles.primaryBtn} onClick={handleLogin}>
                LOG IN
              </button>
            </div>
          ) : (
            <div style={styles.authRow}>
              <span style={styles.welcome}>{username}</span>
              <button style={styles.ghostBtn} onClick={handleLogout}>
                LOGOUT
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div style={styles.mainLayout}>
        {/* Video Player Section */}
        <div style={styles.videoSection}>
          {uploadStatus !== 'uploaded' ? (
            <div style={styles.uploadContainer}>
              <div style={styles.uploadContent}>
                {uploadStatus === 'uploading' ? (
                  <p style={styles.uploadingText}>UPLOADING VIDEO</p>
                ) : (
                  <>
                    <h2 style={styles.uploadTitle}>UPLOAD YOUR VIDEO</h2>
                    <p style={styles.uploadDesc}>
                      Premium AI Caption Generator
                    </p>
                    <button style={styles.uploadBtn} onClick={handleChooseClick}>
                      SELECT FILE
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
            <div style={styles.playerWrapper}>
              <ViralPlayer
                videoUrl={uploadedVideoUrl}
                captions={captionLines}
                onCaptionChange={handleActiveCaptionChange}
                autoPlay={false}
                muted={false}
              />

              {/* Draggable Caption Box */}
              <DraggableCaptionBox
                activePhrase={activePhrase}
                position={captionPosition}
                onPositionChange={setCaptionPosition}
              />
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div style={styles.controlPanel}>
          {/* AI Generation Section */}
          <div style={styles.aiSection}>
            <h3 style={styles.sectionTitle}>CAPTION GENERATION</h3>

            {captionLines.length === 0 && uploadStatus === 'uploaded' ? (
              <>
                <button
                  style={styles.generateBtn}
                  onClick={handleGenerateViralCaptions}
                  disabled={aiGenerationLoading}
                >
                  GENERATE VIRAL CAPTIONS
                </button>
                <p style={styles.generateHint}>
                  One click. Full automation. Professional results.
                </p>
              </>
            ) : (
              <div style={styles.statsBox}>
                <div style={styles.stat}>
                  <span style={styles.statLabel}>CAPTIONS</span>
                  <span style={styles.statValue}>{captionLines.length}</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statLabel}>ACTIVE</span>
                  <span style={styles.statValue}>
                    {activePhrase?.phrase || '--'}
                  </span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statLabel}>STATUS</span>
                  <span style={styles.statValue}>READY</span>
                </div>
              </div>
            )}

            {/* Trim Button */}
            {captionLines.length > 0 && (
              <button
                style={{
                  ...styles.trimBtn,
                  opacity: aiTrimLoading ? 0.6 : 1
                }}
                onClick={handleAiSmartTrim}
                disabled={aiTrimLoading}
              >
                {aiTrimLoading ? 'TRIMMING' : '[JUMP_CUT] REMOVE SILENCE'}
              </button>
            )}
          </div>

          {/* Dragging Info */}
          {captionLines.length > 0 && (
            <div style={styles.dragInfo}>
              <p style={styles.dragInfoText}>
                [DRAG] Reposition captions on video using mouse or touch
              </p>
            </div>
          )}

          {/* Status Bar */}
          <div style={styles.statusBar}>
            <span>{uploadedFilename || 'NO VIDEO'}</span>
            <span>|</span>
            <span>{captionLines.length} CAPTIONS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   PRODUCTION-READY STYLES OBJECT
   ============================================================================ */

const styles = {
  // ========== SIRI AI CIRCLE STYLES ==========
  siriCircleContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    margin: '0 auto 20px'
  },

  siriRingOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '3px solid transparent',
    borderTop: '3px solid #ffd200',
    borderRight: '3px solid #00ffcc',
    animation: 'loadingSpinner 2s linear infinite',
    boxShadow: '0 0 30px rgba(255, 210, 0, 0.4)'
  },

  siriRingMiddle: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    width: 'calc(100% - 24px)',
    height: 'calc(100% - 24px)',
    borderRadius: '50%',
    border: '2px solid transparent',
    borderBottom: '2px solid #ff0055',
    borderLeft: '2px solid #9900ff',
    animation: 'loadingSpinner 3s linear reverse infinite',
    boxShadow: '0 0 20px rgba(255, 0, 85, 0.3), inset 0 0 20px rgba(0, 255, 204, 0.1)'
  },

  siriRingCore: {
    position: 'absolute',
    top: '30%',
    left: '30%',
    width: '40%',
    height: '40%',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #00ffcc, #ff0055)',
    animation: 'siriGlow 2s ease-in-out infinite',
    boxShadow: '0 0 40px #00ffcc, 0 0 80px #ff0055'
  },

  siriPulseInner: {
    position: 'absolute',
    top: '35%',
    left: '35%',
    width: '30%',
    height: '30%',
    borderRadius: '50%',
    background: '#fff',
    animation: 'siriPulse 1.5s ease-in-out infinite',
    opacity: 0.3
  },

  // ========== LOADING SCREEN STYLES ==========
  aiLoadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #0d0d11 0%, #1a1a28 100%)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    animation: 'slideInFade 0.4s ease-out'
  },

  aiLoadingContent: {
    textAlign: 'center',
    zIndex: 1001
  },

  aiLoadingTitle: {
    margin: '0 0 20px 0',
    fontSize: 32,
    fontWeight: 900,
    color: '#ffd200',
    fontFamily: "'Rubik One', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: 3,
    textShadow: '0 0 20px rgba(255, 210, 0, 0.6)'
  },

  aiStepContainer: {
    margin: '0 0 24px 0'
  },

  aiStepSymbol: {
    display: 'block',
    fontSize: 28,
    color: '#00ffcc',
    marginBottom: 8,
    textShadow: '0 0 15px rgba(0, 255, 204, 0.5)'
  },

  aiLoadingStep: {
    margin: 0,
    fontSize: 14,
    color: '#00ffcc',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: 1
  },

  aiLoadingBar: {
    width: 320,
    height: 4,
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    margin: '20px auto'
  },

  aiLoadingBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ffd200, #00ffcc)',
    boxShadow: '0 0 10px #ffd200'
  },

  aiLoadingSubtext: {
    margin: '16px 0 0 0',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: "'Inter', sans-serif"
  },

  // ========== AUTH MODAL STYLES ==========
  authModalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'slideInFade 0.4s ease-out'
  },

  authModal: {
    position: 'relative',
    background: '#0d0d11',
    borderRadius: 16,
    border: '2px solid #ffd200',
    boxShadow: '0 0 50px rgba(255, 210, 0, 0.4), 0 0 100px rgba(255, 0, 85, 0.2)',
    padding: 0,
    maxWidth: 900,
    width: '90%',
    maxHeight: '90vh',
    overflow: 'hidden'
  },

  authCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255, 0, 85, 0.8)',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  authModalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0
  },

  authMascotSide: {
    background: 'linear-gradient(135deg, #1a1a24 0%, #2a2a38 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRight: '2px solid rgba(255, 210, 0, 0.2)'
  },

  authMascotLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#00ffcc',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: "'Rubik One', sans-serif"
  },

  authFormSide: {
    background: '#0d0d11',
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },

  authTitle: {
    margin: '0 0 8px 0',
    fontSize: 28,
    fontWeight: 900,
    color: '#fff',
    fontFamily: "'Rubik One', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: 2
  },

  authSubtitle: {
    margin: '0 0 24px 0',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: "'Inter', sans-serif"
  },

  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },

  authField: {
    position: 'relative'
  },

  authLabel: {
    display: 'block',
    marginBottom: 6,
    fontSize: 10,
    color: '#00ffcc',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: "'Rubik One', sans-serif"
  },

  authInput: {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid rgba(0, 255, 204, 0.3)',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.3s ease',
    outline: 'none',
    boxSizing: 'border-box'
  },

  authSubmitBtn: {
    marginTop: 12,
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #ffd200, #ffed4e)',
    border: 'none',
    borderRadius: 6,
    color: '#000',
    fontSize: 12,
    fontWeight: 900,
    fontFamily: "'Rubik One', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 0 20px rgba(255, 210, 0, 0.5)'
  },

  authLoadingSpinner: {
    display: 'inline-block',
    width: 12,
    height: 12,
    border: '2px solid rgba(0, 0, 0, 0.2)',
    borderTop: '2px solid #000',
    borderRadius: '50%',
    animation: 'loadingSpinner 0.8s linear infinite'
  },

  authFooter: {
    marginTop: 16,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif"
  },

  authGlowEffect: {
    position: 'absolute',
    top: -120,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 350,
    height: 350,
    background: 'radial-gradient(circle, rgba(255, 210, 0, 0.1), transparent)',
    pointerEvents: 'none'
  },

  // ========== DRAGGABLE CAPTION BOX STYLES ==========
  draggableCaptionBox: {
    position: 'absolute',
    padding: '16px 24px',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 210, 0, 0.4)',
    zIndex: 40,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    boxShadow: '0 0 40px rgba(255, 210, 0, 0.3), 0 0 80px rgba(0, 255, 204, 0.1)',
    transition: 'box-shadow 0.3s ease'
  },

  captionWordsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '6px',
    marginBottom: 8
  },

  dragIndicator: {
    fontSize: 9,
    color: 'rgba(255, 210, 0, 0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: 1
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

  toast: {
    position: 'fixed',
    top: 20,
    right: 20,
    padding: '12px 16px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    zIndex: 9999,
    animation: 'slideInFade 0.3s ease-out'
  },

  toastSuccess: { background: '#4caf50', color: '#fff' },
  toastError: { background: '#ff6b6b', color: '#fff' },
  toastInfo: { background: '#2196f3', color: '#fff' },

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

  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
    color: '#ffd200',
    fontFamily: "'Rubik One', sans-serif",
    letterSpacing: 2,
    textTransform: 'uppercase'
  },

  authRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  },

  welcome: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: "'Inter', sans-serif"
  },

  mainLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    gap: 0
  },

  videoSection: {
    flex: 0.65,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    borderRight: '1px solid rgba(255,255,255,0.04)',
    overflow: 'hidden',
    padding: '16px'
  },

  playerWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  uploadContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  uploadContent: {
    textAlign: 'center'
  },

  uploadingText: {
    color: '#ffd200',
    fontWeight: 700,
    fontSize: 16,
    margin: 0,
    fontFamily: "'Rubik One', sans-serif"
  },

  uploadTitle: {
    fontSize: 28,
    fontWeight: 900,
    color: '#ffd200',
    margin: '0 0 8px 0',
    fontFamily: "'Rubik One', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: 2
  },

  uploadDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    margin: '0 0 20px 0',
    fontFamily: "'Inter', sans-serif"
  },

  uploadBtn: {
    padding: '12px 28px',
    borderRadius: 6,
    border: 'none',
    background: '#ffd200',
    color: '#000',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: "'Rubik One', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: 1,
    transition: 'all 0.3s ease'
  },

  controlPanel: {
    flex: 0.35,
    display: 'flex',
    flexDirection: 'column',
    background: '#111',
    borderLeft: '1px solid rgba(255,255,255,0.04)',
    overflow: 'hidden'
  },

  aiSection: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto'
  },

  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: 11,
    fontWeight: 800,
    color: '#ffd200',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: "'Rubik One', sans-serif"
  },

  generateBtn: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 6,
    border: 'none',
    background: 'linear-gradient(135deg, #ffd200, #ffed4e)',
    color: '#000',
    fontSize: 11,
    fontWeight: 900,
    fontFamily: "'Rubik One', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 0 25px rgba(255, 210, 0, 0.5)',
    marginBottom: 10
  },

  generateHint: {
    margin: 0,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.4
  },

  statsBox: {
    background: 'rgba(255, 210, 0, 0.08)',
    border: '1px solid rgba(255, 210, 0, 0.2)',
    borderRadius: 6,
    padding: '10px',
    marginBottom: 10
  },

  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    fontSize: 10,
    color: '#fff',
    fontFamily: "'Inter', sans-serif"
  },

  statLabel: {
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.6)'
  },

  statValue: {
    color: '#ffd200',
    fontWeight: 700
  },

  trimBtn: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'linear-gradient(135deg, #ff6b6b, #ff8a80)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "'Rubik One', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: 1,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: 10,
    boxShadow: '0 0 15px rgba(255, 107, 107, 0.4)'
  },

  dragInfo: {
    background: 'rgba(0, 255, 204, 0.08)',
    border: '1px solid rgba(0, 255, 204, 0.2)',
    borderRadius: 6,
    padding: '10px',
    marginBottom: 10
  },

  dragInfoText: {
    margin: 0,
    fontSize: 9,
    color: '#00ffcc',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.4,
    letterSpacing: 0.5
  },

  statusBar: {
    display: 'flex',
    gap: 8,
    padding: '10px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    flexShrink: 0,
    fontFamily: "'Inter', sans-serif"
  },

  primaryBtn: {
    padding: '8px 12px',
    borderRadius: 4,
    border: 'none',
    background: 'linear-gradient(90deg, #00e5ff, #7c4dff)',
    color: '#000',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: "'Rubik One', sans-serif"
  },

  ghostBtn: {
    padding: '8px 12px',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif"
  }
};
