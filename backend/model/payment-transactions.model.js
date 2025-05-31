import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const PaymentTransaction = sequelize.define('PaymentTransaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    transaction_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'VND',
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['pending', 'completed', 'failed', 'refunded']]
        }
    },
    payment_provider: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    external_transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'payment_transactions',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['transaction_type']
        }
    ]
});

export default PaymentTransaction; 