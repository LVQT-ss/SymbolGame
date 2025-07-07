-- Add recording columns to game_history table
DO $$
BEGIN
    -- Add recording_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'game_history' 
        AND column_name = 'recording_url'
    ) THEN
        ALTER TABLE game_history
        ADD COLUMN recording_url VARCHAR(255) NULL;
        
        COMMENT ON COLUMN game_history.recording_url 
        IS 'URL to game recording';
    END IF;

    -- Add recording_duration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'game_history' 
        AND column_name = 'recording_duration'
    ) THEN
        ALTER TABLE game_history
        ADD COLUMN recording_duration INTEGER DEFAULT 5;
        
        COMMENT ON COLUMN game_history.recording_duration 
        IS 'Recording duration in seconds';
    END IF;

    RAISE NOTICE 'Successfully added recording columns to game_history table';
END;
$$; 