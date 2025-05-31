# Symbol Mobile App - Complete API Documentation 🚀

A comprehensive list of all API endpoints required for the Symbol Mobile App gaming platform.

## 📋 API Overview

**Base URL**: `https://api.symbolapp.com/v1`
**Authentication**: JWT Bearer Token (except auth endpoints)
**Response Format**: JSON
**HTTP Status Codes**: Standard REST conventions

---

## 🔐 Authentication & User Management

### **Authentication Endpoints**

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
POST   /api/auth/resend-verification
```

### **User Profile Endpoints**

```
GET    /api/users/profile              # Get current user profile
PUT    /api/users/profile              # Update user profile
POST   /api/users/avatar               # Upload profile avatar
DELETE /api/users/avatar               # Remove profile avatar
GET    /api/users/{userId}             # Get specific user profile (public)
PUT    /api/users/username             # Update username
PUT    /api/users/password             # Change password
DELETE /api/users/account              # Delete user account
```

### **User Settings**

```
GET    /api/users/settings             # Get user preferences
PUT    /api/users/settings             # Update user settings
PUT    /api/users/settings/privacy     # Update privacy settings
PUT    /api/users/settings/notifications # Update notification preferences
```

---

## 🎮 Game Management

### **Game Categories**

```
GET    /api/games/categories           # Get all game categories
GET    /api/games/categories/{id}      # Get specific game category
GET    /api/games/categories/unlocked  # Get unlocked games for user
```

### **Game Sessions**

```
POST   /api/games/sessions             # Start new game session
GET    /api/games/sessions/{id}        # Get game session details
PUT    /api/games/sessions/{id}        # Update game session (submit score)
POST   /api/games/sessions/{id}/end    # End game session
GET    /api/games/sessions/history     # Get user's game history
GET    /api/games/sessions/recent      # Get recent games
```

### **Game Statistics**

```
GET    /api/games/stats                # Get user's overall game stats
GET    /api/games/stats/{categoryId}   # Get stats for specific game
GET    /api/games/stats/summary        # Get stats summary for dashboard
GET    /api/games/stats/streaks        # Get winning/playing streaks
```

---

## 🏆 Leaderboards & Rankings

### **Leaderboard Endpoints**

```
GET    /api/leaderboards/daily         # Daily leaderboard
GET    /api/leaderboards/weekly        # Weekly leaderboard
GET    /api/leaderboards/monthly       # Monthly leaderboard
GET    /api/leaderboards/all-time      # All-time leaderboard
GET    /api/leaderboards/friends       # Friends-only leaderboard
GET    /api/leaderboards/{categoryId}  # Game-specific leaderboards
```

### **User Rankings**

```
GET    /api/rankings/user              # Current user's ranking
GET    /api/rankings/user/{userId}     # Specific user's ranking
GET    /api/rankings/around-user       # Rankings around current user
GET    /api/rankings/top               # Top 10/50/100 players
```

---

## 🏅 Achievement System

### **Achievement Endpoints**

```
GET    /api/achievements               # Get all available achievements
GET    /api/achievements/user          # Get user's achievements
GET    /api/achievements/progress      # Get achievement progress
POST   /api/achievements/claim/{id}    # Claim achievement reward
GET    /api/achievements/recent        # Get recently earned achievements
GET    /api/achievements/categories    # Get achievement categories
```

### **Achievement Progress**

```
PUT    /api/achievements/progress/{id} # Update achievement progress
GET    /api/achievements/unlocked      # Get unlocked achievements
GET    /api/achievements/locked        # Get locked achievements
GET    /api/achievements/completion    # Get completion percentage
```

---

## 💰 Currency & Economy

### **Currency Management**

```
GET    /api/currency/balance           # Get user's currency balance
POST   /api/currency/earn              # Award currency to user
POST   /api/currency/spend             # Spend user currency
GET    /api/currency/transactions      # Get transaction history
POST   /api/currency/purchase          # Purchase currency (IAP)
```

### **Store & Purchases**

```
GET    /api/store/items                # Get store items
POST   /api/store/purchase             # Purchase store item
GET    /api/store/purchases            # Get user purchases
POST   /api/store/verify               # Verify purchase receipt
```

---

## 👥 Social Features

### **Friends System**

```
GET    /api/friends                    # Get user's friends list
POST   /api/friends/request            # Send friend request
PUT    /api/friends/accept/{userId}    # Accept friend request
PUT    /api/friends/decline/{userId}   # Decline friend request
DELETE /api/friends/{userId}           # Remove friend
GET    /api/friends/requests           # Get pending requests
GET    /api/friends/suggestions        # Get friend suggestions
```

### **Social Posts & Comments**

```
GET    /api/posts                      # Get posts feed
POST   /api/posts                      # Create new post
GET    /api/posts/{id}                 # Get specific post
PUT    /api/posts/{id}                 # Update post
DELETE /api/posts/{id}                 # Delete post
POST   /api/posts/{id}/like            # Like/unlike post
POST   /api/posts/{id}/comments        # Add comment to post
GET    /api/posts/{id}/comments        # Get post comments
```

### **User Search & Discovery**

```
GET    /api/users/search               # Search users by username
GET    /api/users/nearby               # Find nearby players (location-based)
GET    /api/users/top-players          # Get top players
GET    /api/users/active               # Get currently active users
```

---

## 🔔 Notifications

### **Notification Management**

```
GET    /api/notifications              # Get user notifications
PUT    /api/notifications/{id}/read    # Mark notification as read
PUT    /api/notifications/read-all     # Mark all as read
DELETE /api/notifications/{id}         # Delete notification
POST   /api/notifications/subscribe    # Subscribe to push notifications
PUT    /api/notifications/preferences  # Update notification preferences
```

### **Push Notifications**

```
POST   /api/notifications/register-device # Register device for push
DELETE /api/notifications/unregister-device # Unregister device
POST   /api/notifications/send         # Send notification (admin)
GET    /api/notifications/history      # Get notification history
```

---

## 📊 Analytics & Statistics

### **User Analytics**

```
GET    /api/analytics/dashboard        # Get dashboard analytics
GET    /api/analytics/playtime         # Get playtime statistics
GET    /api/analytics/performance      # Get performance metrics
GET    /api/analytics/trends           # Get user trends
POST   /api/analytics/event            # Track custom event
```

### **Game Analytics**

```
GET    /api/analytics/games/popular    # Get popular games
GET    /api/analytics/games/difficulty # Get difficulty statistics
GET    /api/analytics/games/completion # Get completion rates
GET    /api/analytics/sessions         # Get session analytics
```

---

## 🎯 Daily Challenges & Events

### **Daily Challenges**

```
GET    /api/challenges/daily           # Get daily challenges
POST   /api/challenges/complete/{id}   # Complete challenge
GET    /api/challenges/progress        # Get challenge progress
GET    /api/challenges/rewards         # Get available rewards
POST   /api/challenges/claim/{id}      # Claim challenge reward
```

### **Special Events**

```
GET    /api/events/active              # Get active events
GET    /api/events/upcoming            # Get upcoming events
POST   /api/events/participate/{id}    # Participate in event
GET    /api/events/leaderboard/{id}    # Get event leaderboard
POST   /api/events/claim-reward/{id}   # Claim event reward
```

---

## 🔧 Administrative Endpoints

### **Admin User Management**

```
GET    /api/admin/users                # Get all users (paginated)
PUT    /api/admin/users/{id}/ban       # Ban user
PUT    /api/admin/users/{id}/unban     # Unban user
GET    /api/admin/users/banned         # Get banned users
PUT    /api/admin/users/{id}/role      # Update user role
```

### **Admin Game Management**

```
POST   /api/admin/games/categories     # Create game category
PUT    /api/admin/games/categories/{id} # Update game category
DELETE /api/admin/games/categories/{id} # Delete game category
PUT    /api/admin/games/maintenance    # Toggle maintenance mode
```

### **Admin Analytics**

```
GET    /api/admin/analytics/overview   # Get platform overview
GET    /api/admin/analytics/users      # Get user analytics
GET    /api/admin/analytics/games      # Get game analytics
GET    /api/admin/analytics/revenue    # Get revenue analytics
```

---

## 🔄 Real-time Features (WebSocket)

### **WebSocket Endpoints**

```
WS     /ws/leaderboard                 # Real-time leaderboard updates
WS     /ws/friends                     # Real-time friend activity
WS     /ws/notifications               # Real-time notifications
WS     /ws/game-sessions               # Real-time game updates
WS     /ws/chat                        # Real-time chat (if implemented)
```

---

## 📝 Request/Response Examples

### **Authentication - Login**

```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "user": {
      "id": "uuid",
      "username": "player123",
      "email": "user@example.com",
      "level": 24,
      "coins": 12450,
      "gems": 89
    }
  }
}
```

### **Game Session - Start Game**

```json
POST /api/games/sessions
{
  "gameCategory": "symbol-match",
  "difficulty": "medium"
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "gameCategory": "symbol-match",
    "startedAt": "2024-01-01T10:00:00Z",
    "timeLimit": 300,
    "status": "active"
  }
}
```

### **Leaderboard - Get Daily Rankings**

```json
GET /api/leaderboards/daily

Response:
{
  "success": true,
  "data": {
    "period": "daily",
    "lastUpdated": "2024-01-01T10:00:00Z",
    "rankings": [
      {
        "rank": 1,
        "userId": "uuid",
        "username": "TopPlayer",
        "score": 15680,
        "level": 28,
        "avatar": "avatar-url"
      }
    ],
    "userRank": {
      "rank": 5,
      "score": 12450
    }
  }
}
```

---

## 🔒 Authentication & Security

### **Headers Required**

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-Client-Version: 1.0.0
X-Platform: ios|android|web
```

### **Rate Limiting**

```
Auth endpoints: 5 requests/minute
Game endpoints: 30 requests/minute
Leaderboard: 10 requests/minute
General: 100 requests/minute
```

### **Error Response Format**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

---

## 📋 Implementation Priority

### **Phase 1 - Core APIs**

1. ✅ Authentication endpoints
2. ✅ User profile management
3. ✅ Basic game sessions
4. ✅ Leaderboards (daily/weekly/all-time)
5. ✅ Currency system basics

### **Phase 2 - Enhanced Features**

6. 🔄 Achievement system
7. 🔄 Social features (friends)
8. 🔄 Notifications
9. 🔄 Daily challenges
10. 🔄 Advanced analytics

### **Phase 3 - Advanced Features**

11. ⏳ Real-time features (WebSocket)
12. ⏳ Special events
13. ⏳ Advanced social features
14. ⏳ Admin panel APIs
15. ⏳ Machine learning recommendations

---

This comprehensive API documentation covers all endpoints needed to support the Symbol Mobile App's complete feature set as described in the README.md file.
