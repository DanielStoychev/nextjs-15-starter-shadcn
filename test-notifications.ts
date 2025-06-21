import { NotificationService } from '@/lib/notification-service';

async function testNotificationSystem() {
    console.log('🔔 Testing Notification System...');

    try {
        // Test account creation notification (you'll need a real user ID)
        const testUserId = 'test-user-id'; // Replace with an actual user ID from your database

        console.log('📧 Testing account creation notification...');
        await NotificationService.notifyAccountCreated(testUserId);

        console.log('💰 Testing payment success notification...');
        await NotificationService.notifyPaymentSuccess(testUserId, 1000, 'Premium League Entry'); // £10.00

        console.log('🎮 Testing game result notification...');
        await NotificationService.notifyGameResult(
            testUserId,
            'test-game-instance',
            25,
            'Manchester United vs Liverpool'
        );

        console.log('⚠️ Testing warning notification...');
        await NotificationService.notifyMissingInformation(testUserId);

        console.log('🎉 Testing winnings notification...');
        await NotificationService.notifyWinningsAvailable(testUserId, 2500, 'Premier League Predictions Week 15'); // £25.00

        console.log('📢 Testing info notification...');
        await NotificationService.notifyNewFeature(
            'New Feature: Live Commentary',
            'Check out our new live commentary feature for enhanced match experience!',
            '/features/live-commentary'
        );

        console.log('✅ All notification tests completed successfully!');
        console.log('Check your notifications panel to see the results.');
    } catch (error) {
        console.error('❌ Error testing notifications:', error);
    }
}

// Run the test
testNotificationSystem();
