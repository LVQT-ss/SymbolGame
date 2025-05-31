import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const UserAchievement = sequelize.define('UserAchievement', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    achievement_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    game_session_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    progress_value: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    acquired_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'user_achievements',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'achievement_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['achievement_id']
        }
    ]
});

export default UserAchievement; 