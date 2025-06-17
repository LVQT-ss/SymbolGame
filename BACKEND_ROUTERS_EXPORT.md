# Backend Routers & Web Utils Export

## Backend Main Application (backend/index.js)

The main backend application is built with Express.js and includes the following core setup:

- **Framework**: Express.js
- **Port**: 3000 (default) or from environment variable
- **Database**: PostgreSQL with Sequelize ORM
- **Documentation**: Swagger/OpenAPI at `/api-docs`
- **Base API URL**: `/api`

### Middleware Used:

- `express.json()` - JSON body parser
- `cookieParser()` - Cookie parsing
- `cors()` - Cross-origin resource sharing
- Custom token verification middleware

### Health Check:

- **GET** `/api/health` - API health status endpoint

---

## All Backend Routers Summary

### 1. Authentication Router (`/api/auth`)

**File**: `backend/routes/auth.route.js`

| Method | Endpoint                    | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| POST   | `/api/auth/register`        | Register new user (Customer/Admin) |
| POST   | `/api/auth/login`           | User login with statistics         |
| POST   | `/api/auth/forgot-password` | Request password reset             |
| POST   | `/api/auth/reset-password`  | Reset password with token          |

**Exported Functions**: `register`, `login`, `requestPasswordReset`, `resetPassword`

---

### 2. User Router (`/api/user`)

**File**: `backend/routes/user.route.js`

| Method | Endpoint                   | Description                   |
| ------ | -------------------------- | ----------------------------- |
| GET    | `/api/user/getalluser`     | Get all users with statistics |
| GET    | `/api/user/getallcustomer` | Get all customer users only   |
| PUT    | `/api/user/update/:userId` | Update user profile           |
| DELETE | `/api/user/delete/:userId` | Delete user account           |
| POST   | `/api/user/logout`         | User logout                   |
| GET    | `/api/user/:userId`        | Get specific user by ID       |

**Exported Functions**: `getAllUsers`, `getUserById`, `updateUser`, `deleteUser`, `getAllCustomer`, `logout`

---

### 3. Social Router (`/api/users`)

**File**: `backend/routes/social.route.js`

| Method | Endpoint                       | Description              |
| ------ | ------------------------------ | ------------------------ |
| GET    | `/api/users/:userId/stats`     | Get user statistics      |
| POST   | `/api/users/:userId/follow`    | Follow a user            |
| DELETE | `/api/users/:userId/unfollow`  | Unfollow a user          |
| GET    | `/api/users/:userId/followers` | Get user's followers     |
| GET    | `/api/users/:userId/following` | Get users being followed |

**Exported Functions**: `getUserStats`, `followUser`, `unfollowUser`, `getUserFollowers`, `getUserFollowing`

---

### 4. Game Router (`/api/game`)

**File**: `backend/routes/game.route.js`

| Method | Endpoint                        | Description                             |
| ------ | ------------------------------- | --------------------------------------- |
| POST   | `/api/game/start`               | Start new game (Admin only)             |
| POST   | `/api/game/admin/create-custom` | Create custom game session (Admin only) |
| GET    | `/api/game/assigned`            | Get assigned games (Customer only)      |
| POST   | `/api/game/complete`            | Complete game session                   |
| GET    | `/api/game/history`             | Get game history                        |
| GET    | `/api/game/stats`               | Get game statistics summary             |
| GET    | `/api/game/admin/dashboard`     | Admin game dashboard                    |
| GET    | `/api/game/available`           | Get available games                     |

**Exported Functions**: `startGame`, `completeGame`, `getGameHistory`, `getGameStatsSummary`, `getAssignedSessions`, `createGameWithCustomRounds`, `getAdminGameDashboard`, `getAvailableGames`

---

### 5. Comment Router (`/api/game/sessions`)

**File**: `backend/routes/comment.route.js`

| Method | Endpoint                                            | Description                    |
| ------ | --------------------------------------------------- | ------------------------------ |
| POST   | `/api/game/sessions/:sessionId/comments`            | Create comment on game session |
| GET    | `/api/game/sessions/:sessionId/comments`            | Get comments for session       |
| PUT    | `/api/game/sessions/:sessionId/comments/:commentId` | Update comment                 |
| DELETE | `/api/game/sessions/:sessionId/comments/:commentId` | Delete comment                 |
| POST   | `/api/game/sessions/:sessionId/like`                | Like game session              |
| DELETE | `/api/game/sessions/:sessionId/like`                | Unlike game session            |
| GET    | `/api/game/sessions/:sessionId/likes`               | Get session likes              |

**Exported Functions**: `createComment`, `getComments`, `updateComment`, `deleteComment`, `likeSession`, `unlikeSession`, `getSessionLikes`

---

### 6. Leaderboard Router (`/api/leaderboard`)

**File**: `backend/routes/leaderboard.route.js`

| Method | Endpoint                        | Description                            |
| ------ | ------------------------------- | -------------------------------------- |
| GET    | `/api/leaderboard`              | Get leaderboard by type and period     |
| GET    | `/api/leaderboard/types`        | Get available leaderboard types        |
| GET    | `/api/leaderboard/user/:userId` | Get user ranks across all leaderboards |
| POST   | `/api/leaderboard/update`       | Update leaderboards (Admin only)       |

**Leaderboard Types**:

- `overall_score`, `best_single_game`, `speed_masters`, `accuracy_kings`
- `experience_leaders`, `level_champions`, `most_followed`, `most_liked`
- `most_active`, `achievement_hunters`

**Time Periods**: `daily`, `weekly`, `monthly`, `all_time`

**Exported Functions**: `getLeaderboard`, `getLeaderboardTypes`, `getUserRanks`, `updateLeaderboards`

---

### 7. Notification Router (`/api/notifications`)

**File**: `backend/routes/notification.route.js`

| Method | Endpoint                      | Description               |
| ------ | ----------------------------- | ------------------------- |
| GET    | `/api/notifications`          | Get follow notifications  |
| PUT    | `/api/notifications/:id/read` | Mark notification as read |

**Exported Functions**: `getFollowNotifications`, `markNotificationAsRead`

---

### 8. Achievement Router (`/api/achievements`)

**File**: `backend/routes/achievement.route.js`

| Method | Endpoint                         | Description                       |
| ------ | -------------------------------- | --------------------------------- |
| GET    | `/api/achievements/public`       | Get public achievements (no auth) |
| POST   | `/api/achievements/create`       | Create achievement (Admin only)   |
| GET    | `/api/achievements`              | Get all achievements              |
| GET    | `/api/achievements/user/:userId` | Get user achievements             |
| POST   | `/api/achievements/check`        | Check user achievements           |
| PUT    | `/api/achievements/:id/showcase` | Toggle showcase achievement       |
| GET    | `/api/achievements/leaderboard`  | Get achievement leaderboard       |

**Achievement Categories**: `performance`, `progress`, `social`, `consistency`, `special`, `difficulty`

**Exported Functions**: `createAchievement`, `getAllAchievements`, `getUserAchievements`, `checkUserAchievements`, `toggleShowcase`, `getAchievementLeaderboard`, `getPublicAchievements`

---

### 9. Admin Router (`/api/admin`)

**File**: `backend/routes/admin.route.js`

| Method | Endpoint                     | Description                   |
| ------ | ---------------------------- | ----------------------------- |
| GET    | `/api/admin/customers/count` | Get customer count statistics |

**Exported Functions**: `getCustomerCount`

---

### 10. Transaction Router (`/api/transaction`)

**File**: `backend/routes/transaction.route.js`

**Status**: Empty file (0 lines) - No routes implemented yet

---

## Web Utils API Functions

### File: `web/src/Utils/ApiFunctions.js`

**Base Configuration**:

- **Base URL**: `https://symbolgame.onrender.com/api`
- **Timeout**: 10 seconds
- **HTTP Client**: Axios

### Available Functions:

#### Authentication Functions:

```javascript
// User registration
async function register(userData)
// Parameters: { usertype, username, email, password, full_name?, avatar?, age? }
// Returns: Registration response with user data

// User signout
async function signout()
// Removes token from localStorage
// Returns: { success: true }
```

### Utility Functions:

```javascript
// Get authorization headers
const getHeader = () => {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};
```

### Exported Functions:

- `register` - User registration
- `signout` - User logout

**Note**: The ApiFunctions.js file appears to be incomplete, containing only basic authentication functions. Additional API functions for games, social features, leaderboards, etc., would need to be implemented to match the backend router capabilities.

---

## Authentication & Authorization

### Token-based Authentication:

- JWT tokens stored in localStorage
- Authorization header: `Bearer <token>`
- Protected routes use `verifyToken` middleware

### User Types:

- **Admin**: Full access, can create games, manage users
- **Customer**: Limited access, can play assigned games, social features

### Route Access Control:

- **Public**: Health check, public achievements, auth endpoints
- **Authenticated**: Most game and social features
- **Admin Only**: Game creation, user management, admin statistics
- **Customer Only**: Assigned game sessions

---

## Database Integration

### Features:

- PostgreSQL database with Sequelize ORM
- Automatic database initialization and synchronization
- Model associations setup
- Graceful shutdown handling

### Health Monitoring:

- Database connection validation
- API health check endpoint
- Error handling and logging
