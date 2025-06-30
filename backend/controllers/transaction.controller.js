import PaymentTransaction from "../model/payment-transactions.model.js";
import User from "../model/user.model.js";
import { Op } from "sequelize";
import sequelize from '../database/db.js';
import crypto from 'crypto';
import querystring from 'querystring';
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

export const createCoinPurchase = async (req, res) => {
    const dbTransaction = await sequelize.transaction();

    try {
        const { userId, packageId } = req.body;

        if (!userId || !packageId) {
            await dbTransaction.rollback();
            return res.status(400).json({ message: 'Missing userId or packageId' });
        }

        // Check if package exists
        const coinPackage = COIN_PACKAGES[packageId];
        if (!coinPackage) {
            await dbTransaction.rollback();
            return res.status(400).json({ message: 'Invalid package ID' });
        }

        // Check if user exists
        const user = await User.findByPk(userId, { transaction: dbTransaction });
        if (!user) {
            await dbTransaction.rollback();
            return res.status(404).json({ message: 'User not found' });
        }

        // Create payment transaction
        const newTransaction = await PaymentTransaction.create({
            user_id: userId,
            transaction_type: 'coin_purchase',
            price: coinPackage.price,
            currency: 'VND',
            status: 'pending',
            payment_provider: null,
            external_transaction_id: `COIN-${Date.now()}-${userId}`
        }, { transaction: dbTransaction });

        await dbTransaction.commit();

        res.status(201).json({
            success: true,
            transaction: newTransaction,
            package: coinPackage,
            message: 'Coin purchase transaction created successfully'
        });
    } catch (err) {
        await dbTransaction.rollback();
        console.error('Error creating coin purchase:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const createVNPayCoinPayment = async (req, res) => {
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
            payment_provider: 'vnpay',
            external_transaction_id: `COIN-${Date.now()}-${userId}`
        });

        const totalAmount = coinPackage.price * 100; // Convert to VNPay format

        const tmnCode = process.env.VNP_TMNCODE;
        const secretKey = process.env.VNP_HASHSECRET;
        const vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURN_URL;

        if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
            return res.status(500).json({ message: "VNPay configuration missing" });
        }

        let vnp_Params = {
            vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_TmnCode: tmnCode,
            vnp_Amount: totalAmount,
            vnp_CurrCode: "VND",
            vnp_TxnRef: transaction.external_transaction_id,
            vnp_OrderInfo: `Nap ${coinPackage.coins} coins cho user ${userId}`,
            vnp_OrderType: "billpayment",
            vnp_Locale: "vn",
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: req.ip || '127.0.0.1',
            vnp_CreateDate: new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14),
        };

        // Sort the parameters alphabetically by key before signing
        vnp_Params = Object.fromEntries(Object.entries(vnp_Params).sort());

        // Create hash using HMAC SHA512
        const signData = querystring.stringify(vnp_Params, "&", "=");
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        vnp_Params["vnp_SecureHash"] = signed;

        const paymentUrl = `${vnpUrl}?${querystring.stringify(vnp_Params)}`;

        res.status(200).json({
            success: true,
            paymentUrl,
            transaction: transaction,
            package: coinPackage
        });
    } catch (error) {
        console.error('Error creating VNPay coin payment:', error);
        res.status(500).json({ message: 'Error creating payment', error: error.message });
    }
};

export const vnpayCoinReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHashType"];

        const secretKey = process.env.VNP_HASHSECRET;

        // Sort parameters alphabetically before signing
        vnp_Params = Object.fromEntries(Object.entries(vnp_Params).sort());

        // Generate signature
        const signData = querystring.stringify(vnp_Params, "&", "=");
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        console.log("Generated Signature:", signed);
        console.log("Received SecureHash:", secureHash);

        if (secureHash !== signed) {
            return res.status(400).json({ message: "Invalid signature" });
        }

        if (vnp_Params["vnp_ResponseCode"] === "00") {
            const dbTransaction = await sequelize.transaction();

            try {
                // Find transaction
                const transaction = await PaymentTransaction.findOne({
                    where: { external_transaction_id: vnp_Params["vnp_TxnRef"] },
                    transaction: dbTransaction
                });

                if (!transaction) {
                    await dbTransaction.rollback();
                    return res.status(404).json({ message: "Transaction not found" });
                }

                if (transaction.status === 'completed') {
                    await dbTransaction.rollback();
                    return res.status(400).json({ message: "Transaction already completed" });
                }

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

                return res.status(200).json({
                    success: true,
                    message: "Payment successful",
                    transaction: transaction,
                    coinsAdded: coinPackage.coins,
                    newBalance: user.coins + coinPackage.coins
                });
            } catch (error) {
                await dbTransaction.rollback();
                throw error;
            }
        } else {
            // Payment failed
            const transaction = await PaymentTransaction.findOne({
                where: { external_transaction_id: vnp_Params["vnp_TxnRef"] }
            });

            if (transaction) {
                await transaction.update({ status: "failed" });
            }

            return res.status(400).json({ message: "Payment failed" });
        }
    } catch (error) {
        console.error('Error processing VNPay return:', error);
        res.status(500).json({ message: 'Error processing payment return', error: error.message });
    }
};

export const generateVietQRCoin = async (req, res) => {
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
            payment_provider: 'vietqr',
            external_transaction_id: `COIN-QR-${Date.now()}-${userId}`
        });

        // Get bank account details from .env
        const { ACCOUNT_NAME, ACCOUNT_NUMBER, BANK_CODE } = process.env;
        if (!ACCOUNT_NAME || !ACCOUNT_NUMBER || !BANK_CODE) {
            return res.status(500).json({ message: "Bank details are missing in .env file" });
        }

        // Generate VietQR URL with transaction details
        const vietQRUrl = `https://img.vietqr.io/image/${BANK_CODE}-${ACCOUNT_NUMBER}-qr_only.png?amount=${coinPackage.price}&addInfo=Coin-${transaction.id}-${userId}`;

        // Generate QR Code as base64 image
        const qrCodeBase64 = await QRCode.toDataURL(vietQRUrl);

        res.status(200).json({
            success: true,
            message: "VietQR Code generated successfully",
            vietQRUrl,
            qrCodeBase64,
            transaction: transaction,
            package: coinPackage,
            bankInfo: {
                accountName: ACCOUNT_NAME,
                accountNumber: ACCOUNT_NUMBER,
                bankCode: BANK_CODE,
                amount: coinPackage.price,
                description: `Nap ${coinPackage.coins} coins`
            }
        });
    } catch (error) {
        console.error("Error generating VietQR for coins:", error);
        res.status(500).json({ message: "Error generating VietQR", error: error.message });
    }
};

export const checkCoinPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.query;
        if (!transactionId) {
            return res.status(400).json({ message: "Transaction ID is required" });
        }

        // Find transaction in database
        const transaction = await PaymentTransaction.findByPk(transactionId, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'coins']
            }]
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.status(200).json({
            success: true,
            transaction: transaction,
            status: transaction.status
        });
    } catch (error) {
        console.error("Error checking coin payment status:", error);
        res.status(500).json({ message: "Error checking payment status", error: error.message });
    }
};

export const confirmManualCoinPayment = async (req, res) => {
    const dbTransaction = await sequelize.transaction();

    try {
        const { transactionId, adminId } = req.body;

        if (!transactionId || !adminId) {
            await dbTransaction.rollback();
            return res.status(400).json({ message: "Transaction ID and Admin ID are required" });
        }

        // Check if admin exists and is admin
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            await dbTransaction.rollback();
            return res.status(403).json({ message: "Only admin can confirm payments" });
        }

        // Find transaction
        const transaction = await PaymentTransaction.findByPk(transactionId, { transaction: dbTransaction });
        if (!transaction) {
            await dbTransaction.rollback();
            return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.status === 'completed') {
            await dbTransaction.rollback();
            return res.status(400).json({ message: "Transaction already completed" });
        }

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
        const newBalance = user.coins + coinPackage.coins;
        await user.update({
            coins: newBalance
        }, { transaction: dbTransaction });

        await dbTransaction.commit();

        res.status(200).json({
            success: true,
            message: "Payment confirmed and coins added successfully",
            transaction: transaction,
            coinsAdded: coinPackage.coins,
            newBalance: newBalance
        });
    } catch (error) {
        await dbTransaction.rollback();
        console.error("Error confirming manual coin payment:", error);
        res.status(500).json({ message: "Error confirming payment", error: error.message });
    }
};

// ===================================
// PAYOS INTEGRATION FUNCTIONS
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
        console.log('PayOS Webhook received:', req.body);

        const webhookData = req.body;

        // Verify webhook signature
        const webhookSignature = req.headers['x-payos-signature'];
        if (!webhookSignature) {
            return res.status(400).json({ message: "Missing webhook signature" });
        }

        // PayOS webhook signature verification
        const sortedKeys = Object.keys(webhookData.data).sort();
        const sortedData = {};
        sortedKeys.forEach(key => {
            sortedData[key] = webhookData.data[key];
        });

        const signatureData = JSON.stringify(sortedData);
        const expectedSignature = crypto
            .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
            .update(signatureData)
            .digest('hex');

        if (webhookSignature !== expectedSignature) {
            console.log('Invalid webhook signature');
            return res.status(400).json({ message: "Invalid webhook signature" });
        }

        const { orderCode, status, amount } = webhookData.data;

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

                res.status(200).json({
                    success: true,
                    message: "Payment processed successfully"
                });
            } catch (error) {
                await dbTransaction.rollback();
                throw error;
            }
        } else if (status === 'CANCELLED') {
            // Update transaction status to failed
            await transaction.update({ status: "failed" });
            res.status(200).json({
                success: true,
                message: "Payment cancelled"
            });
        } else {
            res.status(200).json({
                success: true,
                message: "Webhook received"
            });
        }
    } catch (error) {
        console.error('Error processing PayOS webhook:', error);
        res.status(500).json({
            message: 'Error processing webhook',
            error: error.message
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

export const getAllTransactions = async (req, res) => {
    try {
        const transactions = await PaymentTransaction.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'coins']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            success: true,
            transactions: transactions
        });
    } catch (err) {
        console.error('Error fetching transactions:', err);
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

export const getDailyTransactions = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const transactions = await PaymentTransaction.findAll({
            where: {
                createdAt: {
                    [Op.gte]: today
                }
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'coins']
            }]
        });

        res.status(200).json({
            success: true,
            transactions: transactions
        });
    } catch (err) {
        console.error('Error fetching daily transactions:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTransactionsByDateRange = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        const transactions = await PaymentTransaction.findAll({
            where: {
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                }
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'coins']
            }]
        });

        res.status(200).json({
            success: true,
            transactions: transactions
        });
    } catch (err) {
        console.error('Error fetching transactions by date range:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Legacy functions - kept for backward compatibility
export const generateVietQR = async (req, res) => {
    try {
        res.status(501).json({
            message: "This function requires Order and OrderDetails models. Please use coin-specific endpoints instead."
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error", error: error.message });
    }
};

export const generateQRCode = async (req, res) => {
    try {
        res.status(501).json({
            message: "This function requires Order and Transaction models. Please use coin-specific endpoints instead."
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error", error: error.message });
    }
};

export const createTransaction = async (req, res) => {
    try {
        res.status(501).json({
            message: "This function requires Order and Transaction models. Please use coin-specific endpoints instead."
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error", error: error.message });
    }
};

export const createVNPayPayment = async (req, res) => {
    try {
        res.status(501).json({
            message: "This function requires Order model. Please use createVNPayCoinPayment instead."
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error", error: error.message });
    }
};

export const vnpayReturn = async (req, res) => {
    try {
        res.status(501).json({
            message: "This function requires Transaction model. Please use vnpayCoinReturn instead."
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error", error: error.message });
    }
};

export const checkPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.query;
        if (!transactionId) {
            return res.status(400).json({ message: "Transaction ID is required" });
        }

        // Find transaction in database using PaymentTransaction model
        const transaction = await PaymentTransaction.findByPk(transactionId, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'coins']
            }]
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        return res.status(200).json({
            success: true,
            transaction: transaction,
            status: transaction.status
        });
    } catch (error) {
        console.error("Error checking payment status:", error);
        res.status(500).json({ message: "Error checking payment status", error: error.message });
    }
};
