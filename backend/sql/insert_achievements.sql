-- SQL Queries to Import Sample Achievements
-- Run these queries in your PostgreSQL database

-- First, let's make sure we handle conflicts properly
-- This will insert achievements only if they don't already exist

INSERT INTO achievements (
    name, description, category, type, rarity, icon, badge_color, 
    points, coin_reward, experience_reward, condition_type, condition_value, 
    condition_operator, max_progress, progress_increment, time_frame, 
    is_hidden, is_secret, is_active, sort_order, "createdAt", "updatedAt"
) VALUES 

-- PERFORMANCE ACHIEVEMENTS
('Lightning Calculator', 'Complete 10 problems in under 30 seconds', 'performance', 'single', 'common', '⚡', '#FFD700', 50, 25, 100, 'speed_average', 3, '>=', NULL, 1, 'none', false, false, true, 1, NOW(), NOW()),

('Perfect Precision', 'Achieve 100% accuracy on 20 consecutive problems', 'performance', 'single', 'rare', '🎯', '#00FF00', 150, 75, 300, 'consecutive_correct', 20, '>=', NULL, 1, 'none', false, false, true, 2, NOW(), NOW()),

('Speed Demon', 'Answer a problem in under 1 second', 'performance', 'single', 'epic', '🔥', '#FF4500', 300, 150, 500, 'speed_average', 1, '<=', NULL, 1, 'none', false, false, true, 3, NOW(), NOW()),

-- SCORE ACHIEVEMENTS
('First Steps', 'Score your first 100 points', 'performance', 'single', 'common', '👶', '#87CEEB', 25, 10, 50, 'total_score', 100, '>=', NULL, 1, 'none', false, false, true, 4, NOW(), NOW()),

('High Scorer', 'Reach 10,000 total points', 'performance', 'single', 'rare', '🎊', '#9370DB', 200, 100, 400, 'total_score', 10000, '>=', NULL, 1, 'none', false, false, true, 5, NOW(), NOW()),

('Math Millionaire', 'Accumulate 1,000,000 total points', 'performance', 'single', 'legendary', '💰', '#FFD700', 1000, 500, 2000, 'total_score', 1000000, '>=', NULL, 1, 'none', false, false, true, 6, NOW(), NOW()),

-- PROGRESS ACHIEVEMENTS
('Getting Started', 'Complete your first 10 games', 'progress', 'single', 'common', '🎮', '#32CD32', 50, 25, 100, 'games_played', 10, '>=', NULL, 1, 'none', false, false, true, 7, NOW(), NOW()),

('Dedicated Player', 'Play 100 games', 'progress', 'single', 'rare', '🏆', '#FF6347', 150, 75, 300, 'games_played', 100, '>=', NULL, 1, 'none', false, false, true, 8, NOW(), NOW()),

('Level Up Master', 'Reach level 10', 'progress', 'single', 'rare', '📈', '#4169E1', 200, 100, 400, 'level_reached', 10, '>=', NULL, 1, 'none', false, false, true, 9, NOW(), NOW()),

-- SOCIAL ACHIEVEMENTS
('Popular Player', 'Get 10 followers', 'social', 'single', 'common', '👥', '#FF69B4', 75, 40, 150, 'followers_count', 10, '>=', NULL, 1, 'none', false, false, true, 10, NOW(), NOW()),

('Like Magnet', 'Receive 50 likes on your games', 'social', 'single', 'rare', '❤️', '#DC143C', 125, 60, 250, 'likes_received', 50, '>=', NULL, 1, 'none', false, false, true, 11, NOW(), NOW()),

('Community Leader', 'Get 100 followers', 'social', 'single', 'epic', '👑', '#DAA520', 250, 125, 500, 'followers_count', 100, '>=', NULL, 1, 'none', false, false, true, 12, NOW(), NOW()),

-- CONSISTENCY ACHIEVEMENTS
('Daily Dedication', 'Play for 7 consecutive days', 'consistency', 'single', 'common', '📅', '#32CD32', 100, 50, 200, 'consecutive_days', 7, '>=', NULL, 1, 'daily', false, false, true, 13, NOW(), NOW()),

('Weekly Warrior', 'Play for 30 consecutive days', 'consistency', 'single', 'rare', '🗓️', '#4169E1', 300, 150, 600, 'consecutive_days', 30, '>=', NULL, 1, 'daily', false, false, true, 14, NOW(), NOW()),

('Night Owl', 'Play between 10 PM and 2 AM for 5 days', 'consistency', 'single', 'rare', '🦉', '#FFE4B5', 175, 85, 350, 'special_event', 5, '>=', NULL, 1, 'none', true, false, true, 15, NOW(), NOW()),

-- DIFFICULTY ACHIEVEMENTS
('Challenge Accepted', 'Complete 5 expert-level games', 'difficulty', 'single', 'epic', '💪', '#B22222', 300, 150, 600, 'level_reached', 5, '>=', NULL, 1, 'none', false, false, true, 16, NOW(), NOW()),

-- SECRET ACHIEVEMENTS
('Lucky Seven', 'Score exactly 777 points in a single game', 'special', 'single', 'epic', '🍀', '#32CD32', 777, 77, 777, 'best_score', 777, '=', NULL, 1, 'none', false, true, true, 17, NOW(), NOW()),

('The Chosen One', 'Be the first player to discover this secret achievement', 'special', 'single', 'legendary', '✨', '#DAA520', 1000, 500, 2000, 'special_event', 1, '>=', NULL, 1, 'none', false, true, true, 18, NOW(), NOW()),

-- PROGRESSIVE ACHIEVEMENTS
('Math Explorer', 'Complete games in different categories', 'progress', 'progressive', 'rare', '🗺️', '#4682B4', 200, 100, 400, 'special_event', 5, '>=', 5, 1, 'none', false, false, true, 19, NOW(), NOW()),

('Streak Master', 'Build your winning streak', 'consistency', 'progressive', 'epic', '🔥', '#FF4500', 400, 200, 800, 'consecutive_correct', 20, '>=', 20, 1, 'none', false, false, true, 20, NOW(), NOW()),

-- LEGENDARY ACHIEVEMENTS
('Math Prodigy', 'Achieve perfection: 1000 games, 95%+ accuracy, level 25+', 'performance', 'single', 'legendary', '🧠', '#9400D3', 2000, 1000, 5000, 'games_played', 1000, '>=', NULL, 1, 'none', false, false, true, 21, NOW(), NOW())

ON CONFLICT (name) DO NOTHING;

-- Verify the import
SELECT 
    COUNT(*) as total_achievements,
    category,
    COUNT(*) as count_per_category
FROM achievements 
GROUP BY category
ORDER BY category;

-- Show all achievements
SELECT 
    id, name, category, type, rarity, points, coin_reward, experience_reward
FROM achievements 
ORDER BY sort_order, category, rarity; 