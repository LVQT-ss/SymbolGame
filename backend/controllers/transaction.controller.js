import PaymentTransaction from "../model/payment-transactions.model.js";
import User from "../model/user.model.js";
import { Op } from "sequelize";
import sequelize from '../database/db.js';
import dotenv from 'dotenv';
import QRCode from "qrcode";
import PayOS from '@payos/node';
dotenv.config();

// Initialize PayOS
const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

// Coin packages available for purchase
const COIN_PACKAGES = {
    package1: { coins: 100, price: 10000, name: "100 Coins" },
    package2: { coins: 500, price: 45000, name: "500 Coins" },
    package3: { coins: 1000, price: 85000, name: "1000 Coins" },
    package4: { coins: 2500, price: 200000, name: "2500 Coins" },
    package5: { coins: 5000, price: 380000, name: "5000 Coins" }
};

// ===================================
// COIN PACKAGES
// ===================================

export const getCoinPackages = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            packages: COIN_PACKAGES
        });
    } catch (error) {
        console.error("Error getting coin packages:", error);
        res.status(500).json({ message: "Error getting coin packages", error: error.message });
    }
};

// ===================================
// PAYOS PAYMENT SYSTEM (ONLY ACTIVE PAYMENT METHOD)
// ===================================

export const createPayOSCoinPayment = async (req, res) => {
    try {
        const { userId, packageId } = req.body;

        if (!userId || !packageId) {
            return res.status(400).json({ message: "UserId and packageId are required" });
        }

        // Check if package exists
        const coinPackage = COIN_PACKAGES[packageId];
        if (!coinPackage) {
            return res.status(400).json({ message: "Invalid package ID" });
        }

        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create transaction record
        const transaction = await PaymentTransaction.create({
            user_id: userId,
            transaction_type: 'coin_purchase',
            price: coinPackage.price,
            currency: 'VND',
            status: 'pending',
            payment_provider: 'payos',
            external_transaction_id: `PAYOS-${Date.now()}-${userId}`
        });

        // Create PayOS payment request
        const paymentData = {
            orderCode: transaction.id,
            amount: coinPackage.price,
            description: `Nap ${coinPackage.coins} coins`, // Max 25 chars: "Nap 5000 coins" = 13 chars
            returnUrl: process.env.PAYOS_RETURN_URL,
            cancelUrl: process.env.PAYOS_CANCEL_URL,
            buyerName: user.username || `User${userId}`,
            buyerEmail: user.email || `user${userId}@symbol.game`,
            buyerPhone: user.phone || "0000000000",
            expiredAt: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes from now
        };

        console.log('Creating PayOS payment with data:', paymentData);
        console.log('Description length:', paymentData.description.length); // Debug log

        const paymentLinkRes = await payOS.createPaymentLink(paymentData);

        // Update transaction with PayOS order code
        await transaction.update({
            external_transaction_id: `PAYOS-${paymentLinkRes.orderCode}-${userId}`
        });

        // Generate QR code image from PayOS QR string
        let qrCodeImageUrl = null;
        if (paymentLinkRes.qrCode) {
            try {
                qrCodeImageUrl = await QRCode.toDataURL(paymentLinkRes.qrCode);
            } catch (qrError) {
                console.warn('Failed to generate QR code image:', qrError);
            }
        }

        res.status(200).json({
            success: true,
            paymentUrl: paymentLinkRes.checkoutUrl,
            qrCode: paymentLinkRes.qrCode, // Original QR string from PayOS
            qrCodeImageUrl: qrCodeImageUrl, // QR code as data URL for easy display
            transaction: transaction,
            package: coinPackage,
            orderCode: paymentLinkRes.orderCode,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                currentCoins: user.coins,
                newCoinsAfterPayment: user.coins + coinPackage.coins
            },
            paymentInfo: {
                description: paymentData.description,
                amount: coinPackage.price,
                currency: 'VND',
                expiresAt: new Date(paymentData.expiredAt * 1000).toISOString(),
                expiresInMinutes: 30
            }
        });
    } catch (error) {
        console.error('Error creating PayOS coin payment:', error);
        res.status(500).json({
            message: 'Error creating PayOS payment',
            error: error.message,
            details: error.response?.data || error
        });
    }
};

export const payOSWebhook = async (req, res) => {
    try {
        console.log('PayOS Webhook received:', {
            method: req.method,
            headers: req.headers,
            body: req.body
        });

        // Handle GET request (direct access for testing)
        if (req.method === 'GET') {
            return res.status(200).json({
                message: "PayOS Webhook endpoint is active",
                status: "ok",
                method: "POST required"
            });
        }

        // Simplified webhook processing - similar to your working example
        const webhookData = req.body;

        // Handle empty webhook (PayOS validation test)
        if (!webhookData || Object.keys(webhookData).length === 0) {
            console.log('Empty webhook - likely PayOS validation test');
            return res.status(200).json({
                status: 'success',
                message: 'Webhook received successfully'
            });
        }

        // Handle different webhook data structures
        let orderCode, status, amount;

        if (webhookData.data) {
            // PayOS webhook format: { data: { orderCode, status, amount } }
            orderCode = webhookData.data.orderCode;
            status = webhookData.data.status;
            amount = webhookData.data.amount;
        } else {
            // Direct format: { orderCode, status, amount }
            orderCode = webhookData.orderCode;
            status = webhookData.status;
            amount = webhookData.amount;
        }

        console.log('Processing webhook:', { orderCode, status, amount });

        // If no orderCode provided, this might be a validation test
        if (!orderCode) {
            console.log('No orderCode - treating as validation test');
            return res.status(200).json({
                status: 'success',
                message: 'Webhook validation successful'
            });
        }

        // Find transaction by order code
        const transaction = await PaymentTransaction.findOne({
            where: {
                id: orderCode
            }
        });

        if (!transaction) {
            console.log(`Transaction with orderCode ${orderCode} not found`);
            return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.status === 'completed') {
            console.log('Transaction already completed');
            return res.status(200).json({ message: "Transaction already processed" });
        }

        // Process successful payment
        if (status === 'PAID') {
            const dbTransaction = await sequelize.transaction();

            try {
                // Find the coin package based on transaction amount
                const packageEntry = Object.entries(COIN_PACKAGES).find(([key, pkg]) => pkg.price === parseFloat(transaction.price));

                if (!packageEntry) {
                    await dbTransaction.rollback();
                    return res.status(400).json({ message: "Invalid package amount" });
                }

                const [packageId, coinPackage] = packageEntry;

                // Update transaction status
                await transaction.update({
                    status: "completed",
                    completed_at: new Date()
                }, { transaction: dbTransaction });

                // Add coins to user
                const user = await User.findByPk(transaction.user_id, { transaction: dbTransaction });
                await user.update({
                    coins: user.coins + coinPackage.coins
                }, { transaction: dbTransaction });

                await dbTransaction.commit();

                console.log(`PayOS payment successful for order ${orderCode}. Added ${coinPackage.coins} coins to user ${user.id}`);

                // Simple success response like your working example
                res.status(200).json({
                    status: 'success',
                    message: 'Payment processed successfully'
                });
            } catch (error) {
                await dbTransaction.rollback();
                throw error;
            }
        } else if (status === 'CANCELLED') {
            // Update transaction status to failed
            await transaction.update({ status: "failed" });
            res.status(200).json({
                status: 'success',
                message: 'Payment cancelled'
            });
        } else {
            // Simple response for any other status
            res.status(200).json({
                status: 'success',
                message: 'Webhook received successfully'
            });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process webhook'
        });
    }
};

export const payOSReturn = async (req, res) => {
    try {
        const { orderCode, status, cancel } = req.query;

        if (!orderCode) {
            return res.status(400).json({ message: "Order code is required" });
        }

        // Find transaction
        const transaction = await PaymentTransaction.findOne({
            where: { id: orderCode },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'coins']
            }]
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // If payment was cancelled
        if (cancel === 'true') {
            await transaction.update({ status: "failed" });

            return res.status(200).json({
                success: false,
                message: "Payment was cancelled",
                transaction: transaction
            });
        }

        // Check payment status from PayOS
        try {
            const paymentInfo = await payOS.getPaymentLinkInformation(orderCode);

            if (paymentInfo.status === 'PAID' && transaction.status === 'pending') {
                const dbTransaction = await sequelize.transaction();

                try {
                    // Find the coin package
                    const packageEntry = Object.entries(COIN_PACKAGES).find(([key, pkg]) => pkg.price === parseFloat(transaction.price));

                    if (!packageEntry) {
                        await dbTransaction.rollback();
                        return res.status(400).json({ message: "Invalid package amount" });
                    }

                    const [packageId, coinPackage] = packageEntry;

                    // Update transaction
                    await transaction.update({
                        status: "completed",
                        completed_at: new Date()
                    }, { transaction: dbTransaction });

                    // Add coins to user
                    const user = await User.findByPk(transaction.user_id, { transaction: dbTransaction });
                    await user.update({
                        coins: user.coins + coinPackage.coins
                    }, { transaction: dbTransaction });

                    await dbTransaction.commit();

                    return res.status(200).json({
                        success: true,
                        message: "Payment successful! Coins have been added to your account.",
                        transaction: transaction,
                        coinsAdded: coinPackage.coins,
                        newBalance: user.coins + coinPackage.coins
                    });
                } catch (error) {
                    await dbTransaction.rollback();
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error checking PayOS payment status:', error);
        }

        res.status(200).json({
            success: true,
            message: "Return processed",
            transaction: transaction
        });
    } catch (error) {
        console.error('Error processing PayOS return:', error);
        res.status(500).json({
            message: 'Error processing payment return',
            error: error.message
        });
    }
};


export const receiveHook = async (req, res) => {
    try {
        console.log('Received webhook:', req.body);

        const { orderCode, status, transactionId } = req.body;

        // Find transaction by ID or orderCode
        let transaction;

        if (transactionId) {
            transaction = await PaymentTransaction.findByPk(transactionId);
        } else if (orderCode) {
            transaction = await PaymentTransaction.findOne({
                where: {
                    [Op.or]: [
                        { id: orderCode },
                        { external_transaction_id: orderCode }
                    ]
                }
            });
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'Missing transactionId or orderCode'
            });
        }

        if (!transaction) {
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        // If status is provided and is 'completed' or 'PAID', update transaction
        if (status && (status.toLowerCase() === 'completed' || status.toUpperCase() === 'PAID')) {
            if (transaction.status === 'completed') {
                return res.status(200).json({
                    status: 'success',
                    message: 'Transaction already completed',
                    transaction: transaction
                });
            }

            const dbTransaction = await sequelize.transaction();

            try {
                // Find the coin package based on transaction amount
                const packageEntry = Object.entries(COIN_PACKAGES).find(([key, pkg]) => pkg.price === parseFloat(transaction.price));

                if (!packageEntry) {
                    await dbTransaction.rollback();
                    return res.status(400).json({
                        status: 'error',
                        message: 'Invalid package amount'
                    });
                }

                const [packageId, coinPackage] = packageEntry;

                // Update transaction status
                await transaction.update({
                    status: "completed",
                    completed_at: new Date()
                }, { transaction: dbTransaction });

                // Add coins to user
                const user = await User.findByPk(transaction.user_id, { transaction: dbTransaction });
                if (!user) {
                    await dbTransaction.rollback();
                    return res.status(404).json({
                        status: 'error',
                        message: 'User not found'
                    });
                }

                await user.update({
                    coins: user.coins + coinPackage.coins
                }, { transaction: dbTransaction });

                await dbTransaction.commit();

                console.log(`Payment completed via webhook for transaction ${transaction.id}. Added ${coinPackage.coins} coins to user ${user.id}`);

                return res.status(200).json({
                    status: 'success',
                    message: 'Transaction completed successfully',
                    transaction: {
                        id: transaction.id,
                        status: 'completed',
                        user_id: transaction.user_id,
                        coins_added: coinPackage.coins,
                        new_balance: user.coins + coinPackage.coins
                    }
                });
            } catch (error) {
                await dbTransaction.rollback();
                throw error;
            }
        } else {
            // Just log the webhook for other statuses
            return res.status(200).json({
                status: 'success',
                message: 'Webhook received successfully',
                transaction: {
                    id: transaction.id,
                    current_status: transaction.status
                }
            });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process webhook'
        });
    }
};

// ===================================
// TRANSACTION MANAGEMENT
// ===================================

export const getUserTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, type } = req.query;

        const offset = (page - 1) * limit;

        const whereClause = { user_id: userId };
        if (type) {
            whereClause.transaction_type = type;
        }

        const transactions = await PaymentTransaction.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'coins']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.status(200).json({
            success: true,
            transactions: transactions.rows,
            pagination: {
                total: transactions.count,
                page: parseInt(page),
                pages: Math.ceil(transactions.count / limit),
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        console.error('Error fetching user transactions:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTransactionById = async (req, res) => {
    try {
        const transaction = await PaymentTransaction.findByPk(req.params.transactionId, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'coins']
            }]
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(200).json({
            success: true,
            transaction: transaction
        });
    } catch (err) {
        console.error('Error fetching transaction:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
