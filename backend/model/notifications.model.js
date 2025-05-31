import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            isIn: [['new_follower', 'achievement_earned', 'followed_user_achievement', 'session_liked', 'session_commented']]
        }
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    related_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    related_achievement_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    related_game_session_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['user_id', 'is_read']
        },
        {
            fields: ['user_id', 'type']
        },
        {
            fields: ['createdAt']
        }
    ]
});

export default Notification; 