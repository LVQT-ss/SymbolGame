# Symbol Mobile App 🎮

A modern React Native gaming application featuring multiple game modes, social features, achievement system, and comprehensive user management.

## 📱 Project Overview

Symbol Mobile App is a comprehensive gaming platform built with React Native and Expo, featuring:

- Multiple game modes (Symbol Match, Memory Game, Speed Challenge, Puzzle Master)
- Complete user authentication system
- Real-time leaderboards with multiple ranking periods
- Achievement system with progress tracking
- Currency system (Coins & Gems)
- Social features with friend system
- Responsive design for all device sizes
- Dark theme with modern UI/UX

## 🏗️ Architecture

### **Frontend Stack**

- **React Native** 0.79.2
- **Expo SDK** ~53.0.9
- **TypeScript** for type safety
- **Expo Router** for file-based navigation
- **Expo Vector Icons** for consistent iconography

### **Database**

- **PostgreSQL** with comprehensive schema
- **Real-time data synchronization**
- **Optimized indexes for performance**

## 📱 Screens & Features

### 🔐 **Authentication System**

**Location**: `app/(auth)/Auth.tsx`

#### Features:

- **Dual Mode Interface**: Login & Registration in single screen
- **Form Validation**: Email format, password strength, username requirements
- **Real-time Feedback**: Loading states, success/error alerts
- **Security Features**: Password visibility toggle, secure input handling

#### User Flow:

1. User lands on authentication screen
2. Toggle between Login/Register modes
3. Input validation with clear error messages
4. Successful authentication redirects to main app

#### Technical Implementation:

```tsx
// Key Features
- Email format validation with regex
- Password minimum 6 characters
- Username editing with real-time validation
- Form reset on mode switch
- Loading states during API calls
```

---

### 🏠 **Home Dashboard**

**Location**: `app/(tabs)/home.tsx`

#### Features:

- **Dynamic Greeting**: Time-based greetings (Morning/Afternoon/Evening)
- **User Statistics**: Total score, games played, win rate
- **Level Progress**: XP tracking with visual progress bar
- **Current Rank**: Global ranking with total player count
- **Game Modes Grid**: 4 different game categories
- **Achievement Tracking**: Recent achievements with progress
- **Quick Actions**: Shortcuts to common features
- **Profile Modal**: Comprehensive user profile management

#### User Statistics Dashboard:

```tsx
// Displayed Metrics
- Total Score: 45,280 points
- Games Played: 127 games
- Win Rate: 78.5%
- Current Level: 24
- Global Rank: #5 out of 2,847 players
```

#### Game Modes:

1. **Symbol Match** (🔴 Red) - Match symbols to score points
2. **Memory Game** (🔵 Teal) - Test memory skills
3. **Speed Challenge** (🔵 Blue) - Race against time
4. **Puzzle Master** (🟢 Green) - Locked until level 30

#### Profile Modal Features:

- **Currency Display**: Coins (12,450) & Gems (89)
- **Editable Username**: In-place editing with validation
- **Statistics Grid**: Wins, losses, win rate, global rank
- **Experience Progress**: Visual XP bar with numeric display
- **Action Buttons**: Change avatar, share profile, logout

---

### 🏆 **Leaderboard System**

**Location**: `app/(tabs)/leaderboard.tsx`

#### Features:

- **Multiple Time Periods**: Daily, Weekly, All-time rankings
- **Top 3 Podium**: Special visual treatment for top players
- **Complete Rankings**: Full leaderboard with 20 sample players
- **User Highlighting**: Current user highlighted in gold
- **Pull-to-Refresh**: Real-time leaderboard updates
- **Player Profiles**: Tap to view player details

#### Leaderboard Structure:

```tsx
// Ranking Display
- Rank position (#1, #2, #3, etc.)
- Player avatar with profile image
- Username with level indicator
- Total score with formatted numbers
- Special icons for top 3 (Trophy, Medal, Bronze)
```

#### Interactive Elements:

- **Period Selection**: Toggle between Daily/Weekly/All-time
- **Refresh Button**: Manual refresh option
- **Player Cards**: Tap for player profile view
- **Current User**: Special highlighting and "(You)" indicator

---

## 💾 Database Schema

### **Core Tables**

#### **Users Table**

```sql
- id (UUID, Primary Key)
- username (Unique, 100 chars)
- email (Unique, 255 chars)
- password (Encrypted)
- full_name, avatar
- total_score, games_played, games_won, games_lost
- coins, gems (Currency system)
- level, experience, max_experience
- join_date, created_at, updated_at, last_login
- is_active (Boolean)
```

#### **Game Categories**

```sql
- id (UUID), name (Unique)
- display_name, description
- icon (Ionicons name), color (Hex)
- unlock_level, is_active
```

#### **Game Sessions**

```sql
- id (UUID), user_id, game_category_id
- score, duration_seconds, is_won
- moves_count, mistakes_count
- coins_earned, experience_gained
- started_at, ended_at, created_at
```

#### **Achievements System**

```sql
- achievements: id, name, title, description, icon
- requirement_type, requirement_value
- coins_reward, gems_reward, experience_reward

- user_achievements: user_id, achievement_id
- current_progress, is_earned, earned_at
```

#### **Leaderboards**

```sql
- user_id, game_category_id
- period_type (daily/weekly/monthly/all_time)
- period_start, period_end
- total_score, games_played, games_won
- win_rate, rank_position
```

### **Additional Tables**

- **friendships**: Friend system with request status
- **notifications**: Comprehensive notification system
- **currency_transactions**: Complete audit trail
- **user_settings**: Customizable preferences
- **posts, post_likes, post_comments**: Social features

## 🎨 Responsive Design

### **Device Support**

- **Phones**: < 768px (2 columns, compact layout)
- **Tablets**: 768-1024px (3 columns, enhanced spacing)
- **Large Screens**: > 1024px (4 columns, desktop experience)

### **Dynamic Features**

- **Font Scaling**: 1x/1.2x/1.4x based on device
- **Adaptive Padding**: 20px/24px/32px responsive spacing
- **Flexible Grids**: Auto-adjusting column counts
- **Orientation Support**: Portrait/landscape optimization

### **Responsive Components**

```tsx
// Dynamic Grid System
Phone: 2 columns (games, quick actions)
Tablet: 3 columns (optimized for touch)
Desktop: 4 columns (maximum content)

// Font Size Scaling
const getResponsiveFontSize = (baseSize: number) => {
  if (isLargeScreen) return baseSize * 1.4;
  if (isTablet) return baseSize * 1.2;
  return baseSize;
};
```

## 🔧 Technical Requirements

### **Development Environment**

```json
{
  "node": ">=16.0.0",
  "npm": ">=8.0.0",
  "expo-cli": "Latest"
}
```

### **Dependencies**

```json
{
  "expo": "~53.0.9",
  "react": "19.0.0",
  "react-native": "0.79.2",
  "expo-router": "~5.0.6",
  "@expo/vector-icons": "^14.1.0",
  "@react-navigation/bottom-tabs": "^7.3.10",
  "expo-status-bar": "~2.2.3",
  "typescript": "~5.8.3"
}
```

### **Features Implemented**

- ✅ Complete Authentication System
- ✅ Responsive Home Dashboard
- ✅ Interactive Leaderboards
- ✅ Profile Management Modal
- ✅ Currency System (Coins/Gems)
- ✅ Achievement Tracking
- ✅ Level & Experience System
- ✅ Dark Theme UI
- ✅ TypeScript Implementation
- ✅ Database Schema Design

## 🚀 Setup Instructions

### **1. Clone Repository**

```bash
git clone <repository-url>
cd symbol-mobile-app
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Configure Environment**

```bash
# Create .env file
DATABASE_URL=postgresql://username:password@localhost:5432/symbol_db
JWT_SECRET=your-jwt-secret-key
```

### **4. Database Setup**

```bash
# Run PostgreSQL migrations
psql -d symbol_db -f database/schema.sql
psql -d symbol_db -f database/sample_data.sql
```

### **5. Start Development Server**

```bash
npx expo start
```

### **6. Run on Device**

- **iOS**: Press `i` in terminal or scan QR code with Expo Go
- **Android**: Press `a` in terminal or scan QR code with Expo Go
- **Web**: Press `w` in terminal

## 📱 Screen Navigation

### **App Structure**

```
app/
├── _layout.tsx (Root layout with StatusBar)
├── (auth)/
│   ├── _layout.tsx (Auth stack navigation)
│   └── Auth.tsx (Login/Register screen)
└── (tabs)/
    ├── _layout.tsx (Tab navigation)
    ├── home.tsx (Main dashboard)
    └── leaderboard.tsx (Rankings)
```

### **Navigation Flow**

1. **App Launch** → Authentication Check
2. **Not Authenticated** → Auth Screen
3. **Authenticated** → Home Dashboard
4. **Tab Navigation** → Home ↔ Leaderboard
5. **Profile Modal** → Tap profile picture

## 🎮 Game Features

### **Planned Game Modes**

#### **1. Symbol Match**

- **Objective**: Match mathematical symbols (>, <, =)
- **Difficulty**: Progressive number ranges
- **Scoring**: Speed + accuracy bonus

#### **2. Memory Game**

- **Objective**: Remember and repeat symbol sequences
- **Mechanics**: Visual memory challenges
- **Progression**: Increasing sequence length

#### **3. Speed Challenge**

- **Objective**: Solve as many as possible in time limit
- **Time Pressure**: 30-second rounds
- **Scoring**: Correct answers per second

#### **4. Puzzle Master**

- **Objective**: Complex mathematical puzzles
- **Unlock**: Level 30 requirement
- **Difficulty**: Advanced problem solving

## 🏆 Achievement System

### **Achievement Categories**

- **First Steps**: Complete first game, first win
- **Consistency**: Daily play streaks, weekly goals
- **Mastery**: High scores, perfect games
- **Social**: Friend connections, shared content
- **Collection**: Unlock all game modes

### **Sample Achievements**

```tsx
{
  "first-win": {
    title: "First Victory",
    description: "Win your first game",
    icon: "trophy",
    requirement: "games_won >= 1",
    reward: "100 coins, 50 XP"
  },
  "speed-demon": {
    title: "Speed Demon",
    description: "Complete 10 games under 30 seconds",
    icon: "flash",
    requirement: "fast_games >= 10",
    reward: "500 coins, 200 XP"
  }
}
```

## 📊 API Endpoints (Backend Requirements)

### **Authentication**

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
PUT  /api/auth/profile
```

### **Game Management**

```
GET  /api/games/categories
POST /api/games/sessions
PUT  /api/games/sessions/:id
GET  /api/games/history
```

### **Leaderboards**

```
GET  /api/leaderboards/:period
GET  /api/leaderboards/user/:id
GET  /api/leaderboards/rank/:userId
```

### **Achievements**

```
GET  /api/achievements
GET  /api/achievements/user/:id
POST /api/achievements/progress
```

### **Social Features**

```
GET  /api/friends
POST /api/friends/request
PUT  /api/friends/accept/:id
GET  /api/notifications
PUT  /api/notifications/read
```

## 🔮 Future Enhancements

### **Phase 2 Features**

- [ ] Real-time multiplayer games
- [ ] Voice chat during games
- [ ] Tournament system
- [ ] Daily challenges
- [ ] Guild/team features

### **Phase 3 Features**

- [ ] AR game modes
- [ ] Video recording of gameplay
- [ ] Live streaming integration
- [ ] Machine learning difficulty adjustment
- [ ] Cross-platform tournaments

### **Technical Improvements**

- [ ] Offline mode support
- [ ] Push notifications
- [ ] Analytics integration
- [ ] Crash reporting
- [ ] Performance monitoring

## 🤝 Contributing

### **Development Guidelines**

1. Follow TypeScript strict mode
2. Use semantic commit messages
3. Maintain 80%+ test coverage
4. Follow React Native best practices
5. Update documentation for new features

### **Code Style**

- **ESLint**: Expo configuration
- **Prettier**: 2-space indentation
- **TypeScript**: Strict type checking
- **Components**: Functional components with hooks

## 📄 License

MIT License - see LICENSE file for details.

## 👥 Team

- **Frontend**: React Native + TypeScript
- **Backend**: Node.js + PostgreSQL
- **Design**: Modern gaming UI/UX
- **DevOps**: Expo managed workflow

---

## 📞 Support

For technical support or feature requests:

- Create an issue in the repository
- Contact development team
- Check documentation wiki

**Happy Gaming! 🎮🏆**
