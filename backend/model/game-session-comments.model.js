import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const GameSessionComment = sequelize.define('GameSessionComment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    game_session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'game_session_comments',
    timestamps: true,
    indexes: [
        {
            fields: ['game_session_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['createdAt']
        }
    ]
});

export default GameSessionComment; 