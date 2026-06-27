import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

function ensureFileExists(p) {
  if (!fs.existsSync(p)) throw new Error(`File not found: ${p}`);
}

// Trim video: start in seconds, duration in seconds.
export function trimVideo(inputPath, startSec, durationSec, outputPath, reencode = false, onProgress) {
  ensureFileExists(inputPath);
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath).setStartTime(startSec).setDuration(durationSec);

    if (!reencode) {
      cmd.outputOptions('-c', 'copy');
    } else {
      cmd.videoCodec('libx264').audioCodec('aac').outputOptions('-crf', '23', '-preset', 'veryfast');
    }

    cmd.on('error', (err) => reject(err))
      .on('progress', (p) => { if (onProgress) onProgress(p); })
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
}

export function applyColorGrade(inputPath, preset, outputPath, onProgress) {
  ensureFileExists(inputPath);
  const presets = {
    vibrant: "eq=contrast=1.15:brightness=0.02:saturation=1.35,unsharp=3:3:0.7",
    cinematic: "eq=contrast=1.18:brightness=0.0:saturation=1.05,colorlevels=rimin=0.02:gimin=0.02:bimin=0.02,tonemap=hable",
    "boost-contrast": "eq=contrast=1.3:brightness=0.0:saturation=1.2,curves=preset=strong_contrast",
    "hdr-ish": "eq=contrast=1.25:brightness=0.02:saturation=1.25,tonemap=tonemap=linear:desat=0",
    flat: "eq=contrast=0.95:brightness=-0.02:saturation=0.9"
  };
  const filter = presets[preset] || presets.vibrant;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters(filter)
      .videoCodec('libx264')
      .audioCodec('copy')
      .outputOptions('-crf', '18', '-preset', 'medium')
      .on('error', (err) => reject(err))
      .on('progress', (p) => { if (onProgress) onProgress(p); })
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
}

export function extractAudioToM4A(inputPath, outPath, onProgress) {
  ensureFileExists(inputPath);
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('aac')
      .audioBitrate('128k')
      .format('m4a')
      .on('error', (err) => reject(err))
      .on('progress', (p) => { if (onProgress) onProgress(p); })
      .on('end', () => resolve(outPath))
      .save(outPath);
  });
}

// transcribeWithOpenAI (optional)
export async function transcribeWithOpenAI(audioPath, outSrtPath) {
  ensureFileExists(audioPath);
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set in env');

  const form = new FormData();
  form.append('file', fs.createReadStream(audioPath));
  form.append('model', 'whisper-1');
  form.append('response_format', 'srt');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: form
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI transcription failed: ${res.status} ${res.statusText} - ${body}`);
  }

  const srt = await res.text();
  fs.writeFileSync(outSrtPath, srt, 'utf8');
  return outSrtPath;
}

export function burnSubtitles(inputPath, srtPath, outputPath, onProgress) {
  ensureFileExists(inputPath);
  ensureFileExists(srtPath);
  return new Promise((resolve, reject) => {
    const escaped = srtPath.replace(/'/g, "'\\''");
    const filter = `subtitles='${escaped}'`;
    ffmpeg(inputPath)
      .videoFilters(filter)
      .on('error', (err) => reject(err))
      .on('progress', (p) => { if (onProgress) onProgress(p); })
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
}

// Burn ASS (Advanced SubStation Alpha) subtitles into video using libass renderer.
export function burnASS(inputPath, assPath, outputPath, onProgress) {
  ensureFileExists(inputPath);
  ensureFileExists(assPath);
  return new Promise((resolve, reject) => {
    const escaped = assPath.replace(/'/g, "'\\''");
    const filter = `ass='${escaped}'`;
    ffmpeg(inputPath)
      .videoFilters(filter)
      .videoCodec('libx264')
      .audioCodec('copy')
      .outputOptions('-crf', '18', '-preset', 'medium')
      .on('error', (err) => reject(err))
      .on('progress', (p) => { if (onProgress) onProgress(p); })
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
}

// Generate a short preview video with ASS burned in (start + duration)
export function generatePreviewWithASS(inputPath, assPath, startSec, durationSec, outputPath, onProgress) {
  ensureFileExists(inputPath);
  ensureFileExists(assPath);
  return new Promise((resolve, reject) => {
    const escaped = assPath.replace(/'/g, "'\\''");
    const filter = `ass='${escaped}'`;
    const cmd = ffmpeg(inputPath).videoFilters(filter).videoCodec('libx264').audioCodec('aac').outputOptions('-crf', '20', '-preset', 'veryfast');

    if (startSec != null) cmd.setStartTime(startSec);
    if (durationSec != null) cmd.setDuration(durationSec);

    cmd.on('error', (err) => reject(err))
      .on('progress', (p) => { if (onProgress) onProgress(p); })
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
}
