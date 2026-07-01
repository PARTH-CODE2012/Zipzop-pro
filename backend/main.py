# backend/main.py
"""
AI ZipZop Studio - Premium Viral Video Editing Pipeline
Complete backend for automated gaming video transformation
"""

import os
import json
import tempfile
import subprocess
import logging
from typing import Optional, List, Dict
from datetime import datetime
from pathlib import Path
import threading

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import whisper
import numpy as np
from scipy import signal
from scipy.io import wavfile
import librosa
import soundfile as sf
from moviepy.editor import VideoFileClip, concatenate_videoclips, CompositeVideoClip, TextClip
import google.generativeai as genai

# ========== CONFIGURATION ==========
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
TEMP_DIR = Path("temp")

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

# Initialize APIs
WHISPER_MODEL = "base"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ========== GLOBAL JOB STORE ==========
# Use thread-safe dictionary for job state management
jobs_store = {}
jobs_lock = threading.Lock()


def set_job_state(job_id: str, state: Dict):
    """Thread-safe job state setter"""
    with jobs_lock:
        jobs_store[job_id] = state


def get_job_state(job_id: str) -> Optional[Dict]:
    """Thread-safe job state getter"""
    with jobs_lock:
        return jobs_store.get(job_id)


# ========== MODELS ==========

class JobRequest(BaseModel):
    videoUrl: str
    filename: str
    mode: str = "viral_retention"


class CreateKineticCaptionRequest(BaseModel):
    videoUrl: str
    filename: str
    action: str = "trim_silence"


class Caption(BaseModel):
    word: str
    start: float
    duration: float
    end: float


class JobResponse(BaseModel):
    jobId: str
    status: str
    videoUrl: Optional[str] = None
    captions: Optional[List[Caption]] = None
    duration: Optional[float] = None
    error: Optional[str] = None
    timestamp: str


# ========== WHISPER TRANSCRIPTION ==========

def transcribe_audio(video_path: str) -> List[Dict]:
    """
    Transcribe video audio using Whisper with word-level timestamps
    Returns list of {word, start, end}
    """
    logger.info(f"🎙️ Transcribing: {video_path}")
    
    try:
        # Load Whisper model
        model = whisper.load_model(WHISPER_MODEL)
        
        # Transcribe with word timestamps
        result = model.transcribe(video_path, language="en", verbose=False)
        
        words_data = []
        
        # Extract word-level timestamps
        if "segments" in result:
            for segment in result["segments"]:
                if "words" in segment:
                    for word_info in segment["words"]:
                        words_data.append({
                            "word": word_info["word"].strip(),
                            "start": word_info["start"],
                            "end": word_info["end"],
                            "duration": word_info["end"] - word_info["start"]
                        })
                else:
                    # Fallback: estimate word timings
                    text = segment["text"].strip()
                    words = text.split()
                    segment_start = segment["start"]
                    segment_end = segment["end"]
                    segment_duration = segment_end - segment_start
                    
                    if words:
                        word_duration = segment_duration / len(words)
                        for idx, word in enumerate(words):
                            word_start = segment_start + (idx * word_duration)
                            word_end = word_start + word_duration
                            words_data.append({
                                "word": word,
                                "start": word_start,
                                "end": word_end,
                                "duration": word_duration
                            })
        
        logger.info(f"✅ Transcribed {len(words_data)} words")
        return words_data
    
    except Exception as e:
        logger.error(f"❌ Transcription error: {str(e)}")
        raise


# ========== INTELLIGENT WORD GROUPING ==========

def group_captions(words_data: List[Dict], max_gap: float = 0.4, max_words: int = 4) -> List[Dict]:
    """
    Group words into phrases (2-4 words max)
    Split on gaps > max_gap seconds
    """
    logger.info(f"📋 Grouping {len(words_data)} words into phrases...")
    
    if not words_data:
        return []
    
    phrases = []
    current_phrase = {
        "phrase": words_data[0]["word"],
        "words": [words_data[0]["word"]],
        "start": words_data[0]["start"],
        "end": words_data[0]["end"],
        "word_count": 1
    }
    
    for i in range(1, len(words_data)):
        current_word = words_data[i]["word"]
        gap = words_data[i]["start"] - current_phrase["end"]
        
        # Continue phrase if gap is small and word count < max
        if gap <= max_gap and current_phrase["word_count"] < max_words:
            current_phrase["phrase"] += f" {current_word}"
            current_phrase["words"].append(current_word)
            current_phrase["end"] = words_data[i]["end"]
            current_phrase["word_count"] += 1
        else:
            # Start new phrase
            phrases.append(current_phrase)
            current_phrase = {
                "phrase": current_word,
                "words": [current_word],
                "start": words_data[i]["start"],
                "end": words_data[i]["end"],
                "word_count": 1
            }
    
    # Add last phrase
    phrases.append(current_phrase)
    
    logger.info(f"✅ Created {len(phrases)} phrases")
    return phrases


# ========== SILENCE DETECTION & REMOVAL ==========

def detect_silence(video_path: str, silence_threshold: float = -30, min_duration: float = 0.3) -> List[tuple]:
    """
    Detect silent zones in audio track using librosa
    Returns list of (start_time, end_time) tuples for silent segments
    """
    logger.info(f"🔇 Detecting silence in {video_path}...")
    
    try:
        # Extract audio
        video = VideoFileClip(video_path)
        audio = video.audio
        
        if audio is None:
            logger.warning("No audio track found")
            return []
        
        # Get audio data
        sr = int(audio.fps)
        audio_data = audio.to_soundarray()
        
        # Convert to mono if stereo
        if len(audio_data.shape) > 1:
            audio_data = np.mean(audio_data, axis=1)
        
        # Normalize
        audio_data = audio_data / (np.max(np.abs(audio_data)) + 1e-10)
        
        # Compute RMS energy
        frame_length = 2048
        hop_length = 512
        rms = librosa.feature.rms(y=audio_data, frame_length=frame_length, hop_length=hop_length)[0]
        
        # Convert to dB
        S_db = librosa.power_to_db(rms ** 2, ref=np.max)
        
        # Find silent frames
        silent_frames = S_db < silence_threshold
        
        # Group consecutive silent frames
        min_frames = int(min_duration * sr / hop_length)
        silent_intervals = []
        
        in_silence = False
        silence_start = 0
        
        for i, is_silent in enumerate(silent_frames):
            if is_silent and not in_silence:
                silence_start = i
                in_silence = True
            elif not is_silent and in_silence:
                silence_duration = (i - silence_start) * hop_length / sr
                if silence_duration >= min_duration:
                    start_time = silence_start * hop_length / sr
                    end_time = i * hop_length / sr
                    silent_intervals.append((start_time, end_time))
                in_silence = False
        
        # Close the video to free memory
        video.close()
        
        logger.info(f"✅ Found {len(silent_intervals)} silent zones")
        return silent_intervals
    
    except Exception as e:
        logger.error(f"❌ Silence detection error: {str(e)}")
        return []


def remove_silence_ffmpeg(video_path: str, silent_intervals: List[tuple], output_path: str) -> Dict:
    """
    Remove silent segments and stitch video back together using FFmpeg
    Returns mapping of old timestamps -> new timestamps
    """
    logger.info(f"✂️ Removing {len(silent_intervals)} silent zones...")
    
    try:
        video = VideoFileClip(video_path)
        total_duration = video.duration
        
        # Create keep intervals (inverse of silent intervals)
        keep_intervals = []
        current_time = 0
        
        for silence_start, silence_end in sorted(silent_intervals):
            if current_time < silence_start:
                keep_intervals.append((current_time, silence_start))
            current_time = silence_end
        
        # Add remaining segment
        if current_time < total_duration:
            keep_intervals.append((current_time, total_duration))
        
        # Clip video segments
        clips = []
        for start, end in keep_intervals:
            clip = video.subclip(start, end)
            clips.append(clip)
        
        # Concatenate
        if clips:
            final_video = concatenate_videoclips(clips)
            final_video.write_videofile(output_path, verbose=False, logger=None)
            
            new_duration = final_video.duration
            final_video.close()
            video.close()
            
            logger.info(f"✅ Trimmed video saved to {output_path}")
            
            # Return timing map
            timing_map = {
                "original_duration": total_duration,
                "new_duration": new_duration,
                "removed_duration": total_duration - new_duration,
                "keep_intervals": keep_intervals
            }
            
            return timing_map
        else:
            video.close()
            logger.warning("No video segments to keep")
            return {}
    
    except Exception as e:
        logger.error(f"❌ Silence removal error: {str(e)}")
        raise


def update_timestamps(words_data: List[Dict], timing_map: Dict) -> List[Dict]:
    """
    Update word timestamps based on silence removal
    """
    if not timing_map or not timing_map.get("keep_intervals"):
        return words_data
    
    logger.info("⏱️ Updating timestamps after silence removal...")
    
    updated_words = []
    keep_intervals = timing_map["keep_intervals"]
    
    for word in words_data:
        word_start = word["start"]
        word_end = word["end"]
        
        # Find which keep interval this word falls into
        new_start = None
        offset = 0
        
        for interval_start, interval_end in keep_intervals:
            if word_start >= interval_start and word_start < interval_end:
                offset = sum(interval_end - interval_start for s, e in keep_intervals if e <= interval_start)
                new_start = offset + (word_start - interval_start)
                new_end = offset + (word_end - interval_start)
                break
        
        if new_start is not None:
            updated_words.append({
                **word,
                "start": new_start,
                "end": new_end,
                "duration": new_end - new_start
            })
    
    logger.info(f"✅ Updated {len(updated_words)} word timestamps")
    return updated_words


# ========== VERTICAL CROPPING (9:16) ==========

def crop_to_vertical(video_path: str, output_path: str) -> str:
    """
    Crop/resize video to 9:16 aspect ratio (1080x1920)
    Center the main action/face
    """
    logger.info(f"📱 Cropping to vertical 9:16 format...")
    
    try:
        video = VideoFileClip(video_path)
        
        # Original dimensions
        orig_width = video.w
        orig_height = video.h
        orig_ratio = orig_width / orig_height
        target_ratio = 9 / 16  # 0.5625
        
        if orig_ratio > target_ratio:
            # Video is too wide, crop width
            new_width = int(orig_height * target_ratio)
            x_center = (orig_width - new_width) // 2
            cropped = video.crop(x1=x_center, x2=x_center + new_width)
        else:
            # Video is too tall, crop height
            new_height = int(orig_width / target_ratio)
            y_center = (orig_height - new_height) // 2
            cropped = video.crop(y1=y_center, y2=y_center + new_height)
        
        # Resize to 1080x1920
        resized = cropped.resize((1080, 1920))
        
        resized.write_videofile(output_path, verbose=False, logger=None)
        
        resized.close()
        video.close()
        
        logger.info(f"✅ Vertical video saved to {output_path}")
        return output_path
    
    except Exception as e:
        logger.error(f"❌ Vertical cropping error: {str(e)}")
        raise


# ========== ASS SUBTITLE GENERATION ==========

def generate_ass_subtitles(phrases: List[Dict], output_path: str) -> str:
    """
    Generate .ass (Advanced SubStation Alpha) subtitle file
    with pop-bounce animation and neon styling
    """
    logger.info(f"🎨 Generating ASS subtitles...")
    
    ass_content = """[Script Info]
Title: AI ZipZop Viral Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Viral,Arial Black,72,&H00FFD200,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,2,2,0,0,1920,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    # Add subtitle events
    for idx, phrase in enumerate(phrases):
        start_ms = int(phrase["start"] * 1000)
        end_ms = int(phrase["end"] * 1000)
        
        # Convert milliseconds to ASS timestamp format (h:mm:ss.cs)
        start_time = f"0:{int(start_ms // 60000)}:{int((start_ms % 60000) / 1000)}.{int((start_ms % 1000) / 10)}"
        end_time = f"0:{int(end_ms // 60000)}:{int((end_ms % 60000) / 1000)}.{int((end_ms % 1000) / 10)}"
        
        # Create animation effect (scale up pop-bounce)
        text = f"{{\\pos(540,1800)\\an2\\c&H00FFD200&\\bord3\\shad2\\t(0,100,\\scale1.3)\\t(100,200,\\scale1.0)}}{phrase['phrase'].upper()}"
        
        ass_content += f"Dialogue: 0,{start_time},{end_time},Viral,,0,0,0,,{text}\n"
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(ass_content)
    
    logger.info(f"✅ ASS subtitles saved to {output_path}")
    return output_path


# ========== FFMPEG OVERLAY ==========

def apply_captions_ffmpeg(video_path: str, ass_path: str, output_path: str) -> str:
    """
    Apply ASS subtitles to video using FFmpeg
    """
    logger.info(f"📹 Applying captions with FFmpeg...")
    
    try:
        # Escape path for Windows/Unix compatibility
        subtitle_path = ass_path.replace("\\", "\\\\").replace("'", "'\\''")
        
        cmd = [
            "ffmpeg",
            "-i", video_path,
            "-vf", f"subtitles={subtitle_path}",
            "-c:v", "libx264",
            "-preset", "fast",
            "-c:a", "aac",
            "-y",
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"FFmpeg error: {result.stderr}")
        
        logger.info(f"✅ Captions applied: {output_path}")
        return output_path
    
    except Exception as e:
        logger.error(f"❌ Caption application error: {str(e)}")
        raise


# ========== MAIN PIPELINE (BACKGROUND TASK) ==========
# CRITICAL FIX: This function now updates jobs_store directly

def process_video_pipeline(video_path: str, job_id: str):
    """
    Complete video processing pipeline (runs as background task):
    1. Transcribe audio with Whisper
    2. Group words into phrases
    3. Detect and remove silence
    4. Crop to vertical (9:16)
    5. Generate ASS subtitles
    6. Apply captions with FFmpeg
    
    CRITICAL: Saves result to jobs_store[job_id] when complete
    """
    
    logger.info(f"🎬 Starting pipeline for job {job_id}")
    
    try:
        # Update state: currently processing
        set_job_state(job_id, {"status": "processing", "step": "Initializing..."})
        
        # Step 1: Transcribe
        set_job_state(job_id, {"status": "processing", "step": "Transcribing audio..."})
        words_data = transcribe_audio(video_path)
        
        # Step 2: Group captions
        set_job_state(job_id, {"status": "processing", "step": "Grouping captions..."})
        phrases = group_captions(words_data)
        
        # Step 3: Detect silence
        set_job_state(job_id, {"status": "processing", "step": "Detecting silence..."})
        silent_intervals = detect_silence(video_path)
        
        # Step 4: Remove silence
        set_job_state(job_id, {"status": "processing", "step": "Removing silence..."})
        silence_removed_path = OUTPUT_DIR / f"{job_id}_trimmed.mp4"
        timing_map = remove_silence_ffmpeg(video_path, silent_intervals, str(silence_removed_path))
        
        # Update timestamps
        set_job_state(job_id, {"status": "processing", "step": "Updating timestamps..."})
        updated_words = update_timestamps(words_data, timing_map)
        updated_phrases = group_captions(updated_words)
        
        # Step 5: Crop to vertical
        set_job_state(job_id, {"status": "processing", "step": "Cropping to vertical..."})
        vertical_path = OUTPUT_DIR / f"{job_id}_vertical.mp4"
        crop_to_vertical(str(silence_removed_path), str(vertical_path))
        
        # Step 6: Generate ASS subtitles
        set_job_state(job_id, {"status": "processing", "step": "Generating subtitles..."})
        ass_path = OUTPUT_DIR / f"{job_id}.ass"
        generate_ass_subtitles(updated_phrases, str(ass_path))
        
        # Step 7: Apply captions
        set_job_state(job_id, {"status": "processing", "step": "Applying captions..."})
        final_path = OUTPUT_DIR / f"{job_id}_final.mp4"
        apply_captions_ffmpeg(str(vertical_path), str(ass_path), str(final_path))
        
        # Prepare response
        captions = [
            {
                "word": word["word"],
                "start": round(word["start"], 3),
                "duration": round(word["duration"], 3),
                "end": round(word["end"], 3)
            }
            for word in updated_words
        ]
        
        duration = timing_map.get("new_duration", 0)
        
        logger.info(f"✅ Pipeline complete for job {job_id}")
        
        # ========== CRITICAL FIX: Save completed state to jobs_store ==========
        set_job_state(job_id, {
            "status": "completed",
            "jobId": job_id,
            "videoPath": str(final_path),
            "videoUrl": f"/api/download/{job_id}.mp4",
            "captions": captions,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"❌ Pipeline error for job {job_id}: {str(e)}")
        
        # ========== CRITICAL FIX: Save failed state to jobs_store ==========
        set_job_state(job_id, {
            "status": "failed",
            "jobId": job_id,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        })


# ========== FASTAPI APP ==========

app = FastAPI(title="AI ZipZop Backend", version="1.0.0")


# ========== ENDPOINTS ==========

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...), token: str = None):
    """Upload video file"""
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        content = await file.read()
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        logger.info(f"✅ File uploaded: {file.filename}")
        
        return {
            "ok": True,
            "filename": file.filename,
            "size": len(content)
        }
    
    except Exception as e:
        logger.error(f"❌ Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/createJob")
async def create_job(request: JobRequest, background_tasks: BackgroundTasks, token: str = None):
    """
    Create and process video editing job
    CRITICAL FIX: Only sets initial state, background task handles the rest
    """
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        job_id = f"{int(datetime.now().timestamp() * 1000)}"
        
        # Get video path
        if request.videoUrl.startswith("http"):
            # Download from URL
            video_path = TEMP_DIR / f"{job_id}_input.mp4"
            subprocess.run(["wget", request.videoUrl, "-O", str(video_path)], check=True)
        else:
            # Local file
            video_path = UPLOAD_DIR / request.filename
        
        # ========== CRITICAL FIX: Set initial state BEFORE starting background task ==========
        set_job_state(job_id, {
            "status": "processing",
            "jobId": job_id,
            "step": "Initializing...",
            "timestamp": datetime.now().isoformat()
        })
        
        # Start background task - it will update jobs_store with results
        background_tasks.add_task(process_video_pipeline, str(video_path), job_id)
        
        logger.info(f"📋 Job created: {job_id}")
        
        return {
            "jobId": job_id,
            "status": "queued",
            "message": "Video processing started"
        }
    
    except Exception as e:
        logger.error(f"❌ Job creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/job/{job_id}")
async def get_job_status(job_id: str, token: str = None):
    """
    Get job processing status
    CRITICAL FIX: ONLY fetches from jobs_store, does NOT call process_video_pipeline
    """
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # ========== CRITICAL FIX: Only get state from jobs_store ==========
        job_state = get_job_state(job_id)
        
        if job_state is None:
            return JSONResponse(
                status_code=404,
                content={
                    "jobId": job_id,
                    "status": "not_found",
                    "error": "Job not found"
                }
            )
        
        # Return the state as-is
        if job_state.get("status") == "completed":
            return {
                "jobId": job_id,
                "status": "completed",
                "videoUrl": job_state.get("videoUrl"),
                "captions": job_state.get("captions"),
                "duration": job_state.get("duration"),
                "timestamp": job_state.get("timestamp")
            }
        elif job_state.get("status") == "failed":
            return {
                "jobId": job_id,
                "status": "failed",
                "error": job_state.get("error"),
                "timestamp": job_state.get("timestamp")
            }
        else:
            # Still processing
            return {
                "jobId": job_id,
                "status": "processing",
                "step": job_state.get("step", "Processing..."),
                "timestamp": job_state.get("timestamp")
            }
    
    except Exception as e:
        logger.error(f"❌ Status check error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "jobId": job_id,
                "status": "error",
                "error": str(e)
            }
        )


@app.get("/api/download/{file_id}")
async def download_video(file_id: str):
    """Download processed video"""
    try:
        file_path = OUTPUT_DIR / f"{file_id.replace('.mp4', '')}_final.mp4"
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Video not found")
        
        return FileResponse(file_path, media_type="video/mp4")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/createKineticCaption")
async def create_kinetic_caption(
    request: CreateKineticCaptionRequest,
    background_tasks: BackgroundTasks,
    token: str = None
):
    """
    AI silence cutter and jump-trimmer
    """
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        if request.action != "trim_silence":
            raise HTTPException(status_code=400, detail="Invalid action")
        
        job_id = f"trim_{int(datetime.now().timestamp() * 1000)}"
        
        # Get video path
        video_path = UPLOAD_DIR / request.filename
        
        if not video_path.exists():
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Detect and remove silence
        silent_intervals = detect_silence(str(video_path))
        output_path = OUTPUT_DIR / f"{job_id}_trimmed.mp4"
        
        timing_map = remove_silence_ffmpeg(str(video_path), silent_intervals, str(output_path))
        
        logger.info(f"✅ Trim job completed: {job_id}")
        
        return {
            "jobId": job_id,
            "status": "completed",
            "trimmedUrl": f"/api/download/{job_id}_trimmed.mp4",
            "originalDuration": timing_map.get("original_duration", 0),
            "newDuration": timing_map.get("new_duration", 0),
            "silenceRemoved": timing_map.get("removed_duration", 0)
        }
    
    except Exception as e:
        logger.error(f"❌ Kinetic caption error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/jobs")
async def list_jobs(token: str = None):
    """List all jobs (for debugging)"""
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    with jobs_lock:
        return {
            "total_jobs": len(jobs_store),
            "jobs": {
                job_id: {
                    "status": state.get("status"),
                    "timestamp": state.get("timestamp"),
                    "step": state.get("step")
                }
                for job_id, state in jobs_store.items()
            }
        }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
