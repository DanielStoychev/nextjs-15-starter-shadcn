import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test user stats API
console.log('Testing user stats API...');
try {
    const statsResponse = await fetch(`${BASE_URL}/api/user/stats`);
    if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Stats API Response:', JSON.stringify(statsData, null, 2));
    } else {
        console.log('Stats API Error:', statsResponse.status, statsResponse.statusText);
    }
} catch (error) {
    console.log('Stats API Request Failed:', error.message);
}

console.log('\n---\n');

// Test user entries API
console.log('Testing user entries API...');
try {
    const entriesResponse = await fetch(`${BASE_URL}/api/user/entries`);
    if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json();
        console.log('Entries API Response:', JSON.stringify(entriesData, null, 2));
    } else {
        console.log('Entries API Error:', entriesResponse.status, entriesResponse.statusText);
    }
} catch (error) {
    console.log('Entries API Request Failed:', error.message);
}
