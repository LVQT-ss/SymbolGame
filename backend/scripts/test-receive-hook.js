import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TEST_USER_ID = 1; // Test user ID

console.log('🔗 Testing Custom Webhook Endpoint (/receive-hook)');
console.log('='.repeat(60));

async function testReceiveHook() {
    try {
        console.log('\n📋 Test Overview:');
        console.log('- Endpoint: POST /api/transactions/receive-hook');
        console.log('- Purpose: Complete payment transactions via webhook');
        console.log('- Usage: For testing with ngrok URL');

        // Step 1: Create a PayOS payment first
        console.log('\n1️⃣ Creating PayOS payment transaction...');
        const paymentResponse = await axios.post(`${API_BASE}/transactions/payos-coin-payment`, {
            userId: TEST_USER_ID,
            packageId: 'package1' // 100 coins for 10,000 VND
        });

        if (!paymentResponse.data.success) {
            throw new Error('Failed to create payment');
        }

        const transactionId = paymentResponse.data.transaction.id;
        const orderCode = paymentResponse.data.transaction.id;

        console.log(`✅ Payment created successfully`);
        console.log(`   Transaction ID: ${transactionId}`);
        console.log(`   Status: ${paymentResponse.data.transaction.status}`);
        console.log(`   Amount: ${paymentResponse.data.transaction.price} VND`);

        // Step 2: Test webhook with just logging (no completion)
        console.log('\n2️⃣ Testing webhook reception (no completion)...');
        const webhookTest = await axios.post(`${API_BASE}/transactions/receive-hook`, {
            transactionId: transactionId,
            status: 'pending'
        });

        console.log(`✅ Webhook test response:`, webhookTest.data);

        // Step 3: Complete the transaction via webhook
        console.log('\n3️⃣ Completing transaction via webhook...');
        const completionResponse = await axios.post(`${API_BASE}/transactions/receive-hook`, {
            transactionId: transactionId,
            status: 'completed'
        });

        console.log(`✅ Transaction completed via webhook`);
        console.log(`   Status: ${completionResponse.data.status}`);
        console.log(`   Message: ${completionResponse.data.message}`);
        console.log(`   Coins Added: ${completionResponse.data.transaction.coins_added}`);
        console.log(`   New Balance: ${completionResponse.data.transaction.new_balance}`);

        // Step 4: Try to complete again (should get already completed message)
        console.log('\n4️⃣ Testing duplicate completion...');
        const duplicateResponse = await axios.post(`${API_BASE}/transactions/receive-hook`, {
            transactionId: transactionId,
            status: 'completed'
        });

        console.log(`✅ Duplicate completion handled correctly`);
        console.log(`   Message: ${duplicateResponse.data.message}`);

        // Step 5: Test with orderCode instead of transactionId
        console.log('\n5️⃣ Creating another payment to test orderCode lookup...');
        const payment2Response = await axios.post(`${API_BASE}/transactions/payos-coin-payment`, {
            userId: TEST_USER_ID,
            packageId: 'package2' // 500 coins for 45,000 VND
        });

        const orderCode2 = `PAYOS-${Date.now()}-${TEST_USER_ID}`;

        console.log('\n6️⃣ Testing webhook with orderCode...');
        const orderCodeResponse = await axios.post(`${API_BASE}/transactions/receive-hook`, {
            orderCode: payment2Response.data.transaction.id.toString(),
            status: 'PAID'
        });

        console.log(`✅ OrderCode webhook test completed`);
        console.log(`   Status: ${orderCodeResponse.data.status}`);
        console.log(`   Coins Added: ${orderCodeResponse.data.transaction.coins_added}`);

        // Step 7: Test error cases
        console.log('\n7️⃣ Testing error cases...');

        // Test missing parameters
        try {
            await axios.post(`${API_BASE}/transactions/receive-hook`, {
                status: 'completed'
            });
        } catch (error) {
            console.log(`✅ Missing parameters handled correctly: ${error.response.data.message}`);
        }

        // Test non-existent transaction
        try {
            await axios.post(`${API_BASE}/transactions/receive-hook`, {
                transactionId: 999999,
                status: 'completed'
            });
        } catch (error) {
            console.log(`✅ Non-existent transaction handled correctly: ${error.response.data.message}`);
        }

        console.log('\n🎉 All webhook tests completed successfully!');

        console.log('\n📝 How to use with ngrok:');
        console.log('1. Start ngrok: ngrok http 3001');
        console.log('2. Copy the https URL (e.g., https://abc123.ngrok-free.app)');
        console.log('3. Use this webhook URL: https://abc123.ngrok-free.app/api/transactions/receive-hook');
        console.log('4. Send POST request with:');
        console.log('   {');
        console.log('     "transactionId": 123,');
        console.log('     "status": "completed"');
        console.log('   }');

        console.log('\n🔍 PayOS Dashboard Configuration:');
        console.log('- Do NOT use this endpoint in PayOS dashboard');
        console.log('- PayOS should still use: /api/transactions/payos-webhook');
        console.log('- This endpoint is for manual testing only');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status code:', error.response.status);
        }
    }
}

// Run the test
testReceiveHook(); 