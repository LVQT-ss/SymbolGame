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

        // Handle webhook logic here - using working logic from main app
        const webhookData = req.body;

        // Handle empty webhook (PayOS validation test)
        if (!webhookData || Object.keys(webhookData).length === 0) {
            console.log('Empty webhook - likely PayOS validation test');
            return res.status(200).json({
                status: 'success',
                message: 'Webhook received successfully'
            });
        }

        // Handle PayOS webhook format
        let orderCode, amount, isSuccessful = false;

        if (webhookData.data) {
            // PayOS webhook format: { code: '00', success: true, data: { orderCode, amount } }
            orderCode = webhookData.data.orderCode;
            amount = webhookData.data.amount;

            // Check if payment is successful using PayOS format
            isSuccessful = webhookData.code === '00' && webhookData.success === true;
        } else {
            // Direct format: { orderCode, amount }
            orderCode = webhookData.orderCode;
            amount = webhookData.amount;
            isSuccessful = webhookData.status === 'PAID';
        }

        console.log('Processing webhook:', {
            orderCode,
            amount,
            isSuccessful,
            webhookCode: webhookData.code,
            webhookSuccess: webhookData.success
        });

        // If payment is successful, process it
        if (orderCode && isSuccessful) {
            console.log(`🎉 Payment successful for order ${orderCode}!`);

            // Find transaction
            const transaction = await PaymentTransaction.findOne({
                where: { id: orderCode }
            });

            if (!transaction) {
                console.log(`❌ Transaction ${orderCode} not found`);
                return res.status(404).json({ message: "Transaction not found" });
            }

            if (transaction.status === 'completed') {
                console.log(`✅ Transaction ${orderCode} already completed`);
                return res.status(200).json({
                    status: 'success',
                    message: "Transaction already processed"
                });
            }

            // Start database transaction
            const dbTransaction = await sequelize.transaction();

            try {
                // Find coin package
                const packageEntry = Object.entries(COIN_PACKAGES).find(([key, pkg]) =>
                    pkg.price === parseFloat(transaction.price)
                );

                if (!packageEntry) {
                    await dbTransaction.rollback();
                    console.log(`❌ Invalid package amount: ${transaction.price}`);
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
                if (!user) {
                    await dbTransaction.rollback();
                    console.log(`❌ User ${transaction.user_id} not found`);
                    return res.status(404).json({ message: "User not found" });
                }

                await user.update({
                    coins: user.coins + coinPackage.coins
                }, { transaction: dbTransaction });

                await dbTransaction.commit();

                console.log(`✅ SUCCESS: Added ${coinPackage.coins} coins to user ${user.id}. New balance: ${user.coins + coinPackage.coins}`);

                // Simple success response like working example
                res.status(200).json({
                    status: 'success',
                    message: 'Payment processed successfully'
                });

            } catch (error) {
                await dbTransaction.rollback();
                console.error('❌ Database error:', error);
                throw error;
            }
        } else {
            console.log(`ℹ️ Webhook received but not processed - orderCode: ${orderCode}, isSuccessful: ${isSuccessful}`);

            // Simple response for other cases
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
