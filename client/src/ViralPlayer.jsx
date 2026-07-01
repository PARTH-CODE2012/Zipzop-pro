import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import './captions.css';

/**
 * ViralPlayer Component
 * 
 * Production-ready viral caption player for Instagram Reels/TikTok-style content.
 * Implements letter-by-letter kinetic captions with neon colors and pop animations.
 * 
 * Props:
 *   - videoUrl: string (URL to the video file)
 *   - captions: array of { word, start, end } objects (word-level timestamps)
 *   - onCaptionChange: callback when active caption changes
 *   - autoPlay: boolean (default: false)
 *   - muted: boolean (default: false)
 */

const NEON_COLORS = ['#FF0055', '#00FFCC', '#9900FF', '#FFCC00', '#00FF66'];

const ViralPlayer = ({
  videoUrl,
  captions = [],
  onCaptionChange = null,
  autoPlay = false,
  muted = false
}) => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCaption, setActiveCaption] = useState(null);
  const [activeCaptionIndex, setActiveCaptionIndex] = useState(-1);

  /**
   * Calculate which caption should be active based on currentTime
   * Uses memoization to avoid unnecessary recalculations
   */
  const currentActiveCaption = useMemo(() => {
    if (!captions || captions.length === 0) return null;

    const active = captions.find(
      (cap) => currentTime >= cap.start && currentTime < cap.end
    );

    return active || null;
  }, [currentTime, captions]);

  /**
   * Update active caption state and trigger callback
   */
  useEffect(() => {
    if (currentActiveCaption !== activeCaption) {
      setActiveCaption(currentActiveCaption);

      if (currentActiveCaption) {
        const index = captions.findIndex((cap) => cap.word === currentActiveCaption.word);
        setActiveCaptionIndex(index);
      } else {
        setActiveCaptionIndex(-1);
      }

      if (onCaptionChange) {
        onCaptionChange(currentActiveCaption);
      }
    }
  }, [currentActiveCaption, activeCaption, captions, onCaptionChange]);

  /**
   * Handle video time update from native video element
   */
  const handleTimeUpdate = useCallback((e) => {
    const time = e.target.currentTime;
    setCurrentTime(time);
  }, []);

  /**
   * Handle play/pause state
   */
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  /**
   * Handle video ended event
   */
  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveCaption(null);
    setActiveCaptionIndex(-1);
  }, []);

  /**
   * Format time for display (MM:SS)
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  /**
   * Get random neon color from palette
   */
  const getRandomNeonColor = useCallback(() => {
    return NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
  }, []);

  return (
    <div className="viral-player-wrapper">
      {/* Video Container */}
      <div className="viral-video-container">
        <video
          ref={videoRef}
          className="viral-video-player"
          src={videoUrl}
          autoPlay={autoPlay}
          muted={muted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onClick={handlePlayPause}
        />

        {/* Play/Pause Overlay Button */}
        {!isPlaying && currentTime === 0 && (
          <div className="viral-play-button" onClick={handlePlayPause}>
            <div className="viral-play-icon">▶</div>
          </div>
        )}

        {/* Caption Overlay Layer */}
        {activeCaption && (
          <div className="viral-caption-container">
            <div className="viral-caption-word">
              {activeCaption.word.split('').map((letter, idx) => {
                const randomColor = getRandomNeonColor();
                const delay = idx * 0.05; // Staggered delay per letter

                return (
                  <span
                    key={`${activeCaption.word}-${idx}-${currentTime}`}
                    className="viral-caption-letter"
                    style={{
                      color: randomColor,
                      animation: `popBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards`,
                      '--letter-color': randomColor
                    }}
                  >
                    {letter}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Current Time Display */}
        <div className="viral-time-display">
          {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || 0)}
        </div>
      </div>

      {/* Control Bar */}
      <div className="viral-control-bar">
        <button
          className="viral-play-pause-btn"
          onClick={handlePlayPause}
          aria-label="Play/Pause"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Progress Bar */}
        <div className="viral-progress-container">
          <input
            type="range"
            className="viral-progress-bar"
            min="0"
            max={videoRef.current?.duration || 0}
            value={currentTime}
            onChange={(e) => {
              const newTime = parseFloat(e.target.value);
              setCurrentTime(newTime);
              if (videoRef.current) {
                videoRef.current.currentTime = newTime;
              }
            }}
          />
        </div>

        <div className="viral-time-info">
          {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || 0)}
        </div>

        <button
          className="viral-fullscreen-btn"
          onClick={() => {
            if (videoRef.current?.requestFullscreen) {
              videoRef.current.requestFullscreen();
            }
          }}
          aria-label="Fullscreen"
        >
          ⛶
        </button>
      </div>

      {/* Caption Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="viral-debug-info">
          <p>Current Time: {currentTime.toFixed(3)}s</p>
          <p>Active Caption: {activeCaption?.word || 'None'}</p>
          <p>Caption Index: {activeCaptionIndex}</p>
          <p>Total Captions: {captions.length}</p>
        </div>
      )}
    </div>
  );
};

export default ViralPlayer;
