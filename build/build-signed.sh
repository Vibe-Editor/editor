#!/bin/bash

# Usuals.ai - Code Signing Build Script
# This script builds, signs, and notarizes the Electron app

set -e  # Exit on any error

echo "🚀 Starting signed build process for Usuals.ai..."

# Check if environment file exists
if [ ! -f ".env.signing" ]; then
    echo "❌ Error: .env.signing file not found!"
    echo "📝 Please copy build/env-signing-template to .env.signing and fill in your credentials"
    exit 1
fi

# Load environment variables
echo "📋 Loading signing credentials..."
source .env.signing

# Verify required environment variables
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ]; then
    echo "❌ Error: Missing required environment variables!"
    echo "📝 Please ensure APPLE_ID and APPLE_APP_SPECIFIC_PASSWORD are set in .env.signing"
    exit 1
fi

# Export environment variables for electron-builder
export APPLE_ID
export APPLE_APP_SPECIFIC_PASSWORD
export APPLE_TEAM_ID

echo "⚡ Compiling TypeScript..."
npx tsc -p ./.tsconfig

echo "🔨 Building production bundle..."
npm run bundle:prod:src

echo "🧹 Cleaning previous builds..."
rm -rf dist/

echo "📱 Building and signing Electron app with electron-builder..."
# Let electron-builder handle all the deep signing automatically
npx electron-builder build --mac --publish=never

echo "🔍 Verifying code signature..."
if [ -d "./dist/mac-arm64/Usuals.ai.app" ]; then
    echo "✅ App bundle found!"
    codesign --verify --verbose=2 "./dist/mac-arm64/Usuals.ai.app"
    echo "✅ Code signature verified!"
    
    echo "📦 Checking notarization..."
    spctl --assess --verbose=2 "./dist/mac-arm64/Usuals.ai.app"
else
    echo "❌ App bundle not found for verification"
    exit 1
fi

echo "✅ Build complete!"
echo "📦 Signed app: ./dist/mac-arm64/Usuals.ai.app"
echo "📦 DMG file: ./dist/Usuals.ai-0.4.3-arm64.dmg"

echo "🎉 Signed build process completed successfully!"
