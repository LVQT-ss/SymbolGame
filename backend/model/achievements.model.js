import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Achievement = sequelize.define('Achievement', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'achievements',
    timestamps: true,
    indexes: [
        {
            fields: ['is_active']
        }
    ]
});

export default Achievement; 