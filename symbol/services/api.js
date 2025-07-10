import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure base URL for your local backend
const BASE_URL = "https://symbolgame.onrender.com/api";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10 second timeout
});

// Token management for React Native
const getToken = async () => {
    try {
        return await AsyncStorage.getItem("token");
    } catch (error) {
        console.error("Error getting token:", error);
        return null;
    }
};

const setToken = async (token) => {
    try {
        await AsyncStorage.setItem("token", token);
    } catch (error) {
        console.error("Error setting token:", error);
    }
};

const removeToken = async () => {
    try {
        await AsyncStorage.removeItem("token");
    } catch (error) {
        console.error("Error removing token:", error);
    }
};

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, remove it
            await removeToken();
        }
        return Promise.reject(error);
    }
);

// =============================================================================
// 🔐 AUTHENTICATION APIs
// =============================================================================

export const authAPI = {
    register: async (userData) => {
        try {
            const response = await api.post("/auth/register", userData);
            if (response.data.token) {
                await setToken(response.data.token);
            }
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Registration failed");
        }
    },

    login: async (credentials) => {
        try {
            const response = await api.post("/auth/login", credentials);
            if (response.data.token) {
                await setToken(response.data.token);
            }
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Login failed");
        }
    },

    logout: async () => {
        try {
            await api.post("/user/logout");
            await removeToken();
            return { success: true };
        } catch (error) {
            // Even if API call fails, remove local token
            await removeToken();
            return { success: true };
        }
    },

    forgotPassword: async (email) => {
        try {
            const response = await api.post("/auth/forgot-password", { email });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Password reset failed");
        }
    },

    resetPassword: async (resetData) => {
        try {
            const response = await api.post("/auth/reset-password", resetData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Password reset failed");
        }
    }
};

// =============================================================================
// 👤 USER APIs
// =============================================================================

export const userAPI = {
    getProfile: async (userId) => {
        try {
            const response = await api.get(`/user/${userId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get user profile");
        }
    },

    getCurrentUserProfile: async () => {
        try {
            const response = await api.get("/user/me");
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get current user profile");
        }
    },

    // Alternative endpoints to try if /user/me doesn't work
    getCurrentUserProfileAlt: async () => {
        try {
            // Try alternative endpoint
            const response = await api.get("/user/profile");
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get user profile");
        }
    },

    // Store user data from login response
    storeUserDataFromLogin: async (userData) => {
        try {
            await AsyncStorage.setItem("user_profile", JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error("Error storing user data:", error);
            return userData;
        }
    },

    // Get stored user data
    getStoredUserData: async () => {
        try {
            const userData = await AsyncStorage.getItem("user_profile");
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error("Error getting stored user data:", error);
            return null;
        }
    },

    // Clear stored user data
    clearStoredUserData: async () => {
        try {
            await AsyncStorage.removeItem("user_profile");
        } catch (error) {
            console.error("Error clearing user data:", error);
        }
    },

    // 🆕 Update stored user data with new level/XP info
    updateStoredUserLevel: async (updatedInfo) => {
        try {
            const currentUser = await AsyncStorage.getItem("user_profile");
            if (currentUser) {
                const userData = JSON.parse(currentUser);

                // Update the relevant fields
                if (updatedInfo.current_level !== undefined) {
                    userData.current_level = updatedInfo.current_level;
                }
                if (updatedInfo.experience_points !== undefined) {
                    userData.experience_points = updatedInfo.experience_points;
                }
                if (updatedInfo.level_progress !== undefined) {
                    userData.level_progress = updatedInfo.level_progress;
                }
                if (updatedInfo.coins !== undefined) {
                    userData.coins = updatedInfo.coins;
                }

                await AsyncStorage.setItem("user_profile", JSON.stringify(userData));
                console.log("✅ Updated stored user level data:", updatedInfo);
                return userData;
            }
            return null;
        } catch (error) {
            console.error("Error updating stored user level data:", error);
            return null;
        }
    },

    // 🆕 Update stored user statistics immediately after game completion
    updateStoredUserStats: async () => {
        try {
            const currentUser = await AsyncStorage.getItem("user_profile");
            if (!currentUser) return null;

            const userData = JSON.parse(currentUser);

            // Check if we have a user ID
            if (!userData.id) {
                console.log("⚠️ No user ID found in stored data, skipping statistics update");
                return userData;
            }

            console.log("🔄 Fetching fresh statistics after game completion for user ID:", userData.id);

            // Use socialAPI to get comprehensive user stats including statistics array
            const freshProfile = await socialAPI.getUserStats(userData.id);
            if (freshProfile && freshProfile.user && freshProfile.user.statistics) {
                userData.statistics = freshProfile.user.statistics;
                await AsyncStorage.setItem("user_profile", JSON.stringify(userData));
                console.log("✅ Updated stored user statistics:", freshProfile.user.statistics);
                return userData;
            }

            return userData;
        } catch (error) {
            console.error("Error updating stored user statistics:", error);
            return null;
        }
    },

    // Debug function to check current user identity
    debugCurrentUser: async () => {
        try {
            const token = await getToken();
            const storedUser = await AsyncStorage.getItem("user_profile");

            console.log("🔍 Debug Current User Identity:");
            console.log("- Token present:", token ? "Yes" : "No");
            console.log("- Token preview:", token ? token.substring(0, 20) + "..." : "None");
            console.log("- Stored user data:", storedUser ? JSON.parse(storedUser) : "None");

            // Try to get current user from API
            try {
                const response = await api.get("/user/me");
                console.log("- API user data:", response.data);
                return response.data;
            } catch (error) {
                console.log("- API user fetch failed:", error.message);
                return null;
            }
        } catch (error) {
            console.error("Debug user identity error:", error);
            return null;
        }
    },

    updateProfile: async (userId, updateData) => {
        try {
            // Get the last update timestamp from storage
            const lastUpdateKey = `last_profile_update_${userId}`;
            const lastUpdate = await AsyncStorage.getItem(lastUpdateKey);

            if (lastUpdate) {
                const lastUpdateDate = new Date(lastUpdate);
                const currentDate = new Date();
                const monthsDiff = (currentDate.getFullYear() - lastUpdateDate.getFullYear()) * 12 +
                    (currentDate.getMonth() - lastUpdateDate.getMonth());

                if (monthsDiff < 1) {
                    throw new Error('Profile can only be updated once per month');
                }
            }

            const response = await api.put(`/user/update/${userId}`, updateData);

            // Store the update timestamp
            await AsyncStorage.setItem(lastUpdateKey, new Date().toISOString());

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    },

    deleteAccount: async (userId) => {
        try {
            const response = await api.delete(`/user/delete/${userId}`);
            await removeToken();
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to delete account");
        }
    },

    // Claim daily bonus
    claimDailyBonus: async () => {
        try {
            const response = await api.post('/user/claim-daily-bonus');
            return { success: true, ...response.data };
        } catch (error) {
            if (error.response && error.response.data) {
                return { success: false, ...error.response.data };
            }
            return { success: false, message: 'Failed to claim daily bonus' };
        }
    },

    uploadProfilePicture: async (imageUri) => {
        try {
            // Create form data
            const formData = new FormData();

            // Get the file name from the URI
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('image', {
                uri: imageUri,
                name: filename || 'profile.jpg',
                type
            });

            const response = await api.post('/user/upload-profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to upload profile picture');
        }
    }
};

// =============================================================================
// ⚔️ BATTLE APIs
// =============================================================================

export const battleAPI = {
    // Create a new battle session
    createBattle: async (battleData) => {
        try {
            const token = await getToken();
            console.log("🔑 Creating battle with token:", token ? "Present" : "Missing");
            console.log("📝 Battle data:", battleData);

            const response = await api.post("/battle/create", battleData);
            console.log("✅ Create battle API response:", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ Create battle API error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to create battle");
        }
    },

    // Join a battle using battle code
    joinBattle: async (battleCode) => {
        try {
            const token = await getToken();
            console.log("🔑 Joining battle with token:", token ? "Present" : "Missing");
            console.log("🎯 Battle code:", battleCode);

            const response = await api.post("/battle/join", { battle_code: battleCode });
            console.log("✅ Join battle API response:", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ Join battle API error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to join battle");
        }
    },

    // Submit answer for a battle round
    submitBattleRound: async (roundData) => {
        try {
            const response = await api.post("/battle/submit-round", roundData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to submit battle round");
        }
    },

    // Complete a battle session
    completeBattle: async (battleSessionId, totalTime) => {
        try {
            const response = await api.post("/battle/complete", {
                battle_session_id: battleSessionId,
                total_time: totalTime
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to complete battle");
        }
    },

    // Start a battle (creator initiates the countdown)
    startBattle: async (battleId) => {
        try {
            console.log("🚀 Starting battle with ID:", battleId);
            const response = await api.post("/battle/start", {
                battle_id: battleId
            });
            console.log("✅ Start battle API response:", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ Start battle API error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to start battle");
        }
    },

    // Get battle session details
    getBattleSession: async (battleId) => {
        try {
            console.log("🔍 Getting battle session for ID:", battleId);
            const response = await api.get(`/battle/${battleId}`);
            console.log("📊 Battle session data:", {
                id: response.data.battle_session?.id,
                battle_code: response.data.battle_session?.battle_code,
                creator: response.data.creator?.username,
                opponent: response.data.opponent?.username,
                hasOpponent: !!response.data.opponent
            });
            return response.data;
        } catch (error) {
            console.error("❌ Get battle session error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to get battle session");
        }
    },

    // Get user's battle history
    getMyBattles: async (page = 1, limit = 20, status = null) => {
        try {
            const params = { page, limit };
            if (status) params.status = status;

            const response = await api.get("/battle/my-battles", { params });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get battle history");
        }
    },

    // Get all public battles
    getAllBattles: async (page = 1, limit = 30) => {
        try {
            const response = await api.get("/battle/all", {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get all battles");
        }
    },

    // Get available battles for joining
    getAvailableBattles: async (page = 1, limit = 30) => {
        try {
            const response = await api.get("/battle/available", {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get available battles");
        }
    },

    // Debug function to check battle state by code
    debugBattleByCode: async (battleCode) => {
        try {
            console.log("🔍 Debug: Checking battle state for code:", battleCode);
            // We'll make a test call to see battle state
            const response = await api.get("/battle/available");
            const availableBattles = response.data.battles || [];

            const targetBattle = availableBattles.find(battle => battle.battle_code === battleCode);

            if (targetBattle) {
                console.log("📊 Debug: Found battle in available list:", {
                    id: targetBattle.id,
                    code: targetBattle.battle_code,
                    creator: targetBattle.creator?.username,
                    hasOpponent: !!targetBattle.opponent_id,
                    isPublic: targetBattle.is_public
                });
            } else {
                console.log("❌ Debug: Battle not found in available battles list");
            }

            return targetBattle;
        } catch (error) {
            console.error("❌ Debug battle check error:", error.response?.data || error.message);
            return null;
        }
    }
};

// =============================================================================
// 👥 SOCIAL APIs
// =============================================================================

export const socialAPI = {
    getUserStats: async (userId) => {
        try {
            const response = await api.get(`/users/${userId}/stats`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get user stats");
        }
    },

    followUser: async (userId) => {
        try {
            const response = await api.post(`/users/${userId}/follow`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to follow user");
        }
    },

    unfollowUser: async (userId) => {
        try {
            const response = await api.delete(`/users/${userId}/unfollow`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to unfollow user");
        }
    },

    getFollowers: async (userId, page = 1, limit = 20) => {
        try {
            const response = await api.get(`/users/${userId}/followers?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get followers");
        }
    },

    getFollowing: async (userId, page = 1, limit = 20) => {
        try {
            const response = await api.get(`/users/${userId}/following?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get following");
        }
    }
};

// =============================================================================
// 🎮 GAME APIs
// =============================================================================

export const gameAPI = {
    startGame: async (gameData) => {
        try {
            const response = await api.post("/game/start", gameData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to start game");
        }
    },

    // 🎯 ENHANCED: Complete Game API - Fixed to match expected format
    completeGame: async (gameResults) => {
        try {
            console.log("🎮 Starting game completion via api/game/complete");
            console.log("📊 Input data:", gameResults);

            // Validate required fields
            if (!gameResults.game_session_id) {
                throw new Error("game_session_id is required for game completion");
            }
            if (!gameResults.total_time || !gameResults.rounds || !Array.isArray(gameResults.rounds)) {
                throw new Error("total_time and rounds array are required for game completion");
            }

            // Validate rounds data
            if (gameResults.rounds.length === 0) {
                throw new Error("At least one round is required to complete a game");
            }

            // Validate existing session rounds (must include first_number, second_number)
            const invalidRounds = gameResults.rounds.filter(round =>
                !round.first_number || !round.second_number ||
                !round.user_symbol || round.response_time === undefined
            );

            if (invalidRounds.length > 0) {
                throw new Error("All rounds must include first_number, second_number, user_symbol, and response_time");
            }

            // Prepare request payload to match expected format exactly
            const requestPayload = {
                game_session_id: parseInt(gameResults.game_session_id),
                difficulty_level: gameResults.difficulty_level || 2,
                total_time: parseFloat(gameResults.total_time),
                rounds: gameResults.rounds.map(round => ({
                    first_number: parseInt(round.first_number),
                    second_number: parseInt(round.second_number),
                    user_symbol: round.user_symbol,
                    response_time: parseFloat(round.response_time)
                })),
                recording_url: gameResults.recording_url || null
            };

            console.log("📤 Calling POST /api/game/complete");
            console.log("📦 Request payload:", requestPayload);

            const response = await api.post("/game/complete", requestPayload);

            console.log("✅ Game completed successfully via api/game/complete!");
            console.log("📊 Server response status:", response.status);
            console.log("📊 Server response data:", response.data);

            // Validate server response
            if (!response.data) {
                throw new Error("Empty response from server");
            }

            return {
                success: true,
                data: response.data,
                // Extract useful info for easy access
                gameId: response.data.session_info?.game_id,
                finalScore: response.data.game_result?.scoring?.final_score,
                correctAnswers: response.data.game_result?.performance?.correct_answers,
                accuracy: response.data.game_result?.performance?.accuracy,
                experienceGained: response.data.game_result?.scoring?.experience_gained,
                coinsEarned: response.data.game_result?.scoring?.coins_earned,
                leveledUp: response.data.game_result?.player?.level_up,
                newLevel: response.data.game_result?.player?.level_after,
                levelsGained: response.data.game_result?.player?.levels_gained,
                // 🆕 Updated user info for immediate state update
                updatedUserInfo: response.data.updated_user_info,
                _api_endpoint: "/api/game/complete"
            };

        } catch (error) {
            console.error("❌ Failed to complete game via api/game/complete:", error);

            // Enhanced error handling
            let errorMessage = "Failed to complete game";

            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || "Invalid game data provided";
                console.error("❌ Bad Request (400):", errorMessage);
            } else if (error.response?.status === 404) {
                errorMessage = "Game session not found";
                console.error("❌ Not Found (404):", errorMessage);
            } else if (error.response?.status === 409) {
                errorMessage = "Game session already completed or unavailable";
                console.error("❌ Conflict (409):", errorMessage);
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
                console.error("❌ Server error:", errorMessage);
            } else if (error.message) {
                errorMessage = error.message;
                console.error("❌ Client error:", errorMessage);
            }

            throw new Error(errorMessage);
        }
    },

    // 🎯 ENHANCED: Complete Game with Auto-Detection
    // This method automatically detects the mode and formats data appropriately
    completeGameAuto: async (gameData) => {
        try {
            const {
                sessionId,
                rounds,
                totalTime,
                difficultyLevel = 1,
                recordingUrl = null
            } = gameData;

            let formattedGameResults;

            if (sessionId && sessionId !== 0 && sessionId !== "practice" && sessionId !== "quick-submit") {
                // Existing session mode - need full round data
                formattedGameResults = {
                    game_session_id: sessionId,
                    total_time: totalTime,
                    rounds: rounds,
                    recording_url: recordingUrl
                };
            } else {
                // New session mode - only need user responses
                formattedGameResults = {
                    difficulty_level: difficultyLevel,
                    total_time: totalTime,
                    rounds: rounds.map(round => ({
                        user_symbol: round.user_symbol,
                        response_time: round.response_time
                    })),
                    recording_url: recordingUrl
                };
            }

            return await gameAPI.completeGame(formattedGameResults);

        } catch (error) {
            console.error("❌ Auto-complete game failed:", error);
            throw error;
        }
    },

    getGameHistory: async (page = 1, limit = 20) => {
        try {
            const response = await api.get(`/game/history?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get game history");
        }
    },

    getGameStats: async () => {
        try {
            const response = await api.get("/game/stats/summary");
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get game stats");
        }
    },

    getAvailableGames: async (page = 1, limit = 10, adminId = null) => {
        try {
            let url = `/game/available?page=${page}&limit=${limit}`;
            if (adminId) {
                url += `&admin_id=${adminId}`;
            }
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get available games");
        }
    },

    joinGame: async (gameSessionId) => {
        try {
            console.log(`🎮 Joining game session: ${gameSessionId}`);
            const response = await api.post("/game/join", { game_session_id: gameSessionId });

            console.log("✅ Successfully joined game");

            // After joining, the response should include basic game info and rounds
            // If rounds are missing or incomplete, we'll fetch them separately
            const joinData = response.data;

            if (!joinData.rounds || joinData.rounds.length === 0) {
                console.log("🔄 Join response missing rounds, fetching full game data...");

                // Small delay to ensure backend has processed the join
                await new Promise(resolve => setTimeout(resolve, 500));

                try {
                    const gameData = await gameAPI.getGameSession(gameSessionId);
                    console.log(`✅ Fetched game data with ${gameData.rounds?.length || 0} rounds`);

                    if (!gameData.rounds || gameData.rounds.length === 0) {
                        console.warn("⚠️ Still no rounds after fetching game data");
                        // Try one more time with longer delay
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        const retryGameData = await gameAPI.getGameSession(gameSessionId);

                        if (!retryGameData.rounds || retryGameData.rounds.length === 0) {
                            throw new Error("No rounds data available after multiple attempts");
                        }

                        return {
                            ...joinData,
                            ...retryGameData,
                            _enhanced: true,
                            _retry_count: 2
                        };
                    }

                    return {
                        ...joinData,
                        ...gameData,
                        _enhanced: true,
                        _retry_count: 1
                    };
                } catch (fetchError) {
                    console.warn("⚠️ Could not fetch full game data after join:", fetchError);
                    // Return the original join response even if rounds are missing
                    return {
                        ...joinData,
                        _fetch_error: fetchError.message
                    };
                }
            }

            // Validate rounds data if present
            if (joinData.rounds && Array.isArray(joinData.rounds)) {
                const validRounds = joinData.rounds.filter(round =>
                    round &&
                    typeof round.round_number === 'number' &&
                    typeof round.first_number === 'number' &&
                    typeof round.second_number === 'number'
                );

                console.log(`✅ Join response has ${validRounds.length} valid rounds`);

                return {
                    ...joinData,
                    rounds: validRounds,
                    _enhanced: false
                };
            }

            return joinData;

        } catch (error) {
            console.error("❌ Failed to join game:", error);

            // Enhanced error handling
            if (error.response?.status === 404) {
                throw new Error("Game session not found");
            } else if (error.response?.status === 409) {
                if (error.response.data?.message?.includes("completed")) {
                    throw new Error("This game session has already been completed");
                } else if (error.response.data?.message?.includes("assigned")) {
                    throw new Error("This game session is already assigned to another user");
                }
                throw new Error(error.response.data?.message || "Game session is not available");
            } else if (error.response?.status === 400) {
                throw new Error("Invalid game session ID");
            }

            throw new Error(error.response?.data?.message || "Failed to join game");
        }
    },

    // Add missing methods that the frontend is calling
    createGameSession: async (gameData) => {
        try {
            const response = await api.post("/game/start", gameData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to create game session");
        }
    },

    joinGameSession: async (gameSessionId) => {
        try {
            const response = await api.post("/game/join", { game_session_id: gameSessionId });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to join game session");
        }
    },

    getGameSession: async (gameSessionId) => {
        try {
            console.log(`🔄 Calling GET /api/game/${gameSessionId}`);
            const response = await api.get(`/game/${gameSessionId}`);

            console.log(`✅ GET /api/game/${gameSessionId} - Status:`, response.status);
            console.log("📊 Raw server response:", response.data);

            // Validate response structure
            if (!response.data) {
                throw new Error("Empty response from server");
            }

            const { game_session, rounds, progress, current_round } = response.data;

            // Validate game session data
            if (!game_session || !game_session.id) {
                throw new Error("Invalid game session data received");
            }

            console.log(`✅ Game session ${game_session.id} loaded successfully`);
            console.log(`📊 Game details: ${game_session.number_of_rounds} rounds, completed: ${game_session.completed}`);

            // Validate rounds data
            if (!rounds || !Array.isArray(rounds)) {
                console.warn("⚠️ No rounds array found in response");
                // Don't throw error here, let the frontend handle it
                return {
                    ...response.data,
                    rounds: [] // Ensure rounds is at least an empty array
                };
            }

            // Validate round structure
            const validRounds = rounds.filter(round =>
                round &&
                typeof round.round_number === 'number' &&
                typeof round.first_number === 'number' &&
                typeof round.second_number === 'number'
            );

            if (validRounds.length !== rounds.length) {
                console.warn(`⚠️ Some rounds have invalid data. Valid: ${validRounds.length}/${rounds.length}`);
            }

            console.log(`✅ Rounds validated: ${validRounds.length} valid rounds available`);
            console.log("📊 Round sample:", validRounds.slice(0, 2)); // Show first 2 rounds as sample

            return {
                ...response.data,
                rounds: validRounds,
                _meta: {
                    total_rounds_expected: game_session.number_of_rounds,
                    total_rounds_received: validRounds.length,
                    data_complete: validRounds.length === game_session.number_of_rounds,
                    _api_endpoint: `/api/game/${gameSessionId}`
                }
            };

        } catch (error) {
            console.error(`❌ Failed GET /api/game/${gameSessionId}:`, error);

            // Enhanced error messages
            if (error.response?.status === 404) {
                console.error("❌ Not Found (404): Game session doesn't exist");
                throw new Error("Game session not found. It may have been deleted or doesn't exist.");
            } else if (error.response?.status === 403) {
                console.error("❌ Forbidden (403): Access denied to game session");
                throw new Error("You don't have permission to access this game session.");
            } else if (error.response?.status === 400) {
                console.error("❌ Bad Request (400): Invalid session ID");
                throw new Error("Invalid game session ID provided.");
            } else if (error.response?.data?.message) {
                console.error("❌ Server error:", error.response.data.message);
                throw new Error(error.response.data.message);
            }

            console.error("❌ Unknown error:", error.message);
            throw new Error(error.message || "Failed to get game session");
        }
    },

    submitRound: async (gameSessionId, roundData) => {
        try {
            const response = await api.post(`/game/${gameSessionId}/submit-round`, {
                round_number: roundData.round_number,
                user_symbol: roundData.user_symbol,
                response_time: roundData.response_time
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to submit round");
        }
    },

    completeGameRounds: async (gameSessionId, recordingUrl = null) => {
        try {
            // Get all completed rounds for final submission
            const gameSession = await api.get(`/game/${gameSessionId}`);
            const rounds = gameSession.data.rounds || [];

            // Calculate total time from all rounds
            const totalTime = rounds.reduce((sum, round) => sum + (round.response_time || 0), 0);

            // Format rounds for completion
            const formattedRounds = rounds
                .filter(round => round.user_symbol) // Only completed rounds
                .map(round => ({
                    round_number: round.round_number,
                    first_number: round.first_number,
                    second_number: round.second_number,
                    user_symbol: round.user_symbol,
                    response_time: round.response_time
                }));

            const response = await api.post("/game/complete", {
                game_session_id: gameSessionId,
                total_time: totalTime,
                rounds: formattedRounds,
                recording_url: recordingUrl
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to complete game");
        }
    },

    // 🎮 NEW: Create Instant Game - Creates a ready-to-play game immediately
    createInstantGame: async (gameOptions = {}) => {
        try {
            const defaultOptions = {
                difficulty_level: 1,        // Easy level
                number_of_rounds: 10,       // 10 rounds
                // custom_rounds can be added if needed
            };

            const requestData = { ...defaultOptions, ...gameOptions };

            console.log("🎮 Creating instant game with options:", requestData);

            const response = await api.post("/game/create-instant", requestData);

            console.log("✅ Instant game created successfully!");
            return response.data;
        } catch (error) {
            console.error("❌ Failed to create instant game:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to create instant game");
        }
    },

    // 🚀 NEW: Submit Whole Game - Play and submit entire game in one call
    submitWholeGame: async (gameData) => {
        try {
            const response = await api.post("/game/submit-whole", gameData);

            // Extract useful info for easy access (similar to completeGame)
            return {
                success: true,
                ...response.data,
                // Extract useful info for easy access
                gameId: response.data.game_result?.game_id,
                finalScore: response.data.game_result?.scoring?.final_score,
                correctAnswers: response.data.game_result?.performance?.correct_answers,
                accuracy: response.data.game_result?.performance?.accuracy,
                experienceGained: response.data.game_result?.scoring?.experience_gained,
                coinsEarned: response.data.game_result?.scoring?.coins_earned,
                leveledUp: response.data.game_result?.player?.level_up,
                newLevel: response.data.game_result?.player?.level_after,
                levelsGained: response.data.game_result?.player?.levels_gained,
                // 🆕 Updated user info for immediate state update
                updated_user_info: response.data.updated_user_info,
                _api_endpoint: "/api/game/submit-whole"
            };
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to submit whole game");
        }
    },

    // 🎯 UTILITY: Simple Game Completion Helper
    // Simplified function for common game completion scenarios
    finishGame: async (rounds, options = {}) => {
        try {
            const {
                sessionId = null,
                difficultyLevel = 1,
                recordingUrl = null,
                gameStartTime = null
            } = options;

            // Calculate total time
            const totalTime = gameStartTime
                ? (Date.now() - gameStartTime) / 1000
                : rounds.reduce((sum, round) => sum + (round.response_time || 0), 0);

            console.log(`🎮 Finishing game - SessionID: ${sessionId}, Rounds: ${rounds.length}, Time: ${totalTime}s`);

            return await gameAPI.completeGameAuto({
                sessionId,
                rounds,
                totalTime,
                difficultyLevel,
                recordingUrl
            });

        } catch (error) {
            console.error("❌ Failed to finish game:", error);
            throw error;
        }
    },

    // Replay functionality
    replayGame: async (gameId) => {
        try {
            const response = await api.post(`/game/replay/${gameId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to create replay game");
        }
    },

    getGameDetails: async (gameId) => {
        try {
            const response = await api.get(`/game/history/${gameId}/details`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get game details");
        }
    },

    getGameSessionHistory: async (sessionId, page = 1, limit = 20) => {
        try {
            const response = await api.get(`/game/session/${sessionId}/history?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get game session history");
        }
    },

    // 🛠️ UTILITY: Enhanced Game Session Fetcher
    // This method ensures we always get complete round data when fetching a game session
    getGameSessionWithRounds: async (gameSessionId, maxRetries = 3) => {
        console.log(`🔄 Getting game session ${gameSessionId} with guaranteed rounds (max ${maxRetries} retries)`);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries}`);

                // Progressive delay: 0ms, 1s, 2s
                if (attempt > 1) {
                    const delay = (attempt - 1) * 1000;
                    console.log(`⏱️ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const response = await gameAPI.getGameSession(gameSessionId);

                if (response && response.rounds && Array.isArray(response.rounds)) {
                    const validRounds = response.rounds.filter(round =>
                        round &&
                        typeof round.round_number === 'number' &&
                        typeof round.first_number === 'number' &&
                        typeof round.second_number === 'number'
                    );

                    if (validRounds.length > 0) {
                        console.log(`✅ Success on attempt ${attempt}: ${validRounds.length} valid rounds found`);
                        return {
                            ...response,
                            rounds: validRounds,
                            _meta: {
                                ...response._meta,
                                retry_attempt: attempt,
                                valid_rounds_count: validRounds.length,
                                _enhanced_fetch: true
                            }
                        };
                    }
                }

                console.log(`⚠️ Attempt ${attempt} failed - no valid rounds found`);

                if (attempt === maxRetries) {
                    console.error(`❌ All ${maxRetries} attempts failed to get valid rounds`);
                    throw new Error(`No valid rounds found after ${maxRetries} attempts`);
                }

            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed with error:`, error.message);

                if (attempt === maxRetries) {
                    throw error;
                }
            }
        }
    }
};

// =============================================================================
// 🏆 LEADERBOARD APIs
// =============================================================================

export const leaderboardAPI = {
    getDailyLeaderboard: async (page = 1, limit = 20) => {
        try {
            const response = await api.get(`/leaderboard/daily?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get daily leaderboard");
        }
    },

    getWeeklyLeaderboard: async (page = 1, limit = 20) => {
        try {
            const response = await api.get(`/leaderboard/weekly?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get weekly leaderboard");
        }
    },

    getMonthlyLeaderboard: async (page = 1, limit = 20) => {
        try {
            const response = await api.get(`/leaderboard/monthly?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get monthly leaderboard");
        }
    },

    getAllTimeLeaderboard: async (page = 1, limit = 20) => {
        try {
            const response = await api.get(`/leaderboard/all-time?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get all-time leaderboard");
        }
    },

    // 🆕 Redis-only leaderboard (this month's data from Redis)
    getRedisLeaderboard: async (filters) => {
        try {
            const { difficulty_level = 1, region = 'global', time_period = 'monthly', limit = 100, month_year = null } = filters;
            const response = await api.get('/leaderboard/redis', {
                params: {
                    difficulty_level,
                    region,
                    time_period,
                    limit,
                    month_year
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get Redis leaderboard");
        }
    },

    // 🆕 Get available historical months for leaderboards
    getAvailableMonths: async (filters = {}) => {
        try {
            const { difficulty_level = null, region = null } = filters;
            const response = await api.get('/leaderboard/available-months', {
                params: {
                    difficulty_level,
                    region
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get available months");
        }
    },

    getUserPositions: async () => {
        try {
            const response = await api.get("/leaderboard/user/me/positions");
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get user positions");
        }
    }
};

// =============================================================================
// 🏅 ACHIEVEMENT APIs
// =============================================================================

export const achievementAPI = {
    getAllAchievements: async (category = null) => {
        try {
            let url = "/achievements";
            if (category) {
                url += `?category=${category}`;
            }
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get achievements");
        }
    },

    getUserAchievements: async (earnedOnly = false) => {
        try {
            let url = "/achievements/me";
            if (earnedOnly) {
                url += "?earned_only=true";
            }
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get user achievements");
        }
    }
};

// =============================================================================
// 🔔 NOTIFICATION APIs
// =============================================================================

export const notificationAPI = {
    getNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
        try {
            let url = `/notifications?page=${page}&limit=${limit}`;
            if (unreadOnly) {
                url += "&unread_only=true";
            }
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get notifications");
        }
    },

    markAsRead: async (notificationId) => {
        try {
            const response = await api.put(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to mark notification as read");
        }
    }
};

// =============================================================================
// 💬 COMMENT APIs
// =============================================================================

export const commentAPI = {
    getComments: async (sessionId, page = 1, limit = 20) => {
        try {
            const response = await api.get(`/game/sessions/${sessionId}/comments?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get comments");
        }
    },

    createComment: async (sessionId, content) => {
        try {
            const response = await api.post(`/game/sessions/${sessionId}/comments`, { content });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to create comment");
        }
    },

    updateComment: async (sessionId, commentId, content) => {
        try {
            const response = await api.put(`/game/sessions/${sessionId}/comments/${commentId}`, { content });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to update comment");
        }
    },

    deleteComment: async (sessionId, commentId) => {
        try {
            const response = await api.delete(`/game/sessions/${sessionId}/comments/${commentId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to delete comment");
        }
    },

    likeSession: async (sessionId) => {
        try {
            const response = await api.post(`/game/sessions/${sessionId}/like`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to like session");
        }
    },

    unlikeSession: async (sessionId) => {
        try {
            const response = await api.delete(`/game/sessions/${sessionId}/like`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to unlike session");
        }
    },

    getSessionLikes: async (sessionId) => {
        try {
            const response = await api.get(`/game/sessions/${sessionId}/likes`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get session likes");
        }
    }
};

// =============================================================================
// 💰 TRANSACTION/PAYMENT APIs (PayOS)
// =============================================================================

export const paymentAPI = {
    // Get available coin packages
    getCoinPackages: async () => {
        try {
            const response = await api.get("/transactions/coin-packages");
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get coin packages");
        }
    },

    // Create PayOS payment for coins
    createPayOSPayment: async (userId, packageId) => {
        try {
            const response = await api.post("/transactions/payos-coin-payment", {
                userId,
                packageId
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to create PayOS payment");
        }
    },

    // Get user's transaction history
    getUserTransactions: async (userId, page = 1, limit = 10, type = null) => {
        try {
            let url = `/transactions/user/${userId}?page=${page}&limit=${limit}`;
            if (type) {
                url += `&type=${type}`;
            }
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get user transactions");
        }
    },

    // Check transaction status by ID
    getTransactionById: async (transactionId) => {
        try {
            const response = await api.get(`/transactions/${transactionId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to get transaction details");
        }
    }
};

// =============================================================================
// 🚨 UTILITY FUNCTIONS
// =============================================================================

export const apiUtils = {
    // Check if user is authenticated
    isAuthenticated: async () => {
        const token = await getToken();
        return !!token;
    },

    // Get current user token
    getCurrentToken: getToken,

    // Clear all data (logout)
    clearAllData: async () => {
        await removeToken();
    },

    // Health check
    healthCheck: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/health`);
            return response.data;
        } catch (error) {
            throw new Error("Backend server is not responding");
        }
    }
};

// Leaderboard APIs
export const fetchLeaderboard = async (filters) => {
    try {
        const { difficulty_level, region, time_period } = filters;
        const response = await axios.get(`${BASE_URL}/leaderboard`, {
            params: {
                difficulty_level,
                region,
                time_period
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
    }
};

// 🆕 Redis-only leaderboard API
export const fetchRedisLeaderboard = async (filters) => {
    try {
        const { difficulty_level, region, time_period, month_year = null } = filters;
        const token = await getToken();
        const response = await axios.get(`${BASE_URL}/leaderboard/redis`, {
            params: {
                difficulty_level,
                region,
                time_period,
                month_year
            },
            headers: token ? {
                Authorization: `Bearer ${token}`
            } : {}
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching Redis leaderboard:', error);
        throw error;
    }
};

// 🆕 Get available historical months API
export const fetchAvailableMonths = async (filters = {}) => {
    try {
        const { difficulty_level = null, region = null } = filters;
        const token = await getToken();
        const response = await axios.get(`${BASE_URL}/leaderboard/available-months`, {
            params: {
                difficulty_level,
                region
            },
            headers: token ? {
                Authorization: `Bearer ${token}`
            } : {}
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching available months:', error);
        throw error;
    }
};

// Default export for backward compatibility
export default {
    auth: authAPI,
    user: userAPI,
    battle: battleAPI,
    social: socialAPI,
    game: gameAPI,
    leaderboard: leaderboardAPI,
    achievement: achievementAPI,
    notification: notificationAPI,
    comment: commentAPI,
    payment: paymentAPI,
    utils: apiUtils
};