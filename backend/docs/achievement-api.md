# Achievement API Documentation

## Base URL

```
http://localhost:3000/api/achievements
```

## Endpoints Summary

### 🔓 Public Endpoints (No Authentication Required)

#### 1. Get All Public Achievements

```http
GET /api/achievements/public
```

**Description:** Get all public achievements without requiring authentication. Only returns non-secret and non-hidden achievements.

**Query Parameters:**

- `category` (optional): Filter by category (`performance`, `progress`, `social`, `consistency`, `special`, `difficulty`)
- `rarity` (optional): Filter by rarity (`common`, `rare`, `epic`, `legendary`)
- `limit` (optional): Number of achievements to return (default: 50, max: 100)
- `offset` (optional): Number of achievements to skip (default: 0)

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/achievements/public?category=performance&rarity=rare&limit=10"
```

**Example Response:**

```json
{
  "message": "Public achievements retrieved successfully",
  "achievements": [
    {
      "id": 1,
      "name": "Lightning Calculator",
      "description": "Complete 10 problems in under 30 seconds",
      "category": "performance",
      "type": "single",
      "rarity": "common",
      "icon": "⚡",
      "badge_color": "#FFD700",
      "points": 50,
      "coin_reward": 25,
      "experience_reward": 100,
      "max_progress": null,
      "time_frame": "none",
      "sort_order": 1
    }
  ],
  "achievements_by_category": {
    "performance": [...],
    "progress": [...]
  },
  "statistics": {
    "total": 15,
    "returned": 10,
    "categories": 4,
    "rarity_breakdown": {
      "common": 8,
      "rare": 5,
      "epic": 2
    }
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

---

### 🔒 Protected Endpoints (Authentication Required)

#### 2. Get All Achievements with User Progress

```http
GET /api/achievements
Authorization: Bearer <token>
```

**Description:** Get all achievements with user's personal progress data.

**Query Parameters:**

- `category` (optional): Filter by category
- `rarity` (optional): Filter by rarity
- `completed` (optional): Filter by completion status (`true`/`false`)
- `showcased` (optional): Filter by showcase status (`true`/`false`)

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/achievements?completed=true" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**

```json
{
  "message": "Achievements retrieved successfully",
  "achievements": [
    {
      "id": 1,
      "name": "Lightning Calculator",
      "description": "Complete 10 problems in under 30 seconds",
      "category": "performance",
      "type": "single",
      "rarity": "common",
      "icon": "⚡",
      "badge_color": "#FFD700",
      "points": 50,
      "coin_reward": 25,
      "experience_reward": 100,
      "condition_type": "speed_average",
      "condition_value": 3,
      "max_progress": null,
      "is_completed": true,
      "current_progress": 3,
      "completion_percentage": 100,
      "acquired_at": "2024-01-15T10:30:00Z",
      "is_showcased": false,
      "streak_count": 0,
      "best_streak": 0
    }
  ],
  "total": 5
}
```

#### 3. Get User's Achievements

```http
GET /api/achievements/user/:userId
Authorization: Bearer <token>
```

**Description:** Get achievements for a specific user.

**Parameters:**

- `userId` (path): Target user ID

**Query Parameters:**

- `completed` (optional): Filter by completion status
- `showcased` (optional): Filter by showcase status

#### 4. Create Achievement (Admin Only)

```http
POST /api/achievements/create
Authorization: Bearer <admin_token>
```

**Description:** Create a new achievement (admin privileges required).

**Request Body:**

```json
{
  "name": "Achievement Name",
  "description": "Achievement description",
  "category": "performance",
  "type": "single",
  "rarity": "common",
  "icon": "⚡",
  "badge_color": "#FFD700",
  "points": 100,
  "coin_reward": 50,
  "experience_reward": 200,
  "condition_type": "games_played",
  "condition_value": 10,
  "condition_operator": ">=",
  "max_progress": null,
  "is_hidden": false,
  "is_secret": false,
  "unlock_message": "Congratulations!"
}
```

#### 5. Check User Achievements

```http
POST /api/achievements/check
Authorization: Bearer <token>
```

**Description:** Check and award achievements based on user's current statistics and session data.

**Request Body:**

```json
{
  "session_data": {
    "game_session_id": 123,
    "consecutive_correct": 10,
    "accuracy_percentage": 95.5,
    "average_response_time": 2.5,
    "total_score": 850
  }
}
```

#### 6. Toggle Achievement Showcase

```http
PUT /api/achievements/:id/showcase
Authorization: Bearer <token>
```

**Description:** Toggle whether an achievement is showcased on user's profile.

**Parameters:**

- `id` (path): Achievement ID

#### 7. Get Achievement Leaderboard

```http
GET /api/achievements/leaderboard
Authorization: Bearer <token>
```

**Description:** Get leaderboard of users based on achievements.

**Query Parameters:**

- `period` (optional): Time period (`daily`, `weekly`, `monthly`, `all_time`) - default: `all_time`
- `limit` (optional): Number of top users to return (default: 50, max: 100)

---

## Quick Test Commands

### Test Public Endpoint (No Auth)

```bash
# Get all public achievements
curl -X GET "http://localhost:3000/api/achievements/public"

# Get performance achievements only
curl -X GET "http://localhost:3000/api/achievements/public?category=performance"

# Get rare achievements with pagination
curl -X GET "http://localhost:3000/api/achievements/public?rarity=rare&limit=5&offset=0"
```

### Test Protected Endpoints (With Auth)

```bash
# Replace YOUR_JWT_TOKEN with actual token from login

# Get user's achievements
curl -X GET "http://localhost:3000/api/achievements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get completed achievements only
curl -X GET "http://localhost:3000/api/achievements?completed=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get achievement leaderboard
curl -X GET "http://localhost:3000/api/achievements/leaderboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Achievement Categories

- **performance**: Speed, accuracy, scoring achievements
- **progress**: Games played, level progression
- **social**: Followers, likes, community interaction
- **consistency**: Daily play, streaks
- **special**: Secret and special event achievements
- **difficulty**: Challenge-based achievements

## Achievement Rarities

- **common**: Basic achievements for regular progress
- **rare**: Moderate difficulty achievements
- **epic**: Challenging achievements requiring skill
- **legendary**: Extremely difficult, prestigious achievements

## Achievement Types

- **single**: One-time achievement
- **progressive**: Multi-stage achievement with progress tracking
- **cumulative**: Builds over time with accumulated actions
