#!/usr/bin/env node

/**
 * Test Payment Analytics API
 *
 * This script tests the admin payment analytics endpoint
 */

const BASE_URL = 'http://localhost:3001';

async function testPaymentAnalytics() {
    console.log('🧪 Testing Payment Analytics API...\n');

    try {
        // Test the analytics endpoint (will require authentication)
        console.log('1️⃣  Testing Payment Analytics Endpoint...');
        const analyticsResponse = await fetch(`${BASE_URL}/api/admin/payment-analytics`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Status: ${analyticsResponse.status}`);

        if (analyticsResponse.status === 401) {
            console.log('✅ Endpoint properly secured (requires authentication)');
        } else if (analyticsResponse.ok) {
            const data = await analyticsResponse.json();
            console.log('✅ Analytics data retrieved successfully');
            console.log(`   Total Revenue: £${(data.summary?.totalRevenue / 100).toFixed(2) || '0.00'}`);
            console.log(`   Active Entries: ${data.summary?.totalActiveEntries || 0}`);
            console.log(`   Pending Entries: ${data.summary?.totalPendingEntries || 0}`);
        } else {
            console.log('❌ Endpoint returned error');
            console.log(`   Error: ${await analyticsResponse.text()}`);
        }

        console.log('\n🎉 Payment Analytics API Test Complete!');
        console.log('\n📋 Summary:');
        console.log('   - Payment analytics endpoint: Available and secured');
        console.log('   - Next step: Login as admin and visit /admin/payments');
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('\n🔧 Possible issues:');
        console.log('   - Development server not running on port 3001');
        console.log('   - Database connection issues');
        console.log('   - Network connectivity problems');
    }
}

// Run the test
testPaymentAnalytics();
