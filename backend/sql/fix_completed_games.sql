-- Fix games that have all rounds completed but aren't marked as completed
UPDATE game_sessions 
SET 
    completed = true,
    correct_answers = (
        SELECT COUNT(*) 
        FROM round_details 
        WHERE round_details.game_session_id = game_sessions.id 
        AND round_details.is_correct = true
    ),
    total_time = (
        SELECT COALESCE(SUM(round_details.response_time), 0)
        FROM round_details 
        WHERE round_details.game_session_id = game_sessions.id 
        AND round_details.user_symbol IS NOT NULL
    ),
    score = (
        SELECT COUNT(*) * 100
        FROM round_details 
        WHERE round_details.game_session_id = game_sessions.id 
        AND round_details.is_correct = true
    ),
    updatedAt = NOW()
WHERE completed = false 
AND (
    SELECT COUNT(*) 
    FROM round_details 
    WHERE round_details.game_session_id = game_sessions.id 
    AND round_details.user_symbol IS NOT NULL
) = game_sessions.number_of_rounds; 