import express from 'express';
import {
    // Essential coin system functions
    getCoinPackages,
    getUserTransactions,

    // PayOS functions - ONLY ACTIVE PAYMENT METHOD
    createPayOSCoinPayment,
    payOSWebhook,
    payOSReturn,

    // Custom webhook for testing with ngrok
    receiveHook,

    // Transaction management
    getTransactionById
} from '../controllers/transaction.controller.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CoinPackage:
 *       type: object
 *       properties:
 *         coins:
 *           type: integer
 *           description: Number of coins in the package
 *           example: 100
 *         price:
 *           type: integer
 *           description: Price in VND
 *           example: 10000
 *         name:
 *           type: string
 *           description: Package display name
 *           example: "100 Coins"
 *     
 *     PaymentTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Transaction ID
 *           example: 1
 *         user_id:
 *           type: integer
 *           description: User ID who made the transaction
 *           example: 1
 *         transaction_type:
 *           type: string
 *           description: Type of transaction
 *           example: "coin_purchase"
 *         price:
 *           type: number
 *           description: Transaction amount
 *           example: 10000
 *         currency:
 *           type: string
 *           description: Currency code
 *           example: "VND"
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *           description: Transaction status
 *           example: "pending"
 *         payment_provider:
 *           type: string
 *           enum: [payos]
 *           description: Payment provider used (PayOS only)
 *           example: "payos"
 *         external_transaction_id:
 *           type: string
 *           description: External transaction reference
 *           example: "PAYOS-1704567890123-1"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Transaction creation time
 *           example: "2024-01-06T10:30:00Z"
 *         completed_at:
 *           type: string
 *           format: date-time
 *           description: Transaction completion time
 *           example: "2024-01-06T10:35:00Z"
 *     
 *     CoinPurchaseRequest:
 *       type: object
 *       required:
 *         - userId
 *         - packageId
 *       properties:
 *         userId:
 *           type: integer
 *           description: ID of the user making the purchase
 *           example: 1
 *         packageId:
 *           type: string
 *           enum: [package1, package2, package3, package4, package5]
 *           description: Package ID to purchase
 *           example: "package1"
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "User not found"
 *         error:
 *           type: string
 *           description: Detailed error information
 *           example: "Sequelize validation error"
 * 
 * tags:
 *   - name: PayOS Payment System
 *     description: PayOS-only coin purchase system (ACTIVE)
 *   - name: Transaction Management
 *     description: Transaction history and monitoring (ACTIVE)
 */

// ===================================
// COIN PACKAGES
// ===================================

/**
 * @swagger
 * /api/transactions/coin-packages:
 *   get:
 *     tags:
 *       - PayOS Payment System
 *     summary: 🪙 Get available coin packages
 *     description: |
 *       Returns all available coin packages for purchase via PayOS.
 *       
 *       **Available Packages:**
 *       - Package 1: 100 coins = 10,000 VND
 *       - Package 2: 500 coins = 45,000 VND  
 *       - Package 3: 1,000 coins = 85,000 VND
 *       - Package 4: 2,500 coins = 200,000 VND
 *       - Package 5: 5,000 coins = 380,000 VND
 *       
 *       **Payment Method: PayOS Only**
 *       - QR Pay (Momo, VietQR, etc.)
 *       - Bank cards (Domestic & International)
 *       - E-wallets
 *     responses:
 *       200:
 *         description: Successfully retrieved coin packages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 packages:
 *                   type: object
 *                   properties:
 *                     package1:
 *                       $ref: '#/components/schemas/CoinPackage'
 *                     package2:
 *                       $ref: '#/components/schemas/CoinPackage'
 *                     package3:
 *                       $ref: '#/components/schemas/CoinPackage'
 *                     package4:
 *                       $ref: '#/components/schemas/CoinPackage'
 *                     package5:
 *                       $ref: '#/components/schemas/CoinPackage'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   success: true
 *                   packages:
 *                     package1: { coins: 100, price: 10000, name: "100 Coins" }
 *                     package2: { coins: 500, price: 45000, name: "500 Coins" }
 *                     package3: { coins: 1000, price: 85000, name: "1000 Coins" }
 *                     package4: { coins: 2500, price: 200000, name: "2500 Coins" }
 *                     package5: { coins: 5000, price: 380000, name: "5000 Coins" }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/coin-packages', getCoinPackages);

// ===================================
// PAYOS PAYMENT ROUTES (ONLY ACTIVE PAYMENT METHOD)
// ===================================

/**
 * @swagger
 * /api/transactions/payos-coin-payment:
 *   post:
 *     tags:
 *       - PayOS Payment System
 *     summary: 💳 Create PayOS coin payment (ONLY PAYMENT METHOD)
 *     description: |
 *       Creates a PayOS payment link for coin purchase. PayOS is the ONLY active payment method.
 *       
 *       **PayOS Flow:**
 *       1. Create payment link with this endpoint
 *       2. User redirected to PayOS checkout page
 *       3. User completes payment via QR code, card, or e-wallet
 *       4. PayOS sends webhook to confirm payment
 *       5. Coins automatically added to user account
 *       
 *       **Payment Methods Supported by PayOS:**
 *       - QR Pay (Momo, VietQR, etc.)
 *       - Domestic bank cards
 *       - International cards (Visa, Mastercard)
 *       - E-wallets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CoinPurchaseRequest'
 *           examples:
 *             payos_payment:
 *               summary: Create PayOS payment for 2500 coins
 *               value:
 *                 userId: 1
 *                 packageId: "package4"
 *             payos_payment_user2:
 *               summary: Create PayOS payment for user ID 2 (1000 coins)
 *               value:
 *                 userId: 2
 *                 packageId: "package3"
 *     responses:
 *       200:
 *         description: PayOS payment link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 paymentUrl:
 *                   type: string
 *                   description: PayOS checkout URL - redirect user here
 *                   example: "https://pay.payos.vn/web/abc123def456"
 *                 qrCode:
 *                   type: string
 *                   description: PayOS QR code string (for mobile apps)
 *                   example: "00020101021238570010A000000727012700069704220113VQRQADCPK12840208QRIBFTTA530370454062000005802VN62180814Nap 2500 coins63040A9D"
 *                 qrCodeImageUrl:
 *                   type: string
 *                   description: QR code as data URL image (for web display)
 *                   example: "data:image/png;base64,iVBORw0KGgoAAAANS..."
 *                 transaction:
 *                   $ref: '#/components/schemas/PaymentTransaction'
 *                 package:
 *                   $ref: '#/components/schemas/CoinPackage'
 *                 orderCode:
 *                   type: integer
 *                   description: PayOS order code
 *                   example: 12345
 *                 user:
 *                   type: object
 *                   description: User information - WHO is receiving coins
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: User ID receiving coins
 *                       example: 1
 *                     username:
 *                       type: string
 *                       description: Username receiving coins
 *                       example: "player123"
 *                     email:
 *                       type: string
 *                       description: User email
 *                       example: "player123@symbol.game"
 *                     currentCoins:
 *                       type: integer
 *                       description: Current coin balance before payment
 *                       example: 750
 *                     newCoinsAfterPayment:
 *                       type: integer
 *                       description: Expected coin balance after successful payment
 *                       example: 3250
 *                 paymentInfo:
 *                   type: object
 *                   description: Payment details and timing
 *                   properties:
 *                     description:
 *                       type: string
 *                       description: Payment description shown to user
 *                       example: "Nap 2500 coins"
 *                     amount:
 *                       type: integer
 *                       description: Payment amount in VND
 *                       example: 200000
 *                     currency:
 *                       type: string
 *                       example: "VND"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: When payment link expires
 *                       example: "2024-06-30T14:02:37.321Z"
 *                     expiresInMinutes:
 *                       type: integer
 *                       description: Payment expires in X minutes
 *                       example: 30
 *             examples:
 *               successful_response:
 *                 summary: Successful PayOS payment creation
 *                 value:
 *                   success: true
 *                   paymentUrl: "https://pay.payos.vn/web/7a6c4979aa3d4cc3938fe2a7f6413327"
 *                   qrCode: "00020101021238570010A000000727012700069704220113VQRQADCPK12840208QRIBFTTA530370454062000005802VN62180814Nap 2500 coins63040A9D"
 *                   qrCodeImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANS..."
 *                   transaction:
 *                     id: 7
 *                     user_id: 1
 *                     status: "pending"
 *                     price: "200000.00"
 *                     payment_provider: "payos"
 *                   package:
 *                     coins: 2500
 *                     price: 200000
 *                     name: "2500 Coins"
 *                   orderCode: 7
 *                   user:
 *                     id: 1
 *                     username: "player123"
 *                     email: "player123@symbol.game"
 *                     currentCoins: 750
 *                     newCoinsAfterPayment: 3250
 *                   paymentInfo:
 *                     description: "Nap 2500 coins"
 *                     amount: 200000
 *                     currency: "VND"
 *                     expiresAt: "2024-06-30T14:02:37.321Z"
 *                     expiresInMinutes: 30
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: PayOS API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/payos-coin-payment', createPayOSCoinPayment);

/**
 * @swagger
 * /api/transactions/payos-webhook:
 *   post:
 *     tags:
 *       - PayOS Payment System
 *     summary: 🔗 PayOS webhook endpoint (AUTO)
 *     description: |
 *       Handles PayOS webhook notifications for payment status updates. This endpoint is called automatically by PayOS when payment status changes.
 *       
 *       **Webhook Events:**
 *       - PAID: Payment completed successfully → Coins added to user
 *       - CANCELLED: Payment cancelled → Transaction marked as failed
 *       - PENDING: Payment in progress → No action taken
 *       
 *       **Security:**
 *       - Webhook signature verification using HMAC SHA256
 *       - Checksum validation against PayOS checksum key
 *       - Duplicate payment prevention
 *       
 *       **This endpoint is for PayOS use only - not for manual testing**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   orderCode:
 *                     type: integer
 *                     description: Transaction ID in our system
 *                     example: 12345
 *                   status:
 *                     type: string
 *                     enum: [PAID, CANCELLED, PENDING]
 *                     description: Payment status from PayOS
 *                     example: "PAID"
 *                   amount:
 *                     type: integer
 *                     description: Payment amount
 *                     example: 200000
 *     parameters:
 *       - in: header
 *         name: x-payos-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: PayOS webhook signature for verification
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   examples:
 *                     success:
 *                       value: "Payment processed successfully"
 *                     cancelled:
 *                       value: "Payment cancelled"
 *       400:
 *         description: Invalid webhook signature or data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Support both GET (testing) and POST (actual webhook)
router.get('/payos-webhook', payOSWebhook);
router.post('/payos-webhook', payOSWebhook);

// Also support with different paths that PayOS might test
router.all('/payos-webhook/*', payOSWebhook);

/**
 * @swagger
 * /api/transactions/payos-return:
 *   get:
 *     tags:
 *       - PayOS Payment System
 *     summary: ↩️ PayOS return URL handler (AUTO)
 *     description: |
 *       Handles user return from PayOS checkout page. Verifies payment status and provides feedback to user.
 *       
 *       **Return Flow:**
 *       1. User completes/cancels payment on PayOS
 *       2. PayOS redirects user back to this endpoint
 *       3. System checks payment status with PayOS API
 *       4. Returns appropriate response to user
 *       
 *       **Note:** This endpoint is called automatically by PayOS redirect - not for manual testing
 *     parameters:
 *       - in: query
 *         name: orderCode
 *         required: true
 *         schema:
 *           type: integer
 *         description: PayOS order code (transaction ID)
 *         example: 12345
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Payment status from PayOS
 *         example: "PAID"
 *       - in: query
 *         name: cancel
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Whether payment was cancelled
 *         example: "false"
 *     responses:
 *       200:
 *         description: Return processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   examples:
 *                     success:
 *                       value: "Payment successful! Coins have been added to your account."
 *                     cancelled:
 *                       value: "Payment was cancelled"
 *                 transaction:
 *                   $ref: '#/components/schemas/PaymentTransaction'
 *                 coinsAdded:
 *                   type: integer
 *                   description: Number of coins added (only on success)
 *                   example: 2500
 *                 newBalance:
 *                   type: integer
 *                   description: User's new coin balance (only on success)
 *                   example: 3250
 *       400:
 *         description: Missing order code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/payos-return', payOSReturn);

/**
 * @swagger
 * /api/transactions/receive-hook:
 *   post:
 *     tags:
 *       - PayOS Payment System
 *     summary: 🔗 Custom webhook for testing (NGROK)
 *     description: |
 *       Custom webhook endpoint for testing payment completion with ngrok.
 *       This endpoint can manually complete transactions for testing purposes.
 *       
 *       **Usage:**
 *       - Used with ngrok for local testing
 *       - Can complete pending transactions manually
 *       - Updates transaction status to 'completed'
 *       - Adds coins to user account
 *       
 *       **Request Body Options:**
 *       - Use `transactionId` for direct transaction lookup
 *       - Use `orderCode` for PayOS order code lookup
 *       - Set `status` to 'completed' or 'PAID' to complete transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: integer
 *                 description: Direct transaction ID (preferred)
 *                 example: 12345
 *               orderCode:
 *                 type: string
 *                 description: PayOS order code or external transaction ID
 *                 example: "PAYOS-1704567890123-1"
 *               status:
 *                 type: string
 *                 description: Transaction status to set
 *                 enum: [completed, PAID, pending, failed]
 *                 example: "completed"
 *           examples:
 *             complete_by_id:
 *               summary: Complete transaction by ID
 *               value:
 *                 transactionId: 12345
 *                 status: "completed"
 *             complete_by_ordercode:
 *               summary: Complete transaction by order code
 *               value:
 *                 orderCode: "PAYOS-1704567890123-1"
 *                 status: "PAID"
 *             webhook_test:
 *               summary: Test webhook reception
 *               value:
 *                 transactionId: 12345
 *                 status: "pending"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   examples:
 *                     completed:
 *                       value: "Transaction completed successfully"
 *                     received:
 *                       value: "Webhook received successfully"
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12345
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *                     coins_added:
 *                       type: integer
 *                       example: 2500
 *                     new_balance:
 *                       type: integer
 *                       example: 3250
 *       400:
 *         description: Bad request (missing required fields)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Missing transactionId or orderCode"
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Transaction not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Failed to process webhook"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.post('/receive-hook', receiveHook);

// Additional webhook endpoints that PayOS might test
router.post('/webhook', payOSWebhook);
router.post('/webhook/payos', payOSWebhook);
router.all('/payos*', payOSWebhook);

// ===================================
// TRANSACTION MANAGEMENT (ACTIVE)
// ===================================

/**
 * @swagger
 * /api/transactions/user/{userId}:
 *   get:
 *     tags:
 *       - Transaction Management
 *     summary: 📊 Get user's transaction history
 *     description: |
 *       Retrieves transaction history for a specific user with pagination support.
 *       Shows PayOS transactions only.
 *       
 *       **Features:**
 *       - Pagination support
 *       - Filter by transaction type
 *       - Ordered by creation date (newest first)
 *       - PayOS transactions only
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of transactions per page
 *         example: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [coin_purchase]
 *         description: Filter by transaction type
 *         example: "coin_purchase"
 *     responses:
 *       200:
 *         description: User transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentTransaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 5
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/user/:userId', getUserTransactions);

/**
 * @swagger
 * /api/transactions/{transactionId}:
 *   get:
 *     tags:
 *       - Transaction Management
 *     summary: 🔍 Get transaction by ID
 *     description: |
 *       Retrieves detailed information about a specific transaction.
 *       Works with PayOS transactions only.
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the transaction to retrieve
 *         example: 1
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transaction:
 *                   $ref: '#/components/schemas/PaymentTransaction'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:transactionId', getTransactionById);

export default router; 