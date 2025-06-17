-- Add sample game sessions for testing
-- First, get the admin user ID
SET @admin_id = (SELECT id FROM users WHERE usertype = 'Admin' LIMIT 1);

-- Insert sample game sessions
INSERT INTO game_sessions (user_id, number_of_rounds, total_time, correct_answers, score, completed, is_public, created_by_admin, admin_instructions, createdAt, updatedAt) VALUES
(NULL, 10, 0, 0, 0, false, true, @admin_id, 'Practice basic number comparison - great for beginners!', NOW(), NOW()),
(NULL, 15, 0, 0, 0, false, true, @admin_id, 'Intermediate level math challenges - test your skills!', NOW(), NOW()),
(NULL, 20, 0, 0, 0, false, true, @admin_id, 'Advanced mathematical symbol comparison - for experts only!', NOW(), NOW()),
(NULL, 12, 0, 0, 0, false, true, @admin_id, 'Quick thinking challenge - solve as fast as you can!', NOW(), NOW()),
(NULL, 8, 0, 0, 0, false, true, @admin_id, 'Short and sweet - perfect for a quick brain workout!', NOW(), NOW());

-- Get the IDs of the inserted game sessions
SET @game1_id = (SELECT id FROM game_sessions WHERE admin_instructions LIKE 'Practice basic%' LIMIT 1);
SET @game2_id = (SELECT id FROM game_sessions WHERE admin_instructions LIKE 'Intermediate level%' LIMIT 1);
SET @game3_id = (SELECT id FROM game_sessions WHERE admin_instructions LIKE 'Advanced mathematical%' LIMIT 1);
SET @game4_id = (SELECT id FROM game_sessions WHERE admin_instructions LIKE 'Quick thinking%' LIMIT 1);
SET @game5_id = (SELECT id FROM game_sessions WHERE admin_instructions LIKE 'Short and sweet%' LIMIT 1);

-- Add sample rounds for game 1 (10 rounds)
INSERT INTO round_details (game_session_id, round_number, first_number, second_number, correct_symbol, user_symbol, response_time, is_correct, createdAt, updatedAt) VALUES
(@game1_id, 1, 15, 8, '>', NULL, NULL, false, NOW(), NOW()),
(@game1_id, 2, 23, 31, '<', NULL, NULL, false, NOW(), NOW()),
(@game1_id, 3, 12, 12, '=', NULL, NULL, false, NOW(), NOW()),
(@game1_id, 4, 7, 19, '<', NULL, NULL, false, NOW(), NOW()),
(@game1_id, 5, 42, 28, '>', NULL, NULL, false, NOW(), NOW()),
(@game1_id, 6, 5, 5, '=', NULL, NULL, false, NOW(), NOW()),
(@game1_id, 7, 33, 41, '<', NULL, NULL, false, NOW(), NOW()),
(@game1_id, 8, 18, 9, '>', NULL, NULL, false, NOW(), NOW()),
(@game1_id, 9, 26, 26, '=', NULL, NULL, false, NOW(), NOW()),
(@game1_id, 10, 11, 37, '<', NULL, NULL, false, NOW(), NOW());

-- Add sample rounds for game 2 (15 rounds)
INSERT INTO round_details (game_session_id, round_number, first_number, second_number, correct_symbol, user_symbol, response_time, is_correct, createdAt, updatedAt) VALUES
(@game2_id, 1, 25, 17, '>', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 2, 14, 29, '<', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 3, 8, 8, '=', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 4, 35, 22, '>', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 5, 19, 46, '<', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 6, 13, 13, '=', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 7, 27, 31, '<', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 8, 44, 21, '>', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 9, 16, 16, '=', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 10, 9, 38, '<', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 11, 32, 18, '>', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 12, 24, 24, '=', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 13, 6, 41, '<', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 14, 39, 12, '>', NULL, NULL, false, NOW(), NOW()),
(@game2_id, 15, 20, 45, '<', NULL, NULL, false, NOW(), NOW()); 