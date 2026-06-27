-- Create captions table to store generated ASS/SRT and metadata
CREATE TABLE IF NOT EXISTS captions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  filename TEXT NOT NULL,
  ass_path TEXT NOT NULL,
  srt_path TEXT,
  preset TEXT,
  style JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optional templates table
CREATE TABLE IF NOT EXISTS caption_templates (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  preset TEXT,
  style JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
