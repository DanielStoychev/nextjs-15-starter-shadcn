#!/usr/bin/env node
import fetch from 'node-fetch';

async function testStatsAPI() {
    console.log('🔍 Testing /api/user/stats endpoint on localhost:3001...\n');

    try {
        const response = await fetch('http://localhost:3001/api/user/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${response.status}`);
        console.log(`Status Text: ${response.statusText}`);

        if (response.status === 401) {
            console.log('✅ Expected 401 - API requires authentication');
            console.log('This confirms the API endpoint is working');
        } else if (response.ok) {
            const data = await response.json();
            console.log('📊 API Response:', JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log('❌ Error Response:', errorText);
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server not running on port 3001');
            console.log('Please make sure you are using: http://localhost:3001');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testStatsAPI();
