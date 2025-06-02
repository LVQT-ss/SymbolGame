# 🎮 Game Session Creation Guide for Admins

## 🎯 **Overview: 3 Ways to Create Game Sessions**

As an **Admin (Teacher)**, you have **3 different ways** to create game sessions for your students:

1. **Individual Assignment** - Create session for ONE specific customer
2. **🆕 Bulk Assignment** - Create sessions for ALL customers at once
3. **Customer Self-Assignment** - ❌ **BLOCKED** (customers cannot create their own sessions)

---

## 🎲 **🆕 Pre-Generated Round Details System**

### **How It Works:**

When you create game sessions, the system now automatically **pre-generates all round details**:

✅ **Standardized Questions**: All students get the exact same questions
✅ **Fixed Number Range**: All games use numbers 1-50 for consistency  
✅ **Fair Comparison**: Students can't manipulate questions on client-side
✅ **Educational Control**: Perfect for assessments and standardized testing

### **Number Range:**

- **Fixed Range**: Numbers 1-50 for all games
- **Consistent Difficulty**: Same challenge level for fair comparison
- **Educational Focus**: Emphasizes math skills over difficulty management

### **Example Pre-Generated Rounds:**

When you create a session with `number_of_rounds: 5`, the system generates:

```json
[
  { "round_number": 1, "first_number": 23, "second_number": 15 },
  { "round_number": 2, "first_number": 8, "second_number": 42 },
  { "round_number": 3, "first_number": 31, "second_number": 31 },
  { "round_number": 4, "first_number": 7, "second_number": 19 },
  { "round_number": 5, "first_number": 44, "second_number": 12 }
]
```

Students must determine if first > second, first < second, or first = second.

---

## 📱 **Mobile App Business Rules**

### **⏱️ Time Limits:**

- **🔴 5-minute total game limit**: Games must be completed within 300 seconds
- **🟡 60-second round limit**: Each individual round has maximum 60 seconds
- **❌ Auto-fail on timeout**: No response or exceeding time = automatic failure

### **🎯 Scoring System:**

- **Flat 100 points per correct answer** (no speed bonus)
- **Auto-fail rounds**: Timeout or no response = 0 points
- **Simple calculation**: Total Score = Correct Answers × 100

### **📊 Data Storage (Minimal Approach):**

- **Total Game Time**: Cumulative time across all sessions
- **Total Correct Answers**: Running count of all correct responses
- **Games Played**: Total number of completed sessions
- **User Profile**: Basic information and avatar

---

## 🔐 **Prerequisites**

- **Admin Account**: You must have `usertype: 'Admin'`
- **JWT Token**: Login to get your admin authentication token
- **Active Customers**: Target customers must be `is_active: true`

---

## 1️⃣ **Individual Assignment (One Customer)**

### **Use Case:**

- Personalized sessions for specific students
- Individual practice sessions
- Individual remedial work

### **API Endpoint:**

```bash
POST /api/admin/game/create-for-user
```

### **Example Request:**

```bash
curl -X POST http://localhost:3000/api/admin/game/create-for-user \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 5,
    "number_of_rounds": 15,
    "instructions": "Focus on accuracy over speed today, Alice!"
  }'
```

### **Response:**

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
    "number_of_rounds": 15,
    "instructions": "Focus on accuracy over speed today, Alice!",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**🎲 Behind the scenes**: 15 round details are automatically pre-generated and saved to database.

---

## 2️⃣ **🆕 Bulk Assignment (ALL Customers)**

### **Use Case:**

- Class-wide assignments
- Same homework for entire class
- Weekly practice sessions
- Standardized assessments

### **API Endpoint:**

```bash
POST /api/admin/game/create-for-all-customers
```

### **Example Request:**

```bash
curl -X POST http://localhost:3000/api/admin/game/create-for-all-customers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number_of_rounds": 10,
    "instructions": "Weekly practice session - complete by Friday!"
  }'
```

### **Response:**

```json
{
  "message": "Game sessions created for 25 customers",
  "admin": {
    "id": 1,
    "username": "admin_teacher"
  },
  "session_details": {
    "number_of_rounds": 10,
    "number_range": "1-50",
    "instructions": "Weekly practice session - complete by Friday!"
  },
  "results": {
    "total_customers": 25,
    "successful_creations": 25,
    "failed_creations": 0
  },
  "created_sessions": [
    {
      "session_id": 201,
      "customer": {
        "id": 5,
        "username": "student_alice",
        "full_name": "Alice Johnson"
      }
    },
    {
      "session_id": 202,
      "customer": {
        "id": 6,
        "username": "student_bob",
        "full_name": "Bob Smith"
      }
    }
    // ... all other customers
  ]
}
```

**🎲 Behind the scenes**: 250 total round details created (25 students × 10 rounds each), all with identical questions for fair comparison.

---

## 📊 **Check Customer Count Before Bulk Creation**

### **API Endpoint:**

```bash
GET /api/admin/customers/count
```

### **Example Request:**

```bash
curl -X GET http://localhost:3000/api/admin/customers/count \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **Response:**

```json
{
  "message": "Customer count retrieved successfully",
  "active_customers": 25,
  "total_customers": 30,
  "inactive_customers": 5
}
```

**💡 This helps you know how many sessions will be created before doing bulk assignment!**

---

## 🔍 **Browse Available Customers**

### **API Endpoint:**

```bash
GET /api/admin/customers/available
```

### **Response:**

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
      "current_level": 3,
      "statistics": {
        "games_played": 25,
        "best_score": 850
      }
    }
    // ... other customers
  ]
}
```

---

## 📋 **Monitor Created Sessions**

### **API Endpoint:**

```bash
GET /api/admin/game/sessions
```

### **Query Parameters:**

- `status=all` - Show all sessions
- `status=active` - Show incomplete sessions only
- `status=completed` - Show completed sessions only

### **Example:**

```bash
# View all active sessions you created
GET /api/admin/game/sessions?status=active&page=1&limit=20
```

---

## 🎯 **Session Parameters Explained**

### **number_of_rounds** (5-50):

- **5-10**: Quick practice (5-10 minutes)
- **10-15**: Standard session (10-15 minutes)
- **15-25**: Comprehensive practice (15-25 minutes)
- **25+**: Extended practice (25+ minutes)

### **instructions** (Optional):

- Personal messages to students
- Specific focus areas
- Deadlines and expectations
- Encouragement and guidance

---

## 🎮 **🆕 How Students Play Your Assigned Sessions (Mobile App)**

### **Student Game Flow:**

1. **Login** and view assigned sessions:

   ```bash
   GET /api/game/assigned
   ```

2. **🆕 Get the pre-generated questions** for a session:

   ```bash
   GET /api/game/session/156/rounds
   ```

   **Response**: Array of questions like `[{"round_number": 1, "first_number": 23, "second_number": 15}, ...]`

3. **Play the game** using your pre-generated questions

   - **⏱️ 5-minute total time limit**
   - **⏱️ 60-second limit per round**
   - **❌ Auto-fail on timeout**

4. **Submit answers** with response times:

   ```bash
   POST /api/game/complete
   {
     "game_session_id": 156,
     "total_time": 180.5,  // Must be ≤ 300 seconds
     "user_answers": [
       {"user_symbol": ">", "response_time": 2.3},  // Must be ≤ 60 seconds
       {"user_symbol": "<", "response_time": 1.8},
       {"user_symbol": null, "response_time": 65.0}, // Auto-failed (timeout)
       // ... answers for all rounds
     ]
   }
   ```

5. **Get results** with score and progress:
   ```json
   {
     "game_result": {
       "score": 800,
       "correct_answers": 8,
       "total_rounds": 10,
       "accuracy": 80,
       "total_time": 180.5,
       "time_remaining": 119.5,
       "scoring_method": "flat_100_per_correct"
     },
     "mobile_app_rules": {
       "max_total_time": 300,
       "max_round_time": 60,
       "points_per_correct": 100,
       "auto_fail_timeout": true
     }
   }
   ```

### **📱 Mobile App Features:**

✅ **No client-side generation** - students can't manipulate questions
✅ **Identical questions** for all students in bulk assignments  
✅ **Fair assessment** - everyone gets same challenge level
✅ **Time pressure** - 5-minute and 60-second limits add urgency
✅ **Auto-fail protection** - prevents infinite waiting on rounds
✅ **Flat scoring** - 100 points per correct answer (no speed bonus complexity)

---

## 🔄 **Complete Workflow Examples**

### **Scenario 1: Weekly Class Assignment**

```bash
# 1. Check how many students you have
GET /api/admin/customers/count

# 2. Create identical sessions for everyone
POST /api/admin/game/create-for-all-customers
{
  "number_of_rounds": 15,
  "instructions": "Week 3 Assignment - Due Friday. Focus on accuracy!"
}

# 3. Monitor progress
GET /api/admin/game/sessions?status=active
```

**Result**: All 25 students get the exact same 15 questions, ensuring fair comparison.

### **Scenario 2: Individual Help Session**

```bash
# 1. Browse students to find the one who needs help
GET /api/admin/customers/available

# 2. Create personalized session
POST /api/admin/game/create-for-user
{
  "customer_id": 5,
  "number_of_rounds": 10,
  "instructions": "Extra practice for Alice - take your time!"
}
```

**Result**: Alice gets a personalized session with the standard number range (1-50).

---

## 🚨 **What Customers See**

### **When you create sessions, customers will:**

1. **Login** to their account
2. **View assignments** via `GET /api/game/assigned`
3. **🆕 Get questions** via `GET /api/game/session/{sessionId}/rounds`
4. **See your instructions** in the session details
5. **Play with pre-generated questions** (can't change them)
6. **🕰️ Work within time limits** (5 minutes total, 60 seconds per round)
7. **Submit answers** via `POST /api/game/complete`
8. **Earn XP, coins, and levels** automatically

### **Customers CANNOT:**

- ❌ Create their own game sessions (`POST /api/game/start` returns 403)
- ❌ Modify or regenerate questions
- ❌ Complete non-admin sessions
- ❌ Access admin endpoints
- ❌ Exceed time limits (auto-fail)

---

## 📊 **🆕 Updated Complete API List**

### **Admin Game Session APIs:**

**Individual Assignment:**

- POST /api/admin/game/create-for-user - Create session for specific customer

**🆕 Bulk Assignment:**

- POST /api/admin/game/create-for-all-customers - Create sessions for ALL customers
- GET /api/admin/customers/count - Check customer count before bulk creation

**Management:**

- GET /api/admin/customers/available - Browse available customers
- GET /api/admin/game/sessions - Monitor created sessions

**🆕 Customer Game Playing APIs:**

- GET /api/game/assigned - Customers view their assigned sessions
- **🆕 GET /api/game/session/{sessionId}/rounds** - Get pre-generated questions
- POST /api/game/complete - Submit answers with response times
- GET /api/game/history - View completed game history

---

## 🎊 **Benefits of Mobile App System**

### **📱 Mobile-Optimized Features:**

- ✅ **Time Pressure**: 5-minute total and 60-second per round limits
- ✅ **Simple Scoring**: Flat 100 points per correct answer
- ✅ **Auto-Fail Protection**: No infinite waiting on difficult questions
- ✅ **Fair Assessment**: Everyone faces same time constraints
- ✅ **Minimal Data Storage**: Focus on essential metrics only

### **Educational Focus:**

- ✅ **Consistent Challenge**: All students face same number range (1-50)
- ✅ **Fair Assessment**: No difficulty variations to confuse comparison
- ✅ **Focus on Skills**: Emphasizes math ability over difficulty management
- ✅ **Simplified Setup**: Fewer parameters for teachers to manage

### **Time Saving:**

- ✅ Create 25 sessions in **1 API call** instead of 25 separate calls
- ✅ **250 questions generated automatically** (25 students × 10 rounds)
- ✅ Same instructions for entire class
- ✅ No difficulty level decision needed

### **Class Management:**

- ✅ Weekly assignments for entire class
- ✅ Standardized assessments
- ✅ Group practice sessions
- ✅ Homework assignments

### **Performance Tracking:**

- ✅ **Individual response times** per question
- ✅ **Accuracy analysis** per student
- ✅ **Class performance comparison**
- ✅ **Progress monitoring** for all students

---

## 🔒 **Security & Validation**

- **Admin Only**: All endpoints require admin JWT token
- **Active Customers Only**: Only creates sessions for `is_active: true` customers
- **Question Integrity**: Round details can't be modified by students
- **Response Validation**: User answers validated against pre-generated correct answers
- **Audit Trail**: All sessions track `created_by_admin` field

---

## 🚀 **Ready to Use!**

You now have **complete mobile app control** over student game sessions:

✅ **Individual assignments** for personalized learning
✅ **🆕 Bulk assignments** for class-wide activities  
✅ **🆕 Pre-generated questions** for standardized testing
✅ **📱 Mobile app time limits** for urgency and fairness
✅ **Progress monitoring** for all created sessions
✅ **Educational restrictions** ensure proper oversight

**Perfect for mobile math gaming and classroom management!** 🎓📱
