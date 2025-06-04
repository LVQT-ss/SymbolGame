# 🎯 Admin Guide: Creating Game Sessions for Customers

## 🔐 Prerequisites

1. **Admin Account**: You must have a user account with `usertype: 'Admin'`
2. **JWT Token**: Login to get your admin JWT token
3. **Active Customers**: Target customers must have `usertype: 'Customer'` and `is_active: true`

---

## 🚨 **NEW RESTRICTION: Customer Game Access**

> **⚠️ IMPORTANT CHANGE**: Customers can **ONLY** play admin-assigned game sessions. They **CANNOT** create their own games.
>
> - ❌ `POST /api/game/start` - **ADMIN ONLY** (customers get 403 error)
> - ✅ `GET /api/game/assigned` - **NEW ENDPOINT** for customers to see assigned sessions
> - ✅ `POST /api/game/complete` - Customers can only complete admin-assigned sessions

---

## 📋 Step-by-Step Process

### **Step 1: Login as Admin**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin_teacher",
  "password": "your_admin_password"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userinfo": {
    "id": 1,
    "username": "admin_teacher",
    "usertype": "Admin"
  }
}
```

### **Step 2: Get Available Customers**

```bash
GET /api/admin/customers/available
Authorization: Bearer <your_admin_jwt_token>
```

**Response:**

```json
{
  "message": "Available customers retrieved successfully",
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  },
  "customers": [
    {
      "id": 5,
      "username": "student_alice",
      "full_name": "Alice Johnson",
      "avatar": "https://example.com/avatar5.jpg",
      "current_level": 3,
      "experience_points": 2500,
      "coins": 150,
      "statistics": {
        "games_played": 25,
        "best_score": 850,
        "total_score": 15000
      }
    }
  ]
}
```

### **Step 3: Create Game Session for Customer**

```bash
POST /api/admin/game/create-for-user
Authorization: Bearer <your_admin_jwt_token>
Content-Type: application/json

{
  "customer_id": 5,
  "difficulty_level": 3,
  "number_of_rounds": 15,
  "instructions": "Focus on accuracy over speed today. Take your time!"
}
```

**Response:**

```json
{
  "message": "Game session created successfully for customer",
  "admin": {
    "id": 1,
    "username": "admin_teacher"
  },
  "customer": {
    "id": 5,
    "username": "student_alice",
    "full_name": "Alice Johnson",
    "current_level": 3,
    "games_played": 25
  },
  "game_session": {
    "id": 156,
    "difficulty_level": 3,
    "number_of_rounds": 15,
    "instructions": "Focus on accuracy over speed today. Take your time!",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### **Step 4: Monitor Admin-Created Sessions**

```bash
GET /api/admin/game/sessions?status=active
Authorization: Bearer <your_admin_jwt_token>
```

**Response:**

```json
{
  "message": "Admin-created game sessions retrieved successfully",
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  },
  "sessions": [
    {
      "id": 156,
      "difficulty_level": 3,
      "number_of_rounds": 15,
      "completed": false,
      "score": 0,
      "admin_instructions": "Focus on accuracy over speed today. Take your time!",
      "createdAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": 5,
        "username": "student_alice",
        "full_name": "Alice Johnson",
        "current_level": 3
      }
    }
  ]
}
```

---

## 🎮 **Customer Workflow (NEW)**

### **Step 1: Customer Login**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "student_alice",
  "password": "customer_password"
}
```

### **Step 2: View Assigned Sessions**

```bash
GET /api/game/assigned?status=active
Authorization: Bearer <customer_jwt_token>
```

**Response:**

```json
{
  "message": "Assigned game sessions retrieved successfully",
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "sessions": [
    {
      "id": 156,
      "difficulty_level": 3,
      "number_of_rounds": 15,
      "completed": false,
      "score": 0,
      "admin_instructions": "Focus on accuracy over speed today. Take your time!",
      "created_at": "2024-01-15T10:30:00Z",
      "assigned_by": {
        "id": 1,
        "username": "admin_teacher",
        "full_name": "Teacher Johnson"
      }
    }
  ]
}
```

### **Step 3: Customer Tries to Create Game (BLOCKED)**

```bash
POST /api/game/start
Authorization: Bearer <customer_jwt_token>

{
  "difficulty_level": 2,
  "number_of_rounds": 10
}
```

**Response (403 Error):**

```json
{
  "message": "Only Admin users can create game sessions. Customers can only play admin-assigned sessions."
}
```

### **Step 4: Customer Completes Assigned Game**

```bash
POST /api/game/complete
Authorization: Bearer <customer_jwt_token>

{
  "game_session_id": 156,
  "total_time": 180.5,
  "rounds": [
    {
      "first_number": 15,
      "second_number": 8,
      "correct_symbol": ">",
      "user_symbol": ">",
      "response_time": 2.5
    }
  ]
}
```

**Response:**

```json
{
  "message": "Game completed successfully",
  "game_result": {
    "score": 850,
    "correct_answers": 8,
    "total_rounds": 10,
    "accuracy": 80,
    "experience_gained": 85,
    "coins_earned": 8,
    "session_type": "admin_assigned"
  }
}
```

### **Step 5: Customer Views Game History (Admin-Assigned Only)**

```bash
GET /api/game/history
Authorization: Bearer <customer_jwt_token>
```

**Response (Only Shows Admin-Assigned Sessions):**

```json
{
  "message": "Game history retrieved successfully",
  "games": [
    {
      "id": 156,
      "score": 850,
      "completed": true,
      "session_type": "admin_assigned",
      "assigned_by": {
        "id": 1,
        "username": "admin_teacher",
        "full_name": "Teacher Johnson"
      }
    }
  ]
}
```

---

## 📊 Admin Monitoring & Management

### **Filter Sessions by Status:**

```bash
# All sessions you created
GET /api/admin/game/sessions?status=all

# Only active (incomplete) sessions
GET /api/admin/game/sessions?status=active

# Only completed sessions
GET /api/admin/game/sessions?status=completed
```

### **Customer Selection Criteria:**

- ✅ Must be `usertype: 'Customer'`
- ✅ Must be `is_active: true`
- ✅ Shows current level and game statistics
- ✅ Ordered alphabetically by username

---

## 💡 Best Practices

### **1. Difficulty Level Selection:**

- **Level 1-2**: Beginners (numbers 1-10)
- **Level 3-5**: Intermediate (numbers 1-50)
- **Level 6-8**: Advanced (numbers 1-100)
- **Level 9-10**: Expert (numbers 1-500)

### **2. Number of Rounds:**

- **5-10 rounds**: Quick practice
- **10-15 rounds**: Standard session
- **15-25 rounds**: Comprehensive practice
- **25+ rounds**: Extended practice

### **3. Admin Instructions Examples:**

- `"Focus on accuracy over speed"`
- `"Try to improve your personal best of 850"`
- `"Practice level 3 difficulty before moving up"`
- `"Take breaks between rounds if needed"`

### **4. Session Management:**

- Create sessions based on student progress
- Monitor completion rates
- Track performance improvements
- Adjust difficulty based on results

---

## 🔧 API Endpoints Summary

### **Admin Endpoints:**

| Method | Endpoint                          | Description                 |
| ------ | --------------------------------- | --------------------------- |
| `GET`  | `/api/admin/customers/available`  | List active customers       |
| `POST` | `/api/admin/game/create-for-user` | Create session for customer |
| `GET`  | `/api/admin/game/sessions`        | View your created sessions  |

### **Customer Endpoints:**

| Method | Endpoint                  | Description                                   |
| ------ | ------------------------- | --------------------------------------------- |
| `GET`  | `/api/game/assigned`      | View admin-assigned sessions                  |
| `POST` | `/api/game/complete`      | Complete admin-assigned sessions              |
| `GET`  | `/api/game/history`       | View completed sessions (admin-assigned only) |
| `GET`  | `/api/game/stats/summary` | View statistics (admin-assigned only)         |

### **Restricted Endpoints for Customers:**

| Method | Endpoint          | Error Message                                                                                 |
| ------ | ----------------- | --------------------------------------------------------------------------------------------- |
| `POST` | `/api/game/start` | "Only Admin users can create game sessions. Customers can only play admin-assigned sessions." |

### **Query Parameters:**

- **Pagination**: `page`, `limit`
- **Status Filter**: `status=all|active|completed`

---

## 🚨 Error Handling

### **Admin Errors:**

```json
// 403 - Not an admin
{
  "message": "Admin access required"
}

// 404 - Customer not found
{
  "message": "Customer not found"
}

// 400 - Invalid customer type
{
  "message": "Target user must be a Customer"
}

// 400 - Inactive customer
{
  "message": "Customer account is inactive"
}
```

### **Customer Errors:**

```json
// 403 - Customer trying to create game
{
  "message": "Only Admin users can create game sessions. Customers can only play admin-assigned sessions."
}

// 403 - Customer trying to complete non-admin session
{
  "message": "Customers can only complete admin-assigned game sessions"
}

// 403 - Customer accessing admin-only endpoint
{
  "message": "This endpoint is for Customer users only"
}
```

---

## 🎯 Example Complete Workflow

```bash
# 1. Admin creates session for customer
curl -X POST http://localhost:3000/api/admin/game/create-for-user \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 5,
    "difficulty_level": 3,
    "number_of_rounds": 15,
    "instructions": "Focus on accuracy today!"
  }'

# 2. Customer views assigned sessions
curl -X GET http://localhost:3000/api/game/assigned \
  -H "Authorization: Bearer CUSTOMER_TOKEN"

# 3. Customer tries to create own game (FAILS)
curl -X POST http://localhost:3000/api/game/start \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"difficulty_level": 2}'

# Expected error: "Only Admin users can create game sessions..."

# 4. Customer completes assigned session
curl -X POST http://localhost:3000/api/game/complete \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "game_session_id": 156,
    "total_time": 180,
    "rounds": [...]
  }'

# 5. Admin monitors completion
curl -X GET http://localhost:3000/api/admin/game/sessions?status=completed \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 🎊 System Benefits

### **For Admins (Teachers):**

- ✅ **Full Control**: Only admins can create game sessions
- ✅ **Student Monitoring**: Track all assigned sessions
- ✅ **Custom Instructions**: Add personalized guidance
- ✅ **Progress Tracking**: Monitor completion and performance

### **For Customers (Students):**

- ✅ **Guided Learning**: Play only teacher-assigned sessions
- ✅ **Clear Structure**: No confusion about what to play
- ✅ **Teacher Support**: Receive custom instructions
- ✅ **Automatic Rewards**: Still earn XP, coins, and level up

### **System-Wide:**

- ✅ **Quality Control**: All sessions are teacher-approved
- ✅ **Educational Focus**: No random student-created games
- ✅ **Consistent Experience**: Standardized difficulty progression
- ✅ **Anti-Cheating**: Admin oversight prevents gaming the system

---

## 🔒 **Security & Access Control**

- **Admins**: Full access to create/monitor sessions
- **Customers**: Restricted to admin-assigned content only
- **JWT Validation**: All endpoints verify user type
- **Database Constraints**: `created_by_admin` field tracks ownership
- **Error Handling**: Clear messaging for access violations

---

The system now ensures **complete educational control** while maintaining all existing functionality for valid use cases!
