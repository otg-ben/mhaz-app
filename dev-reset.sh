#!/bin/bash

# Next.js Development Server Reset Script
# This script helps fix manifest corruption issues

echo "🔄 Resetting Next.js development environment..."

# Kill any existing dev server processes
echo "📋 Stopping existing dev servers..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Wait for processes to fully stop
sleep 2

# Remove Next.js cache and build artifacts
echo "🗑️  Clearing Next.js cache..."
rm -rf .next
rm -rf .swc

# Optional: Clear node_modules cache (uncomment if needed)
# echo "🗑️  Clearing node_modules cache..."
# rm -rf node_modules/.cache

echo "🚀 Starting fresh development server..."
if [ "$1" = "turbo" ]; then
    echo "Using Turbopack mode..."
    npm run dev:turbo
else
    echo "Using stable mode (without Turbopack)..."
    npm run dev
fi