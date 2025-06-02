# 🎮 **Swagger Testing Guide - Custom Game Creation**

## 🚀 **Quick Start**

1. **Start your server**: `npm start` or `node index.js`
2. **Open Swagger**: `http://localhost:3000/api-docs`
3. **Find the endpoint**: `/api/game/admin/create-custom`

---

## 🔑 **Step 1: Get Authorization Token**

First, you need to login as an Admin user to get a JWT token:

1. Find **POST /api/auth/login** in Swagger
2. Use admin credentials:

```json
{
  "email": "admin@example.com",
  "password": "your_admin_password"
}
```

3. Copy the `token` from the response
4. Click **"Authorize"** button at the top of Swagger
5. Enter: `Bearer YOUR_TOKEN_HERE`

---

## 🎯 **Step 2: Test Custom Game Creation**

### **Test 1: Create Open Game (Anyone Can Join)**

Find **POST /api/game/admin/create-custom** and use:

```json
{
  "admin_instructions": "Practice comparing numbers - anyone can join!",
  "custom_rounds": [
    {
      "first_number": 25,
      "second_number": 18
    },
    {
      "first_number": 7,
      "second_number": 31
    },
    {
      "first_number": 50,
      "second_number": 50
    }
  ]
}
```

**Expected Response:**

- `assigned_to: "open_to_all"`
- `join_instructions: "Game ID: X - Anyone can join using /api/game/join"`

### **Test 2: Create Assigned Game (Specific User)**

```json
{
  "user_id": 5,
  "admin_instructions": "Special assignment for student ID 5",
  "custom_rounds": [
    {
      "first_number": 15,
      "second_number": 20
    },
    {
      "first_number": 30,
      "second_number": 30
    }
  ]
}
```

**Expected Response:**

- `assigned_to: "specific_user"`
- Shows assigned user info

---

## 🔍 **Step 3: Test Browse Available Games**

Find **GET /api/game/available** and test:

- This should show your open games (not assigned ones)
- No authorization needed for browsing

---

## 🎮 **Step 4: Test Joining Game**

Find **POST /api/game/join** and use:

```json
{
  "game_session_id": 157
}
```

_(Use the ID from your created game)_

---

## ❌ **Common Issues & Fixes**

### **Issue 1: "Access denied. Admin privileges required"**

- **Fix**: Make sure you're logged in as Admin user
- **Check**: Authorization header is set correctly

### **Issue 2: "custom_rounds array is required"**

- **Fix**: Make sure `custom_rounds` is not empty
- **Check**: Array has at least 1 round

### **Issue 3: "Numbers must be valid integers"**

- **Fix**: Use whole numbers only (25, not 25.5)
- **Check**: Both first_number and second_number are integers

### **Issue 4: Endpoint not found**

- **Fix**: Use correct path: `/api/game/admin/create-custom`
- **Check**: Server is running on correct port

---

## ✅ **Success Indicators**

**Game Created Successfully:**

```json
{
  "message": "Custom game session created successfully",
  "game_session": {
    "id": 157,
    "assigned_to": "open_to_all",
    "join_instructions": "Game ID: 157 - Anyone can join using /api/game/join"
  }
}
```

**Available Games Shows Your Game:**

```json
{
  "available_games": [
    {
      "id": 157,
      "status": "available_to_join"
    }
  ]
}
```

---

## 🎯 **Quick Test Workflow**

1. **Login as Admin** → Get token
2. **Authorize in Swagger** → Set Bearer token
3. **Create custom game** → POST /api/game/admin/create-custom
4. **Check available games** → GET /api/game/available
5. **Join the game** → POST /api/game/join
6. **Check admin dashboard** → GET /api/game/admin/dashboard

**All endpoints should work perfectly now!** 🚀
