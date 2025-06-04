# 📊 Leaderboard System API Documentation

## Overview

The Leaderboard System is a competitive ranking feature that creates healthy competition among players in the SmartKid Math Game. It tracks player performance across multiple categories and time periods, encouraging continued engagement and skill improvement.

## Table of Contents

- [Leaderboard Categories](#leaderboard-categories)
- [Time Periods](#time-periods)
- [Tier System](#tier-system)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Integration Guide](#integration-guide)
- [Data Models](#data-models)
- [Best Practices](#best-practices)

---

## Leaderboard Categories

### 🏆 **Performance-Based Leaderboards**

#### 1. Overall Score

- **Type**: `overall_score`
- **Description**: Total accumulated points across all games
- **Ranking Criteria**: Sum of all game session scores
- **Use Case**: General skill measurement

#### 2. Best Single Game

- **Type**: `best_single_game`
- **Description**: Highest score achieved in a single game session
- **Ranking Criteria**: Maximum single game score
- **Use Case**: Peak performance measurement

#### 3. Speed Masters

- **Type**: `speed_masters`
- **Description**: Fastest average response times
- **Ranking Criteria**: Lowest average response time per question
- **Use Case**: Quick thinking and reflexes

#### 4. Accuracy Kings

- **Type**: `accuracy_kings`
- **Description**: Highest accuracy percentages
- **Ranking Criteria**: Overall accuracy across all games
- **Use Case**: Precision and consistency

### 📈 **Progress-Based Leaderboards**

#### 5. Experience Leaders

- **Type**: `experience_leaders`
- **Description**: Most experience points earned
- **Ranking Criteria**: Total XP accumulated
- **Use Case**: Long-term progression tracking

#### 6. Level Champions

- **Type**: `level_champions`
- **Description**: Highest current levels
- **Ranking Criteria**: Current user level
- **Use Case**: Advancement and growth

### 👥 **Social Leaderboards**

#### 7. Most Followed

- **Type**: `most_followed`
- **Description**: Users with the most followers
- **Ranking Criteria**: Follower count
- **Use Case**: Social popularity

#### 8. Most Liked

- **Type**: `most_liked`
- **Description**: Players whose games receive the most likes
- **Ranking Criteria**: Total likes received on game sessions
- **Use Case**: Community appreciation

### 🎮 **Activity-Based Leaderboards**

#### 9. Most Active

- **Type**: `most_active`
- **Description**: Users with the most game sessions played
- **Ranking Criteria**: Total number of games played
- **Use Case**: Engagement and dedication

#### 10. Achievement Hunters

- **Type**: `achievement_hunters`
- **Description**: Most achievements unlocked
- **Ranking Criteria**: Number of completed achievements
- **Use Case**: Completionist tracking

---

## Time Periods

### 📅 **Available Periods**

| Period       | Description            | Reset Frequency   | Use Case               |
| ------------ | ---------------------- | ----------------- | ---------------------- |
| **Daily**    | Last 24 hours          | Every midnight    | Short-term competition |
| **Weekly**   | Current week           | Every Monday      | Medium-term goals      |
| **Monthly**  | Current month          | 1st of each month | Long-term achievement  |
| **All-Time** | Since account creation | Never             | Historical records     |

### ⏰ **Period Calculation**

- **Daily**: 00:00:00 to 23:59:59 of current day
- **Weekly**: Monday 00:00:00 to Sunday 23:59:59
- **Monthly**: 1st day 00:00:00 to last day 23:59:59
- **All-Time**: No date restrictions

---

## Tier System

### 💎 **Ranking Tiers**

| Tier         | Icon | Rank Range | Description       | Benefits                               |
| ------------ | ---- | ---------- | ----------------- | -------------------------------------- |
| **Diamond**  | 💎   | #1         | Ultimate champion | Exclusive rewards, special recognition |
| **Platinum** | 🥇   | #2-10      | Elite players     | Premium rewards, status badge          |
| **Gold**     | 🥈   | #11-50     | High performers   | Good rewards, featured status          |
| **Silver**   | 🥉   | #51-200    | Above average     | Standard rewards                       |
| **Bronze**   | 🏅   | #201+      | Participation     | Basic rewards, motivation              |

### 📈 **Trend Indicators**

- **Up** ⬆️ - Improved rank since last update
- **Down** ⬇️ - Decreased rank since last update
- **Stable** ➡️ - Rank unchanged
- **New** 🆕 - First time on leaderboard

---

## API Endpoints

### 1. Get Leaderboard

**Endpoint:** `GET /api/leaderboard`

**Description:** Retrieve leaderboard entries for specific type and period

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | overall_score | Leaderboard category |
| `period` | string | No | all_time | Time period |
| `limit` | integer | No | 50 | Number of entries (max: 100) |
| `offset` | integer | No | 0 | Skip entries for pagination |

**Valid Types:**

- `overall_score`, `best_single_game`, `speed_masters`, `accuracy_kings`
- `experience_leaders`, `level_champions`, `most_followed`, `most_liked`
- `most_active`, `achievement_hunters`

**Valid Periods:**

- `daily`, `weekly`, `monthly`, `all_time`

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:3000/api/leaderboard?type=overall_score&period=weekly&limit=10"
```

**Response:**

```json
{
  "message": "Leaderboard retrieved successfully",
  "leaderboard_type": "overall_score",
  "time_period": "weekly",
  "period_info": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-07T23:59:59.999Z"
  },
  "total_entries": 10,
  "user_rank": {
    "position": 5,
    "score": 8750,
    "tier": "gold",
    "trend": "up"
  },
  "entries": [
    {
      "rank": 1,
      "user": {
        "id": 123,
        "username": "mathpro",
        "full_name": "Alex Chen",
        "avatar": "avatar.jpg",
        "level": 15
      },
      "score": 15240,
      "secondary_score": 98.5,
      "tier": "diamond",
      "trend": "up",
      "rank_change": 2,
      "games_count": 45,
      "last_game_date": "2024-01-07T14:30:00.000Z",
      "is_personal_best": true,
      "is_season_best": true,
      "extra_data": {
        "average_accuracy": 96.2,
        "best_streak": 25
      }
    }
  ]
}
```

### 2. Get Leaderboard Types

**Endpoint:** `GET /api/leaderboard/types`

**Description:** Get all available leaderboard types with descriptions

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/leaderboard/types"
```

**Response:**

```json
{
  "message": "Leaderboard types retrieved successfully",
  "types": [
    {
      "type": "overall_score",
      "name": "Overall Score Leaders",
      "description": "Total accumulated points across all games",
      "category": "performance",
      "icon": "🏆"
    },
    {
      "type": "speed_masters",
      "name": "Speed Masters",
      "description": "Fastest average response times",
      "category": "performance",
      "icon": "⚡"
    },
    {
      "type": "accuracy_kings",
      "name": "Accuracy Kings",
      "description": "Highest accuracy percentages",
      "category": "performance",
      "icon": "🎯"
    }
  ]
}
```

### 3. Get User Ranks

**Endpoint:** `GET /api/leaderboard/user/:userId`

**Description:** Get user's ranks across all leaderboards

**Parameters:**

- `userId` (path): User ID to check ranks for

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | Time period (default: all_time) |

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/leaderboard/user/123?period=weekly"
```

**Response:**

```json
{
  "message": "User ranks retrieved successfully",
  "user": {
    "id": 123,
    "username": "mathpro",
    "full_name": "Alex Chen",
    "avatar": "avatar.jpg",
    "current_level": 15
  },
  "period": "weekly",
  "statistics": {
    "games_played": 156,
    "best_score": 2450,
    "total_score": 45320,
    "achievements_unlocked": 12
  },
  "ranks": [
    {
      "leaderboard_type": "overall_score",
      "rank_position": 5,
      "score_value": 45320,
      "tier": "gold",
      "trend": "up",
      "rank_change": 2,
      "is_personal_best": true,
      "last_updated": "2024-01-07T12:00:00.000Z"
    },
    {
      "leaderboard_type": "speed_masters",
      "rank_position": 12,
      "score_value": 2.1,
      "tier": "gold",
      "trend": "stable",
      "rank_change": 0,
      "is_personal_best": false,
      "last_updated": "2024-01-07T12:00:00.000Z"
    }
  ],
  "best_overall_rank": 5
}
```

### 4. Update Leaderboards (Admin Only)

**Endpoint:** `POST /api/leaderboard/update`

**Description:** Manually refresh leaderboard calculations (Admin only)

**Request Body:**

```json
{
  "types": ["overall_score", "speed_masters"],
  "periods": ["daily", "weekly"]
}
```

**Response:**

```json
{
  "message": "Leaderboards updated successfully",
  "updated_count": 4,
  "types_updated": ["overall_score", "speed_masters"],
  "periods_updated": ["daily", "weekly"]
}
```

---

## Usage Examples

### Frontend Integration Example

```javascript
class LeaderboardManager {
  constructor(apiToken) {
    this.token = apiToken;
    this.baseUrl = "http://localhost:3000/api";
  }

  // Get leaderboard data
  async getLeaderboard(
    type = "overall_score",
    period = "all_time",
    limit = 50
  ) {
    const params = new URLSearchParams({
      type,
      period,
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}/leaderboard?${params}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    return response.json();
  }

  // Get all leaderboard types
  async getLeaderboardTypes() {
    const response = await fetch(`${this.baseUrl}/leaderboard/types`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    return response.json();
  }

  // Get user's rank across all leaderboards
  async getUserRanks(userId, period = "all_time") {
    const response = await fetch(
      `${this.baseUrl}/leaderboard/user/${userId}?period=${period}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    return response.json();
  }

  // Display leaderboard in UI
  renderLeaderboard(entries, userRank) {
    const leaderboardContainer = document.getElementById("leaderboard");

    let html = '<div class="leaderboard-entries">';

    entries.forEach((entry, index) => {
      const isCurrentUser = entry.user.id === this.currentUserId;
      html += `
        <div class="leaderboard-entry ${
          isCurrentUser ? "current-user" : ""
        } tier-${entry.tier}">
          <div class="rank">${entry.rank}</div>
          <div class="tier-badge">${this.getTierIcon(entry.tier)}</div>
          <div class="user-info">
            <img src="${entry.user.avatar}" alt="${
        entry.user.username
      }" class="avatar">
            <div class="user-details">
              <div class="username">${entry.user.username}</div>
              <div class="level">Level ${entry.user.level}</div>
            </div>
          </div>
          <div class="score">${entry.score.toLocaleString()}</div>
          <div class="trend">${this.getTrendIcon(entry.trend)}</div>
        </div>
      `;
    });

    html += "</div>";

    if (userRank) {
      html += `
        <div class="user-rank-summary">
          <h3>Your Rank: #${userRank.position}</h3>
          <p>Score: ${userRank.score.toLocaleString()}</p>
          <p>Tier: ${userRank.tier}</p>
        </div>
      `;
    }

    leaderboardContainer.innerHTML = html;
  }

  getTierIcon(tier) {
    const icons = {
      diamond: "💎",
      platinum: "🥇",
      gold: "🥈",
      silver: "🥉",
      bronze: "🏅",
    };
    return icons[tier] || "🏅";
  }

  getTrendIcon(trend) {
    const icons = {
      up: "⬆️",
      down: "⬇️",
      stable: "➡️",
      new: "🆕",
    };
    return icons[trend] || "➡️";
  }
}

// Usage example
const leaderboardManager = new LeaderboardManager(userToken);

// Load and display overall score leaderboard
async function loadLeaderboard() {
  try {
    const data = await leaderboardManager.getLeaderboard(
      "overall_score",
      "weekly",
      20
    );
    leaderboardManager.renderLeaderboard(data.entries, data.user_rank);
  } catch (error) {
    console.error("Failed to load leaderboard:", error);
  }
}

// Load user's ranks across all leaderboards
async function loadUserProfile(userId) {
  try {
    const ranks = await leaderboardManager.getUserRanks(userId, "all_time");
    displayUserRanks(ranks);
  } catch (error) {
    console.error("Failed to load user ranks:", error);
  }
}
```

### Real-time Updates Example

```javascript
// WebSocket integration for real-time leaderboard updates
class RealTimeLeaderboard extends LeaderboardManager {
  constructor(apiToken, socketUrl) {
    super(apiToken);
    this.socket = new WebSocket(socketUrl);
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "leaderboard_update":
          this.handleLeaderboardUpdate(data);
          break;
        case "rank_change":
          this.handleRankChange(data);
          break;
        case "new_record":
          this.handleNewRecord(data);
          break;
      }
    };
  }

  handleLeaderboardUpdate(data) {
    // Refresh current leaderboard display
    if (this.currentLeaderboardType === data.leaderboard_type) {
      this.refreshLeaderboard();
    }
  }

  handleRankChange(data) {
    // Show rank change notification
    if (data.user_id === this.currentUserId) {
      this.showRankChangeNotification(data);
    }
  }

  handleNewRecord(data) {
    // Show new record celebration
    this.showRecordNotification(data);
  }

  showRankChangeNotification(data) {
    const message =
      data.rank_change > 0
        ? `🎉 You moved up ${data.rank_change} positions to rank #${data.new_rank}!`
        : `You dropped ${Math.abs(data.rank_change)} positions to rank #${
            data.new_rank
          }`;

    this.showNotification(message, data.rank_change > 0 ? "success" : "info");
  }
}
```

### React Component Example

```jsx
import React, { useState, useEffect } from "react";

const LeaderboardComponent = ({ userToken, userId }) => {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [selectedType, setSelectedType] = useState("overall_score");
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedType, selectedPeriod]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/leaderboard?type=${selectedType}&period=${selectedPeriod}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setLeaderboardData(data);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      diamond: "#B9F2FF",
      platinum: "#E5E4E2",
      gold: "#FFD700",
      silver: "#C0C0C0",
      bronze: "#CD7F32",
    };
    return colors[tier] || "#CD7F32";
  };

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-controls">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="overall_score">Overall Score</option>
          <option value="speed_masters">Speed Masters</option>
          <option value="accuracy_kings">Accuracy Kings</option>
          <option value="most_active">Most Active</option>
        </select>

        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="all_time">All Time</option>
        </select>
      </div>

      {leaderboardData?.user_rank && (
        <div className="user-rank-card">
          <h3>Your Rank: #{leaderboardData.user_rank.position}</h3>
          <p>Score: {leaderboardData.user_rank.score.toLocaleString()}</p>
          <div
            className="tier-badge"
            style={{
              backgroundColor: getTierColor(leaderboardData.user_rank.tier),
            }}
          >
            {leaderboardData.user_rank.tier.toUpperCase()}
          </div>
        </div>
      )}

      <div className="leaderboard-entries">
        {leaderboardData?.entries.map((entry) => (
          <div
            key={entry.user.id}
            className={`leaderboard-entry ${
              entry.user.id === userId ? "current-user" : ""
            }`}
            style={{ borderLeft: `4px solid ${getTierColor(entry.tier)}` }}
          >
            <div className="rank">#{entry.rank}</div>
            <img
              src={entry.user.avatar}
              alt={entry.user.username}
              className="avatar"
            />
            <div className="user-info">
              <div className="username">{entry.user.username}</div>
              <div className="level">Level {entry.user.level}</div>
            </div>
            <div className="score">{entry.score.toLocaleString()}</div>
            <div className="trend">
              {entry.trend === "up" && "⬆️"}
              {entry.trend === "down" && "⬇️"}
              {entry.trend === "stable" && "➡️"}
              {entry.trend === "new" && "🆕"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardComponent;
```

---

## Integration Guide

### Step 1: Initialize Leaderboard System

```javascript
// Initialize leaderboard on app start
async function initializeLeaderboards() {
  try {
    // Get available leaderboard types
    const types = await fetch("/api/leaderboard/types", {
      headers: { Authorization: `Bearer ${userToken}` },
    }).then((res) => res.json());

    // Store types in app state
    app.leaderboardTypes = types.types;

    // Set up leaderboard navigation
    renderLeaderboardTabs(types.types);

    // Load default leaderboard
    loadLeaderboard("overall_score", "weekly");
  } catch (error) {
    console.error("Failed to initialize leaderboards:", error);
  }
}
```

### Step 2: Game Session Integration

```javascript
// Update leaderboards after game completion
async function onGameComplete(gameData) {
  try {
    // Save game session first
    await saveGameSession(gameData);

    // Leaderboards are automatically updated by the system
    // But you can trigger manual refresh if needed
    if (gameData.isNewPersonalBest) {
      // Refresh current leaderboard to show updated position
      await refreshCurrentLeaderboard();

      // Show achievement notification
      showNotification(`🎉 New personal best! Score: ${gameData.score}`);
    }
  } catch (error) {
    console.error("Error updating leaderboards:", error);
  }
}
```

### Step 3: Periodic Updates

```javascript
// Set up periodic leaderboard refresh
class LeaderboardUpdater {
  constructor(interval = 30000) {
    // 30 seconds
    this.interval = interval;
    this.isActive = false;
  }

  start() {
    this.isActive = true;
    this.updateLoop();
  }

  stop() {
    this.isActive = false;
  }

  async updateLoop() {
    while (this.isActive) {
      try {
        await this.refreshActiveLeaderboards();
        await this.sleep(this.interval);
      } catch (error) {
        console.error("Leaderboard update error:", error);
        await this.sleep(this.interval);
      }
    }
  }

  async refreshActiveLeaderboards() {
    // Only refresh currently visible leaderboards
    const activeLeaderboard = getCurrentLeaderboardView();
    if (activeLeaderboard) {
      const freshData = await leaderboardManager.getLeaderboard(
        activeLeaderboard.type,
        activeLeaderboard.period
      );
      updateLeaderboardDisplay(freshData);
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Usage
const updater = new LeaderboardUpdater(30000);
updater.start();
```

---

## Data Models

### LeaderboardEntry Model

```javascript
{
  id: Integer,
  user_id: Integer,
  leaderboard_type: String,
  time_period: String,
  period_start: DateTime,
  period_end: DateTime,
  rank_position: Integer,
  previous_rank: Integer,
  score_value: Float,
  secondary_value: Float,
  tier: String,
  games_count: Integer,
  last_game_date: DateTime,
  trend: String,
  points_change: Integer,
  rank_change: Integer,
  is_season_best: Boolean,
  is_personal_best: Boolean,
  is_record_holder: Boolean,
  extra_data: JSON,
  is_active: Boolean,
  last_updated: DateTime,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Leaderboard Response Format

```javascript
{
  message: String,
  leaderboard_type: String,
  time_period: String,
  period_info: {
    start: DateTime,
    end: DateTime
  },
  total_entries: Integer,
  user_rank: {
    position: Integer,
    score: Number,
    tier: String,
    trend: String
  },
  entries: [
    {
      rank: Integer,
      user: {
        id: Integer,
        username: String,
        full_name: String,
        avatar: String,
        level: Integer
      },
      score: Number,
      secondary_score: Number,
      tier: String,
      trend: String,
      rank_change: Integer,
      games_count: Integer,
      last_game_date: DateTime,
      is_personal_best: Boolean,
      is_season_best: Boolean,
      extra_data: Object
    }
  ]
}
```

---

## Best Practices

### 1. Performance Optimization

```javascript
// Implement caching for leaderboard data
class CachedLeaderboardManager extends LeaderboardManager {
  constructor(apiToken, cacheTimeout = 60000) {
    super(apiToken);
    this.cache = new Map();
    this.cacheTimeout = cacheTimeout;
  }

  async getLeaderboard(type, period, limit) {
    const cacheKey = `${type}-${period}-${limit}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await super.getLeaderboard(type, period, limit);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }
}
```

### 2. Error Handling

```javascript
// Graceful error handling for leaderboard failures
async function safeGetLeaderboard(type, period) {
  try {
    return await leaderboardManager.getLeaderboard(type, period);
  } catch (error) {
    console.error("Leaderboard fetch failed:", error);

    // Return cached data if available
    const cached = localStorage.getItem(`leaderboard-${type}-${period}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Return empty leaderboard structure
    return {
      message: "Leaderboard temporarily unavailable",
      entries: [],
      user_rank: null,
      total_entries: 0,
    };
  }
}
```

### 3. User Experience Enhancements

```javascript
// Smooth rank change animations
function animateRankChange(oldRank, newRank) {
  const rankElement = document.getElementById("user-rank");

  if (newRank < oldRank) {
    // Rank improved
    rankElement.classList.add("rank-up");
    showCelebration(`🎉 Rank up! You're now #${newRank}!`);
  } else if (newRank > oldRank) {
    // Rank dropped
    rankElement.classList.add("rank-down");
    showEncouragement(`Keep playing to improve your rank!`);
  }

  // Remove animation classes after animation completes
  setTimeout(() => {
    rankElement.classList.remove("rank-up", "rank-down");
  }, 2000);
}

// Highlight user's position in leaderboard
function highlightUserPosition(entries, userId) {
  return entries.map((entry) => ({
    ...entry,
    isCurrentUser: entry.user.id === userId,
    showArrow: entry.user.id === userId,
  }));
}
```

### 4. Analytics Integration

```javascript
// Track leaderboard interactions
function trackLeaderboardView(type, period) {
  analytics.track("leaderboard_viewed", {
    leaderboard_type: type,
    time_period: period,
    user_level: getCurrentUserLevel(),
    timestamp: new Date().toISOString(),
  });
}

function trackRankChange(oldRank, newRank, leaderboardType) {
  analytics.track("rank_changed", {
    old_rank: oldRank,
    new_rank: newRank,
    rank_change: oldRank - newRank,
    leaderboard_type: leaderboardType,
    improvement: newRank < oldRank,
  });
}
```

### 5. Mobile Optimization

```javascript
// Responsive leaderboard for mobile devices
function adaptLeaderboardForMobile() {
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    // Show fewer entries on mobile
    return 20;
  }

  return 50;
}

// Implement infinite scrolling for mobile
class MobileLeaderboard {
  constructor() {
    this.currentOffset = 0;
    this.limit = 20;
    this.loading = false;
  }

  async loadMore() {
    if (this.loading) return;

    this.loading = true;
    try {
      const data = await leaderboardManager.getLeaderboard(
        this.currentType,
        this.currentPeriod,
        this.limit,
        this.currentOffset
      );

      this.appendEntries(data.entries);
      this.currentOffset += this.limit;
    } finally {
      this.loading = false;
    }
  }

  setupInfiniteScroll() {
    window.addEventListener("scroll", () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 1000
      ) {
        this.loadMore();
      }
    });
  }
}
```

---

This comprehensive leaderboard system creates engaging competition and motivates players to continuously improve their performance in your SmartKid Math Game! 🏆📊✨
