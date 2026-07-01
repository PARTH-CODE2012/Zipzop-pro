/**
 * ============================================================================
 * UNIVERSAL VIRAL AI VIDEO EDITOR - BACKEND ENGINE (ES6 MODULES)
 * ============================================================================
 * 
 * Node.js/Express server that processes video files with AI features.
 * Handles:
 * - Video upload with multer
 * - Mock AI processing pipeline (5-8 seconds)
 * - Real-time status streaming
 * - Multiple feature processing
 * 
 * Server runs on PORT 5000
 * CORS enabled for React frontend on localhost:3000
 * 
 * ES6 MODULES: All imports/exports use modern syntax
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// ES6 equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// ============================================================================
// MULTER CONFIGURATION - VIDEO UPLOAD
// ============================================================================

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer file filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB max
  }
});

// ============================================================================
// AI PROCESSING PIPELINE - MOCK ENGINE (ES6)
// ============================================================================

/**
 * Mock AI processing function that simulates real video editing
 * Steps match frontend loader display:
 * 1. Scanning telemetry
 * 2. Analyzing expressions
 * 3. Color grading
 * 4. Audio synchronization
 * 5. Final rendering
 * 
 * FIXED: String matching now correctly identifies sanitized feature flags
 * Expected format from frontend: ['aismartjumptrim', 'expressionautozoom', ...]
 */
async function processVideoWithAI(videoPath, features) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const processingSteps = [
      {
        step: 1,
        duration: 1000,
        message: '🔍 AI scanning video frames and gameplay telemetry...',
        feature: 'frame_analysis'
      },
      {
        step: 2,
        duration: 1500,
        message: '🎭 Analyzing expressions and intensity peaks for dynamic effects...',
        feature: 'expression_detection'
      },
      {
        step: 3,
        duration: 1200,
        message: '🎨 Applying premium color grading and visual enhancement...',
        feature: 'color_grading'
      },
      {
        step: 4,
        duration: 1300,
        message: '💥 Synchronizing audio spikes with visual effects...',
        feature: 'audio_sync'
      },
      {
        step: 5,
        duration: 1000,
        message: '⚡ Rendering final viral-optimized masterpiece...',
        feature: 'final_render'
      }
    ];

    let currentStep = 0;

    // ========== FIXED: CORRECT STRING MATCHING FOR SANITIZED FEATURE TITLES ==========
    // Frontend sanitizes titles by removing non-alphanumeric chars and converting to lowercase
    // Expected exact matches:
    const processedFeatures = {
      smartTrim: features.includes('aismartjumptrim'),
      autoZoom: features.includes('expressionautozoom'),
      colorGrading: features.includes('premiumcolorgrading'),
      soundSync: features.includes('audiopeaksoundsync'),
      subtitles: features.includes('neonpopbouncesubtitles'),
      effectInsertion: features.includes('intelligenteffectinsertion')
    };

    // Simulate processing with promise-based delays
    const processStep = () => {
      if (currentStep < processingSteps.length) {
        const step = processingSteps[currentStep];
        
        setTimeout(() => {
          const activeFeatures = Object.entries(processedFeatures)
            .filter(([, active]) => active)
            .map(([name]) => name);

          console.log(`[Step ${step.step}] ${step.message}`);
          console.log(`[Features Active] ${activeFeatures.length > 0 ? activeFeatures.join(', ') : 'None'}`);
          
          currentStep++;
          processStep();
        }, step.duration);
      } else {
        // All steps complete - generate output
        const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Processing complete in ${processingTime}s`);

        // Return mock processed video (in production, this would be real file)
        const processedVideoUrl = `https://via.placeholder.com/1280x720/000000/00FF00?text=PROCESSED+VIDEO`;
        
        resolve({
          success: true,
          processedVideoUrl: processedVideoUrl,
          processingTime: parseFloat(processingTime),
          featuresApplied: processedFeatures,
          originalFile: videoPath,
          // Return subtitle metadata if enabled
          subtitlesMetadata: processedFeatures.subtitles ? {
            text: 'VIRAL GAMING VIDEO EDITED ⚡',
            enabled: true,
            position: { x: 50, y: 80 },
            fontSize: 48,
            color: '#00FFCC'
          } : null
        });
      }
    };

    processStep();
  });
}

// ============================================================================
// API ROUTES (ES6)
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Universal Viral AI Video Editor',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/edit-video
 * Main video processing endpoint
 * 
 * Expects:
 * - video: File (multipart form data)
 * - features: JSON array of active feature strings (sanitized lowercase)
 * 
 * Returns:
 * - success: boolean
 * - processedVideoUrl: string (URL to processed video)
 * - processingTime: number (seconds)
 * - featuresApplied: object (which features were used)
 * - subtitlesMetadata: object (subtitle position, text, styling if enabled)
 */
app.post('/api/edit-video', upload.single('video'), async (req, res) => {
  try {
    // Validate upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    // Parse features - expects array of sanitized lowercase strings
    let features = [];
    if (req.body.features) {
      try {
        features = JSON.parse(req.body.features);
        // Ensure all features are lowercase strings
        features = features.map(f => String(f).toLowerCase().trim());
      } catch (e) {
        features = [];
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎬 VIDEO PROCESSING REQUEST RECEIVED');
    console.log('='.repeat(70));
    console.log(`📁 File: ${req.file.filename}`);
    console.log(`📏 Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🎯 Active Features (Raw): ${JSON.stringify(features)}`);
    console.log('='.repeat(70) + '\n');

    // Process video with AI pipeline
    const result = await processVideoWithAI(req.file.path, features);

    // Return success response
    res.json({
      success: true,
      message: 'Video processed successfully',
      processedVideoUrl: result.processedVideoUrl,
      processingTime: result.processingTime,
      featuresApplied: result.featuresApplied,
      subtitlesMetadata: result.subtitlesMetadata,
      originalFile: req.file.filename,
      uploadId: uuidv4()
    });

  } catch (error) {
    console.error('❌ Error processing video:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing video',
      error: error.message
    });
  }
});

/**
 * POST /api/get-processing-status
 * Get real-time processing status (mock implementation)
 * In production, this could use WebSocket or Server-Sent Events
 */
app.post('/api/get-processing-status', (req, res) => {
  res.json({
    status: 'processing',
    currentStep: 2,
    totalSteps: 5,
    message: '🎭 Analyzing expressions and intensity peaks for dynamic effects...',
    progress: 40
  });
});

/**
 * GET /api/features
 * Return available AI features
 */
app.get('/api/features', (req, res) => {
  res.json({
    features: [
      {
        id: 'smartTrim',
        name: 'AI Smart Jump-Trim',
        sanitized: 'aismartjumptrim',
        description: 'Intelligently cuts empty air, dead zones, and traveling time'
      },
      {
        id: 'autoZoom',
        name: 'Expression Auto-Zoom',
        sanitized: 'expressionautozoom',
        description: 'Dynamically zooms 1.3x during intense actions and peaks'
      },
      {
        id: 'colorGrading',
        name: 'Premium Color Grading',
        sanitized: 'premiumcolorgrading',
        description: 'Enhances saturation, contrast, and clarity automatically'
      },
      {
        id: 'soundSync',
        name: 'Audio Peak Sound-Sync',
        sanitized: 'audiopeaksoundsync',
        description: 'Detects audio spikes and syncs visual effects precisely'
      },
      {
        id: 'subtitles',
        name: 'Neon Pop-Bounce Subtitles',
        sanitized: 'neonpopbouncesubtitles',
        description: 'Generates kinetic uppercase captions with scale animations'
      },
      {
        id: 'effectInsertion',
        name: 'Intelligent Effect Insertion',
        sanitized: 'intelligenteffectinsertion',
        description: 'Detects dramatic pauses and prepares contextual effect slots'
      }
    ]
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 500 MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server error',
    error: err.message
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    endpoint: req.originalUrl
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log('\n' + '🚀 '.repeat(15));
  console.log('\n   ⚡ UNIVERSAL VIRAL AI VIDEO EDITOR - BACKEND ENGINE ⚡\n');
  console.log('   📦 ES6 MODULES | 🔧 Node.js Native Import Support\n');
  console.log('🚀 '.repeat(15) + '\n');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🎬 Video uploads directory: ${uploadsDir}`);
  console.log(`🌐 CORS enabled for: http://localhost:3000\n`);
  console.log('Available Endpoints:');
  console.log('  GET  /api/health                - Health check');
  console.log('  POST /api/edit-video            - Process video with AI features');
  console.log('  GET  /api/features              - Get available AI features\n');
});

// ES6 Export (optional - mainly for testing)
export default app;
