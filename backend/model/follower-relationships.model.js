import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const FollowerRelationship = sequelize.define('FollowerRelationship', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    follower_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    followed_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'follower_relationships',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['follower_id', 'followed_id']
        },
        {
            fields: ['follower_id']
        },
        {
            fields: ['followed_id']
        }
    ]
});

export default FollowerRelationship; 