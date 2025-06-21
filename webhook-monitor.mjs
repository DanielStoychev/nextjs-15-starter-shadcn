#!/usr/bin/env node
/**
 * Webhook Monitor for Payment Testing
 *
 * This script monitors webhook calls during payment testing
 * Run this in a separate terminal to see webhook events in real-time
 */
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 3002;

// Middleware to log all webhook requests
app.use('/webhook-monitor', (req, res, next) => {
    console.log('\n🔔 WEBHOOK RECEIVED:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body);
    console.log('---');
    next();
});

// Proxy webhook requests to the actual app
app.use(
    '/webhook-monitor',
    createProxyMiddleware({
        target: 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: {
            '^/webhook-monitor': '/api/stripe/webhook'
        }
    })
);

app.listen(PORT, () => {
    console.log('🔍 Webhook Monitor running on http://localhost:' + PORT);
    console.log('📋 Instructions:');
    console.log('   1. Configure Stripe webhook URL to: http://localhost:' + PORT + '/webhook-monitor');
    console.log('   2. Test payments and watch webhook events here');
    console.log('   3. Press Ctrl+C to stop monitoring');
    console.log('\n⏳ Waiting for webhook events...\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Webhook monitoring stopped');
    process.exit(0);
});
