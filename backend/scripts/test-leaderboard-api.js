import fetch from 'node-fetch';

async function testLeaderboardAPI() {
    try {
        console.log('🧪 Testing leaderboard API...');

        const response = await fetch('http://localhost:3000/api/leaderboard?difficulty_level=1&region=global&time_period=allTime&limit=10');

        if (!response.ok) {
            console.error(`❌ API returned status: ${response.status}`);
            return;
        }

        const data = await response.json();

        console.log('\n✅ Leaderboard API Response:');
        console.log('Success:', data.success);
        console.log('Total players:', data.metadata.total_players);
        console.log('\n🏆 Leaderboard Rankings:');

        data.data.forEach((player, index) => {
            const medal = player.medal || '';
            console.log(`   ${medal} ${player.rank_position}. ${player.full_name} - ${player.score} points (${player.total_games} games) [Level ${player.current_level}]`);
        });

        console.log(`\n📊 Metadata:`);
        console.log(`   Difficulty Level: ${data.metadata.difficulty_level}`);
        console.log(`   Region: ${data.metadata.region}`);
        console.log(`   Time Period: ${data.metadata.time_period}`);
        console.log(`   Total Players: ${data.metadata.total_players}`);

    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

testLeaderboardAPI(); 