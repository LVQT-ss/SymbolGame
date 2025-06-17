import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const GameSessionLike = sequelize.define('GameSessionLike', {
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
}, {
    tableName: 'game_session_likes',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['game_session_id', 'user_id']
        },
        {
            fields: ['game_session_id']
        },
        {
            fields: ['user_id']
        }
    ]
});

export default GameSessionLike; 