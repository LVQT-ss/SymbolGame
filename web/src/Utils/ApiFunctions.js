import axios from "axios";

// Configure base URL for the backend
const BASE_URL = "https://symbolgame.onrender.com/api";

const api = axios.create({
	baseURL: BASE_URL,
	timeout: 10000, // 10 second timeout
});

const getHeader = () => {
	const token = localStorage.getItem("token");
	return {
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	};
};

// =============================================================================
// AUTH API FUNCTIONS
// =============================================================================

async function register(userData) {
	try {
		const response = await api.post("/auth/register", userData);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Registration failed");
	}
}

async function login(credentials) {
	try {
		const response = await api.post("/auth/login", credentials);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Login failed");
	}
}

async function forgotPassword(email) {
	try {
		const response = await api.post("/auth/forgot-password", { email });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Password reset request failed");
	}
}

async function resetPassword(resetData) {
	try {
		const response = await api.post("/auth/reset-password", resetData);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Password reset failed");
	}
}

async function signout() {
	try {
		localStorage.removeItem("token");
		return { success: true };
	} catch {
		throw new Error("Signout failed");
	}
}

// =============================================================================
// USER API FUNCTIONS
// =============================================================================

async function getAllUsers() {
	try {
		const response = await api.get("/user/getalluser", { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get users");
	}
}

async function getAllCustomers() {
	try {
		const response = await api.get("/user/getallcustomer", { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get customers");
	}
}

async function getUserById(userId) {
	try {
		const response = await api.get(`/user/${userId}`, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get user");
	}
}

async function updateUser(userId, userData) {
	try {
		const response = await api.put(`/user/update/${userId}`, userData, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to update user");
	}
}

async function deleteUser(userId) {
	try {
		const response = await api.delete(`/user/delete/${userId}`, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to delete user");
	}
}

async function logout() {
	try {
		const response = await api.post("/user/logout", {}, { headers: getHeader() });
		localStorage.removeItem("token");
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Logout failed");
	}
}

// =============================================================================
// SOCIAL API FUNCTIONS
// =============================================================================

async function getUserStats(userId) {
	try {
		const response = await api.get(`/users/${userId}/stats`);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get user stats");
	}
}

async function followUser(userId) {
	try {
		const response = await api.post(`/users/${userId}/follow`, {}, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to follow user");
	}
}

async function unfollowUser(userId) {
	try {
		const response = await api.delete(`/users/${userId}/unfollow`, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to unfollow user");
	}
}

async function getUserFollowers(userId, page = 1, limit = 20) {
	try {
		const response = await api.get(`/users/${userId}/followers`, {
			params: { page, limit }
		});
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get followers");
	}
}

async function getUserFollowing(userId, page = 1, limit = 20) {
	try {
		const response = await api.get(`/users/${userId}/following`, {
			params: { page, limit }
		});
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get following");
	}
}

// =============================================================================
// GAME API FUNCTIONS
// =============================================================================

async function startGame(gameData = {}) {
	try {
		const response = await api.post("/game/start", gameData, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to start game");
	}
}

async function createCustomGame(customGameData) {
	try {
		const response = await api.post("/game/admin/create-custom", customGameData, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to create custom game");
	}
}

async function getAssignedGames(page = 1, limit = 10, status = "all") {
	try {
		const response = await api.get("/game/assigned", {
			headers: getHeader(),
			params: { page, limit, status }
		});
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get assigned games");
	}
}

async function completeGame(gameData) {
	try {
		const response = await api.post("/game/complete", gameData, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to complete game");
	}
}

async function getGameHistory(page = 1, limit = 20) {
	try {
		const response = await api.get("/game/history", {
			headers: getHeader(),
			params: { page, limit }
		});
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get game history");
	}
}

async function replayGame(gameId) {
	try {
		const response = await api.post(`/game/replay/${gameId}`, {}, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to create replay game");
	}
}

async function getGameDetails(gameId) {
	try {
		const response = await api.get(`/game/history/${gameId}/details`, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get game details");
	}
}

async function getGameStats() {
	try {
		const response = await api.get("/game/stats", { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get game stats");
	}
}

async function getAdminGameDashboard() {
	try {
		const response = await api.get("/game/admin/dashboard", { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get admin dashboard");
	}
}

async function getAvailableGames() {
	try {
		const response = await api.get("/game/available", { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get available games");
	}
}

// =============================================================================
// COMMENT & LIKE API FUNCTIONS
// =============================================================================

async function createComment(sessionId, content) {
	try {
		const response = await api.post(`/game/sessions/${sessionId}/comments`,
			{ content },
			{ headers: getHeader() }
		);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to create comment");
	}
}

async function getComments(sessionId, page = 1, limit = 20) {
	try {
		const response = await api.get(`/game/sessions/${sessionId}/comments`, {
			params: { page, limit }
		});
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get comments");
	}
}

async function updateComment(sessionId, commentId, content) {
	try {
		const response = await api.put(`/game/sessions/${sessionId}/comments/${commentId}`,
			{ content },
			{ headers: getHeader() }
		);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to update comment");
	}
}

async function deleteComment(sessionId, commentId) {
	try {
		const response = await api.delete(`/game/sessions/${sessionId}/comments/${commentId}`,
			{ headers: getHeader() }
		);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to delete comment");
	}
}

async function likeSession(sessionId) {
	try {
		const response = await api.post(`/game/sessions/${sessionId}/like`, {}, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to like session");
	}
}

async function unlikeSession(sessionId) {
	try {
		const response = await api.delete(`/game/sessions/${sessionId}/like`, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to unlike session");
	}
}

async function getSessionLikes(sessionId) {
	try {
		const response = await api.get(`/game/sessions/${sessionId}/likes`);
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get session likes");
	}
}

// =============================================================================
// LEADERBOARD API FUNCTIONS
// =============================================================================

async function getLeaderboard(type = "overall_score", period = "all_time", limit = 50, offset = 0) {
	try {
		const response = await api.get("/leaderboard", {
			headers: getHeader(),
			params: { type, period, limit, offset }
		});
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get leaderboard");
	}
}

async function getLeaderboardTypes() {
	try {
		const response = await api.get("/leaderboard/types", { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get leaderboard types");
	}
}

async function getUserRanks(userId) {
	try {
		const response = await api.get(`/leaderboard/user/${userId}`, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get user ranks");
	}
}

async function updateLeaderboards() {
	try {
		const response = await api.post("/leaderboard/update", {}, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to update leaderboards");
	}
}

// =============================================================================
// NOTIFICATION API FUNCTIONS
// =============================================================================

async function getNotifications(page = 1, limit = 20, unreadOnly = false) {
	try {
		const response = await api.get("/notifications", {
			headers: getHeader(),
			params: { page, limit, unread_only: unreadOnly }
		});
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get notifications");
	}
}

async function markNotificationAsRead(notificationId) {
	try {
		const response = await api.put(`/notifications/${notificationId}/read`, {}, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to mark notification as read");
	}
}

// =============================================================================
// ACHIEVEMENT API FUNCTIONS
// =============================================================================

async function getPublicAchievements(category = null, limit = 50, offset = 0) {
	try {
		const params = { limit, offset };
		if (category) params.category = category;

		const response = await api.get("/achievements/public", { params });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get public achievements");
	}
}

async function createAchievement(achievementData) {
	try {
		const response = await api.post("/achievements/create", achievementData, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to create achievement");
	}
}

async function getAllAchievements() {
	try {
		const response = await api.get("/achievements", { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get achievements");
	}
}

async function getUserAchievements(userId) {
	try {
		const response = await api.get(`/achievements/user/${userId}`, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get user achievements");
	}
}

async function checkUserAchievements() {
	try {
		const response = await api.post("/achievements/check", {}, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to check achievements");
	}
}

async function toggleShowcaseAchievement(achievementId) {
	try {
		const response = await api.put(`/achievements/${achievementId}/showcase`, {}, { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to toggle showcase achievement");
	}
}

async function getAchievementLeaderboard() {
	try {
		const response = await api.get("/achievements/leaderboard", { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get achievement leaderboard");
	}
}

// =============================================================================
// ADMIN API FUNCTIONS
// =============================================================================

async function getCustomerCount() {
	try {
		const response = await api.get("/admin/customers/count", { headers: getHeader() });
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Failed to get customer count");
	}
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

async function healthCheck() {
	try {
		const response = await api.get("/health");
		return response.data;
	} catch (error) {
		throw new Error(error.response?.data?.message || "Health check failed");
	}
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
	// Auth exports
	register,
	login,
	forgotPassword,
	resetPassword,
	signout,

	// User exports
	getAllUsers,
	getAllCustomers,
	getUserById,
	updateUser,
	deleteUser,
	logout,

	// Social exports
	getUserStats,
	followUser,
	unfollowUser,
	getUserFollowers,
	getUserFollowing,

	// Game exports
	startGame,
	createCustomGame,
	getAssignedGames,
	completeGame,
	getGameHistory,
	replayGame,
	getGameDetails,
	getGameStats,
	getAdminGameDashboard,
	getAvailableGames,

	// Comment & Like exports
	createComment,
	getComments,
	updateComment,
	deleteComment,
	likeSession,
	unlikeSession,
	getSessionLikes,

	// Leaderboard exports
	getLeaderboard,
	getLeaderboardTypes,
	getUserRanks,
	updateLeaderboards,

	// Notification exports
	getNotifications,
	markNotificationAsRead,

	// Achievement exports
	getPublicAchievements,
	createAchievement,
	getAllAchievements,
	getUserAchievements,
	checkUserAchievements,
	toggleShowcaseAchievement,
	getAchievementLeaderboard,

	// Admin exports
	getCustomerCount,

	// Health check export
	healthCheck
};