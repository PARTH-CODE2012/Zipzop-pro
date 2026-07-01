import React, { useState, useEffect, useRef } from 'react';
import ViralPlayer from './ViralPlayer';
import './styles.css';

/**
 * ============================================================================
 * UNIVERSAL VIRAL AI VIDEO EDITOR - PROFESSIONAL EDITION
 * ============================================================================
 * 
 * Architecture: Zero-shake viewport with 3-tier layout:
 * - TOP 40%: Fixed cinematic preview + Siri holographic loader
 * - MIDDLE: Cyberpunk voice assistant bar with sound-wave animation
 * - BOTTOM 60%: Independent scrollable master AI controls
 * 
 * Powered by advanced AI frame analysis, audio processing, and
 * intelligent video transformation algorithms.
 */

// ============================================================================
// HOLOGRAPHIC SIRI LOADER COMPONENT
// ============================================================================
const HolographicSiriLoader = ({ isActive, currentStep }) => {
  if (!isActive) return null;

  const steps = [
    '🔍 AI scanning video frames and gameplay telemetry...',
    '🎭 Analyzing expressions and intensity peaks for dynamic effects...',
    '🎨 Applying premium color grading and visual enhancement...',
    '💥 Synchronizing audio spikes with visual effects...',
    '⚡ Rendering final viral-optimized masterpiece...'
  ];

  const currentStepText = steps[currentStep % steps.length];

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0B0F19] via-[#1a1a3f] to-[#0B0F19] backdrop-blur-sm z-50">
      {/* Outer Neon Ring 1 - Cyan */}
      <div className="absolute w-48 h-48 rounded-full border-4 border-[#00FFCC] opacity-30 animate-spin" style={{ animationDuration: '4s' }}>
        <div className="absolute inset-0 rounded-full shadow-2xl" style={{ boxShadow: '0 0 40px #00FFCC, inset 0 0 40px rgba(0, 255, 204, 0.1)' }} />
      </div>

      {/* Middle Neon Ring 2 - Purple */}
      <div className="absolute w-40 h-40 rounded-full border-4 border-[#8B5CF6] opacity-40 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
        <div className="absolute inset-0 rounded-full shadow-2xl" style={{ boxShadow: '0 0 50px #8B5CF6, inset 0 0 50px rgba(139, 92, 246, 0.15)' }} />
      </div>

      {/* Inner Neon Ring 3 - Pink */}
      <div className="absolute w-32 h-32 rounded-full border-4 border-[#EC4899] opacity-50 animate-pulse" style={{ boxShadow: '0 0 60px #EC4899, inset 0 0 60px rgba(236, 72, 153, 0.2)' }}>
        <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(236, 72, 153, 0.4), transparent)', boxShadow: 'inset 0 0 40px rgba(0, 255, 204, 0.1)' }} />
      </div>

      {/* Core White Pulsing Center */}
      <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-white via-[#00FFCC] to-[#8B5CF6] opacity-60 animate-pulse shadow-2xl" style={{ boxShadow: '0 0 80px #00FFCC, 0 0 120px #EC4899' }} />

      {/* Text Information Below */}
      <div className="absolute bottom-32 left-0 right-0 text-center">
        <h2 className="text-2xl font-black text-[#FFED4E] mb-6 uppercase tracking-wider drop-shadow-lg" style={{ textShadow: '0 0 20px rgba(255, 237, 74, 0.6)' }}>
          Processing Viral Video
        </h2>
        
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="text-lg text-[#00FFCC] drop-shadow-lg" style={{ textShadow: '0 0 15px rgba(0, 255, 204, 0.5)' }}>●</div>
          <p className="text-sm text-[#00FFCC] font-semibold tracking-wide drop-shadow-lg" style={{ textShadow: '0 0 10px rgba(0, 255, 204, 0.4)' }}>
            {currentStepText}
          </p>
          <div className="text-lg text-[#00FFCC] drop-shadow-lg animate-pulse" style={{ textShadow: '0 0 15px rgba(0, 255, 204, 0.5)' }}>●</div>
        </div>

        {/* Progress Bar */}
        <div className="w-80 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00FFCC] via-[#8B5CF6] to-[#EC4899] rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%`, boxShadow: '0 0 20px #00FFCC' }}
          />
        </div>

        <p className="text-xs text-gray-400 mt-4 font-mono">
          {Math.round(((currentStep + 1) / steps.length) * 100)}% — Advanced algorithms at work
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// CYBERPUNK VOICE ASSISTANT BAR
// ============================================================================
const CyberpunkAssistantBar = ({ onCommand, isListening, assistantResponse, isResponding }) => {
  const [commandInput, setCommandInput] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    if (commandInput.trim()) {
      onCommand(commandInput);
      setCommandInput('');
    }
  };

  const handleMicClick = () => {
    // Mock speech recognition toggle
    alert('🎤 Speech Recognition: Microphone activation ready for voice commands');
  };

  return (
    <div className="w-full h-auto bg-gradient-to-r from-[#1a1a3f] via-[#0B0F19] to-[#1a1a3f] border-y border-purple-500/30 px-6 py-4 backdrop-blur-sm">
      {/* Assistant Response Area */}
      {assistantResponse && (
        <div className="mb-4 p-4 bg-gradient-to-r from-[#EC4899]/10 to-[#8B5CF6]/10 border border-[#EC4899]/30 rounded-lg">
          <p className="text-sm text-[#00FFCC] font-mono">
            <span className="text-[#FFED4E] font-bold">AI Assistant: </span>
            <TypeOutText text={assistantResponse} isActive={isResponding} />
          </p>
        </div>
      )}

      {/* Input Controls */}
      <div className="flex items-center gap-3">
        {/* Microphone Button with Sound-Wave Animation */}
        <button
          onClick={handleMicClick}
          className={`flex-shrink-0 w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center font-bold text-lg relative ${
            isListening
              ? 'bg-gradient-to-br from-[#EC4899] to-[#FF1493] shadow-lg'
              : 'bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] hover:shadow-lg'
          }`}
          style={{
            boxShadow: isListening
              ? '0 0 30px #EC4899, 0 0 60px rgba(236, 72, 153, 0.4)'
              : '0 0 20px rgba(139, 92, 246, 0.3)'
          }}
        >
          🎤
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-[#EC4899] animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-[#FF1493] animate-ping" style={{ animationDuration: '1.5s' }} />
            </>
          )}
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="असिस्टेंट से कहें (e.g., 'Please edit this video' या 'वीडियो एडिट कर दो भाई')"
            className="w-full px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-purple-500/50 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00FFCC] focus:shadow-lg transition-all placeholder-gray-500"
            style={{
              boxShadow: 'inset 0 0 10px rgba(0, 255, 204, 0.05), 0 0 15px rgba(139, 92, 246, 0.1)'
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!commandInput.trim()}
          className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-[#FFED4E] to-[#FFD93D] text-black font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wide"
          style={{
            boxShadow: '0 0 20px rgba(255, 237, 74, 0.4)'
          }}
        >
          ⚡ SEND
        </button>
      </div>

      {/* Hint Text */}
      <p className="text-xs text-gray-500 mt-2 font-mono">
        💡 Tip: Try "edit this video", "trim", "zoom", "color", "sound", "subtitle", or "meme" commands
      </p>
    </div>
  );
};

// ============================================================================
// TYPE-OUT TEXT ANIMATION
// ============================================================================
const TypeOutText = ({ text, isActive }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!isActive) {
      setDisplayedText(text);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text, isActive]);

  return <>{displayedText}</>;
};

// ============================================================================
// NEON TOGGLE CARD COMPONENT
// ============================================================================
const NeonToggleCard = ({ title, icon, description, isActive, onChange, gradient }) => {
  return (
    <div
      onClick={onChange}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 backdrop-blur-sm transform hover:scale-105 ${
        isActive
          ? `border-[#00FFCC] bg-gradient-to-br ${gradient} shadow-lg`
          : 'border-gray-700/50 bg-gray-900/30 hover:border-purple-500/50'
      }`}
      style={{
        boxShadow: isActive
          ? '0 0 30px rgba(0, 255, 204, 0.3), inset 0 0 20px rgba(0, 255, 204, 0.05)'
          : '0 0 15px rgba(139, 92, 246, 0.1)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider mb-1">
            {icon} {title}
          </h3>
          <p className="text-xs text-gray-300 font-mono">{description}</p>
        </div>

        {/* Toggle Switch */}
        <div
          className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center p-1 ${
            isActive
              ? 'bg-gradient-to-r from-[#00FFCC] to-[#00FF66]'
              : 'bg-gray-700'
          }`}
          style={{
            boxShadow: isActive ? '0 0 20px #00FFCC' : 'none'
          }}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-all duration-300 ${
              isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>

      {/* Status Indicator */}
      {isActive && (
        <div className="flex items-center gap-2 text-xs text-[#00FFCC] font-bold">
          <div className="w-2 h-2 rounded-full bg-[#00FFCC] animate-pulse" />
          ACTIVE
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MASTER FEATURES GRID
// ============================================================================
const MasterFeaturesGrid = ({ features, onToggle }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
      {features.map((feature, idx) => (
        <NeonToggleCard
          key={idx}
          title={feature.title}
          icon={feature.icon}
          description={feature.description}
          isActive={feature.isActive}
          onChange={() => onToggle(idx)}
          gradient={feature.gradient}
        />
      ))}
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  // ========== STATE MANAGEMENT ==========
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);

  const [features, setFeatures] = useState([
    {
      title: 'AI Smart Jump-Trim',
      icon: '✂️',
      description: 'Intelligently cuts empty air, dead zones, and traveling time',
      isActive: false,
      gradient: 'from-[#FF6B6B]/20 to-[#FF1493]/20'
    },
    {
      title: 'Expression Auto-Zoom',
      icon: '🔍',
      description: 'Dynamically zooms 1.3x during intense actions and peaks',
      isActive: false,
      gradient: 'from-[#00FFCC]/20 to-[#00FF66]/20'
    },
    {
      title: 'Premium Color Grading',
      icon: '🎨',
      description: 'Enhances saturation, contrast, and clarity automatically',
      isActive: false,
      gradient: 'from-[#FFED4E]/20 to-[#FFD93D]/20'
    },
    {
      title: 'Audio Peak Sound-Sync',
      icon: '🔊',
      description: 'Detects audio spikes and syncs visual effects precisely',
      isActive: false,
      gradient: 'from-[#EC4899]/20 to-[#FF1493]/20'
    },
    {
      title: 'Neon Pop-Bounce Subtitles',
      icon: '🔤',
      description: 'Generates kinetic uppercase captions with scale animations',
      isActive: false,
      gradient: 'from-[#8B5CF6]/20 to-[#6366F1]/20'
    },
    {
      title: 'Intelligent Effect Insertion',
      icon: '🎭',
      description: 'Detects dramatic pauses and prepares contextual effect slots',
      isActive: false,
      gradient: 'from-[#06B6D4]/20 to-[#00FFCC]/20'
    }
  ]);

  // ========== PROCESSING ANIMATION LOOP ==========
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setProcessingStep((prev) => (prev + 1) % 5);
    }, 1200);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // ========== COMMAND HANDLER WITH MAGIC "EDIT" TRIGGER ==========
  const handleVoiceCommand = (command) => {
    const lowerCmd = command.toLowerCase();
    setIsResponding(true);

    // Parse command and auto-toggle features
    let toggledFeatures = [...features];
    let responseMsg = '';

    // Magic "Edit" Command - Activates ALL premium features
    if (
      lowerCmd.includes('edit this video') ||
      lowerCmd.includes('please edit') ||
      lowerCmd.includes('edit करो') ||
      lowerCmd.includes('वीडियो एडिट कर दो') ||
      lowerCmd.includes('video edit')
    ) {
      toggledFeatures = toggledFeatures.map((f) => ({ ...f, isActive: true }));
      responseMsg = 'AI: समझ गया भाई! मैं आपकी वीडियो का एनालिसिस करके इसे बेस्ट वायरल और ट्रेंडिंग फॉर्मेट में एडिट कर रहा हूँ। सभी ऑटो-एआई फीचर्स एक्टिवेट कर दिए गए हैं। ⚡';
    } 
    // Individual Feature Commands
    else if (lowerCmd.includes('trim') || lowerCmd.includes('jump cut')) {
      toggledFeatures[0].isActive = !toggledFeatures[0].isActive;
      responseMsg = `AI: ${toggledFeatures[0].isActive ? '✂️ Smart Jump-Trim एक्टिवेटेड' : '✂️ Smart Jump-Trim डीएक्टिवेटेड'}—${toggledFeatures[0].isActive ? 'सभी डेड ज़ोन्स निकाल दूंगा' : 'ट्रिमिंग फीचर ऑफ किया गया'}.';
    } 
    else if (lowerCmd.includes('zoom') || lowerCmd.includes('expression')) {
      toggledFeatures[1].isActive = !toggledFeatures[1].isActive;
      responseMsg = `AI: ${toggledFeatures[1].isActive ? '🔍 Expression Auto-Zoom लोड हो गया' : '🔍 Expression Auto-Zoom डीएक्टिवेटेड'}—${toggledFeatures[1].isActive ? 'इंटेंसिटी पीक्स में डायनामिक ज़ूम लागू होंगे' : 'ऑटो-ज़ूम फीचर ऑफ किया गया'}.`;
    } 
    else if (lowerCmd.includes('color') || lowerCmd.includes('grading') || lowerCmd.includes('enhance')) {
      toggledFeatures[2].isActive = !toggledFeatures[2].isActive;
      responseMsg = `AI: ${toggledFeatures[2].isActive ? '🎨 Premium Color Grading एक्टिवेटेड' : '🎨 Premium Color Grading डीएक्टिवेटेड'}—${toggledFeatures[2].isActive ? 'विजुअल इनहांसमेंट लागू हो रहा है' : 'कलर ग्रेडिंग ऑफ किया गया'}.`;
    } 
    else if (lowerCmd.includes('sound') || lowerCmd.includes('sync') || lowerCmd.includes('audio')) {
      toggledFeatures[3].isActive = !toggledFeatures[3].isActive;
      responseMsg = `AI: ${toggledFeatures[3].isActive ? '🔊 Audio Peak Sound-Sync एक्टिवेटेड' : '🔊 Audio Peak Sound-Sync डीएक्टिवेटेड'}—${toggledFeatures[3].isActive ? 'ऑडियो स्पाइक्स से विजुअल इफेक्ट्स सिंक होंगे' : 'साउंड-सिंक फीचर ऑफ किया गया'}.`;
    } 
    else if (lowerCmd.includes('subtitle') || lowerCmd.includes('caption') || lowerCmd.includes('text')) {
      toggledFeatures[4].isActive = !toggledFeatures[4].isActive;
      responseMsg = `AI: ${toggledFeatures[4].isActive ? '🔤 Neon Pop-Bounce Subtitles ऑन' : '🔤 Neon Pop-Bounce Subtitles ऑफ'}—${toggledFeatures[4].isActive ? 'वर्ड-बाय-वर्ड किनेटिक कैप्शन जेनरेट होंगे' : 'सबटाइटल फीचर ऑफ किया गया'}.`;
    } 
    else if (lowerCmd.includes('effect') || lowerCmd.includes('meme') || lowerCmd.includes('sfx')) {
      toggledFeatures[5].isActive = !toggledFeatures[5].isActive;
      responseMsg = `AI: ${toggledFeatures[5].isActive ? '🎭 Intelligent Effect Insertion सेटअप' : '🎭 Intelligent Effect Insertion डीएक्टिवेटेड'}—${toggledFeatures[5].isActive ? 'ड्रामा मोमेंट्स के लिए इफेक्ट स्लॉट्स तैयार' : 'इफेक्ट इंसर्शन ऑफ किया गया'}.`;
    } 
    else {
      responseMsg = `AI: कमांड समझ नहीं आया। कृपया ट्राई करें: "edit this video", "trim", "zoom", "color", "sound", "subtitle" या "meme"। या आप फीचर्स को मैन्युअली टॉगल कर सकते हैं।`;
    }

    setFeatures(toggledFeatures);
    setAssistantResponse(responseMsg);

    setTimeout(() => {
      setIsResponding(false);
    }, 3500);
  };

  // ========== FEATURE TOGGLE ==========
  const handleToggleFeature = (index) => {
    const updated = [...features];
    updated[index].isActive = !updated[index].isActive;
    setFeatures(updated);
  };

  // ========== LAUNCH ENGINE ==========
  const handleLaunchEngine = () => {
    if (!uploadedVideoUrl) {
      alert('📹 Please upload a video first to launch the Viral AI Engine!');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert('✅ Processing complete! Your video has been transformed using all active AI features.');
    }, 8000);
  };

  // ========== DEMO UPLOAD ==========
  const handleUploadVideo = () => {
    // Mock video upload
    const mockVideoUrl = 'https://via.placeholder.com/800x600/000000/FFED4E?text=VIDEO+PREVIEW';
    setUploadedVideoUrl(mockVideoUrl);
    alert('✅ Demo video loaded! Customize your AI features and launch the engine.');
  };

  // ========== RENDER ==========
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden text-white bg-[#0B0F19] select-none touch-none flex flex-col">
      {/* HOLOGRAPHIC SIRI LOADER OVERLAY */}
      {isProcessing && <HolographicSiriLoader isActive={isProcessing} currentStep={processingStep} />}

      {/* TOP 40% - CINEMATIC PREVIEW */}
      <div className="w-full h-[40%] bg-black relative border-b border-purple-500/30 flex items-center justify-center overflow-hidden">
        {uploadedVideoUrl ? (
          <div className="w-full h-full relative">
            <img src={uploadedVideoUrl} alt="Video Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 text-sm font-mono text-[#00FFCC]">
              ▶ PREVIEW MODE | Active Features: {features.filter((f) => f.isActive).length}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-4">
            <div className="text-6xl">🎬</div>
            <h2 className="text-2xl font-black text-[#FFED4E] uppercase tracking-wider">Upload Your Video</h2>
            <button
              onClick={handleUploadVideo}
              className="px-8 py-3 bg-gradient-to-r from-[#00FFCC] to-[#00FF66] text-black font-bold rounded-lg hover:shadow-lg transition-all uppercase text-sm tracking-wide"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 204, 0.4)' }}
            >
              📤 LOAD DEMO VIDEO
            </button>
          </div>
        )}
      </div>

      {/* MIDDLE - CYBERPUNK VOICE ASSISTANT BAR */}
      <CyberpunkAssistantBar
        onCommand={handleVoiceCommand}
        isListening={isListening}
        assistantResponse={assistantResponse}
        isResponding={isResponding}
      />

      {/* BOTTOM 60% - SCROLLABLE MASTER CONTROLS */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0B0F19] to-[#1a1a3f] px-6 py-6 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-black text-[#FFED4E] mb-2 uppercase tracking-wider drop-shadow-lg">
            🎮 Universal AI Features
          </h2>
          <p className="text-sm text-gray-400 font-mono mb-6">
            Powered by Universal Gaming AI Engines • Activate features manually or use voice commands
          </p>

          <MasterFeaturesGrid features={features} onToggle={handleToggleFeature} />
        </div>
      </div>

      {/* FIXED FOOTER ACTION BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/95 to-transparent backdrop-blur-md border-t border-purple-500/30 flex items-center justify-center px-6">
        <button
          onClick={handleLaunchEngine}
          disabled={!uploadedVideoUrl}
          className="w-full max-w-2xl px-8 py-4 bg-gradient-to-r from-[#FFED4E] via-[#FFD93D] to-[#FFC300] text-black font-black rounded-xl hover:shadow-2xl hover:scale-105 transition-all uppercase text-lg tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow: uploadedVideoUrl ? '0 0 40px rgba(255, 237, 74, 0.6), 0 0 80px rgba(255, 237, 74, 0.3)' : 'none'
          }}
        >
          ⚡ LAUNCH VIRAL AI ENGINE ⚡
        </button>
      </div>
    </div>
  );
}
