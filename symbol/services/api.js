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

    updateProfile: async (userId, userData) => {
        try {
            const response = await api.put(`/user/update/${userId}`, userData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to update profile");
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

    completeGame: async (gameResults) => {
        try {
            const response = await api.post("/game/complete", gameResults);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to complete game");
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
            const response = await api.post("/game/join", { game_session_id: gameSessionId });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to join game");
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

// Default export for backward compatibility
export default {
    auth: authAPI,
    user: userAPI,
    social: socialAPI,
    game: gameAPI,
    leaderboard: leaderboardAPI,
    achievement: achievementAPI,
    notification: notificationAPI,
    comment: commentAPI,
    utils: apiUtils
};