# 🎮 Instant Game API - Implementation Guide

## Overview

The **Instant Game API** allows any authenticated user to create and play math comparison games immediately without waiting for admin assignment. This is a "Quick Play" feature that creates a complete game session with rounds ready for immediate gameplay.

## 🚀 Key Features

- ✅ **Instant game creation** - No admin dependency
- ✅ **Automatic round generation** - Based on difficulty level
- ✅ **Custom rounds support** - Optional predefined rounds
- ✅ **Full game tracking** - All gameplay data is stored
- ✅ **Reward system** - XP, coins, and level progression
- ✅ **Compatible with existing APIs** - Uses same submission/completion flow

## 📋 API Endpoint

### `POST /api/game/create-instant`

Creates an instant game session for the authenticated user.

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body (Optional)

```javascript
{
  "difficulty_level": 3,        // Optional: 1-10 (default: 1)
  "number_of_rounds": 10,       // Optional: 1-50 (default: 10)
  "custom_rounds": [            // Optional: predefined rounds
    {
      "first_number": 25,
      "second_number": 17
    },
    {
      "first_number": 8,
      "second_number": 8
    }
  ]
}
```

#### Response (201 Created)

```javascript
{
  "message": "Instant game created successfully! You can start playing immediately.",
  "player": {
    "id": 42,
    "username": "player123",
    "full_name": "John Doe",
    "current_level": 5
  },
  "game_session": {
    "id": 789,                    // Use this ID for subsequent API calls
    "difficulty_level": 3,
    "number_of_rounds": 10,
    "time_limit": 600,            // 10 minutes total
    "round_time_limit": 60,       // 60 seconds per round
    "points_per_correct": 100,
    "created_at": "2024-01-15T10:30:00.000Z",
    "status": "ready_to_play"
  },
  "rounds": [
    {
      "round_number": 1,
      "first_number": 34,
      "second_number": 21
      // Note: correct_symbol is hidden for security
    },
    {
      "round_number": 2,
      "first_number": 15,
      "second_number": 28
    }
    // ... more rounds
  ],
  "instructions": {
    "how_to_play": "Compare the two numbers and choose the correct symbol: > (greater than), < (less than), or = (equal to)",
    "scoring": "100 points per correct answer",
    "time_limit": "60 seconds per round, 10 minutes total",
    "next_steps": [
      "Use POST /api/game/789/submit-round to submit each round",
      "Use POST /api/game/complete to finish the game when all rounds are done",
      "Use GET /api/game/789 to check current progress"
    ]
  }
}
```

## 🎯 Complete Gameplay Flow

### 1. Create Instant Game

```bash
curl -X POST http://localhost:3000/api/game/create-instant \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "difficulty_level": 2,
    "number_of_rounds": 5
  }'
```

### 2. Play Each Round

```bash
curl -X POST http://localhost:3000/api/game/789/submit-round \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "round_number": 1,
    "user_symbol": ">",
    "response_time": 2.5
  }'
```

### 3. Complete Game

```bash
curl -X POST http://localhost:3000/api/game/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "game_session_id": 789,
    "total_time": 25.5,
    "rounds": [...]
  }'
```

## 🗄️ Database Storage

### What Gets Stored

#### GameSession Table

```sql
INSERT INTO game_sessions (
  user_id,              -- Player who created the game
  difficulty_level,     -- 1-10 difficulty
  number_of_rounds,     -- Total rounds
  total_time,           -- Will be updated on completion
  correct_answers,      -- Will be updated on completion
  score,                -- Will be updated on completion
  completed,            -- FALSE initially
  is_public,            -- TRUE (visible to others)
  created_by_admin,     -- NULL (user-created, not admin)
  admin_instructions    -- NULL
) VALUES (42, 3, 10, 0, 0, 0, FALSE, TRUE, NULL, NULL);
```

#### RoundDetail Table (For each round)

```sql
INSERT INTO round_details (
  game_session_id,      -- Links to game session
  round_number,         -- 1, 2, 3, ...
  first_number,         -- Generated based on difficulty
  second_number,        -- Generated based on difficulty
  correct_symbol,       -- Calculated: >, <, or =
  user_symbol,          -- NULL initially, filled when user plays
  response_time,        -- NULL initially, filled when user plays
  is_correct           -- FALSE initially, calculated when user plays
) VALUES (789, 1, 34, 21, '>', NULL, NULL, FALSE);
```

## ⚙️ Implementation Details

### Difficulty Level System

```javascript
// Number range based on difficulty
const maxNumber = Math.min(10 + difficulty_level * 10, 100);

// Examples:
// Level 1: 1-20
// Level 2: 1-30
// Level 3: 1-40
// Level 5: 1-60
// Level 10: 1-100 (max)
```

### Automatic Round Generation

```javascript
function generateDifficultyBasedRounds(numberOfRounds, difficultyLevel = 1) {
  const rounds = [];
  const maxNumber = Math.min(10 + difficultyLevel * 10, 100);

  for (let i = 0; i < numberOfRounds; i++) {
    rounds.push({
      first_number: Math.floor(Math.random() * maxNumber) + 1,
      second_number: Math.floor(Math.random() * maxNumber) + 1,
    });
  }
  return rounds;
}
```

### Correct Symbol Calculation

```javascript
// System automatically calculates correct answer
let correct_symbol;
if (first_number > second_number) {
  correct_symbol = ">";
} else if (first_number < second_number) {
  correct_symbol = "<";
} else {
  correct_symbol = "=";
}
```

## 🔄 Integration with Existing System

### Compatible APIs

After creating an instant game, users can use all existing game APIs:

- **`GET /api/game/:id`** - Check game progress
- **`POST /api/game/:id/submit-round`** - Submit individual rounds
- **`POST /api/game/complete`** - Complete the game and get rewards
- **`GET /api/game/history`** - View completed games
- **`GET /api/game/stats/summary`** - View player statistics

### Reward System

When game is completed:

```javascript
// Scoring
const finalScore = correctAnswers * 100; // 100 points per correct

// Rewards
const experienceGained = Math.floor(finalScore * 0.1); // 10% of score as XP
const coinsEarned = correctAnswers; // 1 coin per correct answer

// Level progression
const newLevel = Math.floor((currentXP + experienceGained) / 1000) + 1;
```

## 🔐 Security & Validation

### Input Validation

- `difficulty_level`: Must be 1-10
- `number_of_rounds`: Must be 1-50
- `custom_rounds`: Must match `number_of_rounds` if provided
- JWT authentication required

### Data Security

- Correct answers are not exposed in API responses
- User can only access their own game sessions
- Game state properly tracked to prevent cheating

## 🎮 Use Cases

### 1. Quick Practice

```javascript
// 5-round easy game
POST /api/game/create-instant
{
  "difficulty_level": 1,
  "number_of_rounds": 5
}
```

### 2. Challenge Mode

```javascript
// 20-round hard game
POST /api/game/create-instant
{
  "difficulty_level": 8,
  "number_of_rounds": 20
}
```

### 3. Custom Training

```javascript
// Specific number combinations
POST /api/game/create-instant
{
  "number_of_rounds": 3,
  "custom_rounds": [
    {"first_number": 99, "second_number": 1},
    {"first_number": 50, "second_number": 50},
    {"first_number": 25, "second_number": 75}
  ]
}
```

## 📊 Benefits

### For Users

- ✅ **Instant gameplay** - No waiting for admin assignment
- ✅ **Flexible difficulty** - Choose your challenge level
- ✅ **Progress tracking** - All games stored in history
- ✅ **Rewards earned** - XP, coins, and level progression

### For System

- ✅ **Reduced admin workload** - Users can self-serve
- ✅ **Increased engagement** - More games played
- ✅ **Scalable design** - No bottlenecks
- ✅ **Data rich** - Complete gameplay analytics

## 🔧 Technical Implementation

The instant game API was implemented by:

1. **Adding `createInstantGame` function** in `game.controller.js`
2. **Adding route** `POST /api/game/create-instant` in `game.route.js`
3. **Reusing existing models** - GameSession and RoundDetail
4. **Maintaining compatibility** with existing submission/completion APIs
5. **Adding comprehensive Swagger documentation**

This approach ensures the new feature integrates seamlessly with the existing system while providing the instant gameplay experience users want!
