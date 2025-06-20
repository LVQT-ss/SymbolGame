import User from './user.model.js';
import UserStatistics from './user-statistics.model.js';
import FollowerRelationship from './follower-relationships.model.js';
import GameSession from './game-sessions.model.js';
import RoundDetail from './round-details.model.js';
import GameHistory from './game-history.model.js';
import UserRoundResponse from './user-round-responses.model.js';
import GameSessionLike from './game-session-likes.model.js';
import GameSessionComment from './game-session-comments.model.js';
import LeaderboardEntry from './leaderboard-entries.model.js';
import Achievement from './achievements.model.js';
import UserAchievement from './user-achievements.model.js';
import Notification from './notifications.model.js';
import PaymentTransaction from './payment-transactions.model.js';

function setupAssociations() {
    // User - UserStatistics (One-to-One)
    User.hasOne(UserStatistics, {
        foreignKey: 'user_id',
        as: 'statistics',
        onDelete: 'CASCADE'
    });
    UserStatistics.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // User - FollowerRelationships (Many-to-Many through FollowerRelationship)
    User.hasMany(FollowerRelationship, {
        foreignKey: 'follower_id',
        as: 'following',
        onDelete: 'CASCADE'
    });
    User.hasMany(FollowerRelationship, {
        foreignKey: 'followed_id',
        as: 'followers',
        onDelete: 'CASCADE'
    });
    FollowerRelationship.belongsTo(User, {
        foreignKey: 'follower_id',
        as: 'follower'
    });
    FollowerRelationship.belongsTo(User, {
        foreignKey: 'followed_id',
        as: 'followed'
    });

    // User - GameSession (One-to-Many)
    User.hasMany(GameSession, {
        foreignKey: 'user_id',
        as: 'gameSessions',
        onDelete: 'CASCADE'
    });
    GameSession.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // Admin User - GameSession (One-to-Many) - for admin-created sessions
    User.hasMany(GameSession, {
        foreignKey: 'created_by_admin',
        as: 'adminCreatedSessions',
        onDelete: 'SET NULL'
    });
    GameSession.belongsTo(User, {
        foreignKey: 'created_by_admin',
        as: 'adminCreator'
    });

    // GameSession - RoundDetail (One-to-Many)
    GameSession.hasMany(RoundDetail, {
        foreignKey: 'game_session_id',
        as: 'rounds',
        onDelete: 'CASCADE'
    });
    RoundDetail.belongsTo(GameSession, {
        foreignKey: 'game_session_id',
        as: 'gameSession'
    });

    // Note: RoundDetail admin creator association removed since created_by_admin field was removed from model

    // GameSession - GameSessionLike (One-to-Many)
    GameSession.hasMany(GameSessionLike, {
        foreignKey: 'game_session_id',
        as: 'likes',
        onDelete: 'CASCADE'
    });
    GameSessionLike.belongsTo(GameSession, {
        foreignKey: 'game_session_id',
        as: 'gameSession'
    });

    // User - GameSessionLike (One-to-Many)
    User.hasMany(GameSessionLike, {
        foreignKey: 'user_id',
        as: 'likedSessions',
        onDelete: 'CASCADE'
    });
    GameSessionLike.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // GameSession - GameSessionComment (One-to-Many)
    GameSession.hasMany(GameSessionComment, {
        foreignKey: 'game_session_id',
        as: 'comments',
        onDelete: 'CASCADE'
    });
    GameSessionComment.belongsTo(GameSession, {
        foreignKey: 'game_session_id',
        as: 'gameSession'
    });

    // User - GameSessionComment (One-to-Many)
    User.hasMany(GameSessionComment, {
        foreignKey: 'user_id',
        as: 'comments',
        onDelete: 'CASCADE'
    });
    GameSessionComment.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // User - LeaderboardEntry (One-to-Many)
    User.hasMany(LeaderboardEntry, {
        foreignKey: 'user_id',
        as: 'leaderboardEntries',
        onDelete: 'CASCADE'
    });
    LeaderboardEntry.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // User - UserAchievement (One-to-Many)
    User.hasMany(UserAchievement, {
        foreignKey: 'user_id',
        as: 'userAchievements',
        onDelete: 'CASCADE'
    });
    UserAchievement.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // Achievement - UserAchievement (One-to-Many)
    Achievement.hasMany(UserAchievement, {
        foreignKey: 'achievement_id',
        as: 'userAchievements',
        onDelete: 'CASCADE'
    });
    UserAchievement.belongsTo(Achievement, {
        foreignKey: 'achievement_id',
        as: 'achievement'
    });

    // GameSession - UserAchievement (One-to-Many, optional)
    GameSession.hasMany(UserAchievement, {
        foreignKey: 'game_session_id',
        as: 'achievements',
        onDelete: 'SET NULL'
    });
    UserAchievement.belongsTo(GameSession, {
        foreignKey: 'game_session_id',
        as: 'gameSession'
    });

    // User - Notification (One-to-Many)
    User.hasMany(Notification, {
        foreignKey: 'user_id',
        as: 'notifications',
        onDelete: 'CASCADE'
    });
    Notification.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // Related User - Notification (One-to-Many, optional)
    User.hasMany(Notification, {
        foreignKey: 'related_user_id',
        as: 'relatedNotifications',
        onDelete: 'SET NULL'
    });
    Notification.belongsTo(User, {
        foreignKey: 'related_user_id',
        as: 'relatedUser'
    });

    // Achievement - Notification (One-to-Many, optional)
    Achievement.hasMany(Notification, {
        foreignKey: 'related_achievement_id',
        as: 'notifications',
        onDelete: 'SET NULL'
    });
    Notification.belongsTo(Achievement, {
        foreignKey: 'related_achievement_id',
        as: 'relatedAchievement'
    });

    // GameSession - Notification (One-to-Many, optional)
    GameSession.hasMany(Notification, {
        foreignKey: 'related_game_session_id',
        as: 'notifications',
        onDelete: 'SET NULL'
    });
    Notification.belongsTo(GameSession, {
        foreignKey: 'related_game_session_id',
        as: 'relatedGameSession'
    });

    // User - PaymentTransaction (One-to-Many)
    User.hasMany(PaymentTransaction, {
        foreignKey: 'user_id',
        as: 'paymentTransactions',
        onDelete: 'CASCADE'
    });
    PaymentTransaction.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // GameSession - GameHistory (One-to-Many)
    GameSession.hasMany(GameHistory, {
        foreignKey: 'game_session_id',
        as: 'gameHistories',
        onDelete: 'CASCADE'
    });
    GameHistory.belongsTo(GameSession, {
        foreignKey: 'game_session_id',
        as: 'gameSession'
    });

    // User - GameHistory (One-to-Many)
    User.hasMany(GameHistory, {
        foreignKey: 'user_id',
        as: 'gameHistories',
        onDelete: 'CASCADE'
    });
    GameHistory.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // RoundDetail - UserRoundResponse (One-to-Many)
    RoundDetail.hasMany(UserRoundResponse, {
        foreignKey: 'round_detail_id',
        as: 'userResponses',
        onDelete: 'CASCADE'
    });
    UserRoundResponse.belongsTo(RoundDetail, {
        foreignKey: 'round_detail_id',
        as: 'roundDetail'
    });

    // GameHistory - UserRoundResponse (One-to-Many)
    GameHistory.hasMany(UserRoundResponse, {
        foreignKey: 'game_history_id',
        as: 'roundResponses',
        onDelete: 'CASCADE'
    });
    UserRoundResponse.belongsTo(GameHistory, {
        foreignKey: 'game_history_id',
        as: 'gameHistory'
    });

    // User - UserRoundResponse (One-to-Many)
    User.hasMany(UserRoundResponse, {
        foreignKey: 'user_id',
        as: 'roundResponses',
        onDelete: 'CASCADE'
    });
    UserRoundResponse.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });
}

export default setupAssociations;