# Historical Leaderboard Sync Guide

This functionality syncs **existing best scores** from your database to Redis leaderboard, so the leaderboard shows historical achievements, not just new games.

## ✨ What It Does

📊 **Populates Redis** with all historical best scores from database  
🎯 **Smart Updates** - Only updates if the score is actually better  
🏆 **Complete Leaderboards** - Shows all existing player achievements  
🚀 **Two Methods** - UserStatistics (fast) or GameHistory (comprehensive)

## 🔧 API Endpoints

### 1. Sync from UserStatistics (Recommended)

```http
POST /api/leaderboard/sync-historical-scores
Authorization: Bearer YOUR_TOKEN
```

**Fast method** - Gets best scores directly from `user_statistics` table

### 2. Sync from GameHistory (Comprehensive)

```http
POST /api/leaderboard/sync-gamehistory-scores
Authorization: Bearer YOUR_TOKEN
```

**Comprehensive method** - Calculates best scores from raw `game_history` data

## 📋 Response Format

```json
{
  "success": true,
  "data": {
    "totalProcessed": 150,
    "synced": 120,
    "skipped": 30,
    "message": "Historical scores synced to Redis successfully"
  }
}
```

## 🧪 Test Results

✅ **Working perfectly!** Our test showed:

- **UserStatistics sync**: Found 3 existing scores, properly skipped duplicates
- **GameHistory sync**: Found 4 scores, synced 1 new record (flow_test_user with 850 points)
- **Smart Logic**: Only updated when score was actually better
- **Final State**: Redis leaderboard now shows all historical best scores

## 📊 Before vs After

**Before Sync:**

```
Difficulty 1: 3 players (johndoe: 147, 123: 137, 111111: 135)
Difficulty 2: 1 player (flow_test_user: 700)
```

**After Sync:**

```
Difficulty 1: 3 players (same scores - no improvement found)
Difficulty 2: 1 player (flow_test_user: 850 - improved from GameHistory!)
```

## 🎯 When to Use

1. **First Time Setup** - Populate Redis with all existing scores
2. **After Data Migration** - Sync historical data to Redis
3. **Leaderboard Reset** - Restore Redis from database backups
4. **Development Testing** - Get realistic leaderboard data

## 🚀 Usage Examples

### Using curl:

```bash
# Sync from UserStatistics (faster)
curl -X POST http://localhost:3001/api/leaderboard/sync-historical-scores \
  -H "Authorization: Bearer YOUR_TOKEN"

# Sync from GameHistory (more comprehensive)
curl -X POST http://localhost:3001/api/leaderboard/sync-gamehistory-scores \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using your app:

```javascript
// In your frontend/mobile app
const response = await fetch("/api/leaderboard/sync-historical-scores", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${userToken}`,
  },
});

const result = await response.json();
console.log(`Synced ${result.data.synced} scores!`);
```

## 🎲 Check Results

After syncing, check your leaderboards:

```http
GET /api/leaderboard?difficulty_level=1&region=global&time_period=allTime
```

You should now see all historical best scores in Redis! 🏆

## ⚡ Performance Notes

- **UserStatistics sync**: Faster, uses pre-calculated best scores
- **GameHistory sync**: Slower but more accurate, calculates from raw data
- **Smart updates**: Only updates when score is actually better
- **No duplicates**: Won't overwrite better existing scores

Your Redis leaderboard is now populated with all historical best scores! 🎉
