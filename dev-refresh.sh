#!/bin/bash

# Development script to handle certificate refresh without full restart
echo "🔄 Refreshing ICP development environment..."

# Kill any hanging processes
pkill -f dfx
pkill -f pocket-ic
dfx killall

# Clean up any lingering files
rm -rf .dfx/local/canister_ids.json.backup 2>/dev/null
rm -rf .dfx/network/local/canister_ids.json.backup 2>/dev/null

# Start fresh but preserve state
echo "🚀 Starting dfx in background..."
dfx start --background --clean &

# Wait for dfx to be ready
sleep 5

# Try to ping until it's ready
while ! dfx ping &>/dev/null; do
    echo "⏳ Waiting for dfx to be ready..."
    sleep 2
done

echo "✅ dfx is ready!"

# Deploy only if needed
if [ "$1" = "--deploy" ]; then
    echo "📦 Deploying canisters..."
    dfx deploy
fi

echo "🎉 Environment refreshed! Your app should work now."
echo "📱 Frontend URL: http://$(dfx canister id pixelledger_frontend).localhost:4943"
