#!/bin/bash

# Quick integration test for MicroCrowd Enhanced
echo "🧪 Quick Integration Test for MicroCrowd Enhanced..."

BACKEND_DIR="../microcrowd-enhanced/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found at $BACKEND_DIR"
    exit 1
fi

# Start backend in background
echo "🚀 Starting backend server..."
cd "$BACKEND_DIR"
source venv/bin/activate

# Start server in background
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test health endpoint
echo "🔍 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)

if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "✅ Backend health check passed!"
    echo "📋 Response: $HEALTH_RESPONSE"
else
    echo "❌ Backend health check failed!"
    echo "📋 Response: $HEALTH_RESPONSE"
fi

# Test root endpoint
echo "🔍 Testing root endpoint..."
ROOT_RESPONSE=$(curl -s http://localhost:8000/)

if [[ $ROOT_RESPONSE == *"MicroCrowd Enhanced API"* ]]; then
    echo "✅ Backend root endpoint working!"
    echo "📋 Response: $ROOT_RESPONSE"
else
    echo "❌ Backend root endpoint failed!"
    echo "📋 Response: $ROOT_RESPONSE"
fi

# Stop the server
echo "🛑 Stopping backend server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo "✅ Integration test completed!"
echo "💡 The backend is ready for the frontend connection."