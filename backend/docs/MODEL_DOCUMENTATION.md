# SmartKid Math Game - Database Models

This document describes the database models for the SmartKid Math Game backend.

## Models Overview

### Core Models

1. **User** (`users`)

   - Primary user entity with profile information, game statistics, and social features
   - Fields: id, username, email, password, full_name, avatar, age, coins, followers_count, following_count, experience_points, current_level, level_progress, is_active

2. **UserStatistics** (`user_statistics`)

   - Performance metrics for each user
   - Fields: user_id, games_played, best_score, total_score

3. **FollowerRelationship** (`follower_relationships`)
   - Many-to-many relationship for user following system
   - Fields: id, follower_id, followed_id

### Game System Models

4. **GameSession** (`game_sessions`)

   - Individual game session records with scoring and social features
   - Fields: id, user_id, difficulty_level, number_of_rounds, total_time, correct_answers, score, completed, is_public, likes_count, comments_count, recording_url, recording_duration

5. **RoundDetail** (`round_details`)

   - Detailed information for each round within a game session
   - Fields: id, game_session_id, round_number, first_number, second_number, correct_symbol, user_symbol, response_time, is_correct

6. **GameSessionLike** (`game_session_likes`)

   - Likes on game sessions
   - Fields: id, game_session_id, user_id

7. **GameSessionComment** (`game_session_comments`)

   - Comments on game sessions
   - Fields: id, game_session_id, user_id, content

8. **LeaderboardEntry** (`leaderboard_entries`)
   - Leaderboard rankings for different time periods
   - Fields: id, user_id, period_type, total_score, games_played, games_won, rank

### Achievement System Models

9. **Achievement** (`achievements`)

   - Available achievements in the game
   - Fields: id, name, points, is_active

10. **UserAchievement** (`user_achievements`)
    - Achievements earned by users
    - Fields: id, user_id, achievement_id, game_session_id, progress_value, acquired_at

### Communication & Payment Models

11. **Notification** (`notifications`)

    - System notifications for users
    - Fields: id, user_id, type, title, content, related_user_id, related_achievement_id, related_game_session_id, is_read

12. **PaymentTransaction** (`payment_transactions`)
    - In-app purchase transactions
    - Fields: id, user_id, transaction_type, price, currency, status, payment_provider, external_transaction_id, completed_at

## Key Relationships

- **User ↔ UserStatistics**: One-to-One
- **User ↔ FollowerRelationship**: Many-to-Many (self-referencing)
- **User ↔ GameSession**: One-to-Many
- **GameSession ↔ RoundDetail**: One-to-Many
- **GameSession ↔ GameSessionLike**: One-to-Many
- **GameSession ↔ GameSessionComment**: One-to-Many
- **User ↔ GameSessionLike**: One-to-Many
- **User ↔ GameSessionComment**: One-to-Many
- **User ↔ LeaderboardEntry**: One-to-Many
- **User ↔ UserAchievement**: One-to-Many
- **Achievement ↔ UserAchievement**: One-to-Many
- **GameSession ↔ UserAchievement**: One-to-Many (optional)
- **User ↔ Notification**: One-to-Many (multiple relationships)
- **User ↔ PaymentTransaction**: One-to-Many

## Features Supported

### Core Game Features

- User registration and authentication
- Math comparison game sessions (>, <, =)
- Round-by-round tracking with response times
- Scoring and difficulty levels
- Anti-cheat video recording

### Social Features

- User following system
- Game session likes and comments
- Leaderboards (daily, weekly, monthly, all-time)
- Achievement system with progress tracking

### Communication Features

- Notification system for follows, achievements, likes, and comments
- Different notification types for various user interactions

### Monetization Features

- Payment transaction tracking
- Support for multiple payment providers
- Transaction status management

## Usage Notes

- All models use UUID primary keys for better scalability
- Foreign key constraints are properly defined with cascade deletes where appropriate
- Indexes are optimized for common query patterns
- The schema supports both public and private game sessions
- Achievement system is flexible with optional game session associations
