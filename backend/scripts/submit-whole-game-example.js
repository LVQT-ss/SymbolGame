// 🎮 SUBMIT WHOLE GAME API - Super Easy Example

/* 
HOW IT WORKS:
1. You play the game (questions are generated by server)
2. You send all your answers in ONE API call
3. Server calculates everything and gives you results
4. Game is saved to your history automatically
*/

// Example API call:
const example = {
    method: 'POST',
    url: '/api/game/submit-whole-game',
    headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json'
    },
    body: {
        // Game settings (optional)
        "difficulty_level": 2,      // 1=easy, 10=hard
        "number_of_rounds": 5,      // How many questions

        // Required: Your results
        "total_time": 25.5,         // Total time in seconds
        "rounds": [                 // Your answers for each question
            {
                "user_symbol": ">", // Your answer (>, <, or =)
                "response_time": 4.2 // Time for this question
            },
            {
                "user_symbol": "<",
                "response_time": 3.1
            },
            {
                "user_symbol": "=",
                "response_time": 2.8
            },
            {
                "user_symbol": ">",
                "response_time": 5.3
            },
            {
                "user_symbol": "<",
                "response_time": 2.1
            }
        ]
    }
};

console.log(`
🎮 SUBMIT WHOLE GAME API - EASIEST WAY TO PLAY!
==============================================

STEP 1: Play the game (in your app)
- Game generates random math questions
- User answers each question: >, <, or =
- Track time for each question

STEP 2: Submit everything at once
POST /api/game/submit-whole-game
{
  "difficulty_level": 2,
  "number_of_rounds": 5, 
  "total_time": 25.5,
  "rounds": [
    {"user_symbol": ">", "response_time": 4.2},
    {"user_symbol": "<", "response_time": 3.1},
    {"user_symbol": "=", "response_time": 2.8},
    {"user_symbol": ">", "response_time": 5.3},
    {"user_symbol": "<", "response_time": 2.1}
  ]
}

STEP 3: Get complete results
{
  "message": "Game created and completed successfully!",
  "game_result": {
    "game_id": 789,
    "player": {
      "username": "player123",
      "level_before": 5,
      "level_after": 6,
      "level_up": true
    },
    "performance": {
      "total_rounds": 5,
      "correct_answers": 4,
      "accuracy": 80,
      "total_time": 25.5
    },
    "scoring": {
      "final_score": 400,
      "experience_gained": 40,
      "coins_earned": 4
    }
  },
  "detailed_rounds": [
    {
      "round_number": 1,
      "question": "25 ? 17",
      "your_answer": ">",
      "correct_answer": ">",
      "is_correct": true
    }
    // ... more rounds
  ],
  "summary": {
    "result": "🎉 Great job!",
    "next_suggestion": "Try difficulty level 3 next!"
  }
}

✅ BENEFITS:
- Only ONE API call needed
- Game created and completed automatically  
- All data saved to your history
- Get instant results and rewards
- Perfect for mobile apps
- No need to track game state

🎯 COMPARISON:

OLD WAY (3 API calls):
1. POST /api/game/create-instant
2. POST /api/game/:id/submit-round (x5 times)
3. POST /api/game/complete

NEW WAY (1 API call):
1. POST /api/game/submit-whole-game ✨

MUCH EASIER! 🚀
`);

// Real example with fetch
const realExample = `
// JavaScript example for your frontend
async function submitMyGame() {
    const myAnswers = [
        {user_symbol: ">", response_time: 2.5},
        {user_symbol: "<", response_time: 1.8}, 
        {user_symbol: "=", response_time: 3.2}
    ];

    const response = await fetch('/api/game/submit-whole-game', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + userToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            difficulty_level: 2,
            number_of_rounds: 3,
            total_time: 7.5,
            rounds: myAnswers
        })
    });

    const result = await response.json();
    console.log('Game completed!', result.game_result.performance);
    console.log('Your score:', result.game_result.scoring.final_score);
    console.log('Level up?', result.game_result.player.level_up);
}
`;

console.log('📱 Frontend example:');
console.log(realExample);

// 📝 UPDATED: /api/game/complete API - Now supports both modes!
console.log(`
🎯 UPDATED /api/game/complete API - Two Modes Available!
======================================================

MODE 1: CREATE NEW SESSION (Like submit-whole-game)
--------------------------------------------------
POST /api/game/complete
{
  "difficulty_level": 2,       // Optional (default: 1)
  "total_time": 25.5,          // Required
  "rounds": [                  // Required - only answers needed
    {"user_symbol": ">", "response_time": 2.5},
    {"user_symbol": "<", "response_time": 1.8},
    {"user_symbol": "=", "response_time": 3.2}
  ]
}

✅ Creates new game session automatically
✅ Server generates questions  
✅ Returns 201 Created
✅ Anyone can use this mode

MODE 2: COMPLETE EXISTING SESSION
---------------------------------
POST /api/game/complete
{
  "game_session_id": 123,      // Required - existing session
  "total_time": 180.5,         // Required
  "rounds": [                  // Required - full round data
    {
      "first_number": 15,       // Must match existing
      "second_number": 8,       // Must match existing
      "user_symbol": ">",       // Your answer
      "response_time": 2.5      // Your time
    }
  ]
}

✅ Completes existing game session
✅ Must match existing round numbers
✅ Returns 200 OK
✅ Anyone can complete any game session

🎯 KEY CHANGES:
- ❌ REMOVED: "This game session is already assigned to another user" error
- ✅ ADDED: Anyone can complete any game session
- ✅ ADDED: Creates new sessions when game_session_id is not provided
- ✅ ADDED: Tracks which user completed each game for history
- ✅ ADDED: Works exactly like submit-whole-game when no session ID provided

🎮 USE CASES:
- Mobile apps: Use Mode 1 (no session ID) for quick games
- Joining existing games: Use Mode 2 with session ID
- Game history: All completed games show who completed them
- No more assignment conflicts!
`);

export { example, realExample }; 