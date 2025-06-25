#!/bin/bash

# Quick certificate bypass for development
echo "🔧 Quick certificate fix..."

# Kill any existing dfx processes
pkill -f "dfx start" 2>/dev/null
sleep 2

# Start dfx with specific local settings
DFX_CONFIG_ROOT=/tmp/dfx-$(date +%s) dfx start --background --host 127.0.0.1:4943 &

sleep 8

# Deploy quickly
dfx deploy --network local

echo "✅ Quick fix applied!"
echo "🌐 Try accessing: http://localhost:4943/?canisterId=$(dfx canister id pixelledger_frontend --network local)"
