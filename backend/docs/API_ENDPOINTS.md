# SmartKid Math Game API Endpoints

## 🏁 Quick Start

- **Base URL**: `http://localhost:3000/api`
- **Swagger Documentation**: `http://localhost:3000/api-docs`
- **Health Check**: `GET /api/health`

## 🔐 Authentication

All endpoints marked with 🔒 require JWT token in Authorization header: `Bearer <token>`

---

## 🎮 Game APIs (NEW)

### Core Game Management

| Method | Endpoint            | Description                          | Auth |
| ------ | ------------------- | ------------------------------------ | ---- |
| `POST` | `/api/game/start`   | Create new game session (Admin only) | 🔒   |
| `POST` | `/api/game/join`    | Join an existing game session        | 🔒   |
| `GET`  | `/api/game/history` | View completed games history         | 🔒   |

### Game Start Request Body (Admin Only)

```json
{
  "number_of_rounds": 15, // 1-50 (optional, default: 10)
  "admin_instructions": "Focus on accuracy over speed",
  "rounds": [
    // Optional predefined rounds
    {
      "first_number": 25,
      "second_number": 18
    },
    {
      "first_number": 7,
      "second_number": 31
    }
  ]
}
```

### Game Join Request Body

```json
{
  "game_session_id": 123
}
```

### Game Rules & Constraints

- **Admin Control**: Only admins can create game sessions
- **Join Limit**: Each session can only be assigned to one user
- **Time Limits**:
  - Total game time: 10 minutes (600 seconds)
  - Per round time: 60 seconds
- **Scoring**: 100 points per correct answer
- **Number Range**: 1-50 for fair comparison
- **Operators**: Greater than (>), Less than (<), Equal to (=)

---

## 🎮 Game APIs - **Enhanced Admin Control**

### **🔧 Admin Game Management (ENHANCED)**

| Method | Endpoint                        | Description                                      | Auth |
| ------ | ------------------------------- | ------------------------------------------------ | ---- |
| `POST` | `/api/game/start`               | Create game session (Admin only - basic)         | 🔒   |
| `POST` | `/api/admin/game/create-custom` | **NEW** Create with custom rounds (Full control) | 🔒   |
| `GET`  | `/api/admin/game/dashboard`     | **NEW** Admin monitoring dashboard               | 🔒   |
| `GET`  | `/api/game/available`           | **NEW** Get games anyone can join                | 🔒   |
| `POST` | `/api/game/join`                | Join an existing game session                    | 🔒   |
| `GET`  | `/api/game/history`             | View completed games history                     | 🔒   |

### **🎯 Enhanced Admin Features**

#### **1. Create Custom Games (Open or Assigned)**

```bash
# Create a game anyone can join
POST /api/admin/game/create-custom
{
  "admin_instructions": "Practice comparing numbers",
  "custom_rounds": [
    { "first_number": 25, "second_number": 18 },
    { "first_number": 7, "second_number": 31 },
    { "first_number": 50, "second_number": 50 }
  ]
}
# Returns: game_session.assigned_to = "open_to_all"

# Or assign to specific user
POST /api/admin/game/create-custom
{
  "user_id": 5,
  "admin_instructions": "Special assignment for you",
  "custom_rounds": [...]
}
# Returns: game_session.assigned_to = "specific_user"
```

#### **2. Players Can Browse Available Games**

```bash
# Anyone can see games open for joining
GET /api/game/available?page=1&limit=10

# Filter by specific admin
GET /api/game/available?admin_id=3
```

#### **3. Join Any Available Game**

```bash
POST /api/game/join
{
  "game_session_id": 157
}
```

### **🔄 Game Flow**

1. **Admin creates custom game** → Sets `user_id: null` for public games
2. **Players browse available games** → `/api/game/available`
3. **Player joins game** → `/api/game/join` with `game_session_id`
4. **Player completes game** → `/api/game/complete` with results
5. **Admin monitors progress** → `/api/admin/game/dashboard`

### **Game Rules & Constraints**

- **Admin Control**: Only admins can create game sessions
- **Custom Numbers**: Any positive integers allowed
- **Custom Symbols**: Override auto-calculation with specific expected answers
- **Time Limits**:
  - Total game time: 10 minutes (600 seconds)
  - Per round time: 60 seconds
- **Scoring**: 100 points per correct answer
- **Operators**: Greater than (>), Less than (<), Equal to (=)

---

## 👥 Social APIs

### User Stats & Social Features

| Method   | Endpoint                        | Description                     | Auth |
| -------- | ------------------------------- | ------------------------------- | ---- |
| `GET`    | `/api/users/{userId}/stats`     | Get user statistics and profile |      |
| `POST`   | `/api/users/{userId}/follow`    | Follow a user                   | 🔒   |
| `DELETE` | `/api/users/{userId}/unfollow`  | Unfollow a user                 | 🔒   |
| `GET`    | `/api/users/{userId}/followers` | Get user's followers list       |      |
| `GET`    | `/api/users/{userId}/following` | Get users this user follows     |      |

---

## 🎮 Game APIs

### Game Session Management

| Method | Endpoint                  | Description                       | Auth |
| ------ | ------------------------- | --------------------------------- | ---- |
| `POST` | `/api/game/start`         | Start a new math game session     | 🔒   |
| `POST` | `/api/game/complete`      | Complete game & submit results    | 🔒   |
| `GET`  | `/api/game/history`       | Get user's game history           | 🔒   |
| `GET`  | `/api/game/stats/summary` | Get comprehensive game statistics | 🔒   |

### Game Start Request Body

```json
{
  "difficulty_level": 3, // 1-10 (optional, default: 1)
  "number_of_rounds": 15 // 5-50 (optional, default: 10)
}
```

### Game Complete Request Body

```json
{
  "game_session_id": 123,
  "total_time": 180, // seconds
  "recording_url": "https://...", // optional anti-cheat video
  "rounds": [
    {
      "first_number": 15,
      "second_number": 8,
      "correct_symbol": ">",
      "user_symbol": ">",
      "response_time": 2.5 // seconds
    }
  ]
}
```

---

## 🏆 Leaderboard APIs

### Rankings & Competitions

| Method | Endpoint                             | Description                          | Auth |
| ------ | ------------------------------------ | ------------------------------------ | ---- |
| `GET`  | `/api/leaderboard/daily`             | Get today's leaderboard              |      |
| `GET`  | `/api/leaderboard/weekly`            | Get this week's leaderboard          |      |
| `GET`  | `/api/leaderboard/monthly`           | Get this month's leaderboard         |      |
| `GET`  | `/api/leaderboard/all-time`          | Get all-time leaderboard             |      |
| `GET`  | `/api/leaderboard/user/me/positions` | Get my positions in all leaderboards | 🔒   |

**Query Parameters**: `page`, `limit` (pagination support)

---

## 🔔 Notification APIs

### Follow Notifications

| Method | Endpoint                       | Description               | Auth |
| ------ | ------------------------------ | ------------------------- | ---- |
| `GET`  | `/api/notifications`           | Get follow notifications  | 🔒   |
| `PUT`  | `/api/notifications/{id}/read` | Mark notification as read | 🔒   |

**Query Parameters**:

- `page`, `limit` (pagination)
- `unread_only=true` (filter unread only)

---

## 🏅 Achievement APIs

### Achievements & Progression

| Method | Endpoint               | Description                       | Auth |
| ------ | ---------------------- | --------------------------------- | ---- |
| `GET`  | `/api/achievements`    | Get all available achievements    |      |
| `GET`  | `/api/achievements/me` | Get my achievements with progress | 🔒   |

**Query Parameters**:

- `category` (filter by: game_performance, social, progression, special)
- `earned_only=true` (show only earned achievements)

---

## 📊 Response Examples

### User Stats Response

```json
{
  "message": "User statistics retrieved successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "coins": 150,
    "followers_count": 25,
    "following_count": 15,
    "experience_points": 2500,
    "current_level": 5,
    "level_progress": 0.75,
    "statistics": {
      "games_played": 50,
      "best_score": 980,
      "total_score": 25000
    }
  }
}
```

### Game Complete Response

```json
{
  "message": "Game completed successfully",
  "game_result": {
    "score": 1350,
    "correct_answers": 12,
    "total_rounds": 15,
    "accuracy": 80,
    "experience_gained": 135,
    "coins_earned": 13
  }
}
```

### Leaderboard Response

```json
{
  "message": "Daily leaderboard retrieved successfully",
  "period": "daily",
  "date": "2024-01-15",
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  },
  "leaderboard": [
    {
      "rank": 1,
      "score": 2500,
      "games_played": 5,
      "user": {
        "id": 1,
        "username": "mathwiz",
        "full_name": "Math Wizard",
        "avatar": "https://example.com/avatar.jpg",
        "current_level": 8
      }
    }
  ]
}
```

### Achievement Response

```json
{
  "message": "User achievements retrieved successfully",
  "statistics": {
    "total_achievements": 25,
    "earned_achievements": 8,
    "completion_percentage": 32
  },
  "achievements": {
    "game_performance": [
      {
        "id": 1,
        "name": "First Victory",
        "description": "Complete your first game session",
        "category": "game_performance",
        "icon_url": "https://example.com/icons/first-victory.png",
        "points_required": 1,
        "reward_coins": 50,
        "is_earned": true,
        "earned_at": "2024-01-15T10:30:00Z",
        "progress": 1
      }
    ]
  }
}
```

---

## 🎯 Key Features

### 🎮 Math Game Mechanics

- **Comparison Game**: Numbers with >, <, = symbols
- **Difficulty Levels**: 1-10 affecting number ranges
- **Scoring System**: Base points + speed bonus
- **Anti-cheat**: Optional video recording
- **Experience & Levels**: XP gained from scores
- **Rewards**: Coins earned per game

### 👥 Social Features

- **Follow System**: Follow/unfollow users
- **Leaderboards**: Daily/Weekly/Monthly/All-time
- **User Statistics**: Games played, best scores, levels
- **Notifications**: Follow notifications

### 🏆 Progression System

- **Levels**: Based on experience points (1000 XP per level)
- **Achievements**: Multiple categories with progress tracking
- **Coins**: Virtual currency earned through gameplay
- **Statistics**: Comprehensive performance tracking

### 📊 Analytics

- **Game History**: Detailed session records
- **Performance Metrics**: Average scores, accuracy, timing
- **Leaderboard Positions**: Rankings across all periods
- **Achievement Progress**: Category-based progression

---

## 🔧 Technical Notes

- **Pagination**: Most list endpoints support `page` and `limit` parameters
- **Integer IDs**: All entities use simple integer IDs (1, 2, 3...)
- **JWT Authentication**: Required for user-specific operations
- **Error Handling**: Consistent HTTP status codes and error messages
- **Swagger Documentation**: Interactive API testing available

---

## 🚀 Development

1. **Start Server**: `npm start` or `node index.js`
2. **API Testing**: Visit `http://localhost:3000/api-docs`
3. **Health Check**: `GET http://localhost:3000/api/health`

All endpoints are ready for testing with comprehensive Swagger documentation!
