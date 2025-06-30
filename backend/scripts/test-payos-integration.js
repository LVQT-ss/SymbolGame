import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:3000/api';

// Test PayOS Integration
async function testPayOSIntegration() {
    console.log('🧪 Testing PayOS Integration...\n');

    try {
        // Test 1: Get coin packages
        console.log('1️⃣ Testing coin packages endpoint...');
        const packagesResponse = await axios.get(`${API_BASE}/transactions/coin-packages`);
        console.log('✅ Coin packages:', packagesResponse.data.packages);
        console.log('');

        // Test 2: Create PayOS payment
        console.log('2️⃣ Testing PayOS payment creation...');
        const paymentData = {
            userId: 1,
            packageId: 'package1'
        };

        const paymentResponse = await axios.post(`${API_BASE}/transactions/payos-coin-payment`, paymentData);
        console.log('✅ PayOS payment created:');
        console.log(`   💰 User: ${paymentResponse.data.user.username} (ID: ${paymentResponse.data.user.id})`);
        console.log(`   📦 Package: ${paymentResponse.data.package.name}`);
        console.log(`   💎 Current coins: ${paymentResponse.data.user.currentCoins}`);
        console.log(`   💎 Coins after payment: ${paymentResponse.data.user.newCoinsAfterPayment}`);
        console.log(`   💵 Amount: ${paymentResponse.data.paymentInfo.amount.toLocaleString('vi-VN')} VND`);
        console.log(`   ⏰ Expires in: ${paymentResponse.data.paymentInfo.expiresInMinutes} minutes`);
        console.log(`   🌐 Payment URL: ${paymentResponse.data.paymentUrl}`);
        console.log(`   📱 QR Code: ${paymentResponse.data.qrCode.substring(0, 50)}...`);
        console.log(`   🖼️ QR Image URL: ${paymentResponse.data.qrCodeImageUrl ? 'Generated' : 'Failed to generate'}`);
        console.log(`   🔢 Order Code: ${paymentResponse.data.orderCode}`);
        console.log('');

        // Test 3: Create payment for different user
        console.log('3️⃣ Testing PayOS payment for different user...');
        const paymentData2 = {
            userId: 2, // Different user
            packageId: 'package3' // Different package
        };

        try {
            const paymentResponse2 = await axios.post(`${API_BASE}/transactions/payos-coin-payment`, paymentData2);
            console.log('✅ PayOS payment created for user 2:');
            console.log(`   💰 User: ${paymentResponse2.data.user.username} (ID: ${paymentResponse2.data.user.id})`);
            console.log(`   📦 Package: ${paymentResponse2.data.package.name}`);
            console.log(`   💎 Current coins: ${paymentResponse2.data.user.currentCoins}`);
            console.log(`   💎 Coins after payment: ${paymentResponse2.data.user.newCoinsAfterPayment}`);
        } catch (error) {
            console.log('⚠️ User 2 not found (expected), testing with user 1 again...');

            // Test with different package for user 1
            const paymentData3 = {
                userId: 1,
                packageId: 'package5' // Biggest package
            };

            const paymentResponse3 = await axios.post(`${API_BASE}/transactions/payos-coin-payment`, paymentData3);
            console.log('✅ PayOS payment created (biggest package):');
            console.log(`   💰 User: ${paymentResponse3.data.user.username}`);
            console.log(`   📦 Package: ${paymentResponse3.data.package.name}`);
            console.log(`   💵 Amount: ${paymentResponse3.data.paymentInfo.amount.toLocaleString('vi-VN')} VND`);
            console.log(`   💎 Coins: ${paymentResponse3.data.package.coins}`);
        }
        console.log('');

        // Test 4: Check payment status
        console.log('4️⃣ Testing payment status check...');
        const statusResponse = await axios.get(`${API_BASE}/transactions/${paymentResponse.data.transaction.id}`);
        console.log('✅ Payment status retrieved:');
        console.log(`   Status: ${statusResponse.data.transaction.status}`);
        console.log(`   User: ${statusResponse.data.transaction.user?.username || 'N/A'}`);
        console.log(`   Amount: ${statusResponse.data.transaction.price}`);
        console.log('');

        // Test 5: Test webhook endpoint (with dummy data)
        console.log('5️⃣ Testing webhook endpoint...');
        const webhookData = {
            data: {
                orderCode: paymentResponse.data.transaction.id,
                status: 'PAID',
                amount: paymentResponse.data.package.price
            }
        };

        // Create dummy signature for testing
        const crypto = await import('crypto');
        const signatureData = JSON.stringify(webhookData.data);
        const dummySignature = crypto.createHmac('sha256', 'test-checksum-key')
            .update(signatureData)
            .digest('hex');

        try {
            const webhookResponse = await axios.post(`${API_BASE}/transactions/payos-webhook`, webhookData, {
                headers: {
                    'x-payos-signature': dummySignature,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Webhook test result:', webhookResponse.data.message);
        } catch (webhookError) {
            console.log('⚠️ Webhook test (expected to fail with dummy signature):', webhookError.response?.data?.message || webhookError.message);
        }

        console.log('\n🎉 PayOS Integration Test Completed!');
        console.log('\n📋 Next Steps:');
        console.log('1. Configure real PayOS credentials in .env file');
        console.log('2. Set up webhook URL in PayOS dashboard');
        console.log('3. Test with real payments in sandbox environment');
        console.log('4. Frontend integration using response format above');

        console.log('\n💡 Integration Tips:');
        console.log('- Use qrCodeImageUrl for web display (img tag)');
        console.log('- Use qrCode string for mobile app integration');
        console.log('- Show user.newCoinsAfterPayment to confirm expected result');
        console.log('- paymentInfo.expiresInMinutes for countdown timer');
        console.log('- Always redirect mobile users to paymentUrl');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure server is running on port 3000');
        console.log('2. Check database connection');
        console.log('3. Verify PayOS credentials in .env file');
        console.log('4. Ensure user ID 1 exists in database');
    }
}

// Test PayOS configuration
function testPayOSConfig() {
    console.log('🔧 Checking PayOS Configuration...\n');

    const requiredEnvVars = [
        'PAYOS_CLIENT_ID',
        'PAYOS_API_KEY',
        'PAYOS_CHECKSUM_KEY',
        'PAYOS_RETURN_URL'
    ];

    let allConfigured = true;

    requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar];
        if (value && value !== `your-${envVar.toLowerCase().replace('_', '-')}`) {
            console.log(`✅ ${envVar}: Configured`);
        } else {
            console.log(`❌ ${envVar}: Not configured or using default value`);
            allConfigured = false;
        }
    });

    if (allConfigured) {
        console.log('\n🎉 All PayOS environment variables are configured!');
    } else {
        console.log('\n⚠️ Some PayOS environment variables need configuration.');
        console.log('Please update your .env file with real PayOS credentials.');
    }

    return allConfigured;
}

// Run tests
async function main() {
    console.log('🚀 PayOS Integration Test Suite\n');

    // Check configuration first
    const configOk = testPayOSConfig();
    console.log('');

    // Run integration tests
    if (configOk) {
        await testPayOSIntegration();
    } else {
        console.log('⏭️ Skipping integration tests due to missing configuration.');
        console.log('Please configure PayOS credentials and run again.');
    }
}

main().catch(console.error); 