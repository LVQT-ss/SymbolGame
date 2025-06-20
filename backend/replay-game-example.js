/**
 * 🔁 REPLAY GAME FUNCTIONALITY - HƯỚNG DẪN SỬ DỤNG
 * =================================================
 * 
 * Chức năng này cho phép người chơi:
 * ✅ Xem lại chi tiết game đã chơi
 * ✅ Chơi lại game với cùng bộ câu hỏi
 * ✅ Thử cải thiện điểm số của mình
 * ✅ Lưu tất cả lịch sử game
 */

import { gameAPI } from '../symbol/services/api.js';

console.log(`
🎮 CÁC CHỨC NĂNG MỚI ĐÃ ĐƯỢC THÊM VÀO:
=====================================

1. 📚 LƯU LỊCH SỬ GAME - api/game/complete
   - Tự động lưu mỗi game sau khi hoàn thành
   - Lưu chi tiết từng câu trả lời
   - Tính toán điểm số và thống kê

2. 📖 XEM CHI TIẾT GAME - api/game/history/{gameId}/details  
   - Xem lại từng câu hỏi và câu trả lời
   - Thống kê chi tiết (thời gian, độ chính xác)
   - Phân tích hiệu suất game

3. 🔁 CHƠI LẠI GAME - api/game/replay/{gameId}
   - Tạo game mới với cùng bộ câu hỏi
   - Thử cải thiện điểm số cũ
   - Thách thức bản thân

📋 HƯỚNG DẪN SỬ DỤNG:
====================
`);

// ===================================================================
// 1. CHƠI GAME VÀ TỰ ĐỘNG LƯU
// ===================================================================

const playGameExample = async () => {
    try {
        console.log("🎯 1. CHƠI GAME VÀ TỰ ĐỘNG LƯU:");

        // Tạo game instant
        const game = await gameAPI.createInstantGame({
            difficulty_level: 2,
            number_of_rounds: 5
        });

        console.log("✅ Game được tạo:", game.game_session.id);

        // Hoàn thành game (giả lập câu trả lời)
        const gameResult = await gameAPI.completeGame({
            game_session_id: game.game_session.id,
            total_time: 45.5,
            rounds: [
                { first_number: 15, second_number: 8, user_symbol: ">", response_time: 2.5 },
                { first_number: 3, second_number: 12, user_symbol: "<", response_time: 1.8 },
                { first_number: 7, second_number: 7, user_symbol: "=", response_time: 3.2 },
                { first_number: 20, second_number: 5, user_symbol: ">", response_time: 2.1 },
                { first_number: 9, second_number: 14, user_symbol: "<", response_time: 2.8 }
            ]
        });

        console.log("✅ Game đã được lưu! Điểm số:", gameResult.game_result.scoring.final_score);
        console.log("📊 Độ chính xác:", gameResult.game_result.performance.accuracy + "%");

        return gameResult.game_result.game_id;

    } catch (error) {
        console.error("❌ Lỗi:", error.message);
    }
};

// ===================================================================
// 2. XEM CHI TIẾT GAME ĐÃ CHƠI
// ===================================================================

const viewGameDetailsExample = async (gameId) => {
    try {
        console.log("\n🔍 2. XEM CHI TIẾT GAME ĐÃ CHƠI:");

        const details = await gameAPI.getGameDetails(gameId);

        console.log("📋 Thông tin game:");
        console.log("   - Điểm số:", details.game.performance.score);
        console.log("   - Độ chính xác:", details.game.performance.accuracy + "%");
        console.log("   - Thời gian trung bình:", details.game.performance.average_response_time + "s");

        console.log("\n📝 Chi tiết từng câu:");
        details.game.rounds.forEach((round, index) => {
            const status = round.is_correct ? "✅" : "❌";
            console.log(`   ${index + 1}. ${round.question} | Trả lời: ${round.your_answer} | Đúng: ${round.correct_answer} ${status}`);
        });

        if (details.game.replay_available) {
            console.log("\n🔁 Game này có thể chơi lại!");
        }

    } catch (error) {
        console.error("❌ Lỗi:", error.message);
    }
};

// ===================================================================
// 3. CHƠI LẠI GAME
// ===================================================================

const replayGameExample = async (originalGameId) => {
    try {
        console.log("\n🔁 3. CHƠI LẠI GAME:");

        const replayGame = await gameAPI.replayGame(originalGameId);

        console.log("✅ Đã tạo game replay!");
        console.log("🎯 Thách thức:", replayGame.challenge.message);
        console.log("📊 Điểm số cần vượt qua:", replayGame.challenge.target_score);
        console.log("🆔 ID game mới:", replayGame.game_session.id);

        console.log("\n🎮 Câu hỏi giống hệt game gốc:");
        replayGame.rounds.forEach((round, index) => {
            console.log(`   ${index + 1}. ${round.first_number} ? ${round.second_number}`);
        });

        // Bây giờ có thể chơi game này với cùng bộ câu hỏi!
        return replayGame.game_session.id;

    } catch (error) {
        console.error("❌ Lỗi:", error.message);
    }
};

// ===================================================================
// 4. XEM LỊCH SỬ GAME
// ===================================================================

const viewGameHistoryExample = async () => {
    try {
        console.log("\n📚 4. XEM LỊCH SỬ GAME:");

        const history = await gameAPI.getGameHistory(1, 10);

        console.log("📊 Thống kê tổng:");
        console.log("   - Tổng game đã chơi:", history.statistics.total_games);
        console.log("   - Điểm số cao nhất:", history.statistics.best_score);
        console.log("   - Tổng điểm:", history.statistics.total_score);

        console.log("\n📋 Game gần đây:");
        history.games.slice(0, 3).forEach((game, index) => {
            console.log(`   ${index + 1}. Game #${game.id} - Điểm: ${game.score} - Độ chính xác: ${game.accuracy}%`);
        });

    } catch (error) {
        console.error("❌ Lỗi:", error.message);
    }
};

// ===================================================================
// CHẠY VÍ DỤ DEMO
// ===================================================================

const runDemo = async () => {
    console.log("🚀 BẮT ĐẦU DEMO CHỨC NĂNG REPLAY:");
    console.log("===================================\n");

    // 1. Chơi game và lưu
    const gameId = await playGameExample();

    if (gameId) {
        // 2. Xem chi tiết game vừa chơi
        await viewGameDetailsExample(gameId);

        // 3. Tạo game replay
        const replayGameId = await replayGameExample(gameId);

        // 4. Xem lịch sử game
        await viewGameHistoryExample();

        console.log("\n✅ DEMO HOÀN THÀNH!");
        console.log("🎮 Bây giờ bạn có thể:");
        console.log("   - Chơi game replay với ID:", replayGameId);
        console.log("   - Xem chi tiết bất kỳ game nào");
        console.log("   - Tạo replay từ bất kỳ game hoàn thành nào");
    }
};

// ===================================================================
// API ENDPOINTS SUMMARY
// ===================================================================

console.log(`
📍 TỔNG HỢP CÁC API MỚI:
========================

🎮 Chơi game và tự động lưu:
POST /api/game/complete
{
  "game_session_id": 123,        // ID game session (hoặc null để tạo mới)
  "total_time": 45.5,            // Tổng thời gian (giây)
  "rounds": [                    // Mảng câu trả lời
    {
      "first_number": 15,        // Số thứ nhất
      "second_number": 8,        // Số thứ hai  
      "user_symbol": ">",        // Câu trả lời của user
      "response_time": 2.5       // Thời gian trả lời (giây)
    }
  ]
}

🔍 Xem chi tiết game:
GET /api/game/history/{gameId}/details

🔁 Chơi lại game:
POST /api/game/replay/{gameId}

📚 Xem lịch sử game:
GET /api/game/history?page=1&limit=20

===================================================================

💡 LỢI ÍCH CHO NGƯỜI CHƠI:
==========================
✅ Không bao giờ mất game đã chơi
✅ Có thể xem lại và phân tích điểm yếu
✅ Thử thách bản thân với cùng bộ câu hỏi
✅ Theo dõi sự tiến bộ qua thời gian
✅ So sánh điểm số giữa các lần chơi

🔧 TRIỂN KHAI FRONTEND:
======================
1. Thêm nút "Chơi lại" trong lịch sử game
2. Hiển thị chi tiết game khi click vào
3. Hiển thị thách thức điểm số khi replay
4. Lưu game tự động sau khi hoàn thành

`);

// Xuất các function để sử dụng
export {
    playGameExample,
    viewGameDetailsExample,
    replayGameExample,
    viewGameHistoryExample,
    runDemo
}; 