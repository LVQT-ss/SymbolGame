// Test script for the new Instant Game API
// This demonstrates how the create-instant API works

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// Example usage of the new API
async function testInstantGameAPI() {
    try {
        console.log('🎮 Testing Instant Game Creation API...\n');

        // Step 1: Create an instant game
        console.log('📝 Step 1: Creating instant game...');
        const createResponse = await axios.post(`${API_BASE}/game/create-instant`, {
            difficulty_level: 3,
            number_of_rounds: 5
        }, {
            headers: {
                'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Game created successfully!');
        console.log('Game ID:', createResponse.data.game_session.id);
        console.log('Player:', createResponse.data.player.username);
        console.log('Rounds to play:', createResponse.data.game_session.number_of_rounds);
        console.log('Difficulty:', createResponse.data.game_session.difficulty_level);

        const gameId = createResponse.data.game_session.id;
        const rounds = createResponse.data.rounds;

        console.log('\n📋 Rounds created:');
        rounds.forEach(round => {
            console.log(`Round ${round.round_number}: ${round.first_number} vs ${round.second_number}`);
        });

        // Step 2: Play each round
        console.log('\n🎯 Step 2: Playing rounds...');
        for (let i = 0; i < rounds.length; i++) {
            const round = rounds[i];

            // Simulate player choosing correct answer
            let userSymbol;
            if (round.first_number > round.second_number) {
                userSymbol = '>';
            } else if (round.first_number < round.second_number) {
                userSymbol = '<';
            } else {
                userSymbol = '=';
            }

            const submitResponse = await axios.post(`${API_BASE}/game/${gameId}/submit-round`, {
                round_number: round.round_number,
                user_symbol: userSymbol,
                response_time: Math.random() * 3 + 1 // Random time between 1-4 seconds
            }, {
                headers: {
                    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ Round ${round.round_number}: ${round.first_number} ${userSymbol} ${round.second_number} - ${submitResponse.data.round_result.is_correct ? 'CORRECT' : 'WRONG'}`);
        }

        // Step 3: Complete the game
        console.log('\n🏁 Step 3: Completing game...');
        const completeResponse = await axios.post(`${API_BASE}/game/complete`, {
            game_session_id: gameId,
            total_time: 25.5,
            rounds: rounds.map((round) => ({
                round_number: round.round_number,
                first_number: round.first_number,
                second_number: round.second_number,
                user_symbol: round.first_number > round.second_number ? '>' :
                    round.first_number < round.second_number ? '<' : '=',
                response_time: Math.random() * 3 + 1
            }))
        }, {
            headers: {
                'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
                'Content-Type': 'application/json'
            }
        });

        console.log('🎉 Game completed!');
        console.log('Final Score:', completeResponse.data.game_result.score);
        console.log('Accuracy:', completeResponse.data.game_result.accuracy + '%');
        console.log('XP Gained:', completeResponse.data.game_result.experience_gained);
        console.log('Coins Earned:', completeResponse.data.game_result.coins_earned);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Usage examples
console.log(`
🎮 INSTANT GAME API USAGE EXAMPLES
================================

1. BASIC INSTANT GAME:
POST /api/game/create-instant
{
  "difficulty_level": 2,
  "number_of_rounds": 10
}

2. CUSTOM ROUNDS GAME:
POST /api/game/create-instant
{
  "difficulty_level": 1,
  "number_of_rounds": 3,
  "custom_rounds": [
    {"first_number": 15, "second_number": 23},
    {"first_number": 8, "second_number": 8},
    {"first_number": 30, "second_number": 12}
  ]
}

3. QUICK 5-ROUND GAME:
POST /api/game/create-instant
{
  "number_of_rounds": 5
}

RESPONSE INCLUDES:
- Game session data with unique ID
- All rounds ready to play
- Instructions for next steps
- Player info and game configuration

THEN USE EXISTING APIs:
- POST /api/game/:id/submit-round (for each round)
- POST /api/game/complete (to finish and get rewards)
- GET /api/game/:id (to check progress)
`);

// Uncomment to run the test (make sure to add a valid JWT token)
// testInstantGameAPI();

export { testInstantGameAPI }; 