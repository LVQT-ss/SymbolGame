INSERT INTO achievements (
    name, 
    description, 
    category, 
    badge_color, 
    points, 
    coin_reward, 
    experience_reward, 
    condition_type, 
    condition_value, 
    condition_operator, 
    max_progress, 
    progress_increment, 
    time_frame, 
    start_date,
    end_date,
    is_hidden, 
    is_secret, 
    is_active, 
    created_by_admin,
    "createdAt",
    "updatedAt"
) VALUES
-- Performance Achievements
('Speed Demon', 'Complete a game with average response time under 2 seconds', 'performance', '#FFD700', 100, 50, 200, 'speed_average', 2, '<=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Perfect Accuracy', 'Achieve 100% accuracy in a game', 'performance', '#FF4500', 150, 100, 300, 'accuracy_percentage', 100, '=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('High Scorer', 'Score 1000 points in a single game', 'performance', '#4169E1', 200, 150, 400, 'best_score', 1000, '>=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Progress Achievements
('Getting Started', 'Play your first game', 'progress', '#32CD32', 50, 25, 100, 'games_played', 1, '>=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Regular Player', 'Play 10 games', 'progress', '#9370DB', 100, 75, 200, 'games_played', 10, '>=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Veteran Player', 'Play 50 games', 'progress', '#FF8C00', 200, 150, 400, 'games_played', 50, '>=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Consistency Achievements
('Daily Streak', 'Play games for 3 consecutive days', 'consistency', '#FF69B4', 150, 100, 300, 'consecutive_days', 3, '>=', NULL, 1, 'daily', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Weekly Warrior', 'Play games for 5 days in a week', 'consistency', '#20B2AA', 200, 150, 400, 'consecutive_days', 5, '>=', NULL, 1, 'weekly', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Social Achievements
('Social Butterfly', 'Gain 5 followers', 'social', '#FF1493', 150, 100, 300, 'followers_count', 5, '>=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Popular Player', 'Gain 20 followers', 'social', '#8A2BE2', 300, 200, 600, 'followers_count', 20, '>=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Special Achievements
('Coin Collector', 'Accumulate 1000 coins', 'special', '#FFD700', 200, 0, 400, 'coins_accumulated', 1000, '>=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Level Up!', 'Reach level 10', 'special', '#00CED1', 250, 200, 500, 'level_reached', 10, '>=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Difficulty Achievements
('Perfect Streak', 'Get 10 correct answers in a row', 'difficulty', '#FF0000', 300, 250, 600, 'consecutive_correct', 10, '>=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Master Player', 'Achieve a total score of 5000', 'difficulty', '#800080', 400, 300, 800, 'total_score', 5000, '>=', NULL, 1, 'none', NULL, NULL, false, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);