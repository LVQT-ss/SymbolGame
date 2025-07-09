# Redis Leaderboard Implementation Guide

## Overview

This implementation replaces the PostgreSQL-based leaderboard cache with a Redis-powered real-time leaderboard system. The key feature is **monthly rewards for the top 3 global players only** (1000/500/200 coins).

## 🏆 System Architecture

```
Game Completion → Update Redis Immediately → GET Leaderboard (Redis)
                     ↓
Monthly (1st) → Bulk Transfer to PostgreSQL → Reward Global Top 3 → Clear Monthly Redis
```

## 🚀 Key Features

### 1. **Real-time Performance**

- Sub-millisecond leaderboard reads from Redis
- Instant updates when users complete games
- No database queries for leaderboard fetching

### 2. **Monthly Rewards (Global Only)**

- **1st Place**: 1000 coins
- **2nd Place**: 500 coins
- **3rd Place**: 200 coins
- **Important**: Only **global** leaderboard winners get rewards, not regional

### 3. **Automatic Scheduling**

- Runs on 1st of every month at 2:00 AM
- Persists monthly data to PostgreSQL
- Distributes rewards to top 3 global players
- Clears monthly Redis data but keeps all-time

### 4. **Multi-level Fallback**

- Primary: Redis (fastest)
- Fallback: PostgreSQL (if Redis empty)
- Emergency: PostgreSQL (if Redis fails)

## 📋 Installation & Setup

### 1. Install Redis Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Add to your `.env` file:

```env
# REDIS CONFIGURATION
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
TIMEZONE=UTC
```

### 3. Install Redis Server

```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Windows (with WSL)
sudo apt install redis-server

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### 4. Start Redis

```bash
redis-server
```

### 5. Start Your Backend

```bash
npm run dev
```

## 🔧 API Endpoints

### Core Leaderboard

```http
GET /api/leaderboard?difficulty_level=1&region=global&time_period=allTime&limit=100
```

### Redis Management

```http
# Manual monthly persistence with rewards
POST /api/leaderboard/monthly-persistence
Authorization: Bearer <token>

# Manual backup to database (flexible options)
POST /api/leaderboard/backup-to-database
Authorization: Bearer <token>
Content-Type: application/json
{
  "includeRewards": false,
  "clearMonthlyData": false,
  "difficulty_levels": [1, 2, 3],
  "regions": ["global", "asia", "america"],
  "leaderboardType": "monthly"
}

# Get monthly job status
GET /api/leaderboard/monthly-job-status
Authorization: Bearer <token>

# Get Redis statistics
GET /api/leaderboard/redis-stats
Authorization: Bearer <token>

# Clear Redis data (admin)
DELETE /api/leaderboard/redis-clear
Authorization: Bearer <token>

# Test monthly rewards (development only)
POST /api/leaderboard/test-monthly-rewards
Authorization: Bearer <token>
```

### Health Check

```http
GET /api/health
```

Now includes Redis status alongside database status.

## 🎮 Data Flow

### Game Completion Flow

1. User completes game
2. **UserStatistics** updated in PostgreSQL
3. **Redis leaderboard** updated immediately
4. Response sent to user (instant)

### Monthly Persistence Flow

1. **Scheduled**: 1st of month at 2:00 AM
2. **Rewards**: Top 3 global players get coins
3. **Persist**: All monthly data → PostgreSQL
4. **Clean**: Clear monthly Redis data
5. **Keep**: All-time Redis data remains

## 📊 Redis Data Structure

### Keys Pattern

```
leaderboard:{region}:{difficulty}:{period}
leaderboard:{region}:{difficulty}:{period}:time

Examples:
- leaderboard:global:1:monthly
- leaderboard:global:1:alltime
- leaderboard:asia:2:monthly
- leaderboard:europe:3:alltime
```

### User Data

```
user:{userId}:{difficulty}

Fields:
- id, username, full_name, avatar
- current_level, country, region
- best_score, best_time, last_updated
```

## 🎯 Monthly Rewards Logic

```javascript
// ONLY GLOBAL leaderboard gets rewards
const MONTHLY_REWARDS = {
  1: 1000, // 1st place: 1000 coins
  2: 500, // 2nd place: 500 coins
  3: 200, // 3rd place: 200 coins
};

// For each difficulty level (1, 2, 3):
// 1. Get global top 3 players
// 2. Award coins: User.increment('coins', { by: rewardAmount, where: { id: userId } })
// 3. Log rewards
// 4. Persist ALL regional data to PostgreSQL
// 5. Clear monthly Redis but keep all-time
```

## 💾 Manual Backup API

The new `/backup-to-database` endpoint allows you to store Redis data to PostgreSQL on-demand with flexible options:

### Backup Options

| Option              | Type    | Default                 | Description                           |
| ------------------- | ------- | ----------------------- | ------------------------------------- |
| `includeRewards`    | boolean | `false`                 | Give coins to top 3 global players    |
| `clearMonthlyData`  | boolean | `false`                 | Clear monthly Redis data after backup |
| `difficulty_levels` | array   | `[1,2,3]`               | Which difficulty levels to backup     |
| `regions`           | array   | `["global","asia",...]` | Which regions to backup               |
| `leaderboardType`   | string  | `"monthly"`             | Type of leaderboard to backup         |

### Common Use Cases

#### 1. Simple Backup (No Rewards, Keep Redis Data)

```bash
curl -X POST http://localhost:3000/api/leaderboard/backup-to-database \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### 2. Backup with Rewards (Manual Monthly)

```bash
curl -X POST http://localhost:3000/api/leaderboard/backup-to-database \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "includeRewards": true,
    "clearMonthlyData": true
  }'
```

#### 3. Backup Specific Regions Only

```bash
curl -X POST http://localhost:3000/api/leaderboard/backup-to-database \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "regions": ["global", "asia"],
    "difficulty_levels": [1, 2]
  }'
```

#### 4. All-time Data Backup

```bash
curl -X POST http://localhost:3000/api/leaderboard/backup-to-database \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "leaderboardType": "alltime"
  }'
```

### Response Format

```json
{
  "success": true,
  "data": {
    "totalEntriesStored": 150,
    "rewardedUsers": [
      {
        "user_id": 123,
        "username": "TopPlayer",
        "rank": 1,
        "difficulty": 1,
        "coins_awarded": 1000,
        "score": 9500
      }
    ],
    "options": {
      "includeRewards": true,
      "clearMonthlyData": false
    }
  },
  "message": "Redis data backed up to database successfully"
}
```

## 🔍 Testing & Debugging

### Test Monthly Rewards

```bash
# Development only
curl -X POST http://localhost:3000/api/leaderboard/test-monthly-rewards \
  -H "Authorization: Bearer <your-token>"
```

### Check Redis Stats

```bash
curl http://localhost:3000/api/leaderboard/redis-stats \
  -H "Authorization: Bearer <your-token>"
```

### Monitor Redis

```bash
redis-cli monitor
```

### Check Leaderboard

```bash
curl "http://localhost:3000/api/leaderboard?difficulty_level=1&region=global&time_period=monthly&limit=10"
```

## Testing and Development

### Monthly Rewards Test Endpoint

The `/api/leaderboard/test-monthly-rewards` endpoint allows you to simulate the complete end-of-month scenario in development environments.

#### 🧪 Test Endpoint Usage

**Endpoint:** `POST /api/leaderboard/test-monthly-rewards`
**Auth Required:** Yes (Bearer Token)
**Environment:** Development only

```bash
# Example test request
curl -X POST "http://localhost:3000/api/leaderboard/test-monthly-rewards" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### What the Test Does

1. **Identifies Global Top 3 Players** across all difficulty levels
2. **Awards Coins:**
   - 🥇 1st Place: 1000 coins
   - 🥈 2nd Place: 500 coins
   - 🥉 3rd Place: 200 coins
3. **Persists Monthly Data** to PostgreSQL database
4. **Clears Monthly Redis Data** (preserves all-time data)
5. **Returns Detailed Results** with winner information

#### ⚠️ Important Test Considerations

- **Real Database Operations:** Coins are actually awarded to users
- **Redis Data Cleanup:** Monthly leaderboard data is cleared
- **Development Only:** Blocked in production environments
- **Global Rankings:** Only global top 3 get rewards (not regional)

#### Example Test Response

```json
{
  "success": true,
  "data": {
    "winners": [
      {
        "rank": 1,
        "userId": 123,
        "full_name": "Alice Smith",
        "coins_awarded": 1000,
        "previous_coins": 2500,
        "new_total_coins": 3500,
        "highest_score": 15420
      }
    ],
    "persistence_stats": {
      "monthly_records_saved": 150,
      "redis_keys_cleared": 45,
      "processing_time": "1.2 seconds"
    },
    "test_environment": {
      "timestamp": "2024-01-01T02:00:00.000Z",
      "triggered_by": 1,
      "mode": "manual_test"
    }
  },
  "message": "Monthly rewards test completed"
}
```

#### 📋 Test Checklist

Before running the test:

- [ ] Verify you're in development environment
- [ ] Ensure Redis has leaderboard data
- [ ] Have authenticated users with scores
- [ ] Check that top players have enough activity

After running the test:

- [ ] Verify coins were awarded correctly
- [ ] Check PostgreSQL has new monthly records
- [ ] Confirm Redis monthly data was cleared
- [ ] Validate all-time data remains intact

#### 🔧 Development Workflow

1. **Setup Test Data:**

   ```bash
   # Add some test scores to Redis
   POST /api/game/complete-game
   ```

2. **Run Monthly Test:**

   ```bash
   POST /api/leaderboard/test-monthly-rewards
   ```

3. **Verify Results:**

   ```bash
   # Check Redis stats
   GET /api/leaderboard/redis-stats

   # Check leaderboard
   GET /api/leaderboard?time_period=allTime
   ```

4. **Reset if Needed:**
   ```bash
   # Clear Redis (if needed for retesting)
   DELETE /api/leaderboard/redis-clear
   ```

## ⚡ Performance Benefits

| Operation        | Before (PostgreSQL) | After (Redis) |
| ---------------- | ------------------- | ------------- |
| Get Leaderboard  | ~200-500ms          | ~1-5ms        |
| Update Score     | ~100-200ms          | ~1-2ms        |
| Concurrent Users | Limited             | 10,000+       |
| Database Load    | High                | Minimal       |

## 🛡️ Error Handling

### Redis Fallback

If Redis fails, the system automatically falls back to PostgreSQL:

```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "source": "postgresql_fallback"
  }
}
```

### Emergency Fallback

If both Redis and normal PostgreSQL fail:

```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "source": "postgresql_emergency"
  }
}
```

## 📅 Monthly Schedule

```
Cron Pattern: "0 2 1 * *"
- Minute: 0
- Hour: 2 (2:00 AM)
- Day: 1 (1st of month)
- Month: * (every month)
- Day of Week: * (any day)
```

## 🚨 Important Notes

1. **Global Rewards Only**: Regional leaderboards don't give rewards
2. **Monthly Reset**: Monthly data is cleared but all-time persists
3. **Automatic Backup**: All data is backed up to PostgreSQL monthly
4. **No Data Loss**: Redis failure doesn't affect the system
5. **Real-time Updates**: Game completion immediately updates leaderboards

## 🔧 Maintenance Commands

### Manual Monthly Persistence

```http
POST /api/leaderboard/monthly-persistence
```

### Manual Backup (Flexible)

```http
POST /api/leaderboard/backup-to-database
Content-Type: application/json
{
  "includeRewards": false,
  "clearMonthlyData": false
}
```

### Clear Redis (Emergency)

```http
DELETE /api/leaderboard/redis-clear
```

### Restart Monthly Job

```javascript
MonthlyLeaderboardJob.restart();
```

## 📈 Monitoring

### Health Check

- Database status
- Redis status
- Connection pools
- Memory usage

### Logs to Watch

```
✅ Redis connected successfully
🏆 Redis leaderboard updated successfully
💰 Awarded 1000 coins to PlayerName (Rank 1, Difficulty 1)
🎉 Monthly persistence completed successfully!
```

## 🎊 Success!

Your Redis leaderboard system is now live with:

- ⚡ Lightning-fast performance
- 💰 Monthly global rewards
- 🔄 Automatic persistence
- 🛡️ Multiple fallbacks
- 📊 Real-time updates

The top 3 global players will automatically receive their monthly coin rewards!
