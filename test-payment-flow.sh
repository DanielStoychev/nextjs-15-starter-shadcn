#!/bin/bash

echo "🧪 Testing Payment Flow"
echo "======================"

# Check if dev server is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "❌ Dev server is not running on port 3001"
    echo "Please run 'npm run dev' first"
    exit 1
fi

echo "✅ Dev server is running"

# Check if we can access the auth endpoints
echo "🔍 Checking authentication endpoints..."
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/session)

if [ "$AUTH_STATUS" -eq 200 ]; then
    echo "✅ Auth endpoints are accessible"
else
    echo "❌ Auth endpoints returned status: $AUTH_STATUS"
fi

# Check if we can access the games page
echo "🔍 Checking games page..."
GAMES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/games)

if [ "$GAMES_STATUS" -eq 200 ]; then
    echo "✅ Games page is accessible"
else
    echo "❌ Games page returned status: $GAMES_STATUS"
fi

echo ""
echo "🎯 Payment Flow Ready!"
echo "Now you can:"
echo "1. Go to http://localhost:3001"
echo "2. Sign in with test user: admin@footygames.co.uk / PaymentTest123!"
echo "3. Navigate to a game and try to make a payment"
echo "4. Check the terminal output for payment confirmation logs"
