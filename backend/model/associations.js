import User from './user.model.js';
import UserStatistics from './user-statistics.model.js';
import FollowerRelationship from './follower-relationships.model.js';
import GameSession from './game-sessions.model.js';
import RoundDetail from './round-details.model.js';
import GameHistory from './game-history.model.js';
import UserRoundResponse from './user-round-responses.model.js';
import GameSessionLike from './game-session-likes.model.js';
import GameSessionComment from './game-session-comments.model.js';
import PaymentTransaction from './payment-transactions.model.js';
import BattleSession from './battle-sessions.model.js';
import BattleRoundDetail from './battle-round-details.model.js';
import LeaderboardCache from './leaderboard-cache.model.js';

function setupAssociations() {
    // User - UserStatistics (One-to-Many) - Now supports multiple difficulty levels per user
    User.hasMany(UserStatistics, {
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

    // Battle-related associations

    // User - BattleSession (Creator relationship)
    User.hasMany(BattleSession, {
        foreignKey: 'creator_id',
        as: 'createdBattles',
        onDelete: 'CASCADE'
    });
    BattleSession.belongsTo(User, {
        foreignKey: 'creator_id',
        as: 'creator'
    });

    // User - BattleSession (Opponent relationship)
    User.hasMany(BattleSession, {
        foreignKey: 'opponent_id',
        as: 'joinedBattles',
        onDelete: 'SET NULL'
    });
    BattleSession.belongsTo(User, {
        foreignKey: 'opponent_id',
        as: 'opponent'
    });

    // User - BattleSession (Winner relationship)
    User.hasMany(BattleSession, {
        foreignKey: 'winner_id',
        as: 'wonBattles',
        onDelete: 'SET NULL'
    });
    BattleSession.belongsTo(User, {
        foreignKey: 'winner_id',
        as: 'winner'
    });

    // BattleSession - BattleRoundDetail (One-to-Many)
    BattleSession.hasMany(BattleRoundDetail, {
        foreignKey: 'battle_session_id',
        as: 'battleRounds',
        onDelete: 'CASCADE'
    });
    BattleRoundDetail.belongsTo(BattleSession, {
        foreignKey: 'battle_session_id',
        as: 'battleSession'
    });

    // UserStatistics - LeaderboardCache (One-to-Many)
    UserStatistics.hasMany(LeaderboardCache, {
        foreignKey: 'user_statistics_id',
        as: 'leaderboardEntries',
        onDelete: 'CASCADE'
    });
    LeaderboardCache.belongsTo(UserStatistics, {
        foreignKey: 'user_statistics_id',
        as: 'userStatistics'
    });
}

export default setupAssociations;