import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    usertype: {
        type: DataTypes.ENUM('Admin', 'Customer'),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    age: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    coins: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    followers_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    following_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    experience_points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    current_level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    level_progress: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'users',
    timestamps: true,
    indexes: [
        {
            fields: ['username']
        },
        {
            fields: ['email']
        },
        {
            fields: ['followers_count']
        }
    ]
});

export default User;