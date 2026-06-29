// client/src/App.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  upload,
  createJob,
  previewKineticCaption,
  createKineticCaption
} from './api'; // existing API helpers
import './styles.css'; // keep existing styles (we use inline styles too)

/**
 * Reverted clean UI matching the screenshot:
 * - Header with title + sub-headline
 * - Large central upload box with dashed border + Hindi prompt + yellow Choose Video File button
 * - Bottom card with 3 tabs: Trim, Captions, Colors
 * - Captions tab contains three buttons exactly as requested
 *
 * Replace client/src/App.jsx with this file contents.
 */

const TABS = { TRIM: 'trim', CAPTIONS: 'captions', COLORS: 'colors' };

export default function App() {
  // Load Inter font into <head> for premium typography
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

  const [currentTab, setCurrentTab] = useState(TABS.TRIM);

  // Upload state
  const [file, setFile] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [token /* for protected endpoints if used */, setToken] = useState('');

  // Trim inputs
  const [startTime, setStartTime] = useState('00:00:00');
  const [duration, setDuration] = useState('30');

  // Captions text placeholder
  const [captionText, setCaptionText] = useState('0|4|Hello world');

  // Colors state
  const [colorPreset, setColorPreset] = useState('vibrant');

  // file input ref
  const fileInputRef = useRef(null);

  // handlers
  function onChooseFileClick() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function onFileSelected(e) {
    const f = e.target.files && e.target.files[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) {
      alert('Please choose a video file first.');
      return;
    }
    try {
      // upload expects a token for auth in the original app; if not using auth pass empty token
      const rsp = await upload(token, file);
      if (rsp?.ok) {
        setUploadedFilename(rsp.filename || file.name);
        alert('Uploaded: ' + (rsp.filename || file.name));
      } else {
        alert('Upload failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      alert('Upload error: ' + String(err));
    }
  }

  async function handleTrim() {
    if (!uploadedFilename) return alert('Upload a video first');
    // Create a trim job: op 'trim'
    try {
      const ops = [{ op: 'trim', start: startTime, duration: Number(duration), reencode: true }];
      const rsp = await createJob(token, uploadedFilename, ops);
      if (rsp?.ok) {
        alert('Trim job queued: ' + rsp.jobId);
      } else {
        alert('Failed to queue trim job: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      alert('Trim error: ' + String(err));
    }
  }

  async function handleGenerateNormalCaptions() {
    if (!uploadedFilename) return alert('Upload a video first');
    // enqueue a job or call endpoint for normal captions — here we use createJob with auto_caption
    try {
      const ops = [{ op: 'auto_caption' }];
      const rsp = await createJob(token, uploadedFilename, ops);
      if (rsp?.ok) alert('Normal captions job queued: ' + rsp.jobId);
      else alert('Failed: ' + JSON.stringify(rsp));
    } catch (err) {
      console.error(err);
      alert('Error: ' + String(err));
    }
  }

  async function handleCreateKineticCaptions() {
    if (!uploadedFilename) return alert('Upload a video first');
    const caps = captionText.split('\n').map((l) => {
      const parts = l.split('|');
      return { start: Number(parts[0] || 0), end: Number(parts[1] || (Number(parts[0] || 0) + 4)), text: parts.slice(2).join('|') };
    });
    try {
      const payload = { filename: uploadedFilename, captions: caps, preset: 'slide-in', burn: false };
      const rsp = await createKineticCaption(token, payload);
      if (rsp?.ok) alert('Kinetic ASS created: ' + rsp.ass);
      else alert('Failed: ' + JSON.stringify(rsp));
    } catch (err) {
      console.error(err);
      alert('Error: ' + String(err));
    }
  }

  async function handlePreviewKinetic() {
    if (!uploadedFilename) return alert('Upload a video first');
    const caps = captionText.split('\n').map((l) => {
      const parts = l.split('|');
      return { start: Number(parts[0] || 0), end: Number(parts[1] || (Number(parts[0] || 0) + 4)), text: parts.slice(2).join('|') };
    });
    try {
      const payload = { filename: uploadedFilename, captions: caps, preset: 'slide-in', start: caps[0]?.start || 0, duration: 6 };
      const rsp = await previewKineticCaption(token, payload);
      if (rsp?.ok) {
        window.open(rsp.preview, '_blank');
      } else {
        alert('Preview failed: ' + JSON.stringify(rsp));
      }
    } catch (err) {
      console.error(err);
      alert('Preview error: ' + String(err));
    }
  }

  // Simple small header + layout
  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.titleRow}>
            <span style={styles.controllerEmoji}>🎮</span>
            <h1 style={styles.title}>ZipZop Pro Video Studio</h1>
          </div>
          <div style={styles.subheadline}>AI Waste Detector, Color Grader, Caption Creator & Relighter</div>
        </div>
      </header>

      {/* Main upload box */}
      <main style={styles.main}>
        <div style={styles.uploadBox}>
          <div style={styles.uploadInner}>
            <div style={styles.hindiText}>अपनी GTA V या गेमप्ले वीडियो यहाँ लोड करें</div>

            <div style={{ height: 26 }} />

            <button style={styles.chooseButton} onClick={onChooseFileClick}>
              Choose Video File
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={onFileSelected}
              style={{ display: 'none' }}
            />

            <div style={{ height: 8 }} />
            <div style={styles.smallNote}>{uploadedFilename ? `Selected: ${uploadedFilename}` : 'No file chosen'}</div>

            <div style={{ height: 12 }} />
            <div>
              <button style={styles.uploadActionButton} onClick={handleUpload} disabled={!file}>
                Upload
              </button>
            </div>
          </div>
        </div>

        {/* Lower card with 3 tabs */}
        <section style={styles.tabCard}>
          {/* Tab headers */}
          <nav style={styles.tabNav}>
            <TabHeader label="✂️ Trim" active={currentTab === TABS.TRIM} onClick={() => setCurrentTab(TABS.TRIM)} />
            <TabHeader label="📝 Captions" active={currentTab === TABS.CAPTIONS} onClick={() => setCurrentTab(TABS.CAPTIONS)} />
            <TabHeader label="🎨 Colors" active={currentTab === TABS.COLORS} onClick={() => setCurrentTab(TABS.COLORS)} />
          </nav>

          <div style={styles.tabContent}>
            {currentTab === TABS.TRIM && (
              <div>
                <h3 style={styles.sectionTitle}>Video Trimming (कस्टम ट्रिम)</h3>
                <p style={styles.helperText}>शुरुआत का समय और अवधि सेट करें।</p>

                <div style={styles.field}>
                  <label style={styles.label}>Start Time (HH:MM:SS)</label>
                  <input style={styles.input} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Duration (seconds) - Leave empty for full video</label>
                  <input style={styles.input} value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>

                <div style={{ marginTop: 16 }}>
                  <button style={styles.trimButton} onClick={handleTrim}>✂️ Trim Video</button>
                </div>
              </div>
            )}

            {currentTab === TABS.CAPTIONS && (
              <div>
                <h3 style={styles.sectionTitle}>Captions</h3>
                <p style={styles.helperText}>Generate and preview captions for your gameplay.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  <button style={styles.captionButton} onClick={handleGenerateNormalCaptions}>Generate Normal Captions</button>
                  <button style={styles.captionButton} onClick={handleCreateKineticCaptions}>Create Kinetic Captions</button>
                  <button style={styles.captionButtonOutline} onClick={handlePreviewKinetic}>Preview Kinetic Style</button>
                </div>
              </div>
            )}

            {currentTab === TABS.COLORS && (
              <div>
                <h3 style={styles.sectionTitle}>Colors</h3>
                <p style={styles.helperText}>Apply quick color grades to improve your gameplay footage.</p>

                <div style={{ marginTop: 12 }}>
                  <select value={colorPreset} onChange={(e) => setColorPreset(e.target.value)} style={styles.select}>
                    <option value="vibrant">Vibrant</option>
                    <option value="cinematic">Cinematic</option>
                    <option value="flat">Flat</option>
                    <option value="boost-contrast">Boost Contrast</option>
                  </select>
                </div>

                <div style={{ marginTop: 14 }}>
                  <button style={styles.applyColorButton} onClick={async () => {
                    if (!uploadedFilename) return alert('Upload a video first');
                    // enqueue color job
                    try {
                      const ops = [{ op: 'color', preset: colorPreset }];
                      const rsp = await createJob(token, uploadedFilename, ops);
                      if (rsp?.ok) alert('Color job queued: ' + rsp.jobId);
                      else alert('Failed: ' + JSON.stringify(rsp));
                    } catch (err) {
                      console.error(err);
                      alert('Error: ' + String(err));
                    }
                  }}>Apply Color Grade</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/* Small components & styles */
function TabHeader({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{ ...styles.tabHeader, ...(active ? styles.tabHeaderActive : {}) }}>
      <span>{label}</span>
      {active && <div style={styles.activeUnderline} />}
    </div>
  );
}

const styles = {
  app: {
    fontFamily: "'Inter', Roboto, Arial, sans-serif",
    background: '#0b0b0c',
    color: '#fff',
    minHeight: '100vh',
    paddingBottom: 24
  },
  header: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    padding: '14px 18px',
    background: '#0a0a0a'
  },
  headerInner: {
    maxWidth: 980,
    margin: '0 auto'
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: 10 },
  controllerEmoji: { fontSize: 22 },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: '#ffd200',
    letterSpacing: 0.2
  },
  subheadline: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    fontSize: 13,
    fontWeight: 500
  },
  main: {
    maxWidth: 980,
    margin: '20px auto',
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18
  },
  uploadBox: {
    background: '#000',
    borderRadius: 12,
    border: '4px dashed rgba(255,255,255,0.06)',
    minHeight: 360,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28
  },
  uploadInner: {
    textAlign: 'center'
  },
  hindiText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 20,
    fontWeight: 500,
    marginBottom: 14
  },
  chooseButton: {
    background: '#ffd200',
    color: '#080808',
    padding: '14px 30px',
    borderRadius: 30,
    border: 'none',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer'
  },
  smallNote: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 6
  },
  uploadActionButton: {
    marginTop: 12,
    background: '#222',
    color: 'white',
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer'
  },
  tabCard: {
    background: '#111214',
    borderRadius: 12,
    padding: 18,
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.03)'
  },
  tabNav: {
    display: 'flex',
    gap: 18,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 10,
    alignItems: 'center'
  },
  tabHeader: {
    paddingBottom: 12,
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.75)',
    fontWeight: 600,
    position: 'relative'
  },
  tabHeaderActive: {
    color: '#ffd200'
  },
  activeUnderline: {
    height: 3,
    background: '#ffd200',
    width: '100%',
    marginTop: 8,
    borderRadius: 3
  },
  tabContent: {
    paddingTop: 14
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    color: '#ffd200',
    fontWeight: 800,
    marginBottom: 6
  },
  helperText: {
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12
  },
  field: {
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8
  },
  input: {
    padding: '12px 14px',
    borderRadius: 8,
    background: '#161617',
    border: '1px solid rgba(255,255,255,0.04)',
    color: 'white',
    fontSize: 14
  },
  trimButton: {
    width: '100%',
    padding: '14px 16px',
    background: '#ff6b6b',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer'
  },
  captionButton: {
    width: '100%',
    padding: '12px 14px',
    background: '#ffd200',
    color: '#080808',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer'
  },
  captionButtonOutline: {
    width: '100%',
    padding: '12px 14px',
    background: 'transparent',
    color: '#ffd200',
    border: '1px solid rgba(255,210,0,0.16)',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer'
  },
  select: {
    padding: '10px 12px',
    borderRadius: 8,
    background: '#0f0f10',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.04)'
  },
  applyColorButton: {
    marginTop: 12,
    background: '#ffd200',
    color: '#080808',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer'
  }
};
