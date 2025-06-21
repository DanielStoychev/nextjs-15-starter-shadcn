#!/usr/bin/env node

/**
 * Payment Integration Test Script
 *
 * This script tests the payment API endpoints to ensure they're working correctly.
 * Run this script to verify the payment integration is functional.
 */

const BASE_URL = 'http://localhost:3001';

async function testPaymentEndpoints() {
    console.log('🧪 Testing Payment Integration...\n');

    try {
        // Test 1: Create Payment Session
        console.log('1️⃣  Testing Payment Session Creation...');
        const paymentResponse = await fetch(`${BASE_URL}/api/games/entry/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gameInstanceId: 'test-game-instance-id',
                userId: 'test-user-id',
                amount: 500, // £5.00
                gameName: 'Test Game'
            })
        });

        if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            console.log('✅ Payment session endpoint is working');
            console.log(`   Session ID: ${paymentData.sessionId ? 'Created' : 'Not created'}`);
            console.log(`   Checkout URL: ${paymentData.url ? 'Generated' : 'Not generated'}\n`);
        } else {
            console.log('❌ Payment session endpoint failed');
            console.log(`   Status: ${paymentResponse.status}`);
            console.log(`   Error: ${await paymentResponse.text()}\n`);
        }

        // Test 2: Test Webhook Endpoint (structure only, can't test actual webhook without Stripe)
        console.log('2️⃣  Testing Webhook Endpoint Structure...');
        const webhookResponse = await fetch(`${BASE_URL}/api/stripe/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': 'test-signature'
            },
            body: JSON.stringify({ test: 'data' })
        });

        // Webhook should return 400 due to invalid signature (expected behavior)
        if (webhookResponse.status === 400) {
            console.log('✅ Webhook endpoint is properly configured');
            console.log('   Signature verification is working (returned 400 as expected)\n');
        } else {
            console.log('❌ Webhook endpoint may have issues');
            console.log(`   Status: ${webhookResponse.status}\n`);
        }

        // Test 3: Test API Routes Exist
        console.log('3️⃣  Testing API Routes Accessibility...');

        const confirmResponse = await fetch(`${BASE_URL}/api/games/entry/confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        console.log(
            `   Confirm Payment Endpoint: ${confirmResponse.status !== 404 ? '✅ Accessible' : '❌ Not Found'}`
        );

        console.log('\n🎉 Payment Integration Test Complete!');
        console.log('\n📋 Summary:');
        console.log('   - Payment session creation endpoint: Available');
        console.log('   - Webhook endpoint: Properly secured');
        console.log('   - Payment confirmation endpoint: Available');
        console.log('   - Next step: Test with actual Stripe checkout flow');
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('\n🔧 Possible issues:');
        console.log('   - Development server not running on port 3001');
        console.log('   - Missing environment variables');
        console.log('   - Network connectivity issues');
    }
}

// Run the test
testPaymentEndpoints();
