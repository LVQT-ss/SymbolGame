# 🎯 **Complete Admin Control Guide**

## **Math Comparison Game - Full Administrative Control**

---

## 🎮 **Admin Control Overview**

As an Admin, you have **complete control** over:

- ✅ **Game Session Creation** - Basic and fully customized
- ✅ **Round Details** - Every number and expected answer
- ✅ **Student Assignment** - Individual or bulk
- ✅ **Monitoring & Analytics** - Real-time dashboard
- ✅ **Performance Tracking** - Detailed statistics

---

## 🔧 **1. Basic Game Creation**

### **Endpoint:** `POST /api/game/start`

**Use Case:** Quick game creation with auto-generated rounds

```bash
curl -X POST http://localhost:3000/api/game/start \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number_of_rounds": 10,
    "admin_instructions": "Focus on accuracy over speed"
  }'
```

**Features:**

- ✅ Auto-generates numbers 1-50
- ✅ Auto-calculates correct symbols
- ✅ Creates unassigned session (students join via ID)

---

## 🎯 **2. 🆕 Full Custom Game Creation**

### **Endpoint:** `POST /api/admin/game/create-custom`

**Use Case:** Complete control over every aspect of the game

```bash
curl -X POST http://localhost:3000/api/admin/game/create-custom \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "admin_instructions": "Special assessment - custom difficulty",
    "custom_rounds": [
      {
        "first_number": 150,
        "second_number": 89,
        "expected_symbol": ">"
      },
      {
        "first_number": 75,
        "second_number": 75,
        "expected_symbol": "="
      },
      {
        "first_number": 25,
        "second_number": 180
      }
    ]
  }'
```

**Features:**

- ✅ **Custom Numbers**: Any positive integers (not limited to 1-50)
- ✅ **Custom Expected Answers**: Override mathematical calculation
- ✅ **Direct Assignment**: Assign to specific student immediately
- ✅ **Variable Difficulty**: Mix easy and challenging numbers
- ✅ **Assessment Mode**: Create specific test scenarios

### **Custom Round Options:**

#### **Option A: Auto-Calculate Symbol**

```json
{
  "first_number": 45,
  "second_number": 23
  // System automatically calculates: ">"
}
```

#### **Option B: Override Symbol (Advanced)**

```json
{
  "first_number": 45,
  "second_number": 23,
  "expected_symbol": "<" // Force wrong answer for testing
}
```

---

## 📊 **3. 🆕 Admin Monitoring Dashboard**

### **Endpoint:** `GET /api/admin/game/dashboard`

**Use Case:** Real-time monitoring of all your created sessions

```bash
# All active sessions, sorted by score
GET /api/admin/game/dashboard?status=active&sort_by=score&sort_order=DESC

# Specific student's sessions
GET /api/admin/game/dashboard?user_id=5&status=all

# Recent completions
GET /api/admin/game/dashboard?status=completed&sort_by=completed_at&limit=10
```

### **Dashboard Features:**

#### **📈 Real-time Statistics**

- Total sessions created by you
- Active vs completed sessions
- Student assignment statistics
- Average and highest scores
- Performance analytics

#### **🔍 Advanced Filtering**

- **Status Filter**: `all`, `active`, `completed`
- **Student Filter**: View specific student's progress
- **Sorting Options**:
  - `created_at` - When you created the session
  - `completed_at` - When student finished
  - `score` - Student performance
  - `user_name` - Alphabetical by student name

#### **📋 Session Details**

Each session shows:

- Student information (name, level, avatar)
- Game progress (rounds completed/total)
- Performance metrics (score, accuracy, time)
- Your admin instructions
- Detailed round summary

---

## 🎯 **4. Advanced Use Cases**

### **Assessment Scenarios**

#### **Scenario A: Progressive Difficulty**

```json
{
  "admin_instructions": "Progressive difficulty assessment",
  "custom_rounds": [
    { "first_number": 5, "second_number": 3 }, // Easy
    { "first_number": 25, "second_number": 18 }, // Medium
    { "first_number": 150, "second_number": 89 }, // Hard
    { "first_number": 500, "second_number": 750 } // Very Hard
  ]
}
```

#### **Scenario B: Specific Learning Objectives**

```json
{
  "admin_instructions": "Focus on equal comparisons",
  "custom_rounds": [
    { "first_number": 25, "second_number": 25, "expected_symbol": "=" },
    { "first_number": 50, "second_number": 50, "expected_symbol": "=" },
    { "first_number": 100, "second_number": 100, "expected_symbol": "=" }
  ]
}
```

#### **Scenario C: Error Detection Test**

```json
{
  "admin_instructions": "Find the incorrect expected answers",
  "custom_rounds": [
    { "first_number": 10, "second_number": 20, "expected_symbol": ">" }, // Wrong!
    { "first_number": 30, "second_number": 15, "expected_symbol": ">" }, // Correct
    { "first_number": 25, "second_number": 25, "expected_symbol": "<" } // Wrong!
  ]
}
```

---

## 📱 **5. Mobile App Integration**

### **Student Game Flow (Your Control)**

1. **Admin Creates Session** (you control all parameters)
2. **Student Receives Assignment** (mobile app notification)
3. **Student Plays Game** (10-minute limit, 60 seconds per round)
4. **Real-time Monitoring** (you see progress on dashboard)
5. **Results Analysis** (detailed performance data)

### **Time & Scoring Control**

- **Fixed Time Limits**: 10 minutes total, 60 seconds per round
- **Scoring System**: 100 points per correct answer
- **Auto-fail Protection**: Student can't get stuck on difficult questions

---

## 🔐 **6. Security & Access Control**

### **Admin-Only Features**

- ❌ Students **CANNOT** create their own sessions
- ❌ Students **CANNOT** modify round details
- ❌ Students **CANNOT** see expected answers during game
- ✅ Only admins can access dashboard and creation endpoints

### **Data Integrity**

- ✅ Round details stored securely server-side
- ✅ Anti-cheat: Students can't manipulate questions
- ✅ Audit trail: All admin actions tracked
- ✅ Complete session history maintained

---

## 🚀 **7. Quick Start Examples**

### **Example 1: Weekly Class Assignment**

```bash
# Create same game for all students
curl -X POST http://localhost:3000/api/admin/game/create-for-all-customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "number_of_rounds": 15,
    "instructions": "Week 5 Practice - Due Friday"
  }'
```

### **Example 2: Individual Remedial Work**

```bash
# Custom game for struggling student
curl -X POST http://localhost:3000/api/admin/game/create-custom \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": 8,
    "admin_instructions": "Extra practice with smaller numbers",
    "custom_rounds": [
      {"first_number": 5, "second_number": 8},
      {"first_number": 12, "second_number": 7},
      {"first_number": 15, "second_number": 15}
    ]
  }'
```

### **Example 3: Advanced Students Challenge**

```bash
# Challenging game for top performers
curl -X POST http://localhost:3000/api/admin/game/create-custom \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": 3,
    "admin_instructions": "Advanced challenge - larger numbers",
    "custom_rounds": [
      {"first_number": 1250, "second_number": 890},
      {"first_number": 500, "second_number": 1500},
      {"first_number": 2000, "second_number": 2000}
    ]
  }'
```

---

## 📊 **8. Complete API Reference**

| Method | Endpoint                          | Description              | Control Level |
| ------ | --------------------------------- | ------------------------ | ------------- |
| `POST` | `/api/game/start`                 | Basic game creation      | ⭐⭐⭐        |
| `POST` | `/api/admin/game/create-custom`   | **Full custom control**  | ⭐⭐⭐⭐⭐    |
| `GET`  | `/api/admin/game/dashboard`       | **Real-time monitoring** | ⭐⭐⭐⭐⭐    |
| `POST` | `/api/admin/game/create-for-user` | Individual assignment    | ⭐⭐⭐⭐      |
| `POST` | `/api/admin/game/create-for-all`  | Bulk assignment          | ⭐⭐⭐⭐      |
| `GET`  | `/api/admin/customers/available`  | Student management       | ⭐⭐⭐        |

---

## 🎯 **Conclusion**

You now have **complete administrative control** over:

- ✅ **Every number** in every round
- ✅ **Every expected answer** (even override math)
- ✅ **Every student assignment**
- ✅ **Real-time monitoring** of all sessions
- ✅ **Detailed analytics** and performance tracking
- ✅ **Mobile app time limits** and constraints
- ✅ **Educational assessment** capabilities

**Perfect for educational environments requiring precise control over student gaming activities!** 🎓📱
