CREATE TABLE IF NOT EXISTS game_history_statistic_current_month (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    difficulty_level INT NOT NULL,
    best_score INT DEFAULT 0,
    best_score_time FLOAT DEFAULT 0,
    games_played INT DEFAULT 0,
    total_score INT DEFAULT 0,
    month_year VARCHAR(7) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_difficulty_month (user_id, difficulty_level, month_year)
); 