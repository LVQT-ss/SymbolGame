-- Fix Achievement Schema - Add Missing Columns
-- Run this SQL in your PostgreSQL database
-- NOTE: Achievement system is already working without these additional columns
-- This script is provided for future enhancements if needed

-- Add missing columns to achievements table
ALTER TABLE achievements 
ADD COLUMN IF NOT EXISTS condition_type VARCHAR(50) DEFAULT 'count',
ADD COLUMN IF NOT EXISTS condition_operator VARCHAR(10) DEFAULT '>=',
ADD COLUMN IF NOT EXISTS max_progress INTEGER,
ADD COLUMN IF NOT EXISTS progress_increment INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS badge_color VARCHAR(7) DEFAULT '#4CAF50',
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_secret BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by_admin INTEGER;

-- Update existing achievements to have required fields
UPDATE achievements 
SET condition_type = 'count', 
    is_active = true, 
    badge_color = '#4CAF50'
WHERE condition_type IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'achievements' 
ORDER BY ordinal_position; 