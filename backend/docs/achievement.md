# 🏆 Achievement System API Documentation

## Overview

The Achievement System is a comprehensive gamification feature designed to increase user engagement and retention in the SmartKid Math Game. It tracks player progress across multiple categories and awards achievements based on various conditions.

## Table of Contents

- [Achievement Categories](#achievement-categories)
- [Achievement Types](#achievement-types)
- [Rarity Levels](#rarity-levels)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Integration Guide](#integration-guide)
- [Data Models](#data-models)
- [Best Practices](#best-practices)

---

## Achievement Categories

### 📊 **Performance**

Achievements based on gameplay performance metrics:

- Speed (response times, quick answers)
- Accuracy (correct answer percentages)
- Scores (high scores, total points)

### 📈 **Progress**

Achievements tracking user advancement:

- Games played milestones
- Level progression
- Experience point accumulation

### 👥 **Social**

Community and social interaction achievements:

- Follower counts
- Likes received/given
- Community engagement

### 🔥 **Consistency**

Regular play habit achievements:

- Daily login streaks
- Weekly play consistency
- Monthly dedication

### ⭐ **Special**

Unique and time-based achievements:

- Time-of-day challenges (Night Owl, Early Bird)
- Seasonal achievements
- Limited-time events

### 💪 **Difficulty**

Challenge-based achievements:

- Expert mode completions
- Hard difficulty challenges
- Advanced skill demonstrations

---

## Achievement Types

### **Single Achievement**

- **Description**: One-time unlock when condition is met
- **Example**: "Reach Level 10"
- **Behavior**: Immediately awarded when criteria fulfilled

### **Progressive Achievement**

- **Description**: Multi-step achievements with milestones
- **Example**: "Math Explorer" (Complete 1, 3, then 5 different categories)
- **Behavior**: Partial rewards given at each milestone

### **Cumulative Achievement**

- **Description**: Ongoing accumulation over time
- **Example**: "Play 1000 games"
- **Behavior**: Progress tracked continuously

---

## Rarity Levels

| Rarity        | Color     | Difficulty | Point Range | Description                 |
| ------------- | --------- | ---------- | ----------- | --------------------------- |
| **Common**    | 🟢 Green  | Easy       | 25-100      | Entry-level achievements    |
| **Rare**      | 🔵 Blue   | Moderate   | 100-200     | Challenging but achievable  |
| **Epic**      | 🟣 Purple | Hard       | 200-500     | Significant accomplishments |
| **Legendary** | 🟡 Gold   | Ultimate   | 500+        | Exceptional feats           |

---

## API Endpoints

### 1. Get All Achievements

**Endpoint:** `GET /api/achievements`

**Description:** Retrieve all achievements with user's progress

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category (performance, progress, social, consistency, special, difficulty) |
| `rarity` | string | No | Filter by rarity (common, rare, epic, legendary) |
| `completed` | boolean | No | Filter by completion status |
| `showcased` | boolean | No | Filter by showcase status |

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:3000/api/achievements?category=performance&rarity=epic"
```

**Response:**

```json
{
  "message": "Achievements retrieved successfully",
  "achievements": [
    {
      "id": 1,
      "name": "Speed Demon",
      "description": "Answer a problem in under 1 second",
      "category": "performance",
      "type": "single",
      "rarity": "epic",
      "icon": "🔥",
      "badge_color": "#FF4500",
      "points": 300,
      "coin_reward": 150,
      "experience_reward": 500,
      "condition_type": "fastest_answer",
      "condition_value": 1.0,
      "max_progress": 1,
      "is_completed": false,
      "current_progress": 0,
      "completion_percentage": 0,
      "acquired_at": null,
      "is_showcased": false,
      "streak_count": 0,
      "best_streak": 0
    }
  ],
  "total": 1
}
```

### 2. Get User's Achievements

**Endpoint:** `GET /api/achievements/user/:userId`

**Description:** Get specific user's achievements and statistics

**Parameters:**

- `userId` (path): Target user ID

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `completed` | boolean | Filter completed achievements |
| `showcased` | boolean | Filter showcased achievements |

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/achievements/user/123?completed=true"
```

**Response:**

```json
{
  "message": "User achievements retrieved successfully",
  "user": {
    "id": 123,
    "username": "mathpro",
    "full_name": "Alex Chen",
    "avatar": "avatar.jpg",
    "current_level": 15
  },
  "achievements": [
    {
      "id": 2,
      "achievement": {
        "id": 5,
        "name": "Perfect Precision",
        "description": "Achieve 100% accuracy on 20 consecutive problems",
        "category": "performance",
        "rarity": "rare",
        "points": 150
      },
      "current_progress": 20,
      "max_progress": 20,
      "completion_percentage": 100,
      "is_completed": true,
      "acquired_at": "2024-01-15T10:30:00.000Z",
      "is_showcased": true
    }
  ],
  "statistics": {
    "total_achievements": 25,
    "completed_achievements": 12,
    "completion_rate": 48.0,
    "total_achievement_points": 1850,
    "by_rarity": {
      "common": 5,
      "rare": 4,
      "epic": 2,
      "legendary": 1
    }
  },
  "is_own_profile": true
}
```

### 3. Check and Award Achievements

**Endpoint:** `POST /api/achievements/check`

**Description:** Check user progress and award new achievements

**Request Body:**

```json
{
  "session_data": {
    "game_session_id": 456,
    "consecutive_correct": 15,
    "accuracy_percentage": 95.5,
    "average_response_time": 2.3,
    "total_score": 1250,
    "difficulty_level": "expert",
    "category": "arithmetic"
  }
}
```

**Response:**

```json
{
  "message": "Achievement check completed",
  "newly_unlocked": 2,
  "progress_updated": 3,
  "achievements": {
    "unlocked": [
      {
        "id": 5,
        "name": "Perfect Precision",
        "description": "Achieve 100% accuracy on 20 consecutive problems",
        "rarity": "rare",
        "points": 150,
        "coin_reward": 75,
        "experience_reward": 300,
        "unlock_message": "Incredible precision! You're becoming a math master!"
      }
    ],
    "updated": [
      {
        "id": 8,
        "name": "Math Explorer",
        "current_progress": 3,
        "max_progress": 5,
        "completion_percentage": 60
      }
    ]
  }
}
```

### 4. Toggle Achievement Showcase

**Endpoint:** `PUT /api/achievements/:id/showcase`

**Description:** Toggle whether an achievement is showcased on user profile

**Parameters:**

- `id` (path): Achievement ID

**Response:**

```json
{
  "message": "Achievement showcase enabled",
  "is_showcased": true
}
```

### 5. Create Achievement (Admin Only)

**Endpoint:** `POST /api/achievements/create`

**Description:** Create a new achievement (Admin access required)

**Request Body:**

```json
{
  "name": "Math Wizard",
  "description": "Solve 100 problems with 95% accuracy",
  "category": "performance",
  "type": "single",
  "rarity": "epic",
  "points": 500,
  "coin_reward": 250,
  "experience_reward": 1000,
  "condition_type": "combined_performance",
  "condition_value": 100,
  "condition_operator": ">=",
  "icon": "🧙‍♂️",
  "badge_color": "#9400D3",
  "is_hidden": false,
  "is_secret": false,
  "unlock_message": "You've mastered the art of mathematics!"
}
```

### 6. Achievement Leaderboard

**Endpoint:** `GET /api/achievements/leaderboard`

**Description:** Get leaderboard based on achievement points

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | Time period (daily, weekly, monthly, all_time) |
| `limit` | integer | Number of top users (max: 100) |

**Response:**

```json
{
  "message": "Achievement leaderboard retrieved successfully",
  "period": "weekly",
  "leaderboard": [
    {
      "id": 123,
      "username": "mathpro",
      "full_name": "Alex Chen",
      "avatar": "avatar.jpg",
      "current_level": 15,
      "achievement_count": 12,
      "total_points": 1850
    }
  ]
}
```

---

## Usage Examples

### Frontend Integration Example

```javascript
class AchievementManager {
  constructor(apiToken) {
    this.token = apiToken;
    this.baseUrl = "http://localhost:3000/api";
  }

  // Get all achievements for current user
  async getUserAchievements(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(
      `${this.baseUrl}/achievements?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.json();
  }

  // Check for new achievements after game session
  async checkAchievements(sessionData) {
    const response = await fetch(`${this.baseUrl}/achievements/check`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_data: sessionData }),
    });
    return response.json();
  }

  // Display achievement unlock popup
  showAchievementPopup(achievements) {
    achievements.forEach((achievement) => {
      console.log(`🎉 Achievement Unlocked: ${achievement.name}`);
      console.log(`📝 ${achievement.description}`);
      console.log(
        `🏆 Rewards: ${achievement.points} points, ${achievement.coin_reward} coins`
      );
    });
  }
}

// Usage in game
const achievementManager = new AchievementManager(userToken);

// After completing a game session
const gameResults = {
  game_session_id: 456,
  consecutive_correct: 20,
  accuracy_percentage: 100,
  average_response_time: 1.5,
  total_score: 2000,
};

achievementManager.checkAchievements(gameResults).then((result) => {
  if (result.newly_unlocked > 0) {
    achievementManager.showAchievementPopup(result.achievements.unlocked);
  }
});
```

### Game Session Integration

```javascript
// After each game completion
async function completeGameSession(gameSessionId, gameStats) {
  try {
    // First save the game session
    await saveGameSession(gameSessionId, gameStats);

    // Then check for achievements
    const achievementCheck = await fetch("/api/achievements/check", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_data: {
          game_session_id: gameSessionId,
          consecutive_correct: gameStats.correctAnswers,
          accuracy_percentage: gameStats.accuracy,
          average_response_time: gameStats.avgResponseTime,
          total_score: gameStats.finalScore,
          difficulty_level: gameStats.difficulty,
        },
      }),
    });

    const result = await achievementCheck.json();

    // Show achievement notifications
    if (result.newly_unlocked > 0) {
      showAchievementNotifications(result.achievements.unlocked);
    }

    // Update progress bars
    if (result.progress_updated > 0) {
      updateProgressBars(result.achievements.updated);
    }
  } catch (error) {
    console.error("Error checking achievements:", error);
  }
}
```

---

## Integration Guide

### Step 1: Initialize Achievement System

```javascript
// Initialize on app start
async function initializeAchievements() {
  try {
    const achievements = await fetch("/api/achievements", {
      headers: { Authorization: `Bearer ${userToken}` },
    }).then((res) => res.json());

    // Store achievements in app state
    app.achievements = achievements.achievements;

    // Set up achievement UI
    renderAchievementTabs(achievements.achievements);
  } catch (error) {
    console.error("Failed to load achievements:", error);
  }
}
```

### Step 2: Game Session Hook

```javascript
// Add to your game completion logic
function onGameComplete(gameData) {
  // Existing game completion logic
  updateUserStats(gameData);
  saveScore(gameData.score);

  // NEW: Check achievements
  checkForNewAchievements(gameData);
}

async function checkForNewAchievements(gameData) {
  const sessionData = {
    game_session_id: gameData.sessionId,
    consecutive_correct: gameData.streak,
    accuracy_percentage: (gameData.correct / gameData.total) * 100,
    average_response_time: gameData.totalTime / gameData.total,
    total_score: gameData.score,
  };

  const result = await achievementManager.checkAchievements(sessionData);

  if (result.newly_unlocked > 0) {
    showAchievementCelebration(result.achievements.unlocked);
  }
}
```

### Step 3: Achievement UI Components

```javascript
// Achievement card component
function createAchievementCard(achievement) {
  const isCompleted = achievement.is_completed;
  const progress = achievement.completion_percentage;

  return `
    <div class="achievement-card ${isCompleted ? "completed" : ""} rarity-${
    achievement.rarity
  }">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <h3>${achievement.name}</h3>
        <p>${achievement.description}</p>
        <div class="achievement-rewards">
          <span class="points">🏆 ${achievement.points}</span>
          <span class="coins">🪙 ${achievement.coin_reward}</span>
          <span class="xp">⭐ ${achievement.experience_reward}</span>
        </div>
        ${
          !isCompleted
            ? `
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
            <span class="progress-text">${achievement.current_progress}/${achievement.max_progress}</span>
          </div>
        `
            : ""
        }
      </div>
      ${isCompleted ? `<div class="completed-badge">✓</div>` : ""}
    </div>
  `;
}
```

---

## Data Models

### Achievement Model

```javascript
{
  id: Integer,
  name: String,
  description: String,
  category: Enum['performance', 'progress', 'social', 'consistency', 'special', 'difficulty'],
  type: Enum['single', 'progressive', 'cumulative'],
  rarity: Enum['common', 'rare', 'epic', 'legendary'],
  icon: String,
  badge_color: String (hex color),
  points: Integer,
  coin_reward: Integer,
  experience_reward: Integer,
  condition_type: String,
  condition_value: Integer,
  condition_operator: Enum['>=', '>', '=', '<', '<='],
  max_progress: Integer,
  is_hidden: Boolean,
  is_secret: Boolean,
  unlock_message: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

### UserAchievement Model

```javascript
{
  id: Integer,
  user_id: Integer,
  achievement_id: Integer,
  current_progress: Integer,
  max_progress: Integer,
  completion_percentage: Float,
  is_completed: Boolean,
  acquired_at: DateTime,
  is_showcased: Boolean,
  streak_count: Integer,
  best_streak: Integer,
  game_session_id: Integer,
  unlock_data: JSON,
  created_at: DateTime,
  updated_at: DateTime
}
```

---

## Best Practices

### 1. Performance Optimization

- **Batch Requests**: Check multiple achievements in single API call
- **Caching**: Cache achievement definitions on client side
- **Lazy Loading**: Load detailed achievement data when needed

### 2. User Experience

- **Immediate Feedback**: Show achievement unlocks immediately after game
- **Progress Indication**: Display progress bars for incomplete achievements
- **Celebration**: Use animations and sounds for achievement unlocks

### 3. Achievement Design

- **Clear Goals**: Make achievement requirements obvious
- **Balanced Difficulty**: Mix easy and challenging achievements
- **Meaningful Rewards**: Ensure rewards feel valuable to players

### 4. Error Handling

```javascript
async function safeAchievementCheck(sessionData) {
  try {
    const result = await checkAchievements(sessionData);
    return result;
  } catch (error) {
    console.error("Achievement check failed:", error);
    // Don't block game flow if achievements fail
    return {
      newly_unlocked: 0,
      progress_updated: 0,
      achievements: { unlocked: [], updated: [] },
    };
  }
}
```

### 5. Analytics Integration

```javascript
// Track achievement events for analytics
function trackAchievementUnlock(achievement) {
  analytics.track("achievement_unlocked", {
    achievement_id: achievement.id,
    achievement_name: achievement.name,
    achievement_rarity: achievement.rarity,
    points_earned: achievement.points,
    user_level: getCurrentUserLevel(),
  });
}
```

---

## Condition Types Reference

| Condition Type         | Description                   | Example Value |
| ---------------------- | ----------------------------- | ------------- |
| `games_played`         | Total games completed         | 100           |
| `total_score`          | Accumulated points            | 10000         |
| `best_score`           | Highest single game score     | 2000          |
| `level_reached`        | User level achieved           | 15            |
| `coins_accumulated`    | Total coins earned            | 5000          |
| `followers_count`      | Number of followers           | 50            |
| `experience_points`    | Total XP earned               | 25000         |
| `consecutive_correct`  | Correct answers in a row      | 20            |
| `speed_average`        | Average response time         | 2.0 (seconds) |
| `accuracy_percentage`  | Accuracy rate                 | 95.0 (%)      |
| `daily_streak`         | Consecutive days played       | 7             |
| `difficulty_completed` | Games completed at difficulty | 10            |

---

This achievement system provides a comprehensive gamification layer that will significantly boost user engagement and retention in your SmartKid Math Game! 🎯✨
