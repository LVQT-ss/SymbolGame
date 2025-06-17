-- ============================================
-- SYMBOL MOBILE APP - SAMPLE DATA SQL
-- ============================================

-- Insert sample users with hashed passwords
INSERT INTO users (username, usertype, email, password, full_name, coins, experience_points, current_level, level_progress, followers_count, following_count, age, created_at, updated_at) VALUES 
('mathmaster2024', 'Customer', 'mathmaster@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7FRPmHXlBpLTHMiT9xOjGXZlqv8tDt6', 'Nguyễn Văn Minh', 2500, 8750, 15, 65.5, 45, 32, '2010-05-15', NOW(), NOW()),
('speedcalculator', 'Customer', 'speedcalc@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7FRPmHXlBpLTHMiT9xOjGXZlqv8tDt6', 'Trần Thị Hoa', 3200, 12300, 20, 80.2, 67, 28, '2008-08-22', NOW(), NOW()),
('numberwizard', 'Customer', 'wizard@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7FRPmHXlBpLTHMiT9xOjGXZlqv8tDt6', 'Lê Quang Huy', 1800, 6200, 12, 45.8, 23, 41, '2012-11-30', NOW(), NOW()),
('mathhero', 'Customer', 'hero@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7FRPmHXlBpLTHMiT9xOjGXZlqv8tDt6', 'Phạm Thu Lan', 4100, 15600, 25, 92.3, 89, 15, '2009-03-18', NOW(), NOW()),
('quickthinker', 'Customer', 'quick@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7FRPmHXlBpLTHMiT9xOjGXZlqv8tDt6', 'Hoàng Minh Tuấn', 2900, 9800, 17, 55.1, 34, 52, '2011-07-08', NOW(), NOW()),
('brainiac', 'Customer', 'brain@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7FRPmHXlBpLTHMiT9xOjGXZlqv8tDt6', 'Đặng Thị Mai', 3800, 14200, 23, 78.9, 76, 19, '2010-12-05', NOW(), NOW()),
('calculusking', 'Customer', 'calculus@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7FRPmHXlBpLTHMiT9xOjGXZlqv8tDt6', 'Vũ Đức Thành', 2200, 7400, 14, 38.7, 18, 61, '2013-01-25', NOW(), NOW()),
('mathgenius', 'Customer', 'genius@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7FRPmHXlBpLTHMiT9xOjGXZlqv8tDt6', 'Bùi Thị Thảo', 5200, 18900, 28, 95.6, 112, 8, '2007-06-12', NOW(), NOW()),
('admin_symbol', 'Admin', 'admin@symbol.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7FRPmHXlBpLTHMiT9xOjGXZlqv8tDt6', 'Quản trị viên Symbol', 10000, 50000, 50, 100.0, 0, 0, '1990-01-01', NOW(), NOW());

-- Insert sample achievements
INSERT INTO achievements (name, description, category, points, coin_reward, experience_reward, condition_value, unlock_message, created_at, updated_at) VALUES 
('First Steps', 'Hoàn thành game đầu tiên của bạn', 'progress', 100, 50, 100, 1, 'Chào mừng bạn đến với thế giới toán học!', NOW(), NOW()),
('Speed Demon', 'Giải 10 bài toán trong vòng 60 giây', 'performance', 300, 150, 300, 10, 'Tốc độ tính toán của bạn thật ấn tượng!', NOW(), NOW()),
('Math Master', 'Đạt điểm số hoàn hảo trong 5 game liên tiếp', 'performance', 500, 250, 500, 5, 'Bạn là bậc thầy toán học thực thụ!', NOW(), NOW()),
('Social Butterfly', 'Có 20 người theo dõi', 'social', 200, 100, 200, 20, 'Bạn đã trở thành ngôi sao trong cộng đồng!', NOW(), NOW()),
('Consistent Player', 'Chơi game mỗi ngày trong 7 ngày liên tiếp', 'consistency', 400, 200, 400, 7, 'Sự kiên trì của bạn thật đáng ngưỡng mộ!', NOW(), NOW()),
('Level Up Champion', 'Đạt level 15', 'progress', 600, 300, 600, 15, 'Chúc mừng! Bạn đã đạt được cấp độ cao!', NOW(), NOW()),
('Accuracy Expert', 'Đạt độ chính xác 95% trong 20 game', 'performance', 450, 225, 450, 20, 'Độ chính xác của bạn thật xuất sắc!', NOW(), NOW()),
('Community Leader', 'Có 50 người theo dõi', 'social', 350, 175, 350, 50, 'Bạn là một nhà lãnh đạo trong cộng đồng!', NOW(), NOW());

-- Insert user achievements (users have achieved some achievements)
INSERT INTO user_achievements (user_id, achievement_id, current_progress, max_progress, is_completed, completion_percentage, acquired_at, is_showcased, created_at, updated_at) VALUES 
-- mathmaster2024 (user_id = 1) achievements
(1, 1, 1, 1, true, 100.0, '2024-05-15 10:30:00', true, NOW(), NOW()),
(1, 4, 45, 20, true, 100.0, '2024-05-20 14:20:00', true, NOW(), NOW()),
(1, 6, 15, 15, true, 100.0, '2024-05-25 16:45:00', false, NOW(), NOW()),
(1, 2, 8, 10, false, 80.0, NULL, false, NOW(), NOW()),

-- speedcalculator (user_id = 2) achievements  
(2, 1, 1, 1, true, 100.0, '2024-05-10 09:15:00', false, NOW(), NOW()),
(2, 2, 10, 10, true, 100.0, '2024-05-18 11:30:00', true, NOW(), NOW()),
(2, 4, 67, 20, true, 100.0, '2024-05-22 13:45:00', true, NOW(), NOW()),
(2, 8, 67, 50, true, 100.0, '2024-05-28 15:20:00', true, NOW(), NOW()),
(2, 7, 18, 20, false, 90.0, NULL, false, NOW(), NOW()),

-- numberwizard (user_id = 3) achievements
(3, 1, 1, 1, true, 100.0, '2024-05-12 08:20:00', false, NOW(), NOW()),
(3, 4, 23, 20, true, 100.0, '2024-05-16 12:10:00', false, NOW(), NOW()),
(3, 5, 5, 7, false, 71.4, NULL, false, NOW(), NOW()),

-- mathhero (user_id = 4) achievements
(4, 1, 1, 1, true, 100.0, '2024-04-28 07:45:00', false, NOW(), NOW()),
(4, 3, 5, 5, true, 100.0, '2024-05-05 14:30:00', true, NOW(), NOW()),
(4, 4, 89, 20, true, 100.0, '2024-05-08 16:20:00', true, NOW(), NOW()),
(4, 6, 25, 15, true, 100.0, '2024-05-12 18:15:00', true, NOW(), NOW()),
(4, 8, 89, 50, true, 100.0, '2024-05-15 19:45:00', true, NOW(), NOW()),
(4, 7, 22, 20, true, 100.0, '2024-05-18 20:30:00', false, NOW(), NOW()),

-- quickthinker (user_id = 5) achievements
(5, 1, 1, 1, true, 100.0, '2024-05-08 06:30:00', false, NOW(), NOW()),
(5, 4, 34, 20, true, 100.0, '2024-05-14 10:45:00', false, NOW(), NOW()),
(5, 6, 17, 15, true, 100.0, '2024-05-20 13:20:00', false, NOW(), NOW()),

-- brainiac (user_id = 6) achievements
(6, 1, 1, 1, true, 100.0, '2024-05-01 05:15:00', false, NOW(), NOW()),
(6, 4, 76, 20, true, 100.0, '2024-05-06 11:30:00', true, NOW(), NOW()),
(6, 6, 23, 15, true, 100.0, '2024-05-11 14:45:00', false, NOW(), NOW()),
(6, 8, 76, 50, true, 100.0, '2024-05-16 17:20:00', true, NOW(), NOW()),
(6, 2, 9, 10, false, 90.0, NULL, false, NOW(), NOW()),

-- calculusking (user_id = 7) achievements
(7, 1, 1, 1, true, 100.0, '2024-05-03 04:45:00', false, NOW(), NOW()),
(7, 5, 6, 7, false, 85.7, NULL, false, NOW(), NOW()),

-- mathgenius (user_id = 8) achievements
(8, 1, 1, 1, true, 100.0, '2024-04-25 03:30:00', false, NOW(), NOW()),
(8, 2, 10, 10, true, 100.0, '2024-04-30 09:15:00', true, NOW(), NOW()),
(8, 3, 5, 5, true, 100.0, '2024-05-02 12:45:00', true, NOW(), NOW()),
(8, 4, 112, 20, true, 100.0, '2024-05-04 15:30:00', true, NOW(), NOW()),
(8, 6, 28, 15, true, 100.0, '2024-05-06 18:20:00', true, NOW(), NOW()),
(8, 8, 112, 50, true, 100.0, '2024-05-08 21:15:00', true, NOW(), NOW()),
(8, 7, 25, 20, true, 100.0, '2024-05-10 22:45:00', false, NOW(), NOW());

-- Insert leaderboard entries
-- Overall Score Leaderboard (All Time)
INSERT INTO leaderboard_entries (user_id, leaderboard_type, time_period, rank_position, score_value, tier, games_count, last_game_date, trend, points_change, rank_change, created_at, updated_at) VALUES 
(8, 'overall_score', 'all_time', 1, 9850, 'diamond', 45, '2024-06-08 18:30:00', 'up', 150, 2, NOW(), NOW()),
(4, 'overall_score', 'all_time', 2, 9420, 'gold', 38, '2024-06-08 17:45:00', 'stable', 0, 0, NOW(), NOW()),
(2, 'overall_score', 'all_time', 3, 8900, 'gold', 42, '2024-06-08 16:20:00', 'down', -80, -1, NOW(), NOW()),
(6, 'overall_score', 'all_time', 4, 8650, 'silver', 35, '2024-06-08 15:10:00', 'up', 120, 1, NOW(), NOW()),
(1, 'overall_score', 'all_time', 5, 8200, 'silver', 40, '2024-06-08 14:30:00', 'down', -50, -2, NOW(), NOW()),
(5, 'overall_score', 'all_time', 6, 7800, 'bronze', 32, '2024-06-08 13:45:00', 'stable', 10, 0, NOW(), NOW()),
(3, 'overall_score', 'all_time', 7, 6900, 'bronze', 28, '2024-06-08 12:20:00', 'up', 90, 1, NOW(), NOW()),
(7, 'overall_score', 'all_time', 8, 6200, 'bronze', 25, '2024-06-08 11:15:00', 'down', -40, -1, NOW(), NOW());

-- Experience Leaders Leaderboard (All Time)
INSERT INTO leaderboard_entries (user_id, leaderboard_type, time_period, rank_position, score_value, tier, games_count, last_game_date, trend, points_change, rank_change, created_at, updated_at) VALUES 
(8, 'experience_leaders', 'all_time', 1, 18900, 'diamond', 45, '2024-06-08 18:30:00', 'stable', 0, 0, NOW(), NOW()),
(4, 'experience_leaders', 'all_time', 2, 15600, 'gold', 38, '2024-06-08 17:45:00', 'up', 200, 1, NOW(), NOW()),
(6, 'experience_leaders', 'all_time', 3, 14200, 'gold', 35, '2024-06-08 15:10:00', 'down', -100, -1, NOW(), NOW()),
(2, 'experience_leaders', 'all_time', 4, 12300, 'silver', 42, '2024-06-08 16:20:00', 'stable', 50, 0, NOW(), NOW()),
(5, 'experience_leaders', 'all_time', 5, 9800, 'silver', 32, '2024-06-08 13:45:00', 'up', 80, 1, NOW(), NOW()),
(1, 'experience_leaders', 'all_time', 6, 8750, 'bronze', 40, '2024-06-08 14:30:00', 'down', -30, -1, NOW(), NOW()),
(7, 'experience_leaders', 'all_time', 7, 7400, 'bronze', 25, '2024-06-08 11:15:00', 'stable', 20, 0, NOW(), NOW()),
(3, 'experience_leaders', 'all_time', 8, 6200, 'bronze', 28, '2024-06-08 12:20:00', 'up', 40, 1, NOW(), NOW());

-- Level Champions Leaderboard (All Time)
INSERT INTO leaderboard_entries (user_id, leaderboard_type, time_period, rank_position, score_value, tier, games_count, last_game_date, trend, points_change, rank_change, created_at, updated_at) VALUES 
(8, 'level_champions', 'all_time', 1, 28, 'diamond', 45, '2024-06-08 18:30:00', 'stable', 0, 0, NOW(), NOW()),
(4, 'level_champions', 'all_time', 2, 25, 'gold', 38, '2024-06-08 17:45:00', 'stable', 0, 0, NOW(), NOW()),
(6, 'level_champions', 'all_time', 3, 23, 'gold', 35, '2024-06-08 15:10:00', 'up', 1, 1, NOW(), NOW()),
(2, 'level_champions', 'all_time', 4, 20, 'silver', 42, '2024-06-08 16:20:00', 'down', 0, -1, NOW(), NOW()),
(5, 'level_champions', 'all_time', 5, 17, 'silver', 32, '2024-06-08 13:45:00', 'stable', 0, 0, NOW(), NOW()),
(1, 'level_champions', 'all_time', 6, 15, 'bronze', 40, '2024-06-08 14:30:00', 'stable', 0, 0, NOW(), NOW()),
(7, 'level_champions', 'all_time', 7, 14, 'bronze', 25, '2024-06-08 11:15:00', 'stable', 0, 0, NOW(), NOW()),
(3, 'level_champions', 'all_time', 8, 12, 'bronze', 28, '2024-06-08 12:20:00', 'stable', 0, 0, NOW(), NOW());

-- Most Followed Leaderboard (All Time)
INSERT INTO leaderboard_entries (user_id, leaderboard_type, time_period, rank_position, score_value, tier, games_count, last_game_date, trend, points_change, rank_change, created_at, updated_at) VALUES 
(8, 'most_followed', 'all_time', 1, 112, 'diamond', 45, '2024-06-08 18:30:00', 'up', 5, 1, NOW(), NOW()),
(4, 'most_followed', 'all_time', 2, 89, 'gold', 38, '2024-06-08 17:45:00', 'down', -2, -1, NOW(), NOW()),
(6, 'most_followed', 'all_time', 3, 76, 'gold', 35, '2024-06-08 15:10:00', 'up', 3, 1, NOW(), NOW()),
(2, 'most_followed', 'all_time', 4, 67, 'silver', 42, '2024-06-08 16:20:00', 'stable', 1, 0, NOW(), NOW()),
(1, 'most_followed', 'all_time', 5, 45, 'silver', 40, '2024-06-08 14:30:00', 'down', -1, -1, NOW(), NOW()),
(5, 'most_followed', 'all_time', 6, 34, 'bronze', 32, '2024-06-08 13:45:00', 'up', 2, 1, NOW(), NOW()),
(3, 'most_followed', 'all_time', 7, 23, 'bronze', 28, '2024-06-08 12:20:00', 'stable', 0, 0, NOW(), NOW()),
(7, 'most_followed', 'all_time', 8, 18, 'bronze', 25, '2024-06-08 11:15:00', 'down', -1, -1, NOW(), NOW());

-- Weekly leaderboards (same ranking but different period)
INSERT INTO leaderboard_entries (user_id, leaderboard_type, time_period, rank_position, score_value, tier, games_count, last_game_date, trend, points_change, rank_change, period_start, period_end, created_at, updated_at) VALUES 
(8, 'overall_score', 'weekly', 1, 1850, 'diamond', 12, '2024-06-08 18:30:00', 'stable', 50, 0, '2024-06-02 00:00:00', '2024-06-08 23:59:59', NOW(), NOW()),
(4, 'overall_score', 'weekly', 2, 1620, 'gold', 10, '2024-06-08 17:45:00', 'up', 80, 1, '2024-06-02 00:00:00', '2024-06-08 23:59:59', NOW(), NOW()),
(2, 'overall_score', 'weekly', 3, 1590, 'gold', 11, '2024-06-08 16:20:00', 'down', -20, -1, '2024-06-02 00:00:00', '2024-06-08 23:59:59', NOW(), NOW()),
(6, 'overall_score', 'weekly', 4, 1480, 'silver', 9, '2024-06-08 15:10:00', 'stable', 30, 0, '2024-06-02 00:00:00', '2024-06-08 23:59:59', NOW(), NOW()),
(1, 'overall_score', 'weekly', 5, 1350, 'silver', 8, '2024-06-08 14:30:00', 'up', 40, 1, '2024-06-02 00:00:00', '2024-06-08 23:59:59', NOW(), NOW());

-- ============================================
-- Summary of inserted data:
-- - 9 users (8 customers + 1 admin) with varied stats
-- - 8 achievements covering different categories 
-- - 27 user achievements (some completed, some in progress)
-- - 33 leaderboard entries across different types and periods
-- ============================================ 